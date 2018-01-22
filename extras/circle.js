'use strict';

module.exports = function circle (n, isPeriodic, dimension) {
  var i, j;
  n = n === undefined ? 3 : Math.round(n);
  var alpha = Math.PI / n;
  var r = 1 / Math.cos(alpha);
  var data = {points: [], weights: [], knots: [[]], degree: 2};

  data.boundary = isPeriodic ? 'closed' : 'clamped';
  data.knots[0].push(0);
  for (i = 0; i < n; i++) {
    var theta = Math.PI * 2 * i / n;
    data.points.push([Math.cos(theta), Math.sin(theta)],
      [r * Math.cos(theta + alpha), r * Math.sin(theta + alpha)]);
    data.weights.push(1, Math.sin(Math.PI / 2 - alpha));
    data.knots[0].push(i / n, i / n);
  }
  data.points.push([1, 0]);
  data.weights.push(1);
  data.knots[0].push(i / n);
  if (!isPeriodic) data.knots[0].push(i / n, i / n);

  if (dimension > 2) {
    for (i = 0; i < data.points.length; i++) {
      for (j = 2; j < dimension; j++) {
        data.points[i][j] = 0;
      }
    }
  }
  return data;
};
