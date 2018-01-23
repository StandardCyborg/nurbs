'use strict';

module.exports = function bisect (x, t, imin, imax) {
  var lo = imin === undefined ? 0 : imin;
  var hi = imax === undefined ? x.length - 1 : imax;
  while (hi - 1 > lo) {
    var m = Math.floor(0.5 * (hi + lo));
    if (x[m] > t) {
      hi = m;
    } else {
      lo = m;
    }
  }
  while (lo < imax && x[lo] === x[lo + 1]) {
    lo++;
  }
  return lo;
};
