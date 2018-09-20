export default class {
  constructor(options = {}) {
    this.options = options;

    if (!(options.width && options.height)) throw new Error('Please specify width and height of the marker image.');

    this.coord = this.options.coord;
    this.img = this.options.img;
    this.offsetX = this.options.offsetX || options.width / 2;
    this.offsetY = this.options.offsetY || options.height;
    this.offset = [this.offsetX, this.offsetY];
    this.height = this.options.height;
    this.width = this.options.width;
  }

  /**
   *  Set icon data
   */
  set(img) {
    this.imgData = img;
  }

  extentPx() {
    return [
      this.offset[0],
      (this.height - this.offset[1]),
      (this.width - this.offset[0]),
      this.offset[1],
    ];
  }
}
