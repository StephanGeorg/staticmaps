import Circle from '../../src/circle';

const { expect } = require('chai');


describe('StaticMap', () => {
  describe('Circle ...', () => {
    it('without any arguments', () => {
      const circle = new Circle({ coord: [13, 52], radius: 1000 });
      const ext = circle.extent();
      console.log({ ext });
      /* expect(() => {
        const options = {
          width: 600,
          height: 200,
        };
        const map = new StaticMaps(options);
        expect(map.constructor.name).to.be.equal('StaticMaps');
      }).to.not.throw(); */
    });
  });
});
