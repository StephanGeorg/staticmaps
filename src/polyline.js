import isEqual from 'lodash.isequal';
import first from 'lodash.first';
import last from 'lodash.last';


export default class Polyline {
  constructor(options = {}) {
    this.options = options;
    this.coords = this.options.coords;
    this.color = this.options.color || '#000000BB';
    this.fill = this.options.fill;
    this.width = this.options.width || 3;
    this.simplify = this.options.simplify || false;
    this.type = (isEqual(first(this.coords), last(this.coords)))
      ? 'polygon' : 'polyline';
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
