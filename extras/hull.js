const ndarray = require('ndarray');
const pack = require('ndarray-pack');
const unpack = require('ndarray-unpack');
const isndarray = require('isndarray');

module.exports = function (hull, nurbs) {
  var i, j, idx1, idx2;
  hull = hull || {};
  var cells = hull.cells = hull.cells || [];
  var ndControlPoints = isndarray(nurbs.points) ? nurbs.points : pack(nurbs.points);
  // var ndControlWeights = isndarray(nurbs.weights) ? nurbs.weights : pack(nurbs.weights);

  hull.positions = unpack(
    ndarray(
      ndControlPoints.data,
      [ndControlPoints.shape[0] * ndControlPoints.shape[1], ndControlPoints.shape[2]]
    )
  );

  var nu = ndControlPoints.shape[0];
  var nv = ndControlPoints.shape[1];

  cells.length = 0;
  for (j = 0; j < nv; j++) {
    for (i = 0; i < nu - (nurbs.boundary[0] === 'closed' ? 0 : 1); i++) {
      idx1 = i * nv + j;
      idx2 = ((i + 1) % nu) * nv + j;
      cells.push([idx1, idx2]);
    }
  }
  for (i = 0; i < nu; i++) {
    for (j = 0; j < nv - (nurbs.boundary[1] === 'closed' ? 0 : 1); j++) {
      idx1 = i * nv + j % nv;
      idx2 = i * nv + (j + 1) % nv;
      cells.push([idx1, idx2]);
    }
  }

  return hull;
};
