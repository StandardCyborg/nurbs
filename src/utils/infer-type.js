'use strict';

var isNdarray = require('./is-ndarray');
var isNdarrayLike = require('./is-ndarray-like');
var isArrayLike = require('./is-array-like');

function inferType (x) {
  if (!x) {
    return undefined;
  }
  if (isNdarray(x) || isNdarrayLike(x)) {
    if (x.dtype === 'generic') {
      return inferType.GENERIC_NDARRAY;
    }
    return inferType.NDARRAY;
  } else {
    if (isArrayLike(x)) {
      // if (isArrayLike(x[0])) {
      return inferType.ARRAY_OF_ARRAYS;
      // }
      // return inferType.PACKED;
    }
    throw new Error('Unhandled data type. Got type: ' + (typeof x));
  }
}

inferType.ARRAY_OF_ARRAYS = 'Arr';
inferType.NDARRAY = 'Nd';
inferType.GENERIC_NDARRAY = 'GenNd';
inferType.PACKED = 'PackArr';

module.exports = inferType;
