var _ = require('lodash');
var fs = require('fs');
var PNG = require('pngjs2').PNG;

var IconMarker = function (coord, filePath, offset_x, offset_y, height, width) {
  this.coord = coord;
  this.img = filePath;
  this.height = height;
  this.width = width;
  this.offset_x = offset_x || 0;
  this.offset_y = offset_y || 0;
  this.offset = [this.offset_x, this.offset_y];

};

module.exports = IconMarker;


IconMarker.prototype.load = function (path) {

  var self = this;

  return new Promise(_.bind(function (resolve,reject){

    fs.createReadStream(path)
      .pipe(new PNG({
        colorType: 6
      }))
      .on('metadata', function (meta){
        // console.log(meta);
      })
      .on('parsed', function() {

        self.imgData = this;
        resolve(true);

      })
      .on('error', function (error) {
        console.log("Load Error", error);
      });

  },this));

};

IconMarker.prototype.extentPx = function () {

  return [
    this.offset[0],
    (this.height - this.offset[1]),
    (this.width - this.offset[0]),
    this.offset[1]
  ];

};
