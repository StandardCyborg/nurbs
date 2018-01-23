'use strict';

module.exports = function arc (theta1, theta2, dimension) {
  var n = Math.ceil(Math.abs(theta2 - theta1) / Math.PI + 0.5);
  var data = {points: [], weights: [], knots: [[0]], degree: 2};
  var alpha = 0.5 * (theta2 - theta1) / n;
  var r = 1 / Math.cos(alpha);
  for (var i = 0; i < n; i++) {
    var theta = theta1 + (theta2 - theta1) * i / n;
    data.points.push([Math.cos(theta), Math.sin(theta)],
      [r * Math.cos(theta + alpha), r * Math.sin(theta + alpha)]);
    data.weights.push(1, Math.sin(Math.PI / 2 - alpha));
    data.knots[0].push(i / n, i / n);
  }
  data.points.push([Math.cos(theta2), Math.sin(theta2)]);
  data.weights.push(1);
  data.knots[0].push(i / n, i / n, i / n);

  if (dimension > 2) {
    for (i = 0; i < data.points.length; i++) {
      for (var j = 2; j < dimension; j++) {
        data.points[i][j] = 0;
      }
    }
  }
  return data;
};
