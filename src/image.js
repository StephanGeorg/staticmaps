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

          // Fixed #20 https://github.com/StephanGeorg/staticmaps/issues/20
          if (!w || !h) {
            resolve({ success: false });
            return null;
          }

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
                success: true,
                position: { top: Math.round(sy), left: Math.round(sx) },
                data: part,
              });
            })
            .catch(() => resolve({ success: false }));
        })
        .catch(() => resolve({ success: false }));
    });
  }

  async draw(tiles) {
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

    const preparedTiles = (await Promise.all(tileParts)).filter((v) => v.success);

    // Compose all prepared tiles to the baselayer
    const queue = [];

    var preparedTilesForSharp = preparedTiles
        .filter((preparedTile) => !!preparedTile) //remove non-existing tiles
        .map((preparedTile) => {
            const { position, data } = preparedTile;
            position.top = Math.round(position.top);
            position.left = Math.round(position.left);
            return {input: data, ...position};
        })

    tempbuffer = await sharp(tempbuffer)
      .composite(preparedTilesForSharp)
      .toBuffer();

    this.image = tempbuffer;
    return true;
  }

  /**
   * Save image to file
   */
  async save(fileName = 'output.png', outOpts = {}) {
    const format = last(fileName.split('.'));
    const outputOptions = outOpts;
    outputOptions.quality = outputOptions.quality || this.quality;
    switch (format.toLowerCase()) {
      case 'webp': await sharp(this.image).webp(outputOptions).toFile(fileName); break;
      case 'jpg':
      case 'jpeg': await sharp(this.image).jpeg(outputOptions).toFile(fileName); break;
      case 'png':
      default: await sharp(this.image).png(outputOptions).toFile(fileName);
    }
  }

  /**
   * Return image as buffer
   */
  async buffer(mime = 'image/png', outOpts = {}) {
    const outputOptions = outOpts;
    outputOptions.quality = outputOptions.quality || this.quality;
    switch (mime.toLowerCase()) {
      case 'image/webp': return sharp(this.image).webp(outputOptions).toBuffer();
      case 'image/jpeg':
      case 'image/jpg': return sharp(this.image).jpeg(outputOptions).toBuffer();
      case 'image/png':
      default: return sharp(this.image).png(outputOptions).toBuffer();
    }
  }
}

module.exports = Image;
