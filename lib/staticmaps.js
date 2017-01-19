var _ = require("lodash");
var request = require("request-promise");

var Image = require("./image");
var IconMarker = require("./marker");

var StaticMaps = function (options) {

  this.options = options || {};

  this.width = this.options.width;
  this.height = this.options.height;
  this.padding_x = this.options.padding_x || 0;
  this.padding_y = this.options.padding_y || 0;
  this.padding = [this.padding_x, this.padding_y];
  this.url_template = this.options.url_template || "http://tile.openstreetmap.org/{z}/{x}/{y}.png";
  this.tile_size = this.options.tile_size || 256;
  this.tile_request_timeout = this.options.tile_request_timeout;
  this.header = this.options.headers;
  this.reverse_y = this.options.reverse_y || false;
  this.background_color = this.options.background_color || "#fff";

  // # features
  this.markers = [];
  this.lines = [];
  this.polygons = [];

  // # fields that get set when map is rendered
  this.center = [];
  this.x_center = 0;
  this.y_center = 0;
  this.zoom = 0;

};

module.exports = StaticMaps;

StaticMaps.prototype.addLine = function (line) {
  this.lines.push(line);
};
StaticMaps.prototype.addMarker = function (options) {
  this.markers.push(new IconMarker(options));
};
StaticMaps.prototype.addPolygon = function (polygon) {
  this.polygons.push(polygon);
};

/**
  * render static map with all map features that were added to map before
  **/
StaticMaps.prototype.render = function (center, zoom) {

  if (!this.lines && !this.markers && !this.polygons && !(center && zoom)) {
    throw new Error("cannot render empty map, add lines / markers / polygons first");
  }

  this.center = center;
  this.zoom = zoom || this._calculateZoom();

  if (center && center.length === 2) {

    this.x_center = _lon_to_x(center[0], this.zoom);
    this.y_center = _lat_to_y(center[1], this.zoom);

  } else {

    // # get extent of all lines
    var extent = this.determineExtent(this.zoom);

    // # calculate center point of map
    var lon_center = (extent[0] + extent[2]) / 2;
    var lat_center = (extent[1] + extent[3]) / 2;

    this.x_center = _lon_to_x(lon_center, this.zoom);
    this.y_center = _lat_to_y(lat_center, this.zoom);

  }

  this.image = new Image({
    width: this.width,
    height: this.height
  });

  return new Promise ( _.bind(function(resolve, reject) {

    this._drawBaselayer()
      .then( _.bind(function (val) {

        this._drawFeatures()
          .then(function (val) { resolve(true); })
          .catch(function (err) { reject(err); });

      },this))
      .catch(function (err) { reject(err); });

  }, this ));

};

/**
  * calculate common extent of all current map features
  **/
StaticMaps.prototype.determineExtent = function (zoom) {

  var extents = [];

  // Add bbox to extent
  if (this.center && this.center.length >= 4) extents.push(this.center);

  // Add lines to extent
  if (this.lines.length) extents.push(this.lines.map(function(line){ return line.extent; }));

  // Add marker to extent
  for (var i=0;i<this.markers.length;i++) {

    var marker = this.markers[i];
    var e = [marker.coord[0],marker.coord[1]];

    if (!zoom) {
      extents.push([
        marker.coord[0],
        marker.coord[1],
        marker.coord[0],
        marker.coord[1],
      ]);
      continue;
    }

    // # consider dimension of marker
    var e_px = marker.extentPx();
    var x = _lon_to_x(e[0], zoom);
    var y = _lat_to_y(e[1], zoom);

    extents.push([
      _x_to_lon(x - parseFloat(e_px[0]) / this.tile_size, zoom),
      _y_to_lat(y + parseFloat(e_px[1]) / this.tile_size, zoom),
      _x_to_lon(x + parseFloat(e_px[2]) / this.tile_size, zoom),
      _y_to_lat(y - parseFloat(e_px[3]) / this.tile_size, zoom)
    ]);
  }

  // Add polygons to extent
  if (this.polygons.length) extents.push(this.polygons.map(function(polygon){ return polygon.extent; }));

  return [
    extents.map(function(e){ return e[0]; }).min(),
    extents.map(function(e){ return e[1]; }).min(),
    extents.map(function(e){ return e[2]; }).max(),
    extents.map(function(e){ return e[3]; }).max()
  ];

};

/**
  * calculate the best zoom level for given extent
  */
StaticMaps.prototype._calculateZoom = function () {

  for (var z=17; z>0; z-- ) {

    var extent = this.determineExtent(z);

    var width = (_lon_to_x(extent[2], z) - _lon_to_x(extent[0], z)) * this.tile_size ;
    if (width > (this.width - this.padding[0] * 2) ) continue;

    var height = (_lat_to_y(extent[1], z)  - _lat_to_y(extent[3], z)) * this.tile_size;
    if (height > (this.height - this.padding[1] * 2) ) continue;

    return z;

  }

};

/**
  * transform tile number to pixel on image canvas
  **/
StaticMaps.prototype._x_to_px = function (x) {

  var px = (x - this.x_center) * this.tile_size + this.width / 2;
  return parseInt(Math.round(px));

};


/**
  * transform tile number to pixel on image canvas
  **/
StaticMaps.prototype._y_to_px = function (y) {

  var px = (y - this.y_center) * this.tile_size + this.height / 2;
  return parseInt(Math.round(px));

};

StaticMaps.prototype._drawBaselayer = function () {

  var x_min = Math.floor(this.x_center - ( 0.5 * this.width / this.tile_size ));
  var y_min = Math.floor(this.y_center - ( 0.5 * this.height / this.tile_size ));
  var x_max = Math.ceil(this.x_center + (0.5 * this.width / this.tile_size ));
  var y_max = Math.ceil(this.y_center + (0.5 * this.height / this.tile_size ));

  var result = [];

  for (var x = x_min; x<x_max; x++) {
    for (var y = y_min; y<y_max; y++) {

      // # x and y may have crossed the date line
      var max_tile = Math.pow(2,this.zoom);
      var tile_x = (x + max_tile) % max_tile;
      var tile_y = (y + max_tile) % max_tile;
      if (this.reverse_y) tile_y = ((1<<this.zoom)-tile_y)-1;

      result.push({
        url: this.url_template.replace('{z}', this.zoom).replace('{x}', tile_x).replace('{y}', tile_y),
        box: [
            this._x_to_px(x),
            this._y_to_px(y),
            this._x_to_px(x + 1),
            this._y_to_px(y + 1),
        ]
      });
    }
  }

  var tilePromises = [];

  _.each(result, function(r){
    tilePromises.push(getTile(r));
  });

  return new Promise(_.bind(function(resolve,reject) {

    Promise.all(tilePromises)
      .then(_.bind(function (tiles) {

        this.image.drawImage(tiles)
          .then(function(){
            resolve(true);
          })
          .catch(function(err){
            reject(err);
          });

      },this))
      .catch(function (error) {
        reject(error);
      });

  },this));

};

StaticMaps.prototype._drawFeatures = function (image) {

  // # add icon marker

  return new Promise (_.bind(function(resolve, reject){

    this.loadMarker()
      .then(_.bind(function () {
        this.drawMarker()
          .then(function () {
            resolve(true);
          })
          .catch(function (error) { reject(error); });

      },this))
      .catch(function(err){
        reject(err);
      });

  },this));

};


StaticMaps.prototype.drawMarker = function () {

  var key = 0;

  return new Promise (_.bind(function (resolve,reject){

    _.each(this.markers, _.bind(function(marker){

      this.image.image.composite(marker.imgData, marker.position[0], marker.position[1]);

    },this));

    resolve(true);

  },this));

};


StaticMaps.prototype.loadMarker = function () {

  return new Promise (_.bind(function (resolve,reject){

    if (!this.markers.length) resolve(true);

    var result = [];
    var position = [];

    _.each(this.markers, _.bind(function (icon){

      icon.position = [
        this._x_to_px(_lon_to_x(icon.coord[0], this.zoom)) - icon.offset[0],
        this._y_to_px(_lat_to_y(icon.coord[1], this.zoom)) - icon.offset[1]
      ];

      result.push(icon.load(icon.img));

    },this));

    Promise.all(result)
      .then(function(){ resolve(true); })
      .catch(function(err) { reject(err); });

  },this));
};

/**
  * transform longitude to tile number
  **/
function _lon_to_x (lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}
/**
  * transform latitude to tile number
  **/
function _lat_to_y (lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
}
function _y_to_lat (y, zoom) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, zoom)))) / Math.PI * 180;
}
function _x_to_lon(x, zoom) {
  return x / Math.pow(2, zoom) * 360 - 180;
}

function getTile(data, remainingAttempts, callback) {

  return new Promise(_.bind(function (resolve,reject) {

    var options = {
      url: data.url,
      encoding: null,
      resolveWithFullResponse: true
    };

    if (this.tile_request_timeout) options.timeout = this.tile_request_timeout;

    request.get(options)
      .then(function (res){
        resolve({
          url: data.url,
          box: data.box,
          body: res.body
        });
      })
      .catch(function (err) { reject(err); });

  },this));

}

// Helper functions

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
