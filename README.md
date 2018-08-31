# StaticMaps [![npm version](https://badge.fury.io/js/staticmaps.svg)](https://badge.fury.io/js/staticmaps)
A node.js library for creating map images with polylines and markers. This library is a node.js implementation of [Static Map](https://github.com/komoot/staticmap).

![Map with polyline](https://stephangeorg.github.io/staticmaps/sample/polyline.png?raw=true=800x280)

## Installation

~~Image manupulation is based on [GraphicsMagick](http://www.graphicsmagick.org/) (default), [ImageMagick](https://www.imagemagick.org/script/download.php) (``imageMagick: true``) or [Sharp](http://sharp.pixelplumbing.com/en/stable/install)  ``sharp: true``. **Install [GraphicsMagick](http://www.graphicsmagick.org/README.html#installation), [ImageMagick](https://www.imagemagick.org/script/download.php) or [Sharp](http://sharp.pixelplumbing.com/en/stable/install/) first.**~~

```bash
> npm i staticmaps
```
## Getting Started

### Initialization ###
```javascript
import StaticMaps from 'staticmaps';
```
```javascript
const options = {
  width: 600,
  height: 400
};
const map = new StaticMaps(options);
```
#### Map options
Parameter           | Description
------------------- | -------------
width               | Width of the output image in px
height              | Height of the output image in px
quality             | **[DEPRECATED](https://github.com/StephanGeorg/staticmaps/blob/devel/README.md#save-options)** (optional) Set quality of output JPEG, 0 - 100 (default: 100). 
paddingX            | (optional) Minimum distance in px between map features and map border
paddingY            | (optional) Minimum distance in px between map features and map border
tileUrl             | (optional) Tile server URL for the map base layer
tileSize            | (optional) Tile size in pixel (default: 256)
tileRequestTimeout  | (optional) Timeout for the tiles request
tileRequestHeader   | (optional) Additional headers for the tiles request (default: {})

### Methods
#### addMarker (options)
Adds a marker to the map.
##### Marker options
Parameter           | Description
------------------- | -------------
coord               | Coordinates of the marker ([Lng, Lat])
img                 | Marker image path or URL
height              | Height of the marker image
width               | Width of the marker image
offsetX             | (optional) X offset of the marker image (default: width/2)
offsetY             | (optional) Y offset of the marker image (default: height)
##### Usage example
```javascript
const marker = {
  img: `${__dirname}/marker.png`, // can also be a URL
  offsetX: 24,
  offsetY: 48,
  width: 48,
  height: 48,
  coord = [13.437524,52.4945528]
};
map.addMarker(marker);
```
***
#### addLine (options)
Adds a polyline to the map.
##### Polyline options
Parameter           | Description
------------------- | -------------
coords              | Coordinates of the polyline ([[Lng, Lat], ... ,[Lng, Lat]])
color               | Stroke color of the polyline (Default: '#000000BB')
width               | Stroke width of the polyline (Default: 3)
simplify            | TODO
##### Usage example
```javascript
  const polyline = {
    coords: [
      [13.399259,52.482659],
      [13.387849,52.477144],
      [13.40538,52.510632]
    ],
    color: '#0000FFBB',
    width: 3
  };

  map.addLine(polyline);
```
***

#### addPolygon(options)
Adds a polygon to the map. Polygon is the same as a polyline but first and last coordinate are equal.
```
map.addPolygon(options);
```
##### Polygon options
Parameter           | Description
------------------- | -------------
coords              | Coordinates of the polygon ([[Lng, Lat], ... ,[Lng, Lat]])
color               | Stroke color of the polygon (Default: '#000000BB')        
width               | Stroke width of the polygon (Default: 3)
fill                | Fill color of the polygon (Default: '#000000BB')
simplify            | TODO
##### Usage example
```javascript
  const polygon = {
    coords: [
      [13.399259,52.482659],
      [13.387849,52.477144],
      [13.40538,52.510632],
      [13.399259,52.482659]
    ],
    color: '#0000FFBB',
    width: 3
  };

  map.addPolygon(polygon);
```
***

#### render (center, zoom)
Renders the map.
```
map.render();
```
##### Render options
Parameter           | Description
------------------- | -------------
center              | (optional) Set center of map to a specific coordinate ([Lng, Lat])
zoom                | (optional) Set a specific zoom level.      

***

#### image.save (fileName, [outputOptions])
Saves the image to a file in `fileName`.
```
map.image.save('my-staticmap-image.png', { compressionLevel: 9 });
```
##### Save options
Parameter           | Description
------------------- | -------------
fileName            | Name of the output file. Specify output format (png, jpg, webp) by adding file extension.
outputOptions       | (optional) Output options set for [sharp](http://sharp.pixelplumbing.com/en/stable/api-output/#png)

The `outputOptions` replaces the deprectated `quality` option. For Backwards compatibility `quality` still works but will be overwritten with `outputOptions.quality`.

***

#### image.buffer (mime, [outputOptions])
Saves the image to a file. If callback is undefined it return a Promise.
```
map.image.buffer('image/jpog', { quality: 75 });
```
##### Buffer options
Parameter           | Description
------------------- | -------------
mime                | Mime type(`image/png`, `image/jpg` or `image/webp`) of the output buffer (default: 'image/png')
outputOptions       | (optional) Output options set for [sharp](http://sharp.pixelplumbing.com/en/stable/api-output/#png)

The `outputOptions` replaces the deprectated `quality` option. For Backwards compatibility `quality` still works but will be overwritten with `outputOptions.quality`.

## Usage Examples

### Simple map w/ zoom and center
```javascript
const zoom = 13;
const center = [13.437524,52.4945528];

map.render(center, zoom)
  .then(() => map.image.save('center.png'))  
  .then(() => console.log('File saved!'))
  .catch(function(err) { console.log(err); });
```
#### Output
![Map with zoom and center](https://stephangeorg.github.io/staticmaps/sample/center.png)

### Simple map with bounding box

If specifying a bounding box instead of a center, the optimal zoom will be calculated.

```javascript
const bbox = [
  11.414795,51.835778,  // lng,lat of first point
  11.645164,51.733833   // lng,lat of second point, ...
];

map.render(bbox)
  .then(() => map.image.save('bbox.png'))  
  .then(() => console.log('File saved!'))
  .catch(console.log);
```
#### Output
![Map with bbox](https://stephangeorg.github.io/staticmaps/sample/bbox.png)

***

### Map with single marker

```javascript
const marker = {
  img: `${__dirname}/marker.png`, // can also be a URL,
  offsetX: 24,
  offsetY: 48,
  width: 48,
  height: 48,
  coord: [13.437524, 52.4945528],
 };
map.addMarker(marker);
map.render()
  .then(() => map.image.save('single-marker.png'))
  .then(() => { console.log('File saved!'); })
  .catch(console.log);
```
You're free to specify a center as well, otherwise the marker will be centered.

#### Output
![Map with marker](https://stephangeorg.github.io/staticmaps/sample/marker.png)

***

### Map with multiple marker
```javascript
const marker = {
  img: `${__dirname}/marker.png`, // can also be a URL
  offsetX: 24,
  offsetY: 48,
  width: 48,
  height: 48
};

marker.coord = [13.437524,52.4945528];
map.addMarker(marker);
marker.coord = [13.430524,52.4995528];
map.addMarker(marker);
marker.coord = [13.410524,52.5195528];
map.addMarker(marker);

map.render()
  .then(() => map.image.save('multiple-marker.png'))
  .then(() => { console.log('File saved!'); })
  .catch(console.log);

```
#### Output
![Map with multiple markers](https://stephangeorg.github.io/staticmaps/sample/multiple-marker.png?raw=true)

***

### Map with polyline
```javascript

var line = {
  coords: [
    [13.399259,52.482659],
    [13.387849,52.477144],
    [13.40538,52.510632]
  ],
  color: '#0000FFBB',
  width: 3
};

map.addLine(line);
map.render()
  .then(() => map.image.save('test/out/polyline.png'))
  .then(() => console.log('File saved!'))
  .catch(console.log);

```
#### Output
![Map with polyline](https://stephangeorg.github.io/staticmaps/sample/polyline.png?raw=true=800x280)
