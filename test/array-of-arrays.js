'use strict';

var test = require('tape');
var nurbs = require('../');
var baselineEvaluate = require('./utils/naive-evaluate');

test('array-of-array style nurbs', function (t) {
  t.test('instantiation', function (t) {
    t.test('using arrays of arrays', function (t) {
      t.test('instantiation in various dimensionalities', function (t) {
        t.test('fails to create a 0-D spline', function (t) {
          var spline;
          t.throws(function () {
            spline = nurbs([1, 2, 3, 4]);
          }, /Expected an array of points/);
          t.equal(spline, undefined);
          t.end();
        });

        t.test('creates a line in one dimension', function (t) {
          var points = [[1], [4], [7]];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 1);
          t.equal(spline.dimension, 1);
          t.deepEqual(spline.degree, [2]);
          t.deepEqual(spline.size, [3]);
          t.end();
        });

        t.test('creates a line in two dimensions', function (t) {
          var points = [[1, 2], [4, 5], [7, 8]];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 1);
          t.equal(spline.dimension, 2);
          t.deepEqual(spline.size, [3]);
          t.end();
        });

        t.test('creates a line in three dimensions', function (t) {
          var points = [[1, 2, 3], [4, 5, 6], [1, 2, 3]];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 1);
          t.equal(spline.dimension, 3);
          t.deepEqual(spline.degree, [2]);
          t.deepEqual(spline.size, [3]);
          t.end();
        });

        t.test('creates a surface in three dimensions', function (t) {
          var points = [
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
            [[7, 8, 9], [10, 11, 12], [13, 14, 15]],
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
          ];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 2);
          t.equal(spline.dimension, 3);
          t.deepEqual(spline.degree, [2, 2]);
          t.deepEqual(spline.size, [3, 3]);
          t.end();
        });

        t.test('creates a surface in two dimensions', function (t) {
          var points = [
            [[1, 2], [4, 5]],
            [[1, 2], [4, 5]],
            [[1, 2], [4, 5]]
          ];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 2);
          t.equal(spline.dimension, 2);
          t.deepEqual(spline.size, [3, 2]);
          t.end();
        });
      });

      t.test('sanitizing the knots', function (t) {
        t.test('accepts knots per-dimension for a surface', function (t) {
          var knots = [[0, 1, 2, 3], [6, 7, 8, 9]];
          var spline = nurbs({
            points: [[[0], [1]], [[20], [21]]],
            degree: [1, 1],
            knots: knots
          });
          t.deepEqual(spline.knots, knots);
          t.end();
        });

        t.test('accepts knots per-dimension for a curve', function (t) {
          var knots = [[0, 1, 2, 3]];
          var spline = nurbs({
            points: [[0], [1]],
            degree: [1],
            knots: knots
          });
          t.deepEqual(spline.knots, knots);
          t.end();
        });

        t.test('sanitizes a flat knot array', function (t) {
          var knots = [0, 1, 2, 3];
          var spline = nurbs({
            points: [[0], [1]],
            degree: [1],
            knots: knots
          });
          t.deepEqual(spline.knots, [knots]);
          t.end();
        });

        t.test('throws correct errors for an invalid flat knot array', function (t) {
          t.throws(function () {
            nurbs({
              points: [[0], [1]],
              degree: [1],
              knots: [0, 1, 2, 3, 4]
            });
          }, /Expected 4 knots in dimension 1 but got 5/);
          t.end();
        });

        t.test('permits unnecessary knots for a degree 1 spline', function (t) {
          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1]],
              degree: [1],
              boundary: 'closed',
              knots: [0, 1, 2, 3, 4]
            });
          });

          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1]],
              degree: [1],
              boundary: 'closed',
              knots: [0, 1, 2, 4]
            });
          });
          t.end();
        });

        t.test('permits unnecessary knots for a degree 2 spline', function (t) {
          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1]],
              degree: [2],
              boundary: 'closed',
              knots: [0, 1, 2, 3, 4, 5]
            });
          });

          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1]],
              degree: [2],
              boundary: 'closed',
              knots: [0, 1, 2, 3]
            });
          });
          t.end();
        });

        t.test('permits unnecessary knots for a degree 3 spline', function (t) {
          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1], [2]],
              degree: [3],
              boundary: 'closed',
              knots: [0, 1, 2, 3, 4]
            });
          });
          t.doesNotThrow(function () {
            nurbs({
              points: [[0], [2], [1], [2]],
              degree: [3],
              boundary: 'closed',
              knots: [0, 1, 2, 3, 4, 5, 6, 7]
            });
          });
          t.end();
        });
      });

      t.test('sanitizing closed', function (t) {
        t.test('expands into arrays', function (t) {
          var pts = [
            [[1], [2], [3]],
            [[4], [5], [6]],
            [[7], [8], [9]]
          ];
          var spline = nurbs({
            points: pts,
            boundary: 'closed'
          });

          t.deepEqual(spline.boundary, ['closed', 'closed']);
          t.end();
        });

        t.test('fills in missing values', function (t) {
          var pts = [[
            [[1], [2]], [[4], [5]],
            [[1], [2]], [[4], [5]]
          ], [
            [[1], [2]], [[4], [5]],
            [[1], [2]], [[4], [5]]
          ]];
          var spline = nurbs({
            points: pts,
            boundary: ['closed', undefined, null]
          });

          t.deepEqual(spline.boundary, ['closed', 'open', 'open']);
          t.end();
        });
      });

      t.test('sanitizing the degree', function (t) {
        t.test('converts a scalar degree to a vector of degrees per dimension', function (t) {
          var points = [
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
            [[7, 8, 9], [10, 11, 12], [13, 14, 15]],
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
          ];
          var spline = nurbs(points, 1);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 2);
          t.equal(spline.dimension, 3);
          t.deepEqual(spline.degree, [1, 1]);
          t.deepEqual(spline.size, [3, 3]);
          t.end();
        });

        t.test('throws an error if a degree is missing', function (t) {
          var points = [
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
            [[7, 8, 9], [10, 11, 12], [13, 14, 15]],
            [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
          ];
          t.throws(function () {
            nurbs(points, [1]);
          }, /Missing degree in dimension 2/);
          t.end();
        });

        t.test('downgrades the degree if not enough points', function (t) {
          var points = [[1, 2, 3], [1, 2, 3]];
          var spline = nurbs(points);
          t.equal(spline.points, points);
          t.equal(spline.splineDimension, 1);
          t.equal(spline.dimension, 3);
          t.deepEqual(spline.degree, [1]);
          t.deepEqual(spline.size, [2]);
          t.end();
        });

        t.test('does not downgrade the degree if a degree was provided', function (t) {
          var points = [[1, 2], [1, 2]];
          t.throws(function () {
            nurbs(points, 2);
          }, /Expected at least 3 points for degree 2 spline in dimension 1 but got only 2/);
          t.end();
        });
      });
    });

    t.test('makes properties read-only', function (t) {
      t.test('fails to write dimension', function (t) {
        var spline = nurbs([[1], [4], [7]]);
        t.equal(spline.dimension, 1);
        t.throws(function () {
          spline.dimension = 7;
        }, /Cannot assign to read only property/);
        t.end();
      });

      t.test('fails to write splineDimension', function (t) {
        var spline = nurbs([[1], [4], [7]]);
        t.equal(spline.splineDimension, 1);
        t.throws(function () {
          spline.splineDimension = 7;
        }, /Cannot assign to read only property/);
        t.end();
      });

      t.test('fails to write size', function (t) {
        var spline = nurbs([[1], [4], [7]]);
        t.deepEqual(spline.size, [3]);
        t.throws(function () {
          spline.size = [7];
        }, /Cannot assign to read only property/);
        t.end();
      });

      t.test('can write size only if no points provided', function (t) {
        // Create a spline with size
        var spline = nurbs({size: [4]});
        t.deepEqual(spline.size, [4]);

        // Can modify size
        t.doesNotThrow(function () {
          spline.size = [5];
        });
        t.deepEqual(spline.size, [5]);

        // Reinitialize with points instead
        spline({points: [[1], [2], [3]]});
        t.deepEqual(spline.size, [3]);

        // now cannot write opints:
        t.throws(function () {
          spline.size = [5];
        }, /Cannot assign to read only property/);

        t.deepEqual(spline.size, [3]);
        t.end();
      });
    });
  });

  t.test('updating', function (t) {
    t.test('updates data', function (t) {
      var spline = nurbs({points: [[1], [4]]});
      t.deepEqual(spline.evaluate([], 1.5), [2.5]);
      spline([[2], [5]]);
      t.deepEqual(spline.evaluate([], 1.5), [3.5]);
      t.end();
    });

    t.test('changes dimensionality ', function (t) {
      var spline = nurbs([[1], [4]]);
      t.deepEqual(spline.evaluate([], 1.5), [2.5]);
      spline([[2, 3], [4, 5]]);
      t.deepEqual(spline.evaluate([], 1.5), [3, 4]);
      t.end();
    });

    t.test('changes degree', function (t) {
      var spline = nurbs([[1], [4]]);
      t.deepEqual(spline.evaluate([], 1.5), [2.5]);
      spline([[1], [1], [4]]);
      t.deepEqual(spline.evaluate([], 1.5), [1.375]);
      t.end();
    });

    t.test('runs validations', function (t) {
      var spline = nurbs([[1], [4]]);
      t.deepEqual(spline.evaluate([], 1.5), [2.5]);
      t.throws(function () {
        spline([1, 1, 4]);
      }, /Expected an array of points/);
      t.end();
    });

    t.test('does not require updating to change the number of points', function (t) {
      var spline = nurbs({points: [[1], [2]], checkBounds: true});
      t.deepEqual(spline.evaluate([], 1.5), [1.5]);
      spline.points = [[1], [2], [3], [4], [5]];
      t.deepEqual(spline.evaluate([], 4.5), [4.5]);

      t.end();
    });

    t.test('evaluates size dynamically', function (t) {
      var spline = nurbs([[1], [2], [3]]);
      t.deepEqual(spline.size, [3]);
      spline.points.push([5]);
      t.deepEqual(spline.size, [4]);
      t.end();
    });

    t.test('evaluates the domain dynamically', function (t) {
      var spline = nurbs([[1], [2], [3]]);
      t.deepEqual(spline.domain, [[2, 3]]);
      spline.points.push([5]);
      t.deepEqual(spline.domain, [[2, 4]]);
      t.end();
    });
  });

  t.test('evaluation', function (t) {
    t.test('curves', function (t) {
      t.test('in one dimension', function (t) {
        t.test('evaluates correctly for a uniform quadratic b-spline', function (t) {
          var spline = nurbs({
            points: [[0], [1], [4]],
            degree: 2,
            boundary: 'clamped'
          });
          t.deepEqual(spline.domain, [[2, 3]]);
          t.deepEqual(spline.evaluate([], 2), [0]);
          t.deepEqual(spline.evaluate([], 2.5), [1.5]);
          t.deepEqual(spline.evaluate([], 3), [4]);
          t.end();
        });

        t.test('evaluates correctly for an open quadratic b-spline', function (t) {
          var spline = nurbs({
            points: [[0], [1], [4], [2], [4]],
            boundary: 'open',
            degree: 2
          });
          t.deepEqual(spline.domain, [[2, 5]]);
          t.deepEqual(spline.evaluate([], 2), [0.5]);
          t.deepEqual(spline.evaluate([], 2.5), [1.25]);
          t.deepEqual(spline.evaluate([], 5), [3]);
          t.end();
        });

        t.test('evaluates correctly for a closed quadratic b-spline', function (t) {
          var spline = nurbs({
            points: [[0], [1], [4], [2], [4]],
            boundary: 'closed',
            degree: 2
          });
          t.deepEqual(spline.domain, [[0, 5]]);
          t.deepEqual(spline.evaluate([], 0), [3]);
          t.deepEqual(spline.evaluate([], 2), [0.5]);
          t.deepEqual(spline.evaluate([], 2.5), [1.25]);
          t.deepEqual(spline.evaluate([], 5), [3]);
          t.end();
        });
      });

      t.test('in two dimensions', function (t) {
        t.test('evaluates correctly for a uniform quadratic b-spline', function (t) {
          var spline = nurbs({
            points: [[0, 0], [1, 1], [2, 4]],
            boundary: 'clamped',
            weights: [1, 2, 1],
            degree: 2
          });
          t.deepEqual(spline.evaluate([], 2), [0, 0]);
          t.deepEqual(spline.evaluate([], 2.5), [1, 4 / 3]);
          t.deepEqual(spline.evaluate([], 3), [2, 4]);
          t.end();
        });

        t.test('evaluates correctly for a uniform weighted quadratic b-spline', function (t) {
          var spline = nurbs({
            points: [[0, 0], [1, 1], [2, 4]],
            degree: 2,
            boundary: 'clamped'
          });
          t.deepEqual(spline.evaluate([], 2), [0, 0]);
          t.deepEqual(spline.evaluate([], 2.5), [1, 1.5]);
          t.deepEqual(spline.evaluate([], 3), [2, 4]);
          t.end();
        });

        t.test('compared to baseline b-spline module', function (t) {
          t.test('is equivalent to an alternate evaluation method for degree 2', function (t) {
            var nPoints = 10;
            var degree = 2;
            var points = new Array(nPoints).fill(0).map((d, i) => [Math.cos(i), Math.sin(i), Math.sqrt(1 + i)]);
            var weights = points.map((d, i) => 1.0 + 0.5 * Math.cos(i));
            var nKnots = points.length + degree + 1;
            var knots = [new Array(nKnots).fill(0).map((d, i) => Math.sqrt(5 + i))];
            var spline = nurbs(points, degree, knots, weights);
            var domain = spline.domain[0];

            var n = 51;
            for (var i = 0; i < n; i++) {
              var tEval = domain[0] + (domain[1] - domain[0]) * i / (n - 1);
              t.deepEqual(spline.evaluate([], tEval), baselineEvaluate(points, degree, knots, weights, tEval), 't = ' + tEval);
            }
            t.end();
          });

          t.test('is equivalent to an alternate evaluation method for degree 3', function (t) {
            var nPoints = 10;
            var degree = 3;
            var points = new Array(nPoints).fill(0).map((d, i) => [Math.cos(i), Math.sin(i), Math.sqrt(1 + i)]);
            var weights = points.map((d, i) => 1.0 + 0.5 * Math.cos(i));
            var nKnots = points.length + degree + 1;
            var knots = [new Array(nKnots).fill(0).map((d, i) => Math.sqrt(5 + i))];
            var spline = nurbs(points, degree, knots, weights);
            var domain = spline.domain[0];

            var n = 51;
            for (var i = 0; i < n; i++) {
              var tEval = domain[0] + (domain[1] - domain[0]) * i / (n - 1);
              t.deepEqual(spline.evaluate([], tEval), baselineEvaluate(points, degree, knots, weights, tEval), 't = ' + tEval);
            }
            t.end();
          });

          t.test('is equivalent to an alternate evaluation method for degree 9', function (t) {
            var nPoints = 10;
            var degree = 9;
            var points = new Array(nPoints).fill(0).map((d, i) => [Math.cos(i), Math.sin(i), Math.sqrt(1 + i)]);
            var weights = points.map((d, i) => 1.0 + 0.5 * Math.cos(i));
            var nKnots = points.length + degree + 1;
            var knots = [new Array(nKnots).fill(0).map((d, i) => Math.sqrt(5 + i))];
            var spline = nurbs(points, degree, knots, weights);
            var domain = spline.domain[0];

            var n = 51;
            for (var i = 0; i < n; i++) {
              var tEval = domain[0] + (domain[1] - domain[0]) * i / (n - 1);
              t.deepEqual(spline.evaluate([], tEval), baselineEvaluate(points, degree, knots, weights, tEval), 't = ' + tEval);
            }
            t.end();
          });
        });

        t.test('is correct for closed splines with knots', function (t) {
          var spline = nurbs({
            points: [[0], [1], [3], [2], [4]],
            degree: 3,
            knots: [1, 2, 4, 8, 16, 32],
            boundary: 'closed'
          });

          // Confirm the start is the same as the end:
          t.deepEqual(
            spline.evaluate([], spline.domain[0][0]),
            spline.evaluate([], spline.domain[0][1])
          );

          t.end();
        });

        t.test('is correct for closed splines with superfluous knots', function (t) {
          var spline = nurbs({
            points: [[0], [1], [3], [2], [4]],
            degree: 2,
            knots: [1, 2, 4, 8, 16, 32, 33, 34],
            boundary: 'closed'
          });

          // Confirm the start is the same as the end:
          t.deepEqual(
            spline.evaluate([], spline.domain[0][0]),
            spline.evaluate([], spline.domain[0][1])
          );

          t.end();
        });

        t.test('is correct for closed splines without knots', function (t) {
          var spline = nurbs({
            points: [[0], [1], [3], [2], [4]],
            degree: 2,
            boundary: 'closed'
          });

          // Confirm the start is the same as the end:
          t.deepEqual(
            spline.evaluate([], spline.domain[0][0]),
            spline.evaluate([], spline.domain[0][1])
          );

          t.end();
        });
      });

      t.test('in three dimensions', function (t) {
        var spline = nurbs({
          points: [[0, 0, 0], [1, 1, 2], [2, 4, 8]],
          degree: 2,
          boundary: 'clamped'
        });
        t.deepEqual(spline.evaluate([], 2), [0, 0, 0]);
        t.deepEqual(spline.evaluate([], 2.5), [1, 1.5, 3]);
        t.deepEqual(spline.evaluate([], 3), [2, 4, 8]);
        t.end();
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

    test('bounds checks', function (t) {
      t.test('does not check bounds by default', function (t) {
        var spline = nurbs({points: [[0], [1], [3], [2], [4]]});

        t.doesNotThrow(function () {
          spline.evaluate([], -2);
        });

        spline({points: spline.points, checkBounds: true});

        t.throws(function () {
          spline.evaluate([], -2);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 5\]. but got t0 = -2./);

        t.end();
      });

      t.test('check bounds for a curve', function (t) {
        var spline = nurbs({
          points: [[0], [1], [3], [2], [4]],
          checkBounds: true
        });

        t.throws(function () {
          spline.evaluate([], -2);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 5\]. but got t0 = -2./);

        t.throws(function () {
          spline.evaluate([], 8);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 5\]. but got t0 = 8./);

        t.throws(function () {
          spline.evaluate([], undefined);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 5\]. but got t0 = undefined./);

        t.throws(function () {
          spline.evaluate([], NaN);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 5\]. but got t0 = NaN./);

        t.end();
      });

      t.test('check bounds for a curve', function (t) {
        var spline = nurbs({
          points: [[[0], [1], [2], [4]], [[3], [2], [4], [5]]],
          checkBounds: true
        });

        t.throws(function () {
          spline.evaluate([], -2);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[1, 2\]. but got t0 = -2./);

        t.throws(function () {
          spline.evaluate([], 1.5);
        }, /Invalid Spline parameter in dimension 1. Valid domain is \[2, 4\]. but got t1 = undefined./);

        t.throws(function () {
          spline.evaluate([], undefined, 2.5);
        }, /Invalid Spline parameter in dimension 0. Valid domain is \[1, 2\]. but got t0 = undefined./);

        t.doesNotThrow(function () {
          spline.evaluate([], 1.5, 2.5);
        });

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

      var curve = nurbs([[1, 2], [3, 4], [5, 6]]);
      curve.transform(m);

      t.deepEqual(curve.points, [
        [17, 21],
        [27, 35],
        [37, 49]
      ]);
      t.end();
    });

    t.test('in three dimensions', function (t) {
      var m = [
        1, 2, 3, 0,
        4, 5, 6, 0,
        8, 9, 10, 0,
        12, 13, 14, 1
      ];

      var curve = nurbs([[1, 2, 3], [3, 4, 5], [5, 6, 7]]);
      curve.transform(m);

      t.deepEqual(curve.points, [
        [45, 52, 59],
        [71, 84, 97],
        [97, 116, 135]
      ]);
      t.end();
    });
  });

  t.test('support', function (t) {
    t.test('truncates destination array', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]]
      });

      t.deepEqual(spline.support([1, 2, 3, 4, 5], 3.0), [1, 2, 3]);
      t.end();
    });

    t.test('check bounds', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        checkBounds: true
      });

      t.throws(function () {
        spline.support([1, 2, 3, 4, 5], 1e10);
      }, /Invalid Spline parameter in dimension 0. Valid domain is \[2, 8\]. but got t0 = 10000000000./);
      t.end();
    });

    t.test('clamped b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        degree: 3,
        boundary: 'clamped'
      });

      t.deepEqual(spline.support([1, 2, 3, 5, 6], 3.0), [0, 1, 2, 3]);
      t.deepEqual(spline.support([], 4.0), [1, 2, 3, 4]);
      t.deepEqual(spline.support([], 5.0), [2, 3, 4, 5]);
      t.deepEqual(spline.support([], 6.0), [3, 4, 5, 6]);
      t.deepEqual(spline.support([], 7.0), [4, 5, 6, 7]);
      t.deepEqual(spline.support([], 8.0), [4, 5, 6, 7]);

      t.end();
    });

    t.test('open b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        degree: 3,
        boundary: 'open'
      });

      t.deepEqual(spline.support([], 3.0), [0, 1, 2, 3]);
      t.deepEqual(spline.support([], 4.0), [1, 2, 3, 4]);
      t.deepEqual(spline.support([], 5.0), [2, 3, 4, 5]);
      t.deepEqual(spline.support([], 6.0), [3, 4, 5, 6]);
      t.deepEqual(spline.support([], 7.0), [4, 5, 6, 7]);
      t.deepEqual(spline.support([], 8.0), [4, 5, 6, 7]);

      t.end();
    });

    t.test('closed b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        degree: 3,
        boundary: 'closed'
      });

      t.deepEqual(spline.support([], 0.0), [5, 6, 7, 0]);
      t.deepEqual(spline.support([], 1.0), [6, 7, 0, 1]);
      t.deepEqual(spline.support([], 2.0), [7, 0, 1, 2]);
      t.deepEqual(spline.support([], 3.0), [0, 1, 2, 3]);
      t.deepEqual(spline.support([], 4.0), [1, 2, 3, 4]);
      t.deepEqual(spline.support([], 5.0), [2, 3, 4, 5]);
      t.deepEqual(spline.support([], 6.0), [3, 4, 5, 6]);
      t.deepEqual(spline.support([], 7.0), [4, 5, 6, 7]);
      t.deepEqual(spline.support([], 8.0), [5, 6, 7, 0]);

      t.end();
    });

    t.test('non-uniform clamped b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        knots: new Array(12).fill(0).map((d, i) => i * i),
        degree: 3
      });

      t.deepEqual(spline.support([], 9.0), [0, 1, 2, 3]);
      t.deepEqual(spline.support([], 16.0), [1, 2, 3, 4]);
      t.deepEqual(spline.support([], 25.0), [2, 3, 4, 5]);
      t.deepEqual(spline.support([], 36.0), [3, 4, 5, 6]);
      t.deepEqual(spline.support([], 49.0), [4, 5, 6, 7]);
      t.deepEqual(spline.support([], 64.0), [4, 5, 6, 7]);

      t.end();
    });

    t.test('non-uniform clamped b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        knots: new Array(12).fill(0).map((d, i) => i * i),
        degree: 3,
        boundary: 'closed'
      });

      t.deepEqual(spline.support([], 0.0), [5, 6, 7, 0]);
      t.deepEqual(spline.support([], 2.0), [6, 7, 0, 1]);
      t.deepEqual(spline.support([], 4.0), [7, 0, 1, 2]);
      t.deepEqual(spline.support([], 9.0), [0, 1, 2, 3]);
      t.deepEqual(spline.support([], 16.0), [1, 2, 3, 4]);
      t.deepEqual(spline.support([], 25.0), [2, 3, 4, 5]);
      t.deepEqual(spline.support([], 36.0), [3, 4, 5, 6]);
      t.deepEqual(spline.support([], 49.0), [4, 5, 6, 7]);
      t.deepEqual(spline.support([], 64.0), [4, 5, 6, 7]);

      t.end();
    });

    t.test('of a clamped surface', function (t) {
      var spline = nurbs({
        points: [
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]]
        ],
        degree: 3
      });

      t.deepEqual(
        spline.support([], 3, 3),
        [
          0, 0, 0, 1, 0, 2, 0, 3,
          1, 0, 1, 1, 1, 2, 1, 3,
          2, 0, 2, 1, 2, 2, 2, 3,
          3, 0, 3, 1, 3, 2, 3, 3
        ]
      );

      t.end();
    });

    t.test('of a closed surface', function (t) {
      var spline = nurbs({
        points: [
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]],
          [[0], [0], [0], [0], [0]]
        ],
        degree: 3,
        boundary: ['closed', 'clamped']
      });

      t.deepEqual(
        spline.support([], 0, 3),
        [
          3, 0, 3, 1, 3, 2, 3, 3,
          4, 0, 4, 1, 4, 2, 4, 3,
          5, 0, 5, 1, 5, 2, 5, 3,
          0, 0, 0, 1, 0, 2, 0, 3
        ]
      );

      t.end();
    });
  });

  t.test('basis', function (t) {
    t.test('clamped b-splines', function (t) {
      var spline = nurbs({
        points: [[0], [0], [0], [0], [0], [0], [0], [0]],
        degree: 2,
        boundary: 'clamped'
      });

      var basis = spline.evaluator(null, true);
      t.equal(basis(2, 0), 1);
      t.equal(basis(2, 1), 0);
      t.equal(basis(2, 2), 0);
      t.equal(basis(2, 3), 0);

      t.equal(basis(3, 0), 0);
      t.equal(basis(3, 1), 0.5);
      t.equal(basis(3, 2), 0.5);
      t.equal(basis(3, 3), 0);

      t.equal(basis(3.5, 0), 0);
      t.equal(basis(3.5, 1), 0.125);
      t.equal(basis(3.5, 2), 0.75);
      t.equal(basis(3.5, 3), 0.125);
      t.equal(basis(3.5, 4), 0);

      t.end();
    });

    t.test('clamped b-spline surface', function (t) {
      var spline = nurbs({
        size: [4, 4],
        degree: 3,
        boundary: 'clamped'
      });

      var basis = spline.evaluator(null, true);

      t.equal(basis(3.5, 3.5, 0, 0), 0.015625);
      t.equal(basis(3.5, 3.5, 1, 0), 0.046875);
      t.equal(basis(3.5, 3.5, 2, 0), 0.046875);
      t.equal(basis(3.5, 3.5, 3, 0), 0.015625);

      t.equal(basis(3.5, 3.5, 0, 1), 0.046875);
      t.equal(basis(3.5, 3.5, 1, 1), 0.140625);
      t.equal(basis(3.5, 3.5, 2, 1), 0.140625);
      t.equal(basis(3.5, 3.5, 3, 1), 0.046875);

      t.equal(basis(3.5, 3.5, 0, 2), 0.046875);
      t.equal(basis(3.5, 3.5, 1, 2), 0.140625);
      t.equal(basis(3.5, 3.5, 2, 2), 0.140625);
      t.equal(basis(3.5, 3.5, 3, 2), 0.046875);

      t.equal(basis(3.5, 3.5, 0, 3), 0.015625);
      t.equal(basis(3.5, 3.5, 1, 3), 0.046875);
      t.equal(basis(3.5, 3.5, 2, 3), 0.046875);
      t.equal(basis(3.5, 3.5, 3, 3), 0.015625);

      t.end();
    });
  });

  t.test('without points', function (t) {
    t.test('throws if no points and no size', function (t) {
      t.throws(function () {
        nurbs();
      }, /Either points or a control hull size must be provided./);
      t.end();
    });

    t.test('permits scalar size', function (t) {
      var curve;
      t.doesNotThrow(function () {
        curve = nurbs({size: 10});
      });
      t.equal(curve.splineDimension, 1);
      t.equal(curve.dimension, 0);
      t.deepEqual(curve.size, [10]);
      t.end();
    });

    t.test('throws if size is empty array', function (t) {
      t.throws(function () {
        nurbs({size: []});
      }, /`size` must be a number or an array of length at least one./);
      t.end();
    });

    t.test('accepts size instead of points', function (t) {
      t.doesNotThrow(function () {
        nurbs({size: [8, 4]});
      });
      t.end();
    });

    t.test('allows basis function evaluation without points', function (t) {
      var curve = nurbs({size: 10});
      var basis = curve.evaluator(null, true);
      t.equal(basis(3, 0), 0.0);
      t.equal(basis(3, 1), 0.5);
      t.equal(basis(3, 2), 0.5);
      t.equal(basis(3, 3), 0.0);
      t.end();
    });

    t.test('allows support evaluation without points', function (t) {
      var curve = nurbs({size: 10});
      t.deepEqual(curve.support([], 3), [1, 2, 3]);
      t.end();
    });
  });
});
