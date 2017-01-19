var fs = require('fs');
var PNG = require('pngjs2').PNG;
var Jimp = require("jimp");
var _ = require('lodash');

var Image = function (options) {

    console.log(options);

    this.options = options || {};
    this.width = this.options.width;
    this.height = this.options.height;

};

module.exports = Image;

Image.prototype.drawImage = function (tiles) {

  return new Promise (_.bind(function(resolve, reject) {

    var key = 0;

    var image = new Jimp(this.width, this.height, _.bind(function (err, image) {
      // this image is 256 x 256, every pixel is set to 0x00000000
      if (err) console.log(err);

      this.image = image;

      _.each(tiles, _.bind(function (data) {

        Jimp.read(data.body, _.bind(function (err, tile) {
            // do stuff with the image (if no exception)
            if (err) console.log(err);
            //else console.log(tile);

            var x = data.box[0] < 0 ? -data.box[0] : 0;
            var y = data.box[1] < 0 ? -data.box[1] : 0;
            var extraWidth = x + tile.bitmap.width - this.width;
            var extraHeight = y + tile.bitmap.width - this.height;

            var srcw = tile.bitmap.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0);
            var srch = tile.bitmap.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0);
            var srcx = x < 0 ? 0 : x;
            var srcy = y < 0 ? 0 : y;

            console.log(srcx, srcy, x, y, srcw, srch);

            image.blit(tile, x, y, srcx, srcy, srcw, srch);
            this.image = image;

            if (key === tiles.length-1) resolve(true);
            key++;


        },this));
      },this));
    },this));
  },this));

  /*return new Promise (_.bind(function(resolve, reject) {
    var key = 0;

    _.each(tiles, _.bind(function (data) {

      var tile = new PNG({
        colorType: 6
      });

      tile.parse(data.body, _.bind(function(error){

        var x = data.box[0];
        var y = data.box[1];

        if (error) reject(error);

        var extraWidth = x + tile.width - this.width;
        var extraHeight = y + tile.width - this.height;

        tile.bitblt(this.png,
          x < 0 ? -x : 0,
          y < 0 ? -y : 0,
          tile.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0),
          tile.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0),
          x < 0 ? 0 : x,
          y < 0 ? 0 : y);

        if (key === tiles.length-1) resolve(true);
        key++;

      },this));
    },this));
  },this));*/

};

Image.prototype.pack = function () {
  return this.png.pack();
};

Image.prototype.save = function (fileName, cb) {

  this.image.write(fileName, cb);

  //return this.png.pack().pipe(fs.createWriteStream(fileName));

};
