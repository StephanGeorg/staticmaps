import circle from '@turf/circle';
import bbox from '@turf/bbox';

export default class Circle {
  constructor(options = {}) {
    this.options = options;
    this.coord = this.options.coord;
    this.radius = Number(this.options.radius);
    this.color = this.options.color || '#000000BB';
    this.fill = this.options.fill || '#AA0000BB';
    this.width = Number.isFinite(this.options.width) ? Number(this.options.width) : 3;

    if (!this.coord || !Array.isArray(this.coord) || this.coord.length < 2) throw new Error('Specify center of circle');
    if (!this.radius || !Number(this.radius)) throw new Error('Specify radius of circle');
  }

  /**
   * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
   */
  extent() {
    const center = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: this.coord,
      },
    };
    const circ = circle(center, (this.radius / 1000), { steps: 100 });
    const circleBbox = bbox(circ);
    return circleBbox;
  }
}
