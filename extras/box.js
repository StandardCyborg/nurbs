'use strict';

// var uniformKnots = require('./uniform-knots');

module.exports = function box (dimension) {
  var i;

  var data = {
    points: [
      [1, 0],
      [1, 0],
      [0, 1],
      [0, 1],
      [-1, 0],
      [-1, 0],
      [0, -1],
      [0, -1],
      [1, 0]
    ],
    boundary: 'closed',
    weights: new Array(9).fill(1),
    knots: [new Array(10).fill(0).map((d, i) => i / 9)],
    // knots: [uniformKnots([], 9, 2)],
    degree: 2
  };

  if (dimension > 2) {
    for (i = 0; i < data.points.length; i++) {
      for (var j = 2; j < dimension; j++) {
        data.points[i][j] = 0;
      }
    }
  }
  return data;
};
