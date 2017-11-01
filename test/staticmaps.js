import path from 'path';

import StaticMaps from '../src/lib/staticmaps';
import GeoJSON from './static/geojson';
import Route from './static/route';

const { expect } = require('chai');

const markerPath = path.join(__dirname, 'marker.png');

describe('StaticMap', () => {
  describe('Initializing ...', () => {
    it('without any arguments', () => {
      expect(() => {
        const options = {
          width: 888,
          height: 280,
        };
        const map = new StaticMaps(options);
      }).to.not.throw();
    });
  });

  describe('Rendering ...', () => {
    it('render w/ center', (done) => {
      const options = {
        width: 888,
        height: 280,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };
      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/01-center.jpg'))
        .then(done)
        .catch(done);
    }).timeout(3000);

    it('render w/ center from custom', (done) => {
      const options = {
        width: 888,
        height: 280,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };

      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/02-center_osm.png'))
        .then(done)
        .catch(done);
    }).timeout(3000);

    it('render w/ bbox', (done) => {
      const options = {
        width: 888,
        height: 280,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };

      const map = new StaticMaps(options);
      map.render([11.414795, 51.835778, 11.645164, 51.733833])
        .then(() => map.image.save('test/out/03-bbox.png'))
        .then(done)
        .catch(done);
    }).timeout(3000);

    it('render w/ icon', (done) => {
      const options = {
        width: 888,
        height: 280,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };

      const map = new StaticMaps(options);

      const marker = {
        img: markerPath,
        offsetX: 24,
        offsetY: 48,
        width: 48,
        height: 48,
      };

      marker.coord = [13.437524, 52.4945528];
      map.addMarker(marker);

      marker.coord = [13.430524, 52.4995528];
      map.addMarker(marker);

      map.render([13.437524, 52.4945528], 12)
        .then(() => map.image.save('test/out/04-marker.png'))
        .then(done)
        .catch(done);
    }).timeout(3000);

    it('render w/out center', (done) => {
      const options = {
        width: 1600,
        height: 560,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };
      const map = new StaticMaps(options);
      const marker = {
        img: markerPath,
        offsetX: 24,
        offsetY: 48,
        width: 48,
        height: 48,
      };

      marker.coord = [13.437524, 52.4945528];
      map.addMarker(marker);
      marker.coord = [13.430524, 52.4995528];
      map.addMarker(marker);
      marker.coord = [13.410524, 52.5195528];
      map.addMarker(marker);

      map.render()
        .then(() => map.image.save('test/out/05-marker-nocenter.png'))
        .then(done)
        .catch(done);
    }).timeout(3000);
  });

  describe('Rendering w/ lines ...', () => {
    it('Render StaticMap w/ single polyline', (done) => {
      const options = {
        width: 1600,
        height: 560,
        paddingX: 0,
        paddingY: 0,
        quality: 10,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
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

      const marker = {
        img: markerPath,
        offsetX: 24,
        offsetY: 44,
        width: 48,
        height: 48,
      };

      marker.coord = [13.438854,52.494917];
      map.addMarker(marker);
      marker.coord = [13.38652,52.51636];
      map.addMarker(marker);

      map.render()
        .then(() => map.image.save('test/out/06-polyline.png'))
        .then(done)
        .catch(done);
    }).timeout(10000);

    it('Render StaticMap w/ polygon', (done) => {
      const options = {
        width: 888,
        height: 280,
        paddingX: 50,
        paddingY: 50,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
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

  describe('Rendering buffer ...', () => {
    it('render w/ center', (done) => {
      const options = {
        width: 888,
        height: 280,
        tileUrl: 'https://osm.luftlinie.org/retina/{z}/{x}/{y}.png',
        tileSize: 512,
      };

      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.buffer('image/png'))
        .then((buffer) => {
          done();
        })
        .catch(done);
    }).timeout(3000);
  });
});
