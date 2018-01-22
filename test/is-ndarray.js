var test = require('tape');
var isNdarray = require('../src/utils/is-ndarray');
var ndarray = require('ndarray');

test('is-ndarray', function (t) {
  t.test('returns false for non-ndarrays', function (t) {
    t.equal(isNdarray(5), false);
    t.equal(isNdarray([]), false);
    t.equal(isNdarray(undefined), false);
    t.equal(isNdarray(null), false);
    t.equal(isNdarray({foo: 'bar'}), false);
    t.end();
  });
  t.test('returns true for generic ndarrays', function (t) {
    t.equal(isNdarray(ndarray({
      get: function () {},
      set: function () {}
    })), true);
    t.end();
  });

  t.test('returns true for ndarrays', function (t) {
    t.equal(isNdarray(ndarray([1, 2, 3])), true);
    t.end();
  });
});
