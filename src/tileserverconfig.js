class TileServerConfig {
  constructor(options) {
    this.options = options;
    this.tileUrl = 'tileUrl' in this.options ? this.options.tileUrl : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.tileSubdomains = this.options.tileSubdomains || this.options.subdomains || [];
  }
}

export default TileServerConfig;
module.exports = TileServerConfig;
