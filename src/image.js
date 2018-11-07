import sharp from 'sharp';
import last from 'lodash.last';

import asyncQueue from './helper/asyncQueue';

export default class Image {
  constructor(options = {}) {
    this.options = options;
    this.width = this.options.width;
    this.height = this.options.height;
    this.quality = this.options.quality || 100;
  }

  /**
   * Prepare all tiles to fit the baselayer
   */
  prepareTileParts(data) {
    return new Promise((resolve) => {
      const tile = sharp(data.body);
      tile
        .metadata()
        .then((metadata) => {
          const x = data.box[0];
          const y = data.box[1];
          const sx = x < 0 ? 0 : x;
          const sy = y < 0 ? 0 : y;
          const dx = x < 0 ? -x : 0;
          const dy = y < 0 ? -y : 0;
          const extraWidth = x + (metadata.width - this.width);
          const extraHeight = y + (metadata.width - this.height);
          const w = metadata.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0);
          const h = metadata.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0);
          return tile
            .extract({
              left: dx,
              top: dy,
              width: w,
              height: h,
            })
            .toBuffer()
            .then((part) => {
              resolve({
                position: { top: Math.round(sy), left: Math.round(sx) },
                data: part,
              });
            });
        });
    });
  }

  async draw(tiles) {
    return new Promise(async (resolve) => {
      // Generate baseimage
      const baselayer = sharp({
        create: {
          width: this.width,
          height: this.height,
          channels: 4,
          background: {
            r: 0, g: 0, b: 0, alpha: 0,
          },
        },
      });
      // Save baseimage as buffer
      let tempbuffer = await baselayer.png().toBuffer();

      // Prepare tiles for composing baselayer
      const tileParts = [];
      tiles.forEach((tile, i) => {
        tileParts.push(this.prepareTileParts(tile, i));
      });
      const preparedTiles = await Promise.all(tileParts);

      // Compose all prepared tiles to the baselayer
      const queue = [];
      preparedTiles.forEach((preparedTile) => {
        queue.push(async () => {
          const { position, data } = preparedTile;
          position.top = Math.round(position.top);
          position.left = Math.round(position.left);
          tempbuffer = await sharp(tempbuffer)
            .overlayWith(data, position)
            .toBuffer();
        });
      });
      await asyncQueue(queue);
      this.image = tempbuffer;

      resolve(true);
    });
  }

  /**
   * Save image to file
   */
  save(fileName = 'output.png', outOpts = {}) {
    const format = last(fileName.split('.'));
    const outputOptions = outOpts;
    outputOptions.quality = outputOptions.quality || this.quality;
    return new Promise(async (resolve, reject) => {
      try {
        switch (format.toLowerCase()) {
          case 'webp': await sharp(this.image).webp(outputOptions).toFile(fileName); break;
          case 'jpg':
          case 'jpeg': await sharp(this.image).jpeg(outputOptions).toFile(fileName); break;
          case 'png':
          default: await sharp(this.image).png(outputOptions).toFile(fileName); break;
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Return image as buffer
   */
  buffer(mime = 'image/png', outOpts = {}) {
    const outputOptions = outOpts;
    outputOptions.quality = outputOptions.quality || this.quality;
    return new Promise(async (resolve) => {
      let buffer;
      switch (mime.toLowerCase()) {
        case 'image/webp': buffer = await sharp(this.image).webp(outputOptions).toBuffer(); break;
        case 'image/jpeg':
        case 'image/jpg': buffer = await sharp(this.image).jpeg(outputOptions).toBuffer(); break;
        case 'image/png':
        default: buffer = await sharp(this.image).png(outputOptions).toBuffer(); break;
      }
      resolve(buffer);
    });
  }
}

module.exports = Image;
