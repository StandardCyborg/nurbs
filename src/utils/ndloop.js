'use strict';

module.exports = function ndloop (n, callback) {
  for (var m = 1, k = 0, i = []; k < n.length; k++) {
    m *= Array.isArray(n[k]) ? (n[k][1] - n[k][0]) : n[k];
    i[k] = Array.isArray(n[k]) ? n[k][0] : 0;
  }
  for (var ptr = 0; ptr < m; ptr++) {
    callback(i.slice());
    for (k = n.length - 1; k >= 0; k--) {
      if (i[k] === (Array.isArray(n[k]) ? n[k][1] : n[k]) - 1) {
        i[k] = Array.isArray(n[k]) ? n[k][0] : 0;
      } else {
        i[k]++;
        break;
      }
    }
  }
};
