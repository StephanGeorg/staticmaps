var should = require('should');
var StaticMaps = require('../lib/staticmaps');

var markerPath = __dirname + '/marker.png';


describe('StaticMap', function(){
  var geocoder;

  describe('Initializing ...', function() {

    it('without any arguments', function() {

      (function() {

        var options = {
          width: 600,
          height: 200
        };
        map = new StaticMaps(options);

      }).should.not.throw();
    });

  });


  describe('Rendering ...', function() {

    it('render w/ center', function(done) {

      this.timeout(3000);

      var options = {
        width: 600,
        height: 200
      };

      map = new StaticMaps(options);
      map.render([13.437524,52.4945528], 13)
        .then(function(values) {
          var save = map.image.save( 'test/out/01-center.jpg', function (){
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/ center from custom', function(done) {

      this.timeout(3000);

      var options = {
        width: 600,
        height: 200,
        url_template: "https://osm.luftlinie.org/retina/{z}/{x}/{y}.png",
        tile_size: 512
      };

      map = new StaticMaps(options);
      map.render([13.437524,52.4945528], 13)
        .then(function(values) {
          var save = map.image.save( 'test/out/02-center_osm.png', function (){
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/ bbox', function(done) {

      this.timeout(3000);

      var options = {
        width: 1200,
        height: 800
      };

      map = new StaticMaps(options);
      map.render([11.414795,51.835778, 11.645164,51.733833])
        .then(function(values) {
          var save = map.image.save('test/out/03-bbox.png', function (){
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/ icon', function(done) {

     this.timeout(3000);

      var options = {
        width: 500,
        height: 500,
        url_template: "https://osm.luftlinie.org/retina/{z}/{x}/{y}.png",   // this tiles server is not for public use!
        tile_size: 512
      };

      map = new StaticMaps(options);

      var marker = {
        img: markerPath,
        offset_x: 24,
        offset_y: 48,
        width: 48,
        height: 48
      };

      marker.coord = [13.437524,52.4945528];
      map.addMarker(marker);

      marker.coord = [13.430524,52.4995528];
      map.addMarker(marker);

      map.render([13.437524,52.4945528], 12)
        .then(function(values) {
          var save = map.image.save('test/out/04-marker.png', function (){
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/out center', function(done) {

     this.timeout(3000);

      var options = {
        width: 1200,
        height: 800
      };
      map = new StaticMaps(options);

      var marker = {
        img: markerPath,
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
          var save = map.image.save('test/out/05-marker-nocenter.png', function (){
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

  });

  describe('Rendering w/ lines ...', function() {

    it('render w/ single line', function(done) {

      this.timeout(5000);

      var options = {
        width: 600,
        height: 300,
        url_template: "https://osm.luftlinie.org/retina/{z}/{x}/{y}.png",   // this tiles server is not for public use!
        tile_size: 512,
        paddingX: 50,
        paddingY: 50
      };

      map = new StaticMaps(options);

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
          var save = map.image.save('test/out/06-line.png', function (){

            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });
  });

  describe('Rendering buffer ...', function() {

    it('render w/ center', function(done) {

      this.timeout(3000);

      var options = {
        width: 600,
        height: 200
      };

      map = new StaticMaps(options);
      map.render([13.437524,52.4945528], 13)
        .then(function(values) {
          map.image.buffer('image/png', function (error, buffer){
            if (buffer) done();
          });
        })
        .catch(function(err) { console.log(err); });

    });
  });


});
