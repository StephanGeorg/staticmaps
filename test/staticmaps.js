import path from 'path';

import StaticMaps from '../src/staticmaps';
import GeoJSON from './static/geojson';
import MultiPolygonGeometry from './static/multipolygonGeometry';
import Route from './static/routeLong';

const { expect } = require('chai');

const markerPath = path.join(__dirname, 'marker.png');

describe('StaticMap', () => {
  describe('Initializing ...', () => {
    it('without any arguments', () => {
      expect(() => {
        const options = {
          width: 600,
          height: 200,
        };
        const map = new StaticMaps(options);
        expect(map.constructor.name).to.be.equal('StaticMaps');
      }).to.not.throw();
    });
  });

  describe('Rendering ...', () => {
    it('render w/ center', (done) => {
      const options = {
        width: 600,
        height: 200,
      };
      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/01-center.jpg'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('render w/ center from custom', (done) => {
      const options = {
        width: 600,
        height: 200,
      };

      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/02-center_osm.png'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('render w/ bbox', (done) => {
      const options = {
        width: 600,
        height: 300,
        quality: 80,
        paddingY: 50,
        paddingX: 50,
      };

      const map = new StaticMaps(options);
      map.render([-6.1359285, 53.3145145, -6.1058408, 53.3253966])
        .then(() => map.image.save('test/out/03-bbox.png'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('render w/ icon', (done) => {
      const options = {
        width: 500,
        height: 500,
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
    }).timeout(0);

    it('render w/ remote url icon', (done) => {
      const options = {
        width: 500,
        height: 500,
      };

      const map = new StaticMaps(options);

      const marker = {
        img: 'https://img.icons8.com/color/48/000000/marker.png',
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
        .then(() => map.image.save('test/out/04-marker-remote.png'))
        .then(done)
        .catch(console.log);
    }).timeout(0);

    it('render w/out center', (done) => {
      const options = {
        width: 1200,
        height: 800,
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
    }).timeout(0);
  });

  describe('Rendering w/ polylines ...', () => {
    it('Render StaticMap w/ single polyline', (done) => {
      const options = {
        width: 800,
        height: 800,
        paddingX: 0,
        paddingY: 0,
        quality: 10,
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
    }).timeout(0);
  });

  describe('Rendering w/ polygons ...', () => {
    it('Render StaticMap w/ polygon', (done) => {
      const options = {
        width: 600,
        height: 300,
        paddingX: 50,
        paddingY: 50,
      };

      const map = new StaticMaps(options);

      const polygon = {
        coords: GeoJSON.way.geometry.coordinates[0][0],
        color: '#0000FFBB',
        fill: '#000000BB',
        width: 1,
      };

      map.addPolygon(polygon);
      map.render()
        .then(() => map.image.save('test/out/07-polygon.png'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('Render StaticMap w/ multipolygon', (done) => {
      const options = {
        width: 600,
        height: 300,
        paddingX: 80,
        paddingY: 80,
      };

      const map = new StaticMaps(options);

      const multipolygon = {
        coords: MultiPolygonGeometry.geometry.coordinates,
        color: '#0000FFBB',
        fill: '#000000BB',
        width: 1,
      };

      map.addMultiPolygon(multipolygon);
      map.render()
        .then(() => map.image.save('test/out/07-multipolygon.png'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('Render StaticMap w/ thousands of polygons', (done) => {
      const options = {
        width: 600,
        height: 300,
        paddingX: 50,
        paddingY: 50,
      };

      const map = new StaticMaps(options);

      const polygon = {
        coords: GeoJSON.way.geometry.coordinates[0][0],
        color: '#0000FFBB',
        fill: '#000000BB',
        width: 1,
      };

      for (let i = 0; i < 10000; i++) map.addPolygon({ ...polygon });
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/07-multiple-polygons.png'))
        .then(done)
        .catch(done);
    }).timeout(0);
  });

  describe('Rendering circles ...', () => {
    it('Render StaticMap w/ circle', (done) => {
      const options = {
        width: 600,
        height: 300,
        paddingX: 20,
        paddingY: 20,
      };

      const map = new StaticMaps(options);

      const circle = {
        coord: [13.01, 51.98],
        radius: 500,
        fill: '#000000',
        width: 0,
      };

      const circle2 = {
        coord: [13.01, 51.98],
        radius: 800,
        fill: '#fab700CC',
        color: '#FFFFFF',
        width: 2,
      };

      map.addCircle(circle2);
      map.addCircle(circle);
      map.render()
        .then(() => map.image.save('test/out/099-circle.png'))
        .then(done)
        .catch(done);
    }).timeout(0);
  });

  describe('Rendering text ...', () => {
    it('Render StaticMap with text', (done) => {
      const options = {
        width: 1200,
        height: 800,
      };

      const map = new StaticMaps(options);
      const text = {
        coord: [13.437524, 52.4945528],
        text: 'TEXT',
        size: 50,
        width: '1px',
        fill: '#000000',
        color: '#ffffff',
        font: 'Impact',
        anchor: 'middle',
      };

      map.addText(text);

      map.render([13.437524, 52.4945528])
        .then(() => map.image.save('test/out/08-text-center.png'))
        .then(done)
        .catch(done);
    }).timeout(0);

    it('Render text on NASA Blue Marble', (done) => {
      const options = {
        width: 1200,
        height: 800,
        tileUrl: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
        zoomRange: {
          max: 8,
        },
      };

      const map = new StaticMaps(options);
      const text = {
        coord: [13.437524, 52.4945528],
        text: 'My Text',
        size: 50,
        width: '1px',
        fill: '#000000',
        color: '#ffffff',
        font: 'Calibri',
      };

      map.addText(text);

      map.render([13.437524, 52.4945528])
        .then(() => map.image.save('test/out/09-text-nasabm.png'))
        .then(done)
        .catch(done);
    }).timeout(0);
  });

  describe('Rendering buffer ...', () => {
    it('render w/ center', (done) => {
      const options = {
        width: 600,
        height: 200,
      };

      const map = new StaticMaps(options);
      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.buffer('image/png'))
        .then((buffer) => {
          expect(buffer).to.be.an.instanceof(Buffer);
          done();
        })
        .catch(done);
    }).timeout(0);
  });

  describe('Fetch tiles from subdomains', () => {
    it('should fetch from subdomains', (done) => {
      const options = {
        width: 1024,
        height: 1024,
        subdomains: ['a', 'b', 'c'],
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      };

      const map = new StaticMaps(options);

      map.render([13.437524, 52.4945528], 13)
        .then(() => map.image.save('test/out/10-subdomains.png'))
        .then(done)
        .catch(done);
    }).timeout(0);
  });
});
