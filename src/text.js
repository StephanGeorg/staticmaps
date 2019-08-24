export default class Text {
  constructor(options = {}) {
    this.options = options;
    this.coord = this.options.coord;
    this.text = this.options.text;
    this.color = this.options.color || '#000000BB';
    this.width = `${this.options.width}px` || '1px';
    this.fill = this.options.fill || '#000000';
    this.size = this.options.size || 12;
    this.font = this.options.font || 'Arial';
    this.anchor = this.options.anchor || 'start';
  }
}
