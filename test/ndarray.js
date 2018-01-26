'use strict';

var test = require('tape');
var nurbs = require('../');
var pack = require('ndarray-pack');
var baselineEvaluate = require('./utils/naive-evaluate');

test('ndarray style nurbs', function (t) {
  t.test('instantiation', function (t) {
    t.test('in three dimensions', function (t) {
      t.test('obeys ordering compatible with ndarray-pack', function (t) {
        var points = [
          [[0, 1], [2, 3], [4, 5], [6, 7]],
          [[8, 9], [10, 11], [12, 13], [14, 15]],
          [[15, 16], [17, 18], [19, 20], [21, 22]]
        ];

        var packedSpline = nurbs(pack(points));
        var unpackedSpline = nurbs(points);

        // Correctness with expectaions
        t.equal(packedSpline.splineDimension, 2);
        t.equal(packedSpline.dimension, 2);
        t.deepEqual(packedSpline.degree, [2, 2]);
        t.deepEqual(packedSpline.size, [3, 4]);

        // Correctness compared to unpacked
        t.equal(packedSpline.splineDimension, unpackedSpline.splineDimension);
        t.equal(packedSpline.dimension, unpackedSpline.dimension);
        t.deepEqual(packedSpline.degree, unpackedSpline.degree);
        t.deepEqual(packedSpline.size, unpackedSpline.size);

        t.end();
      });
    });
  });

  t.test('update', function (t) {
    t.test('evaluates size dynamically', function (t) {
      var spline = nurbs(pack([[1], [2], [3]]));
      t.deepEqual(spline.size, [3]);
      spline.points = pack([[1], [2], [3], [4]]);
      t.deepEqual(spline.size, [4]);
      t.end();
    });

    t.test('evaluates the domain dynamically', function (t) {
      var spline = nurbs(pack([[1], [2], [3]]));
      t.deepEqual(spline.domain, [[2, 3]]);
      spline.points = pack([[1], [2], [3], [4]]);
      t.deepEqual(spline.domain, [[2, 4]]);
      t.end();
    });
  });

  t.test('evaluation', function (t) {
    t.test('curves', function (t) {
      t.test('evaluates correctly for a uniform quadratic b-spline', function (t) {
        var points = pack([[0], [1], [4]]);
        var spline = nurbs({
          points: points,
          degree: 2,
          boundary: 'clamped'
        });
        t.deepEqual(spline.evaluate([], 2), [0]);
        t.deepEqual(spline.evaluate([], 2.5), [1.5]);
        t.deepEqual(spline.evaluate([], 3), [4]);
        t.end();
      });

      t.test('is equivalent to an alternate evaluation method for degree 3', function (t) {
        var degree = 3;
        var points = new Array(10).fill(0).map((d, i) => [Math.cos(i), Math.sin(i), Math.sqrt(1 + i)]);
        var weights = points.map((d, i) => 1.0 + 0.5 * Math.cos(i));
        var knots = [new Array(points.length + degree + 1).fill(0).map((d, i) => Math.sqrt(5 + i))];
        var spline = nurbs(pack(points), degree, knots, pack(weights));
        var domain = spline.domain[0];

        var n = 51;
        for (var i = 0; i < n; i++) {
          var tEval = domain[0] + (domain[1] - domain[0]) * i / (n - 1);
          t.deepEqual(spline.evaluate([], tEval), baselineEvaluate(points, degree, knots, weights, tEval), 't = ' + tEval);
        }
        t.end();
      });
    });
    t.test('surfaces', function (t) {
      t.test('in one dimension', function (t) {
        var spline = nurbs({
          points: [
            [[0], [1], [4]],
            [[1], [4], [8]],
            [[2], [8], [16]]
          ],
          boundary: 'clamped'
        });
        t.deepEqual(spline.evaluate([], 2, 2), [0]);
        t.deepEqual(spline.evaluate([], 2, 3), [4]);
        t.deepEqual(spline.evaluate([], 3, 2), [2]);
        t.deepEqual(spline.evaluate([], 3, 3), [16]);
        t.deepEqual(spline.evaluate([], 2.5, 2.5), [4.625]);
        t.deepEqual(spline.evaluate([], 2.25, 2.5), [2.96875]);
        t.end();
      });

      t.test('in two dimensions', function (t) {
        var spline = nurbs({
          points: [
            [[0, 1], [1, 2], [4, 5]],
            [[1, 2], [4, 5], [8, 9]],
            [[2, 3], [8, 9], [16, 17]]
          ],
          boundary: 'clamped'
        });
        t.deepEqual(spline.evaluate([], 2, 2), [0, 1]);
        t.deepEqual(spline.evaluate([], 2, 3), [4, 5]);
        t.deepEqual(spline.evaluate([], 3, 2), [2, 3]);
        t.deepEqual(spline.evaluate([], 3, 3), [16, 17]);
        t.deepEqual(spline.evaluate([], 2.5, 2.5), [4.625, 5.625]);
        t.deepEqual(spline.evaluate([], 2.25, 2.5), [2.96875, 3.96875]);
        t.end();
      });

      t.test('in three dimensions', function (t) {
        var spline = nurbs({
          points: [
            [[0, 1, 2], [1, 2, 3], [4, 5, 6]],
            [[1, 2, 3], [4, 5, 6], [8, 9, 10]],
            [[2, 3, 4], [8, 9, 10], [16, 17, 18]]
          ],
          boundary: 'clamped'
        });
        t.deepEqual(spline.evaluate([], 2, 2), [0, 1, 2]);
        t.deepEqual(spline.evaluate([], 2, 3), [4, 5, 6]);
        t.deepEqual(spline.evaluate([], 3, 2), [2, 3, 4]);
        t.deepEqual(spline.evaluate([], 3, 3), [16, 17, 18]);
        t.deepEqual(spline.evaluate([], 2.5, 2.5), [4.625, 5.625, 6.625]);
        t.deepEqual(spline.evaluate([], 2.25, 2.5), [2.96875, 3.96875, 4.96875]);
        t.end();
      });
    });
  });

  t.test('transforming', function (t) {
    t.test('in two dimensions', function (t) {
      var m = [
        1, 2, 0,
        4, 5, 0,
        8, 9, 1
      ];

      var curve = nurbs(pack([[1, 2], [3, 4], [5, 6]]));
      curve.transform(m);

      t.deepEqual(Array.apply(null, curve.points.data), [17, 21, 27, 35, 37, 49]);
      t.end();
    });

    t.test('in three dimensions', function (t) {
      var m = [
        1, 2, 3, 0,
        4, 5, 6, 0,
        8, 9, 10, 0,
        12, 13, 14, 1
      ];

      var curve = nurbs(pack([[1, 2, 3], [3, 4, 5], [5, 6, 7]]));
      curve.transform(m);

      t.deepEqual(Array.apply(null, curve.points.data), [
        45, 52, 59,
        71, 84, 97,
        97, 116, 135
      ]);
      t.end();
    });
  });
});
