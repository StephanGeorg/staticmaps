var should = require('should');
var StaticMaps = require('../lib/staticmaps');


describe('StaticMap', function(){
  var geocoder;

  describe('Initializating', function() {



    it('without any arguments', function() {

      (function() {
        map = new StaticMaps(500, 500);
      }).should.not.throw();
    });


    it('render', function(done) {

      this.timeout(5000);

      map = new StaticMaps(1200, 800);
      map.render(13, [13.437524,52.4945528])
        .then(function(values) {
          var save = map.image.save( 'simple.png');
          save.on('finish', function () {
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/ icon', function(done) {

     this.timeout(10000);

      var file = __dirname + '/marker.png';

      map = new StaticMaps(500, 500);
      map.addMarker([13.437524,52.4945528], file, 24, 48, 48, 48);
      map.addMarker([13.430524,52.4995528], file, 24, 48, 48, 48);

      map.render(12, [13.437524,52.4945528])
        .then(function(values) {
          var save = map.image.save('marker.png');
          save.on('finish', function () {
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

    it('render w/out center', function(done) {

     this.timeout(10000);

      var file = __dirname + '/marker.png';

      map = new StaticMaps(1000, 1000);
      map.addMarker([13.437524,52.4945528], file, 24, 48, 48, 48);
      map.addMarker([13.430524,52.4995528], file, 24, 48, 48, 48);
      map.addMarker([13.410524,52.5195528], file, 24, 48, 48, 48);

      map.render()
        .then(function(values) {
          var save = map.image.save('marker-nocenter.png');
          save.on('finish', function () {
            done();
          });
        })
        .catch(function(err) { console.log(err); });

    });

  });

});
