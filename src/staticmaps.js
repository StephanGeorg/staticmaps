import request from 'request-promise';
import sharp from 'sharp';
import find from 'lodash.find';
import uniqBy from 'lodash.uniqby';
import url from 'url';
import process from 'process';
import chunk from 'lodash.chunk';

import Image from './image';
import IconMarker from './marker';
import Polyline from './polyline';
import Text from './text';
import asyncQueue from './helper/asyncQueue';
import pjson from '../package.json';

/* transform longitude to tile number */
const lonToX = (lon, zoom) => ((lon + 180) / 360) * (2 ** zoom);
/* transform latitude to tile number */
const latToY = (lat, zoom) => (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
  / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (2 ** zoom);

const yToLat = (y, zoom) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / (2 ** zoom))))
  / Math.PI * 180;

const xToLon = (x, zoom) => x / (2 ** zoom) * 360 - 180;

const LINE_RENDER_CHUNK_SIZE = 1000;

class StaticMaps {
  constructor(options = {}) {
    this.options = options;

    this.width = this.options.width;
    this.height = this.options.height;
    this.paddingX = this.options.paddingX || 0;
    this.paddingY = this.options.paddingY || 0;
    this.padding = [this.paddingX, this.paddingY];
    this.tileUrl = this.options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.tileSize = this.options.tileSize || 256;
    this.tileRequestTimeout = this.options.tileRequestTimeout;
    this.tileRequestHeader = this.options.tileRequestHeader;
    this.reverseY = this.options.reverseY || false;
    this.maxZoom = this.options.maxZoom;
    this.zoomRange = this.options.zoomRange || { min: 1, max: 17 };

    // # features
    this.markers = [];
    this.lines = [];
    this.polygons = [];
    this.text = [];

    // # fields that get set when map is rendered
    this.center = [];
    this.centerX = 0;
    this.centerY = 0;
    this.zoom = 0;
  }

  addLine(options) {
    this.lines.push(new Polyline(options));
  }

  addMarker(options) {
    this.markers.push(new IconMarker(options));
  }

  addPolygon(options) {
    this.lines.push(new Polyline(options));
  }

  addText(options) {
    this.text.push(new Text(options));
  }

  /**
    * Render static map with all map features that were added to map before
    */
  render(center, zoom) {
    if (!this.lines && !this.markers && !this.polygons && !(center && zoom)) {
      throw new Error('Cannot render empty map: Add  center || lines || markers || polygons.');
    }

    this.center = center;
    this.zoom = zoom || this.calculateZoom();

    if (this.maxZoom && this.zoom > this.maxZoom) {
      this.zoom = this.maxZoom;
    }

    if (center && center.length === 2) {
      this.centerX = lonToX(center[0], this.zoom);
      this.centerY = latToY(center[1], this.zoom);
    } else {
      // # get extent of all lines
      const extent = this.determineExtent(this.zoom);

      // # calculate center point of map
      const centerLon = (extent[0] + extent[2]) / 2;
      const centerLat = (extent[1] + extent[3]) / 2;

      this.centerX = lonToX(centerLon, this.zoom);
      this.centerY = latToY(centerLat, this.zoom);
    }

    this.image = new Image(this.options);

    return this.drawBaselayer()
      .then(this.drawFeatures.bind(this));
  }

  /**
    * calculate common extent of all current map features
    */
  determineExtent(zoom) {
    const extents = [];

    // Add bbox to extent
    if (this.center && this.center.length >= 4) extents.push(this.center);

    // Add polylines and polygons to extent
    if (this.lines.length) {
      this.lines.forEach((line) => {
        extents.push(line.extent());
      });
    } // extents.push(this.lines.map(function(line){ return line.extent(); }));

    // Add marker to extent
    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i];
      const e = [marker.coord[0], marker.coord[1]];

      if (!zoom) {
        extents.push([
          marker.coord[0],
          marker.coord[1],
          marker.coord[0],
          marker.coord[1],
        ]);
        continue;
      }

      // # consider dimension of marker
      const ePx = marker.extentPx();
      const x = lonToX(e[0], zoom);
      const y = latToY(e[1], zoom);

      extents.push([
        xToLon(x - parseFloat(ePx[0]) / this.tileSize, zoom),
        yToLat(y + parseFloat(ePx[1]) / this.tileSize, zoom),
        xToLon(x + parseFloat(ePx[2]) / this.tileSize, zoom),
        yToLat(y - parseFloat(ePx[3]) / this.tileSize, zoom),
      ]);
    }

    return [
      Math.min(...extents.map((e) => e[0])),
      Math.min(...extents.map((e) => e[1])),
      Math.max(...extents.map((e) => e[2])),
      Math.max(...extents.map((e) => e[3])),
    ];
  }

  /**
    * calculate the best zoom level for given extent
    */
  calculateZoom() {
    for (let z = this.zoomRange.max; z >= this.zoomRange.min; z--) {
      const extent = this.determineExtent(z);
      const width = (lonToX(extent[2], z) - lonToX(extent[0], z)) * this.tileSize;
      if (width > (this.width - (this.padding[0] * 2))) continue;

      const height = (latToY(extent[1], z) - latToY(extent[3], z)) * this.tileSize;
      if (height > (this.height - (this.padding[1] * 2))) continue;

      return z;
    }
    return this.zoomRange.min;
  }

  /**
    * transform tile number to pixel on image canvas
    */
  xToPx(x) {
    const px = ((x - this.centerX) * this.tileSize) + (this.width / 2);
    return Number(Math.round(px));
  }

  /**
    * transform tile number to pixel on image canvas
    */
  yToPx(y) {
    const px = ((y - this.centerY) * this.tileSize) + (this.height / 2);
    return Number(Math.round(px));
  }

  drawBaselayer() {
    const xMin = Math.floor(this.centerX - (0.5 * this.width / this.tileSize));
    const yMin = Math.floor(this.centerY - (0.5 * this.height / this.tileSize));
    const xMax = Math.ceil(this.centerX + (0.5 * this.width / this.tileSize));
    const yMax = Math.ceil(this.centerY + (0.5 * this.height / this.tileSize));

    const result = [];

    for (let x = xMin; x < xMax; x++) {
      for (let y = yMin; y < yMax; y++) {
        // # x and y may have crossed the date line
        const maxTile = (2 ** this.zoom);
        const tileX = (x + maxTile) % maxTile;
        let tileY = (y + maxTile) % maxTile;
        if (this.reverseY) tileY = ((1 << this.zoom) - tileY) - 1;

        result.push({
          url: this.tileUrl.replace('{z}', this.zoom).replace('{x}', tileX).replace('{y}', tileY),
          box: [
            this.xToPx(x),
            this.yToPx(y),
            this.xToPx(x + 1),
            this.yToPx(y + 1),
          ],
        });
      }
    }

    const tilePromises = [];
    result.forEach((r) => { tilePromises.push(this.getTile(r)); });

    return new Promise((resolve, reject) => {
      Promise.all(tilePromises)
        .then((values) => this.image.draw(values.filter((v) => v.success).map((v) => v.tile)))
        .then(resolve)
        .catch(reject);
    });
  }

  drawFeatures() {
    return this.drawLines()
      .then(this.loadMarker.bind(this))
      .then(this.drawMarker.bind(this))
      .then(this.drawText.bind(this));
  }

  drawText() {
    return new Promise(async (resolve) => {
      if (!this.text.length) resolve(true);

      const queue = [];
      this.text.forEach((text) => {
        queue.push(async () => {
          await this.renderText(text);
        });
      });
      await asyncQueue(queue);
      resolve(true);
    });
  }

  /**
   * Render text on a baseimage
   */
  async renderText(text) {
    const baseImage = sharp(this.image.image);

    return new Promise((resolve, reject) => {
      const mapcoords = [
        this.xToPx(lonToX(text.coord[0], this.zoom)),
        this.yToPx(latToY(text.coord[1], this.zoom)),
      ];

      baseImage
        .metadata()
        .then((imageMetadata) => {
          const svgPath = `
            <svg
              width="${imageMetadata.width}px"
              height="${imageMetadata.height}px"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg">
              <text
                x="${mapcoords[0]}"
                y="${mapcoords[1]}"
                style="fill-rule: inherit; font-family: ${text.font};"
                font-size="${text.size}pt"
                stroke="${text.color}"
                fill="${text.fill ? text.fill : 'none'}"
                stroke-width="${text.width}"
                text-anchor="${text.anchor}"
              >
                  ${text.text}</text>
            </svg>`;

          baseImage
            .composite([{ input: Buffer.from(svgPath), top: 0, left: 0 }])
            .toBuffer()
            .then((buffer) => {
              this.image.image = buffer;
              resolve(buffer);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  async drawLines() {
    if (!this.lines.length) return true;
    const chunks = chunk(this.lines, LINE_RENDER_CHUNK_SIZE);
    const baseImage = sharp(this.image.image);
    const imageMetadata = await baseImage.metadata();
    const processedChunks = chunks.map((c) => this.processChunk(c, imageMetadata));

    this.image.image = await baseImage
      .composite(processedChunks)
      .toBuffer();

    return true;
  }

  lineToSvg(line) {
    const points = line.coords.map((coord) => [
      this.xToPx(lonToX(coord[0], this.zoom)),
      this.yToPx(latToY(coord[1], this.zoom)),
    ]);
    return `<${(line.type === 'polyline') ? 'polyline' : 'polygon'}
                style="fill-rule: inherit;"
                points="${points.join(' ')}"
                stroke="${line.color}"
                fill="${line.fill ? line.fill : 'none'}"
                stroke-width="${line.width}"/>`;
  }

  processChunk(lines, imageMetadata) {
    const svgPath = `
            <svg
              width="${imageMetadata.width}px"
              height="${imageMetadata.height}"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg">
              ${lines.map((line) => this.lineToSvg(line))}              
            </svg>`;
    return { input: Buffer.from(svgPath), top: 0, left: 0 };
  }

  drawMarker() {
    return new Promise(async (resolve) => {
      const queue = [];
      this.markers.forEach((marker) => {
        queue.push(async () => {
          this.image.image = await sharp(this.image.image)
            .composite([{
              input: marker.imgData,
              top: Math.round(marker.position[1]),
              left: Math.round(marker.position[0]),
            }])
            .toBuffer();
        });
      });
      await asyncQueue(queue);
      resolve(true);
    });
  }

  /**
    *   Preloading the icon image
    */
  loadMarker() {
    return new Promise((resolve, reject) => {
      if (!this.markers.length) resolve(true);
      const icons = uniqBy(this.markers.map((m) => ({ file: m.img })), 'file');

      let count = 1;
      icons.forEach(async (ico) => {
        const icon = ico;
        const isUrl = !!url.parse(icon.file).hostname;
        try {
          // Load marker from remote url
          if (isUrl) {
            const img = await request.get({
              rejectUnauthorized: false,
              url: icon.file,
              encoding: null,
            });
            icon.data = await sharp(img).toBuffer();
          } else {
            // Load marker from local fs
            icon.data = await sharp(icon.file).toBuffer();
          }
        } catch (err) {
          reject(err);
        }

        if (count++ === icons.length) {
          // Pre loaded all icons
          this.markers.forEach((mark) => {
            const marker = mark;
            marker.position = [
              this.xToPx(lonToX(marker.coord[0], this.zoom)) - marker.offset[0],
              this.yToPx(latToY(marker.coord[1], this.zoom)) - marker.offset[1],
            ];
            const imgData = find(icons, { file: marker.img });
            marker.set(imgData.data);
          });

          resolve(true);
        }
      });
    });
  }

  /**
   *  Fetching tiles from endpoint
   */
  getTile(data) {
    return new Promise((resolve) => {
      const options = {
        url: data.url,
        encoding: null,
        resolveWithFullResponse: true,
        headers: this.tileRequestHeader || {},
        timeout: this.tileRequestTimeout,
      };

      const defaultAgent = `staticmaps@${pjson.version} (Node.js ${process.version})`;
      options.headers['User-Agent'] = options.headers['User-Agent'] || defaultAgent;

      request.get(options).then((res) => {
        resolve({
          success: true,
          tile: {
            url: data.url,
            box: data.box,
            body: res.body,
          },
        });
      }).catch((error) => resolve({
        success: false,
        error,
      }));
    });
  }
}

export default StaticMaps;
module.exports = StaticMaps;
