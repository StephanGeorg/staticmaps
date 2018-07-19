import path from 'path';

import StaticMaps from '../src/staticmaps';
import GeoJSON from './static/geojson';
import Route from './static/routeLong';

const { expect } = require('chai');

const markerPath = path.join(__dirname, 'marker.png');

describe('StaticMap w/ ImageMagick', () => {
  describe('Rendering w/ lines by ImageMagick...', () => {
    it('Render StaticMap w/ single polyline', (done) => {
      const options = {
        width: 800,
        height: 800,
        paddingX: 0,
        paddingY: 0,
        quality: 10,
        imageMagick: true
      };

      const map = new StaticMaps(options);

      const coords = Route.routes[0].geometry.coordinates;
      const polyline = {
        coords,
        color: '#0000FF66',
        width: 3,
      };

      const polyline2 = {
        coords,
        color: '#FFFFFF00',
        width: 6,
      };

      map.addLine(polyline2);
      map.addLine(polyline);
      map.render()
        .then(() => map.image.save('test/out/06-polyline.jpg'))
        .then(done)
        .catch(done);
    }).timeout(10000);

    it('Render StaticMap w/ polygon', (done) => {
      const options = {
        width: 600,
        height: 300,
        paddingX: 50,
        paddingY: 50,
        imageMagick: true
      };

      const map = new StaticMaps(options);

      const polygon = {
        coords: GeoJSON.way.geometry.coordinates[0][0],
        color: '#0000FFBB',
        width: 1,
      };

      map.addPolygon(polygon);
      map.render()
        .then(() => map.image.save('test/out/07-polygon.png'))
        .then(done)
        .catch(done);
    }).timeout(10000);
  });
});
