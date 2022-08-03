export default class {
  constructor(options = {}) {
    this.options = options;

//    if (!(options.width && options.height)) throw new Error('Please specify width and height of the marker image.');

    this.coord = this.options.coord;
    this.img = this.options.img;

    this.height = Number.isFinite(this.options.height)
     ? Number(this.options.height) : null;
    this.width = Number.isFinite(this.options.width)
     ? Number(this.options.width) : null;

    this.drawWidth = Number(this.options.drawWidth || this.options.width);
    this.drawHeight = Number(this.options.drawHeight || this.options.height);
    this.resizeMode = this.options.resizeMode || 'fit';
    
    this.offsetX = Number.isFinite(this.options.offsetX)
      ? Number(this.options.offsetX) : this.drawWidth / 2;
    
      this.offsetY = Number.isFinite(this.options.offsetY)
      ? Number(this.options.offsetY) : this.drawHeight;
    this.offset = [this.offsetX, this.offsetY];
  }

  setSize(width, height) {
    this.width = Number(width);
    this.height = Number(height);

    if(isNaN(this.drawWidth)) {
      this.drawWidth = this.width;
    }
    
    if(isNaN(this.drawHeight)) {
      this.drawHeight = this.height;
    }
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
