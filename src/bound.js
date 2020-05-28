import bbox from '@turf/bbox';

export default class Circle {
  constructor(options = {}) {
    this.options = options;
    this.coords = this.options.coords;
  }

  /**
   * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
   */
  extent() {
    const line = {
      type: 'LineString',
      coordinates: this.coords,
    };
    return bbox(line);
  }
}
