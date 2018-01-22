module.exports = function (out, n, p) {
  var j;
  for (j = 0; j < p; j++) {
    out[j] = 0;
    out[n + p - j] = 1;
  }
  var nt = n - p + 1;
  for (j = 0; j < nt; j++) {
    out[p + j] = j / (nt - 1);
  }

  return out;
};
