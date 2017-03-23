
class Line {

  constructor(options = {}) {
    this.options = options;
    this.coords = this.options.coords;
    this.color = this.options.color || '#000000BB';
    this.width = this.options.width || 3;
    this.simplify = this.options.simplify || false;
    this.type = 'polyline';
  }

  /**
   * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
   */
  extent() {
    return [
      this.coords.map(c => c[0]).min(),
      this.coords.map(c => c[1]).min(),
      this.coords.map(c => c[0]).max(),
      this.coords.map(c => c[1]).max(),
    ];
  }

}

module.exports = Line;

// Helper functions
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
