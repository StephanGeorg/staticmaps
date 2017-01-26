var _ = require("lodash");
var Jimp = require("jimp");

var IconMarker = function (options) {

  this.options = options || {};

  if (!(options.width && options.height)) throw new Error("Please specify width and height of the marker image.");

  this.coord = this.options.coord;
  this.img = this.options.img;
  this.offset_x = this.options.offset_x || width/2;
  this.offset_y = this.options.offset_y || height;
  this.offset = [this.offset_x, this.offset_y];
  this.height = this.options.height;
  this.width = this.options.width;

};

module.exports = IconMarker;

/**
 * Load icon image from fs or remote request
 */
IconMarker.prototype.load = function (path) {

  return new Promise(_.bind(function (resolve,reject){
    Jimp.read(this.img, _.bind(function (err, tile) {
        if (err) reject(err);
        this.imgData = tile;
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
