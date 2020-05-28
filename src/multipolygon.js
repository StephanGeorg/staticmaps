import flatten from 'lodash.flatten';

export default class MultiPolygon {
  constructor(options = {}) {
    this.options = options;
    this.coords = this.options.coords;
    this.color = this.options.color || '#000000BB';
    this.fill = this.options.fill;
    this.width = Number.isFinite(this.options.width) ? Number(this.options.width) : 3;
    this.simplify = this.options.simplify || false;
  }

  /**
   * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
   */
  extent() {
    const allPoints = flatten(this.coords);

    return [
      Math.min(...allPoints.map((c) => c[0])),
      Math.min(...allPoints.map((c) => c[1])),
      Math.max(...allPoints.map((c) => c[0])),
      Math.max(...allPoints.map((c) => c[1])),
    ];
  }
}
