'use strict';

// Source: https://github.com/scijs/isndarray
// By Kyle Robinson Young, MIT Licensed.

module.exports = function (arr) {
  if (!arr) return false;
  if (!arr.dtype) return false;
  var re = new RegExp('function View[0-9]+d(:?' + arr.dtype + ')+');
  return re.test(String(arr.constructor));
};
