import Jimp from 'jimp';
import { _ } from 'lodash';

export default class Image {
  constructor(options = {}) {
    this.options = options;
    this.width = this.options.width;
    this.height = this.options.height;
    this.quality = this.options.quality || 100;
  }

  draw(tiles) {
    return new Promise((resolve, reject) => {
      let key = 0;
      const img = new Jimp(this.width, this.height, (err, image) => {
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
      });
    });
  }

  /**
   * Save image to file
   */
  save(fileName, cb) {
    if (_.isFunction(cb)) {
      this.image
        .quality(this.quality)
        .write(fileName, cb);
    } else {
      return new Promise((resolve) => {
        this.image
          .quality(this.quality)
          .write(fileName, () => {
            resolve(true);
          });
      });
    }
    return null;
  }

  /**
   * Return image as buffer
   */
  buffer(mime, cb) {
    if (_.isFunction(cb)) {
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
