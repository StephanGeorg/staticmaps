var _ = require("lodash");
var Jimp = require("jimp");

var IconMarker = function (options) {

  this.options = options || {};

  if (!(options.width && options.height)) throw new Error("Please specify width and height of the marker image.");

  this.coord = this.options.coord;
  this.img = this.options.img;
  this.offsetX = this.options.offsetX || options.width/2;
  this.offsetY = this.options.offsetY || options.height;
  this.offset = [this.offsetX, this.offsetY];
  this.height = this.options.height;
  this.width = this.options.width;

};

module.exports = IconMarker;

/**
 * Load icon image from fs or remote request
 */
IconMarker.prototype.load = function (path) {

  return new Promise(function (resolve,reject){
    Jimp.read(this.img, function (err, tile) {
        if (err) reject(err);
        this.imgData = tile;
        resolve(true);
    }.bind(this));
  }.bind(this));

};

IconMarker.prototype.extentPx = function () {

  return [
    this.offset[0],
    (this.height - this.offset[1]),
    (this.width - this.offset[0]),
    this.offset[1]
  ];

};
