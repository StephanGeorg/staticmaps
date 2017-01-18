var fs = require('fs');
var PNG = require('pngjs2').PNG;

var Image = function (options) {

    this.png = new PNG(options);
    this.width = this.png.width;
    this.height = this.png.height;

};

module.exports = Image;

Image.prototype.drawImage = function (data, x, y, callback) {
  var tile = new PNG({
    colorType: 6
  });

  tile.parse(data, function (err) {
    if (err) {
      return callback(err);
    }

    var extraWidth = x + tile.width - this.width;
    var extraHeight = y + tile.height - this.height;

    tile.bitblt(this.png,
      x < 0 ? -x : 0,
      y < 0 ? -y : 0,
      tile.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0),
      tile.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0),
      x < 0 ? 0 : x,
      y < 0 ? 0 : y);

    callback(null);
  });
};

Image.prototype.pack = function () {
  return this.png.pack();
};

Image.prototype.save = function (fileName) {
  return this.png.pack().pipe(fs.createWriteStream(fileName));
};
