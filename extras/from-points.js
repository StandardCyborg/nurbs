'use strict';

// var nurbs = require('../');
var isNdarray = require('../src/utils/is-ndarray-like');
// var ndloop = require('../src/utils/ndloop');
// var solve = require('ndarray-linear-solve');
// var ndarray = require('ndarray');

function getShape (data) {
  if (isNdarray(data)) {
    return {
      size: data.shape.slice(0, data.shape.length - 1),
      splineDimension: data.shape.length - 1,
      spatialDimension: data.shape[data.shape.length - 1]
    };
  } else {
    var splineDimension = 0;
    var size = [];
    for (var ptr = data; Array.isArray(ptr[0]); ptr = ptr[0]) {
      splineDimension++;
      size.push(ptr.length);
    }
    return {
      splineDimension: splineDimension,
      spatialDimension: ptr.length,
      size: size
    };
  }
}

module.exports = function nurbsFromPoints (opts) {
  if (!opts.points) {
    throw new Error('Points must be provided in order to fit a curve');
  }

  var shape = getShape(opts.points);
  var size = shape.size;

  var proxyOpts = Object.assign({}, opts);
  delete proxyOpts.points;
  proxyOpts.size = size;

  // var proxySpline = nurbs(proxyOpts);

  switch (shape.splineDimension) {
    case 1:
      // var domain = proxySpline.domain[0];
      break;
    default:
      throw new Error('Can only fit 1D splines at the moment.');
  }

  // return proxySpline;
};
