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
    it('render w/ center', async () => {
      const options = {
        width: 600,
        height: 200,
      };
      const map = new StaticMaps(options);
      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/01-center.jpg');
    }).timeout(0);

    it('render quadKeys based map', async () => {
      const options = {
        width: 600,
        height: 200,
        tileUrl: 'http://ak.dynamic.{s}.tiles.virtualearth.net/comp/ch/{quadkey}?mkt=en-US&it=G,L&shading=hill&og=1757&n=z',
        tileSubdomains: ['t0', 't1', 't2', 't3'],
      };
      const map = new StaticMaps(options);
      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/01a-quadkeys.jpg');
    }).timeout(0);

    it('render w/ center from custom', async () => {
      const options = {
        width: 600,
        height: 200,
      };

      const map = new StaticMaps(options);
      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/02-center_osm.png');
    }).timeout(0);

    it('render w/ bbox', async () => {
      const options = {
        width: 600,
        height: 300,
        quality: 80,
        paddingY: 50,
        paddingX: 50,
      };

      const map = new StaticMaps(options);
      await map.render([-6.1359285, 53.3145145, -6.1058408, 53.3253966]);
      await map.image.save('test/out/03-bbox.png');
    }).timeout(0);

    it('render w/ icon', async () => {
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

      await map.render([13.437524, 52.4945528], 12);
      await map.image.save('test/out/04-marker.png');
    }).timeout(0);

    it('render w/ remote url icon', async () => {
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

      await map.render([13.437524, 52.4945528], 12);
      await map.image.save('test/out/04-marker-remote.png');
    }).timeout(0);

    it('render w/out center', async () => {
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

      await map.render();
      await map.image.save('test/out/05-marker-nocenter.png');
    }).timeout(0);

    it('render w/out base layer', async () => {
      const options = {
        width: 800,
        height: 800,
        paddingX: 0,
        paddingY: 0,
        quality: 10,
        tileUrl: undefined,
      };
      const map = new StaticMaps(options);

      const coords = Route.routes[0].geometry.coordinates;

      const marker = {
        img: markerPath,
        offsetX: 24,
        offsetY: 48,
        width: 48,
        height: 48,
      };
      [marker.coord] = coords;
      map.addMarker(marker);
      marker.coord = coords[coords.length - 1];
      map.addMarker(marker);

      const polyline = {
        coords,
        color: '#0000FF66',
        width: 3,
      };
      map.addLine(polyline);

      const text = {
        coord: coords[Math.round(coords.length / 2)],
        offsetX: 100,
        offsetY: 50,
        text: 'TEXT',
        size: 50,
        width: '1px',
        fill: '#000000',
        color: '#ffffff',
        font: 'Impact',
        anchor: 'middle',
      };

      map.addText(text);

      await map.render();
      await map.image.save('test/out/05-annotations-nobaselayer.png');
    }).timeout(0);
  });

  describe('Rendering w/ polylines ...', () => {
    it('Render StaticMap w/ single polyline', async () => {
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
      await map.render();
      await map.image.save('test/out/06-polyline.jpg');
    }).timeout(0);
  });

  describe('Rendering w/ polygons ...', () => {
    it('Render StaticMap w/ polygon', async () => {
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
      await map.render();
      await map.image.save('test/out/07-polygon.png');
    }).timeout(0);

    it('Render StaticMap w/ multipolygon', async () => {
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
      await map.render();
      await map.image.save('test/out/07-multipolygon.png');
    }).timeout(0);

    it('Render StaticMap w/ thousands of polygons', async () => {
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
      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/07-multiple-polygons.png');
    }).timeout(0);
  });

  describe('Rendering circles ...', () => {
    it('Render StaticMap w/ circle', async () => {
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
      await map.render();
      await map.image.save('test/out/099-circle.png');
    }).timeout(0);
  });

  describe('Rendering text ...', () => {
    it('Render StaticMap with text', async () => {
      const options = {
        width: 1200,
        height: 800,
      };

      const map = new StaticMaps(options);
      const text = {
        coord: [13.437524, 52.4945528],
        offsetX: 100,
        offsetY: 50,
        text: 'TEXT',
        size: 50,
        width: '1px',
        fill: '#000000',
        color: '#ffffff',
        font: 'Impact',
        anchor: 'middle',
      };

      map.addText(text);

      await map.render([13.437524, 52.4945528]);
      await map.image.save('test/out/08-text-center.png');
    }).timeout(0);

    it('Render text on NASA Blue Marble', async () => {
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

      await map.render([13.437524, 52.4945528]);
      await map.image.save('test/out/09-text-nasabm.png');
    }).timeout(0);
  });

  describe('Rendering buffer ...', () => {
    it('render w/ center', async () => {
      const options = {
        width: 600,
        height: 200,
      };

      const map = new StaticMaps(options);
      await map.render([13.437524, 52.4945528], 13);
      await map.image.buffer('image/png');
    }).timeout(0);
  });

  describe('Fetch tiles from subdomains', () => {
    it('should fetch from subdomains', async () => {
      const options = {
        width: 1024,
        height: 1024,
        tileSubdomains: ['a', 'b', 'c'],
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      };

      const map = new StaticMaps(options);

      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/10-subdomains.png');
    }).timeout(0);
  });

  describe('Fetch tiles from multiple layers', () => {
    it('should assemble layers', async () => {
      const options = {
        width: 1024,
        height: 600,
        tileLayers: [{
          tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        }, {
          tileUrl: 'http://www.openfiremap.de/hytiles/{z}/{x}/{y}.png',
        }],
      };

      const map = new StaticMaps(options);

      await map.render([13.437524, 52.4945528], 13);
      await map.image.save('test/out/11-layers.png');
    }).timeout(0);
  });
});
