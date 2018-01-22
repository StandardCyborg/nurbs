var test = require('tape');

var inferType = require('../src/utils/infer-type');
var ndarray = require('ndarray');

test('infer-type', function (t) {
  t.test('normal (array-backed) ndarray', function (t) {
    var x = ndarray([1, 2, 3]);
    t.equal(inferType(x), inferType.NDARRAY);
    t.end();
  });

  t.test('ndarray-like object', function (t) {
    var pseudoNd = {
      shape: [1, 2],
      offset: 0,
      stride: [1, 1],
      data: [1, 2]
    };
    t.equal(inferType(pseudoNd), inferType.NDARRAY);
    t.end();
  });

  t.test('generic (get/set-backed) ndarray', function (t) {
    var data = {};
    var x = ndarray({
      get: function (i) { return data[i]; },
      set: function (i, value) { data[i] = value; }
    });
    t.equal(inferType(x), inferType.GENERIC_NDARRAY);
    t.end();
  });

  t.test('packed data', function (t) {
    var x = [1, 2, 3, 4, 5];
    t.equal(inferType(x), inferType.ARRAY_OF_ARRAYS);
    t.end();
  });

  t.test('array of arrays', function (t) {
    var x = [[1, 2], [3, 4], [5, 6]];
    t.equal(inferType(x), inferType.ARRAY_OF_ARRAYS);
    t.end();
  });
});
