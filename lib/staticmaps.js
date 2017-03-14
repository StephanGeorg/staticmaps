var request = require("request-promise");
var gm = require("gm");
var Jimp = require("jimp");
var _ = require("lodash");

var Image = require("./image");
var IconMarker = require("./marker");
var Line = require("./line");

var StaticMaps = function (options) {

  this.options = options || {};

  this.width = this.options.width;
  this.height = this.options.height;
  this.paddingX = this.options.paddingX || 0;
  this.paddingY = this.options.paddingY || 0;
  this.padding = [this.paddingX, this.paddingY];
  this.tileUrl = this.options.tileUrl || "http://tile.openstreetmap.org/{z}/{x}/{y}.png";
  this.tileSize = this.options.tileSize || 256;
  this.tileRequestTimeout = this.options.tileRequestTimeout;
  this.reverseY = this.options.reverseY || false;

  // # features
  this.markers = [];
  this.lines = [];
  this.polygons = [];

  // # fields that get set when map is rendered
  this.center = [];
  this.centerX = 0;
  this.centerY = 0;
  this.zoom = 0;

};

module.exports = StaticMaps;

StaticMaps.prototype.addLine = function (options) {
  this.lines.push(new Line(options));
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
    throw new Error("Cannot render empty map: Add  center || lines || markers || polygons.");
  }

  this.center = center;
  this.zoom = zoom || this._calculateZoom();

  if (center && center.length === 2) {

    this.centerX = _lon_to_x(center[0], this.zoom);
    this.centerY = _lat_to_y(center[1], this.zoom);

  } else {

    // # get extent of all lines
    var extent = this.determineExtent(this.zoom);

    // # calculate center point of map
    var centerLon = (extent[0] + extent[2]) / 2;
    var centerLat = (extent[1] + extent[3]) / 2;

    this.centerX = _lon_to_x(centerLon, this.zoom);
    this.centerY = _lat_to_y(centerLat, this.zoom);

  }

  this.image = new Image({
    width: this.width,
    height: this.height
  });


  return this._drawBaselayer()
    .then(this._drawFeatures.bind(this));

};

/**
  * calculate common extent of all current map features
  **/
StaticMaps.prototype.determineExtent = function (zoom) {

  var extents = [];

  // Add bbox to extent
  if (this.center && this.center.length >= 4) extents.push(this.center);

  // Add lines to extent
  if (this.lines.length) {
    this.lines.forEach(function (line){
      extents.push(line.extent());
    });
  } //extents.push(this.lines.map(function(line){ return line.extent(); }));

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
      _x_to_lon(x - parseFloat(e_px[0]) / this.tileSize, zoom),
      _y_to_lat(y + parseFloat(e_px[1]) / this.tileSize, zoom),
      _x_to_lon(x + parseFloat(e_px[2]) / this.tileSize, zoom),
      _y_to_lat(y - parseFloat(e_px[3]) / this.tileSize, zoom)
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

    var width = (_lon_to_x(extent[2], z) - _lon_to_x(extent[0], z)) * this.tileSize ;
    if (width > (this.width - this.padding[0] * 2) ) continue;

    var height = (_lat_to_y(extent[1], z)  - _lat_to_y(extent[3], z)) * this.tileSize;
    if (height > (this.height - this.padding[1] * 2) ) continue;

    return z;

  }

};

/**
  * transform tile number to pixel on image canvas
  **/
StaticMaps.prototype._x_to_px = function (x) {

  var px = (x - this.centerX) * this.tileSize + this.width / 2;
  return parseInt(Math.round(px));

};


/**
  * transform tile number to pixel on image canvas
  **/
StaticMaps.prototype._y_to_px = function (y) {

  var px = (y - this.centerY) * this.tileSize + this.height / 2;
  return parseInt(Math.round(px));

};

StaticMaps.prototype._drawBaselayer = function () {

  var x_min = Math.floor(this.centerX - ( 0.5 * this.width / this.tileSize ));
  var y_min = Math.floor(this.centerY - ( 0.5 * this.height / this.tileSize ));
  var x_max = Math.ceil(this.centerX + (0.5 * this.width / this.tileSize ));
  var y_max = Math.ceil(this.centerY + (0.5 * this.height / this.tileSize ));

  var result = [];

  for (var x = x_min; x<x_max; x++) {
    for (var y = y_min; y<y_max; y++) {

      // # x and y may have crossed the date line
      var max_tile = Math.pow(2,this.zoom);
      var tile_x = (x + max_tile) % max_tile;
      var tile_y = (y + max_tile) % max_tile;
      if (this.reverseY) tile_y = ((1<<this.zoom)-tile_y)-1;

      result.push({
        url: this.tileUrl.replace('{z}', this.zoom).replace('{x}', tile_x).replace('{y}', tile_y),
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

  result.forEach(function(r){
    tilePromises.push(getTile(r));
  });

  return new Promise(function(resolve,reject) {

    Promise.all(tilePromises)
      .then(function (tiles) {

        this.image.draw(tiles)
          .then(function(){
            resolve(true);
          })
          .catch(function(err){
            reject(err);
          });

      }.bind(this))
      .catch(function (error) {
        reject(error);
      });

  }.bind(this));

};

StaticMaps.prototype._drawFeatures = function (image) {

  return this._drawLines()
    .then(this._loadMarker.bind(this))
    .then(this._drawMarker.bind(this));

};


StaticMaps.prototype._drawLines = function () {

  return new Promise(function(resolve, reject) {

    if (!this.lines.length) resolve(true);

    processArray(this.lines, this.__draw.bind(this))
      .then(function(result) {
        resolve(result);

      }, function(reason) {
        reject(reason);
    })
    .catch(function(err){
      reject(err);
    });

  }.bind(this));

};

/**
 * Draw a polyline/polygon on a baseimage
 */
StaticMaps.prototype.__draw = function (line) {

  var type = line.type;
  var baseImage = this.image.image;

  return new Promise(function(resolve, reject) {

      var points = line.coords.map(function(coord){
        return [
          this._x_to_px(_lon_to_x(coord[0], this.zoom)),
          this._y_to_px(_lat_to_y(coord[1], this.zoom)),
        ];
      }.bind(this));

      //if (line.simplify) points = _simplify(points);

      baseImage.getBuffer(Jimp.AUTO, function (err,result) {

        if (err) reject(err);

        if (type === 'polyline') {

          gm(result)
            .fill(0)
            .stroke(line.color,line.width)
            .drawPolyline(points)
            .toBuffer(function(err, buffer) {
              if (err) reject(err);
              Jimp.read(buffer, function(err,image){
                if (err) reject(err);
                this.image.image = image;
                resolve(image);
              }.bind(this));
            }.bind(this));

        } else if (type === 'poygon') {

          gm(result)
            .fill(0)
            .stroke(line.color,line.width)
            .drawPolygon(points)
            .toBuffer(function(err, buffer) {
              if (err) reject(err);
              Jimp.read(buffer, function(err,image){
                if (err) reject(err);
                this.image.image = image;
                resolve(image);
              }.bind(this));
            }.bind(this));

        }

      }.bind(this));
    }.bind(this));
};

StaticMaps.prototype._drawMarker = function () {

  var baseImage = this.image.image;

  return new Promise (function (resolve,reject){

    this.markers.forEach(function(marker){

      baseImage.composite(marker.imgData, marker.position[0], marker.position[1]);

    }.bind(this));

    resolve(true);

  }.bind(this));

};

/**
  *   Preloading the icon image
  */
StaticMaps.prototype._loadMarker = function () {

  return new Promise (function (resolve,reject){

    if (!this.markers.length) resolve(true);

    var icons = _.uniqBy(this.markers.map(function (m) { return { file: m.img }; }), 'file');
    var count = 1;

    icons.forEach(function (i) {

      Jimp.read(i.file, function (err, tile) {
        if (err) reject(err);
        i.data = tile;
        if (count++ === icons.length) {

          // Pre loaded all icons
          this.markers.forEach(function (icon){

            icon.position = [
              this._x_to_px(_lon_to_x(icon.coord[0], this.zoom)) - icon.offset[0],
              this._y_to_px(_lat_to_y(icon.coord[1], this.zoom)) - icon.offset[1]
            ];

            var imgData = _.find(icons, {file: icon.img});
            icon.set(imgData.data);

          }, this);

          resolve(true);

        }
      }.bind(this));
    }.bind(this));
  }.bind(this));
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
function _x_to_lon (x, zoom) {
  return x / Math.pow(2, zoom) * 360 - 180;
}

function getTile(data) {

  return new Promise(function (resolve,reject) {

    var options = {
      url: data.url,
      encoding: null,
      resolveWithFullResponse: true
    };

    if (this.tileRequestTimeout) options.timeout = this.tileRequestTimeout;

    request.get(options)
      .then(function (res){
        resolve({
          url: data.url,
          box: data.box,
          body: res.body
        });
      })
      .catch(function (err) { reject(err); });

  }.bind(this));

}

// Helper functions

function processArray(array, fn) {
   var results = [];
   return array.reduce(function(p, item) {
       return p.then(function() {
           return fn(item).then(function(data) {
             results.push(data);
             return results;
           });
       });
   }, Promise.resolve());
}

Array.prototype.last = function(){
  return this[this.length - 1];
};
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
