export default {
  /**
   * Transform longitude to tile number
   */
  lonToX(lon, zoom) {
    return ((lon + 180) / 360) * (2 ** zoom);
  },

  /**
   *  Transform latitude to tile number
   */
  latToY(lat, zoom) {
    return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
    / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (2 ** zoom);
  },

  yToLat(y, zoom) {
    return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / (2 ** zoom))))
      / Math.PI * 180;
  },

  xToLon(x, zoom) {
    return x / (2 ** zoom) * 360 - 180;
  },

  meterToPixel(meter, zoom, lat) {
    const latitudeRadians = lat * (Math.PI / 180);
    const meterProPixel = (156543.03392 * Math.cos(latitudeRadians)) / 2 ** zoom;
    return meter / meterProPixel;
  },
};
