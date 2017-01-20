var _ = require("lodash");

var Line = function (options) {

  this.options = options || {};

  this.coords = this.options.coords;
  this.color = this.options.color || '#000000';
  this.width = this.options.width || 2;
  this.simplify = this.options.simplify || true;

};

module.exports = Line;

/**
 * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
 */
Line.prototype.extent = function () {

  return [
    this.coords.map(function(c){ return c[0]; }).min(),
    this.coords.map(function(c){ return c[1]; }).min(),
    this.coords.map(function(c){ return c[0]; }).max(),
    this.coords.map(function(c){ return c[1]; }).max()
  ];

};

// Helper functions

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
