# staticmaps
A small, node.js library for creating map images with ~~lines and~~ markers.

## Installation

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
parameter           | description
------------------- | -------------
width               | Width of the output image in pixels
height              | Height of the output image in pixels
padding_x           | (optional) Minimum distance in pixel between map features and map border
padding_y           | (optional) Minimum distance in pixel between map features and map border
url_template        | (optional) Tile server URL for the map base layer, e.g. <code>http://a.tile.osm.org/{z}/{x}/{y}.png</code>
tile_size           | (optional) tile size in pixel (default: 256)
tile_request_timeout| (optional) timeout for the tiles request

## Usage

### Simple map w/ zoom and center
```javascript
var zoom = 13;
var center = [13.437524,52.4945528];

map.render(center, zoom)
  .then(function(values) {
    var save = map.image.save( 'center.png', function (){
      console.log("Map saved!")  
    });  
   })
   .catch(function(err) { console.log(err); });
      console.log("Something went wrong!");   
   });
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
    var save = map.image.save( 'bbox.png', function (){
      console.log("Map saved!")  
    });  
   })
   .catch(function(err) { console.log(err); });
      console.log("Something went wrong!");   
   });
```
#### Output
![Map with bbox](https://stephangeorg.github.io/staticmaps/sample/bbox.png)

### Map with single marker

```javascript
var marker = {
  filePath: __dirname + '/marker.png',
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
  filePath: __dirname + '/marker.png',
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
![Map with multiple markers](https://stephangeorg.github.io/staticmaps/sample/multiple-marker2.png)
