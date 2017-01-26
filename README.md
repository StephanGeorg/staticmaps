# staticmaps
A node.js library for creating map images with polylines and markers. This library is a node.js implementation of [Static Map](https://github.com/komoot/staticmap).

## Installation

Image manupulation is based on [GraphicsMagick](http://www.graphicsmagick.org/). You **need to [install](http://www.graphicsmagick.org/README.html#documentation) it before** using staticmaps.

```bash
npm i staticmaps
```
## Getting Started

### Initialization ###
```javascript
var StaticMaps = require('staticmaps');
```
```javascript
var options = {
  width: 600,
  height: 400
};
var map = new StaticMaps(options);
```
#### Options
Parameter           | Description
------------------- | -------------
width               | Width of the output image in px
height              | Height of the output image in px
padding_x           | (optional) Minimum distance in px between map features and map border
padding_y           | (optional) Minimum distance in px between map features and map border
url_template        | (optional) Tile server URL for the map base layer
tile_size           | (optional) tile size in pixel (default: 256)
tile_request_timeout| (optional) timeout for the tiles request

## Usage

### Simple map w/ zoom and center
```javascript
var zoom = 13;
var center = [13.437524,52.4945528];

map.render(center, zoom)
  .then(function(values) {
    map.image.save( 'center.png', function (){
      console.log("Map saved!");  
    });  
   })
   .catch(function(err) { console.log(err); });
```
#### Output
![Map with zoom and center](https://stephangeorg.github.io/staticmaps/sample/center.png)

### Simple map with bounding box

If specifying a bounding box instead of a center, the optimal zoom will be calculated.

```javascript
var bbox = [
  11.414795,51.835778,  // lng,lat of first point
  11.645164,51.733833   // lng,lat of second point, ...
];

map.render(bbox)
  .then(function(values) {
    map.image.save( 'bbox.png', function (){
      console.log("Map saved!");  
    });  
   })
   .catch(function(err) { console.log(err); });
```
#### Output
![Map with bbox](https://stephangeorg.github.io/staticmaps/sample/bbox.png)

### Map with single marker

```javascript
var marker = {
  img: __dirname + '/marker.png', // can also be a URL
  offset_x: 24,
  offset_y: 48,
  width: 48,
  height: 48
};

marker.coord = [13.437524,52.4945528];
map.addMarker(marker);

map.render()
  .then(function(values) {
    var save = map.image.save('marker.png', function (){
      console.log("Done!");
    });
  })
  .catch(function(err) { console.log(err); });

```
You're free to specify a center as well, otherwise the marker will be centered.

#### Output
![Map with marker](https://stephangeorg.github.io/staticmaps/sample/marker.png)

### Map with multiple marker
```javascript

var marker = {
  img: __dirname + '/marker.png',
  offset_x: 24,
  offset_y: 48,
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
  .then(function(values) {
    var save = map.image.save('multiple-marker.png', function (){
      console.log("Done!");
    });
  })
  .catch(function(err) { console.log(err); });
});

```
#### Output
![Map with multiple markers](https://stephangeorg.github.io/staticmaps/sample/multiple-marker.png?raw=true)

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
  .then(function(values) {
    map.image.save('test/out/polyline.png', function (){
      done();
    });
  })
  .catch(function(err) { console.log(err); });

```
#### Output
![Map with polyline](https://stephangeorg.github.io/staticmaps/sample/polyline.png?raw=true)

## Marker 
### Usage example
```javascript
var marker = {
  img: __dirname + '/marker.png',
  offset_x: 24,
  offset_y: 48,
  width: 48,
  height: 48,
  coord = [13.437524,52.4945528]
};
map.addMarker(marker);
```

### Options
Parameter           | Description
------------------- | -------------
coord               | Coordinates of the marker [lng,lat]
img                 | Path or URL of the marker icon image
width               | Width of the marker icon image
height              | Height of the marker icon image
offset_x            | (optional) X offset for image (default: width/2) 
offset_y            | (optional) Y offset for image (default: height)

## Polyline 
### Usage example
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
```

### Options
Parameter           | Description
------------------- | -------------
coords              | Coordinates of the polyline [[lng,lat],...,[lat,lng]]
color               | Color of the polyline (#RRGGBBAA)
width               | Stroke width


