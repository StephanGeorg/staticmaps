var should = require('should');
var StaticMaps = require('../lib/staticmaps');


describe('StaticMap', function(){
  var geocoder;

  describe('Initializating', function() {

    it('without any arguments', function() {
      (function() {
        map = new StaticMaps(300, 400);

        map.render(10, [13.437524,52.4945528]);

      }).should.not.throw();
    });

  });

});
