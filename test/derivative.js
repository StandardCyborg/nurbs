'use strict';

var test = require('tape');
var nurbs = require('../');
var almostEqual = require('almost-equal');

test('array-of-array style nurbs', function (t) {
  t.test('1D curves', function (t) {
    t.test('sanitizes unwrapped derivative order', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 2
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a quadratic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 2
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a quadratic rational b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        weights: [2, 4, 3, 5, 3],
        degree: 2
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a closed quadratic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        boundary: 'closed',
        degree: 2
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a cubic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 3
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a closed cubic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        boundary: 'closed',
        degree: 3
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          1e-3
        ));
      }

      t.end();
    });

    t.test('evaluates the derivative of a rational cubic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        weights: [1, 3, 2, 4, 3],
        degree: 3
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        t.ok(almostEqual(
          der1([], tValue)[0],
          spline.numericalDerivative([], 1, 0, tValue)[0],
          2e-3
        ));
      }

      t.end();
    });
  });

  t.test('derivative basis', function (t) {
    var spline = nurbs({
      points: [[0], [0], [0], [0], [0]],
      weights: [1, 2, 3, 4, 5],
      degree: 3
    });

    var der1Basis = spline.evaluator(1, true);
    var domain = spline.domain[0];

    var n = 11;
    for (var i = 0; i < spline.size[0]; i++) {
      for (var j = 0; j < spline.size[0]; j++) {
        spline.points[j][0] = i === j ? 1 : 0;
      }
      for (var k = 1; k < n - 1; k++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * k / (n - 1);

        var ana = der1Basis(tValue, i);
        var num = spline.numericalDerivative([], 1, 0, tValue)[0];

        t.ok(almostEqual(ana, num, 1e-7), 'basis function for point ' + i + ', deriv = ' + num + ' at t = ' + tValue);
      }
    }
    t.end();
  });

  t.test('2D curves', function (t) {
    t.test('evaluates the derivative of a quadratic b-spline', function (t) {
      var spline = nurbs({
        points: [[0, 3], [1, 4], [4, 2], [2, 0], [4, 7]],
        degree: 2
      });

      var der1 = spline.evaluator([1]);
      var domain = spline.domain[0];
      var n = 11;

      for (var i = 0; i < n; i++) {
        var tValue = domain[0] + (domain[1] - domain[0]) * i / (n - 1);
        var ana = der1([], tValue);
        var num = spline.numericalDerivative([], 1, 0, tValue);

        t.ok(almostEqual(ana[0], num[0], 1e-3));
        t.ok(almostEqual(ana[1], num[1], 1e-3));
      }

      t.end();
    });
  });

  t.test('2D surfaces', function (t) {
    t.test('evaluates dp/du of a quadratic b-spline surface', function (t) {
      var spline = nurbs({
        points: [
          [[0, 3], [1, 4], [4, 2]],
          [[2, 0], [4, 7], [6, 8]],
          [[2, 3], [5, 2], [1, 3]]
        ],
        degree: 2
      });
      var der1 = spline.evaluator([1, 0]);
      var domain = spline.domain;
      var n = 5;

      for (var i = 0; i < n; i++) {
        var u = domain[0][0] + (domain[0][1] - domain[0][0]) * i / (n - 1);
        for (var j = 0; j < n; j++) {
          var v = domain[1][0] + (domain[1][1] - domain[1][0]) * j / (n - 1);

          var ana = der1([], u, v);
          var num = spline.numericalDerivative([], 1, 0, u, v);

          t.ok(almostEqual(ana[0], num[0], 1e-3), 'dp/du at (u, v) = (' + u + ', ' + v + ')');
          t.ok(almostEqual(ana[1], num[1], 1e-3), 'dp/du at (u, v) = (' + u + ', ' + v + ')');
        }
      }

      t.end();
    });

    t.test('evaluates dp/dv of a quadratic b-spline surface', function (t) {
      var spline = nurbs({
        points: [
          [[0, 3], [1, 4], [4, 2]],
          [[2, 0], [4, 7], [6, 8]],
          [[2, 3], [5, 2], [1, 3]]
        ],
        degree: 2
      });
      var der1 = spline.evaluator([0, 1]);
      var domain = spline.domain;
      var n = 5;

      for (var i = 0; i < n; i++) {
        var u = domain[0][0] + (domain[0][1] - domain[0][0]) * i / (n - 1);
        for (var j = 0; j < n; j++) {
          var v = domain[1][0] + (domain[1][1] - domain[1][0]) * j / (n - 1);

          var ana = der1([], u, v);
          var num = spline.numericalDerivative([], 1, 1, u, v);

          t.ok(almostEqual(ana[0], num[0], 1e-3), 'dp/du at (u, v) = (' + u + ', ' + v + ')');
          t.ok(almostEqual(ana[1], num[1], 1e-3), 'dp/du at (u, v) = (' + u + ', ' + v + ')');
        }
      }

      t.end();
    });
  });

  t.test('second derivatives', function (t) {
    t.test('of a quadratic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 2
      });

      var der2 = spline.evaluator([2]);
      var domain = spline.domain[0];
      var n = 21;

      var h = 1e-4;

      for (var i = 1; i < n - 1; i++) {
        var u = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        var expectedDer2 = (spline.evaluate([], u + h)[0] - 2.0 * spline.evaluate([], u)[0] + spline.evaluate([], u - h)[0]) / h / h;
        var actualDer2 = der2([], u)[0];

        t.ok(almostEqual(actualDer2, expectedDer2, 2e-3), 'second derivative at t = ' + u + ', expected: ' + expectedDer2 + ', actual: ' + actualDer2);
      }

      t.end();
    });

    t.test('of a cubic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 3
      });

      var der2 = spline.evaluator([2]);
      var domain = spline.domain[0];
      var n = 21;

      var h = 1e-4;

      for (var i = 1; i < n - 1; i++) {
        var u = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        var expectedDer2 = (spline.evaluate([], u + h)[0] - 2.0 * spline.evaluate([], u)[0] + spline.evaluate([], u - h)[0]) / h / h;
        var actualDer2 = der2([], u)[0];

        t.ok(almostEqual(actualDer2, expectedDer2, 2e-3), 'second derivative at t = ' + u + ', expected: ' + expectedDer2 + ', actual: ' + actualDer2);
      }

      t.end();
    });

    t.test('of a cubic b-spline with non-uniform knots', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        knots: [new Array(9).fill(0).map((d, i) => Math.sqrt(17 + i))],
        degree: 3
      });

      var der2 = spline.evaluator([2]);
      var domain = spline.domain[0];
      var n = 21;

      var h = 1e-4;

      for (var i = 1; i < n - 1; i++) {
        var u = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        var expectedDer2 = (spline.evaluate([], u + h)[0] - 2.0 * spline.evaluate([], u)[0] + spline.evaluate([], u - h)[0]) / h / h;
        var actualDer2 = der2([], u)[0];

        t.ok(almostEqual(actualDer2, expectedDer2, 2e-3), 'second derivative at t = ' + u + ', expected: ' + expectedDer2 + ', actual: ' + actualDer2);
      }

      t.end();
    });

    t.test('of a quartic b-spline', function (t) {
      var spline = nurbs({
        points: [[0], [1], [4], [2], [4]],
        degree: 4
      });

      var der2 = spline.evaluator([2]);
      var domain = spline.domain[0];
      var n = 21;

      var h = 1e-4;

      for (var i = 1; i < n - 1; i++) {
        var u = domain[0] + (domain[1] - domain[0]) * i / (n - 1);

        var expectedDer2 = (spline.evaluate([], u + h)[0] - 2.0 * spline.evaluate([], u)[0] + spline.evaluate([], u - h)[0]) / h / h;
        var actualDer2 = der2([], u)[0];

        t.ok(almostEqual(actualDer2, expectedDer2, 2e-3), 'second derivative at t = ' + u + ', expected: ' + expectedDer2 + ', actual: ' + actualDer2);
      }

      t.end();
    });
  });
  
  t.test('second derivative of NURBS curves', function (t) {
    t.test('of a quartic b-spline', function (t) {
      var deg = 4;
      var points = [[0], [1], [4], [2], [4], [6], [8]];
      var spline = nurbs({
        points: points,
        knots: [new Array(points.length + deg + 1).fill(0).map((d, i) => Math.sqrt(2 + i))],
        //weights: new Array(points.length).fill(0).map((d, i) => Math.pow(i + 1, 2)),
        degree: deg,
      });

      var der1 = spline.evaluator([1]);
      var der2 = spline.evaluator([2]);
      var der3 = spline.evaluator([3]);
      var der4 = spline.evaluator([4]);
      var domain = spline.domain[0];
      var samples = 3;

      var h = 1e-3;

      for (var i = 0; i < samples; i++) {
        var u = domain[0] + (domain[1] - domain[0]) * (i + 1) / (samples + 1);

        var ym2 = spline.evaluate([], u - 2 * h)[0];
        var ym = spline.evaluate([], u - h)[0];
        var y0 = spline.evaluate([], u)[0];
        var yp = spline.evaluate([], u + h)[0];
        var yp2 = spline.evaluate([], u + 2 * h)[0];

        var expectedDer1 = (yp - ym) / (2 * h);
        var actualDer1 = der1([], u)[0];

        var expectedDer2 = (yp - 2 * y0 + ym) / (h * h);
        var actualDer2 = der2([], u)[0];

        var expectedDer3 = ((yp2 - ym2) - 2 * (yp - ym)) / 2 / (h * h * h);
        var actualDer3 = der3([], u)[0];

        var expectedDer4 = (ym2 + yp2 - 4 * (yp + ym) + 6 * y0) / (h * h * h * h);
        var actualDer4 = der4([], u)[0];

        t.ok(almostEqual(actualDer1, expectedDer1, 2e-3), 'first derivative at t = ' + u + ', expected: ' + expectedDer1 + ', actual: ' + actualDer1);
        t.ok(almostEqual(actualDer2, expectedDer2, 2e-3), 'second derivative at t = ' + u + ', expected: ' + expectedDer2 + ', actual: ' + actualDer2);
        t.ok(almostEqual(actualDer3, expectedDer3, 2e-3), 'third derivative at t = ' + u + ', expected: ' + expectedDer3 + ', actual: ' + actualDer3);
        t.ok(almostEqual(actualDer4, expectedDer4, 2e-3), 'fourth derivative at t = ' + u + ', expected: ' + expectedDer4 + ', actual: ' + actualDer4);
      }

      t.end();
    });
  });
});
