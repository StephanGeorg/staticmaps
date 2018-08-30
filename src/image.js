import Jimp from 'jimp';
import sharp from 'sharp';
import isFunction from 'lodash.isfunction';

import asyncQueue from './helper/asyncQueue';

export default class Image {
  constructor(options = {}) {
    this.options = options;
    this.width = this.options.width;
    this.height = this.options.height;
    this.quality = this.options.quality || 100;
  }


  genParts(data) {
    return new Promise((resolve, reject) => {
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

          console.log(sx, sy, dx, dy, w, h);

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
                position: { top: sx, left: sy },
                data: part,
              });
            });
        });
    });
  }

  async draw(tiles) {
    return new Promise(async (resolve, reject) => {
      let key = 0;

      // let baselayer;
      let tempbuffer;

      const baselayer = sharp({
        create: {
          width: this.width,
          height: this.height,
          channels: 4,
          background: {
            r: 255, g: 255, b: 255, alpha: 0,
          },
        },
      });
      baselayer
        .png()
        .toBuffer()
        .then((buffer) => {
          tempbuffer = buffer;
        });

      const tileParts = [];

      tiles.forEach((data) => {
        tileParts.push(this.genParts(data));
      });

      // console.log(tileParts);
      const d = await Promise.all(tileParts);
      // console.log(d);

      const queue = [];


      d.forEach((dd) => {
        queue.push(async () => {
          tempbuffer = await sharp(tempbuffer)
            .overlayWith(dd.data, dd.position)
            .toBuffer(tempbuffer);
        });
      });
      await asyncQueue(queue);
      await sharp(tempbuffer)
        .toFile('output.png');

      resolve(true);

      /* baselayer
        .png()
        .toBuffer()
        .then((image) => {
          this.image = image;

        }); */


      /* const img = new Jimp(this.width, this.height, (err, image) => {
        if (err) reject(err);
        this.image = image;
        tiles.forEach((data) => {
          Jimp.read(data.body, (errRead, tile) => {
            if (errRead) reject(errRead);

            const x = data.box[0];
            const y = data.box[1];
            const sx = x < 0 ? 0 : x;
            const sy = y < 0 ? 0 : y;
            const dx = x < 0 ? -x : 0;
            const dy = y < 0 ? -y : 0;
            const extraWidth = x + (tile.bitmap.width - this.width);
            const extraHeight = y + (tile.bitmap.width - this.height);
            const w = tile.bitmap.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0);
            const h = tile.bitmap.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0);

            img.blit(tile, sx, sy, dx, dy, w, h);
            this.image = image;

            if (key === tiles.length - 1) resolve(true);
            key++;
          });
        });
      }); */
    });
  }

  /**
   * Save image to file
   */
  save(fileName, cb) {
    if (isFunction(cb)) {
      this.image
        .quality(this.quality)
        .write(fileName, cb);
    } else {
      return new Promise((resolve) => {
        this.image
          .quality(this.quality)
          .write(fileName, () => {
            resolve();
          });
      });
    }
    return null;
  }

  /**
   * Return image as buffer
   */
  buffer(mime, cb) {
    if (isFunction(cb)) {
      this.image.getBuffer(mime, cb);
    } else {
      return new Promise((resolve, reject) => {
        this.image.getBuffer(mime || 'image/png', (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }
    return null;
  }
}

module.exports = Image;
