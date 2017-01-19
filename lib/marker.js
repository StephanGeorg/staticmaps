var _ = require('lodash');
var Jimp = require("jimp");

var IconMarker = function (options) {

  this.options = options || {};

  this.coord = this.options.coord;
  this.img = this.options.filePath;
  this.offset_x = this.options.offset_x || 0;
  this.offset_y = this.options.offset_y || 0;
  this.offset = [this.offset_x, this.offset_y];
  this.height = this.options.height;
  this.width = this.options.width;

};

module.exports = IconMarker;


IconMarker.prototype.load = function (path) {

  var self = this;

  return new Promise(_.bind(function (resolve,reject){

    Jimp.read(path, _.bind(function (err, tile) {
        // do stuff with the image (if no exception)
        if (err) {
          console.log(err);
          reject(err);
        }


        self.imgData = tile;
        resolve(true);



    },this));
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
