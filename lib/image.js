var Jimp = require("jimp");
var _ = require("lodash");

var Image = function (options) {

    this.options = options || {};
    this.width = this.options.width;
    this.height = this.options.height;

};

module.exports = Image;

Image.prototype.drawImage = function (tiles) {

  return new Promise (_.bind(function(resolve, reject) {

    var key = 0;

    var image = new Jimp(this.width, this.height, _.bind(function (err, image) {

      if (err) reject(err);

      this.image = image;

      _.each(tiles, _.bind(function (data) {

        Jimp.read(data.body, _.bind(function (err, tile) {

            if (err) reject(err);

            var x = data.box[0];
            var y = data.box[1];

            var sx = x < 0 ? 0 : x;
            var sy = y < 0 ? 0 : y;

            var dx = x < 0 ? -x : 0;
            var dy = y < 0 ? -y : 0;

            var extraWidth = x + tile.bitmap.width - this.width;
            var extraHeight = y + tile.bitmap.width - this.height;

            var w = tile.bitmap.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0);
            var h = tile.bitmap.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0);

            image.blit(tile, sx, sy, dx, dy, w, h);
            this.image = image;

            if (key === tiles.length-1) resolve(true);
            key++;

        },this));
      },this));
    },this));
  },this));

};

Image.prototype.save = function (fileName, cb) {

  this.image.write(fileName, cb);

};
