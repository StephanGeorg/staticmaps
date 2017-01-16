var _ = require('lodash');

var StaticMaps = function (width, height, padding_x, padding_y, url_template, tile_size, tile_request_timeout, headers, reverse_y, background_color) {

  this.width = width;
  this.height = height;
  this.padding_x = padding_x || 0;
  this.padding_y = padding_y || 0;
  this.padding = [padding_x, padding_y];
  this.url_template = url_template || "https://osm.luftlinie.org/retina/{z}/{x}/{y}.png";
  this.tile_size = tile_size || 512;
  this.tile_request_timeout = tile_request_timeout;
  this.header = headers;
  this.reverse_y = reverse_y || false;
  this.background_color = background_color || "#fff";

  // # features
  this.markers = [];
  this.lines = [];
  this.polygons = [];

  // # fields that get set when map is rendered
  this.x_center = 0;
  this.y_center = 0;
  this.zoom = 0;

};

module.exports = StaticMaps;

StaticMaps.prototype.addLine = function (line) {
  this.lines.push(line);
};
StaticMaps.prototype.addMarker = function (marker) {
  this.markers.push(marker);
};
StaticMaps.prototype.addPolygon = function (polygon) {
  this.polygons.push(polygon);
};

/**
  * render static map with all map features that were added to map before
  **/
StaticMaps.prototype.render = function (zoom, center) {

  if (!this.lines && !this.markers && !this.polygons && !(center && zoom)) {
    throw new Error("cannot render empty map, add lines / markers / polygons first");
  }

  this.zoom = zoom || this._calculateZoom();

  if (center) {

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

  //image = Image.new('RGB', (self.width, self.height), self.background_color);
  this._draw_base_layer(1);
  // this._draw_features(image);

  // return image;

};

/**
  * calculate common extent of all current map features
  **/
StaticMaps.prototype.determineExtent = function (zoom) {

  var extents = this.lines.map(function(l){ return l.extent; });

  _.each(this.markers, function(marker){
    var e = [marker.coord[0],marker.coord[1]];

    if (!zoom) {
      // TODO
      extents.push(e * 2);
      return;
    }

    // # consider dimension of marker

    var e_px = marker.extent_px;
    var x = _lon_to_x(e[0], zoom);
    var y = _lat_to_y(e[1], zoom);

    extents.push([
      _x_to_lon(x - parseFloat(e_px[0]) / this.tile_size, zoom),
      _y_to_lat(y + parseFloat(e_px[1]) / this.tile_size, zoom),
      _x_to_lon(x + parseFloat(e_px[2]) / this.tile_size, zoom),
      _y_to_lat(y - parseFloat(e_px[3]) / this.tile_size, zoom)
    ]);

  });

  extents.push(this.polylines.map(function(p){ return p.extent; }));

  return [
    extents.map(function(e){ return e[0]; }).min(),
    extents.map(function(e){ return e[1]; }).min(),
    extents.map(function(e){ return e[2]; }).min(),
    extents.map(function(e){ return e[3]; }).min()
  ];

};

/**
  * calculate the best zoom level for given extent
  */
StaticMaps.prototype._calculateZoom = function () {

  for (var z=17; z>-1; z-- ) {

    var extent = this.determineExtent(z);

    var width = (_lon_to_x(extent[2], z) - _lon_to_y(extent[3], z) * this.tile_size );
    if (width > (this.width - this.padding[0] * 2) ) continue;

    var height = (_lat_to_y(extent[1], z)  - _lat_to_y(extent[3], z)) * this.tile_size;
    if (height > this.height - this.padding[1] * 2) continue;

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
StaticMaps.prototype._x_to_px = function (y) {

  var px = (y - this.y_center) * this.tile_size + this.height / 2;
  return parseInt(Math.round(px));

};

StaticMaps.prototype._draw_base_layer = function (image) {

  var x_min = Math.floor(this.x_center - ( 0.5 * this.width / this.tile_size ));
  var y_min = Math.floor(this.y_center - ( 0.5 * this.height / this.tile_size ));
  var x_max = Math.ceil(this.x_center + (0.5 * this.width / this.tile_size ));
  var y_max = Math.ceil(this.y_center + (0.5 * this.height / this.tile_size ));

  console.log(x_min,y_min, x_max, y_max);

  for (var x = x_min; x<x_max; x++) {

    console.log("x",x);

    for (var y = y_min; y<y_max; y++) {

      console.log("y",y);

      var nb_requests = 0;

      while(true) {
        nb_requests++;

        console.log("Request",nb_requests);

        // # x and y may have crossed the date line
        var max_tile = Math.pow(2,this.zoom);
        var tile_x = (x + max_tile) % max_tile;
        var tile_y = (y + max_tile) % max_tile;

        if (this.reverse_y) tile_y = ((1<<this.zoom)-tile_y)-1;

        // TODO: Get image from request
        //var res = requests.get(self.url_template.format(z=self.zoom, x=tile_x, y=tile_y), timeout=self.request_timeout, headers=self.headers)
        var res = {};

        console.log(this.url_template, this.zoom, x, y);

        if (res.status_code === 200) break;
        if (nb_requests >= 3 ) {
          throw new Error("could not download tile: {}:");
        }

        // TODO: Image manipulation
        /*tile = Image.open(BytesIO(res.content)).convert("RGBA")
                box = [
                    self._x_to_px(x),
                    self._y_to_px(y),
                    self._x_to_px(x + 1),
                    self._y_to_px(y + 1),
                ]
                image.paste(tile, box, tile)*/

      }
    }
  }
};

StaticMaps.prototype._draw_features = function (image) {
  return;
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



// Helper functions

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
