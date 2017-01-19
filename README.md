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
![Map with zoom and center](https://stephangeorg.github.io/staticmaps/sample/01-center.png)

### Simple map with bounding box

If specifying a bounding box instead of a center, the optimal zoom will be calculated.

```javascript
var bbox = [
  11.414795,51.835778,  // lng,lat of first point
  11.645164,51.733833   // lng,lat of second point, ...
];

map.render(bbox)
  .then(function(values) {
    var save = map.image.save( 'center.png', function (){
      console.log("Map saved!")  
    });  
   })
   .catch(function(err) { console.log(err); });
      console.log("Something went wrong!");   
   });
```

