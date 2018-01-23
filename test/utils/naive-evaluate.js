var bspline = require('b-spline');
var isNdarray = require('../../src/utils/is-ndarray');

module.exports = function (points, degree, knots, weights, t) {
  knots = (knots && knots[0]) ? knots[0] : undefined;
  degree = Array.isArray(degree) ? degree[0] : degree;
  var len = isNdarray(points) ? points.shape[0] : points[0].length;
  var k0 = knots ? knots[degree] : degree;
  var k1 = knots ? knots[knots.length - degree - 1] : len;

  var tadj = (t - k0) / (k1 - k0);

  return bspline(tadj, degree, points, knots, weights);
};
