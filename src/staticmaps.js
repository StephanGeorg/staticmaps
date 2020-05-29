import got from 'got';
import sharp from 'sharp';
import find from 'lodash.find';
import uniqBy from 'lodash.uniqby';
import url from 'url';
import chunk from 'lodash.chunk';

import Image from './image';
import IconMarker from './marker';
import Polyline from './polyline';
import MultiPolygon from './multipolygon';
import Circle from './circle';
import Text from './text';
import Bound from './bound';

import asyncQueue from './helper/asyncQueue';
import geoutils from './helper/geo';

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
    this.subdomains = this.options.subdomains || [];
    this.tileRequestTimeout = this.options.tileRequestTimeout;
    this.tileRequestHeader = this.options.tileRequestHeader;
    this.tileRequestLimit = Number.isFinite(this.options.tileRequestLimit)
      ? Number(this.options.tileRequestLimit) : 2;
    this.reverseY = this.options.reverseY || false;
    const zoomRange = this.options.zoomRange || {};
    this.zoomRange = {
      min: zoomRange.min || 1,
      max: this.options.maxZoom || zoomRange.max || 17, // maxZoom
    };
    // this.maxZoom = this.options.maxZoom; DEPRECATED: use zoomRange.max instead

    // # features
    this.markers = [];
    this.lines = [];
    this.multipolygons = [];
    this.circles = [];
    this.text = [];
    this.bounds = [];

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

  addMultiPolygon(options) {
    this.multipolygons.push(new MultiPolygon(options));
  }

  addCircle(options) {
    this.circles.push(new Circle(options));
  }

  addBound(options) {
    this.bounds.push(new Bound(options));
  }

  addText(options) {
    this.text.push(new Text(options));
  }

  /**
    * Render static map with all map features that were added to map before
    */
  async render(center, zoom) {
    if (!this.lines && !this.markers && !this.multipolygons && !(center && zoom)) {
      throw new Error('Cannot render empty map: Add  center || lines || markers || polygons.');
    }

    this.center = center;
    this.zoom = zoom || this.calculateZoom();

    const maxZoom = this.zoomRange.max;
    if (maxZoom && this.zoom > maxZoom) this.zoom = maxZoom;

    if (center && center.length === 2) {
      this.centerX = geoutils.lonToX(center[0], this.zoom);
      this.centerY = geoutils.latToY(center[1], this.zoom);
    } else {
      // # get extent of all lines
      const extent = this.determineExtent(this.zoom);

      // # calculate center point of map
      const centerLon = (extent[0] + extent[2]) / 2;
      const centerLat = (extent[1] + extent[3]) / 2;

      this.centerX = geoutils.lonToX(centerLon, this.zoom);
      this.centerY = geoutils.latToY(centerLat, this.zoom);
    }

    this.image = new Image(this.options);

    await Promise.all([
      this.drawBaselayer(),
      this.loadMarker(),
    ]);
    return this.drawFeatures();
  }

  /**
    * calculate common extent of all current map features
    */
  determineExtent(zoom) {
    const extents = [];

    // Add bbox to extent
    if (this.center && this.center.length >= 4) extents.push(this.center);

    // add bounds to extent
    if (this.bounds.length) {
      this.bounds.forEach((bound) => extents.push(bound.extent()));
    }

    // Add polylines and polygons to extent
    if (this.lines.length) {
      this.lines.forEach((line) => {
        extents.push(line.extent());
      });
    }
    if (this.multipolygons.length) {
      this.multipolygons.forEach((multipolygon) => {
        extents.push(multipolygon.extent());
      });
    }

    // Add circles to extent
    if (this.circles.length) {
      this.circles.forEach((circle) => {
        extents.push(circle.extent());
      });
    }

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
      const x = geoutils.lonToX(e[0], zoom);
      const y = geoutils.latToY(e[1], zoom);

      extents.push([
        geoutils.xToLon(x - parseFloat(ePx[0]) / this.tileSize, zoom),
        geoutils.yToLat(y + parseFloat(ePx[1]) / this.tileSize, zoom),
        geoutils.xToLon(x + parseFloat(ePx[2]) / this.tileSize, zoom),
        geoutils.yToLat(y - parseFloat(ePx[3]) / this.tileSize, zoom),
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
      const width = (geoutils.lonToX(extent[2], z)
        - geoutils.lonToX(extent[0], z)) * this.tileSize;
      if (width > (this.width - (this.padding[0] * 2))) continue;

      const height = (geoutils.latToY(extent[1], z)
        - geoutils.latToY(extent[3], z)) * this.tileSize;
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

  async drawBaselayer() {
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

        let tileUrl = this.tileUrl.replace('{z}', this.zoom).replace('{x}', tileX).replace('{y}', tileY);

        if (this.subdomains.length > 0) {
          // replace subdomain with random domain from subdomains array
          tileUrl = tileUrl.replace('{s}', this.subdomains[Math.floor(Math.random() * this.subdomains.length)]);
        }

        result.push({
          url: tileUrl,
          box: [
            this.xToPx(x),
            this.yToPx(y),
            this.xToPx(x + 1),
            this.yToPx(y + 1),
          ],
        });
      }
    }

    const tiles = await this.getTiles(result);
    return this.image.draw(tiles.filter((v) => v.success).map((v) => v.tile));
  }

  /**
   *  Render a circle to SVG
   */
  renderCircle(circle, imageMetadata) {
    const latCenter = circle.coord[1];
    const radiusInPixel = geoutils.meterToPixel(circle.radius, this.zoom, latCenter);
    const x = this.xToPx(geoutils.lonToX(circle.coord[0], this.zoom));
    const y = this.yToPx(geoutils.latToY(circle.coord[1], this.zoom));
    const svgPath = `
            <svg
              width="${imageMetadata.width}px"
              height="${imageMetadata.height}"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="${x}"
                cy="${y}"
                r="${radiusInPixel}"
                style="fill-rule: inherit;"
                stroke="${circle.color}"
                fill="${circle.fill}"
                stroke-width="${circle.width}"
                />
            </svg>`;
    return { input: Buffer.from(svgPath), top: 0, left: 0 };
  }

  /**
   *  Draw circles to the basemap
   */
  async drawCircles() {
    if (!this.circles.length) return true;
    const baseImage = sharp(this.image.image);
    const imageMetadata = await baseImage.metadata();

    const mpSvgs = this.circles
      .map((circle) => this.renderCircle(circle, imageMetadata));

    this.image.image = await baseImage.composite(mpSvgs).toBuffer();

    return true;
  }

  /**
   * Render text to SVG
   */
  renderText(text, imageMetadata) {
    const mapcoords = [
      this.xToPx(geoutils.lonToX(text.coord[0], this.zoom)),
      this.yToPx(geoutils.latToY(text.coord[1], this.zoom)),
    ];

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

    return { input: Buffer.from(svgPath), top: 0, left: 0 };
  }

  /**
   *  Draw texts to the baemap
   */
  async drawText() {
    if (!this.text.length) return null;

    const baseImage = sharp(this.image.image);
    const imageMetadata = await baseImage.metadata();

    const txtSvgs = this.text
      .map((text) => this.renderText(text, imageMetadata));

    this.image.image = await baseImage.composite(txtSvgs).toBuffer();

    return true;
  }

  /**
   *  Render MultiPolygon to SVG
   */
  multipolygonToPath(multipolygon) {
    const shapeArrays = multipolygon.coords.map((shape) => shape.map((coord) => [
      this.xToPx(geoutils.lonToX(coord[0], this.zoom)),
      this.yToPx(geoutils.latToY(coord[1], this.zoom)),
    ]));

    const pathArrays = shapeArrays.map((points) => {
      const startPoint = points.shift();

      const pathParts = [
        `M ${startPoint[0]} ${startPoint[1]}`,
        ...points.map((p) => `L ${p[0]} ${p[1]}`),
        'Z',
      ];

      return pathParts.join(' ');
    });

    return `<path
             d="${pathArrays.join(' ')}"
             style="fill-rule: inherit;"
             stroke="${multipolygon.color}"
             fill="${multipolygon.fill ? multipolygon.fill : 'none'}"
             stroke-width="${multipolygon.width}"/>`;
  }

  /**
   *  Render MultiPolygon to SVG
   */
  renderMultiPolygon(multipolygon, imageMetadata) {
    const svgPath = `
            <svg
              width="${imageMetadata.width}px"
              height="${imageMetadata.height}"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg">
              ${this.multipolygonToPath(multipolygon)}
            </svg>`;
    return { input: Buffer.from(svgPath), top: 0, left: 0 };
  }

  /**
   *  Draw Multipolygon to the basemap
   */
  async drawMultiPolygons() {
    if (!this.multipolygons.length) return true;

    const baseImage = sharp(this.image.image);
    const imageMetadata = await baseImage.metadata();

    const mpSvgs = this.multipolygons
      .map((multipolygon) => this.renderMultiPolygon(multipolygon, imageMetadata));

    this.image.image = await baseImage.composite(mpSvgs).toBuffer();

    return true;
  }

  /**
   *  Render Polyline to SVG
   */
  lineToSvg(line) {
    const points = line.coords.map((coord) => [
      this.xToPx(geoutils.lonToX(coord[0], this.zoom)),
      this.yToPx(geoutils.latToY(coord[1], this.zoom)),
    ]);
    return `<${(line.type === 'polyline') ? 'polyline' : 'polygon'}
                style="fill-rule: inherit;"
                points="${points.join(' ')}"
                stroke="${line.color}"
                fill="${line.fill ? line.fill : 'none'}"
                stroke-width="${line.width}"/>`;
  }

  /**
   *  Render Polyline / Polygon to SVG
   */
  renderLine(lines, imageMetadata) {
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

  /**
   *  Draw polylines / polygons to the basemap
   */
  async drawLines() {
    if (!this.lines.length) return true;
    const chunks = chunk(this.lines, LINE_RENDER_CHUNK_SIZE);
    const baseImage = sharp(this.image.image);
    const imageMetadata = await baseImage.metadata();
    const processedChunks = chunks.map((c) => this.renderLine(c, imageMetadata));

    this.image.image = await baseImage
      .composite(processedChunks)
      .toBuffer();

    return true;
  }

  /**
   *  Draw markers to the basemap
   */
  drawMarker() {
    const queue = [];
    this.markers.forEach((marker) => {
      queue.push(async () => {
        const top = Math.round(marker.position[1]);
        const left = Math.round(marker.position[0]);

        if (
          top < 0
          || left < 0
          || top > this.height
          || left > this.width
        ) return;

        this.image.image = await sharp(this.image.image)
          .composite([{
            input: marker.imgData,
            top,
            left,
          }])
          .toBuffer();
      });
    });
    return asyncQueue(queue);
  }

  /**
   *  Draw all features to the basemap
   */
  async drawFeatures() {
    await this.drawLines();
    await this.drawMultiPolygons();
    await this.drawMarker();
    await this.drawText();
    await this.drawCircles();
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
            const img = await got.get({
              rejectUnauthorized: false,
              url: icon.file,
              responseType: 'buffer',
            });
            icon.data = await sharp(img.body).toBuffer();
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
              this.xToPx(geoutils.lonToX(marker.coord[0], this.zoom)) - marker.offset[0],
              this.yToPx(geoutils.latToY(marker.coord[1], this.zoom)) - marker.offset[1],
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
   *  Fetching tile from endpoint
   */
  getTile(data) {
    return new Promise((resolve) => {
      const options = {
        url: data.url,
        responseType: 'buffer',
        resolveWithFullResponse: true,
        headers: this.tileRequestHeader || {},
        timeout: this.tileRequestTimeout,
      };

      // const defaultAgent = `staticmaps@${pjson.version}`;
      // options.headers['User-Agent'] = options.headers['User-Agent'] || defaultAgent;

      got.get(options).then((res) => {
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

  /**
   *  Fetching tiles and limit concurrent connections
   */
  async getTiles(baseLayers) {
    const limit = this.tileRequestLimit;

    // Limit concurrent connections to tiles server
    // https://operations.osmfoundation.org/policies/tiles/#technical-usage-requirements
    if (Number(limit)) {
      const aQueue = [];
      const tiles = [];
      for (let i = 0, j = baseLayers.length; i < j; i += limit) {
        const chunks = baseLayers.slice(i, i + limit);
        const sQueue = [];
        aQueue.push(async () => {
          chunks.forEach((r) => {
            sQueue.push((async () => {
              const tile = await this.getTile(r);
              tiles.push(tile);
            })());
          });
          await Promise.all(sQueue);
        });
      }
      await asyncQueue(aQueue);
      return tiles;
    }

    // Do not limit concurrent connections at all
    const tilePromises = [];
    baseLayers.forEach((r) => { tilePromises.push(this.getTile(r)); });
    return Promise.all(tilePromises);
  }
}

export default StaticMaps;
module.exports = StaticMaps;
