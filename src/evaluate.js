/* eslint-disable no-new-func */

'use strict';

var ndloop = require('./utils/ndloop');
var variable = require('./utils/variable');
var accessorPreamble = require('./utils/accessor-preamble');
var inferType = require('./utils/infer-type');
var isArrayLike = require('./utils/is-array-like');
var sizeGetter = require('./utils/size-getter');

var evaluatorCache = {};
var codeCache = {};

module.exports = function (cacheKey, nurbs, accessors, debug, checkBounds, isBasis, derivative) {
  var splineDimension = nurbs.splineDimension;
  var i, j, n, m, d, kvar;

  var points = nurbs.points;
  var degree = nurbs.degree;
  var weights = nurbs.weights;
  var hasWeights = weights !== undefined;
  var knots = nurbs.knots;
  var spaceDimension = nurbs.dimension;
  var boundary = nurbs.boundary;

  if (derivative !== undefined && derivative !== null) {
    if (!Array.isArray(derivative)) {
      derivative = [derivative];
    }
    var totalDerivativeOrder = 0;
    for (i = 0; i < splineDimension; i++) {
      if (derivative[i] === undefined) derivative[i] = 0;
      totalDerivativeOrder += derivative[i];
    }
    //if (hasWeights && totalDerivativeOrder > 1) {
      //throw new Error('Analytical derivative not implemented for rational b-splines with order n = ' + totalDerivativeOrder + '.');
    //}
  }

  if (isBasis) cacheKey = 'Basis' + cacheKey;
  if (derivative) cacheKey = 'Der' + derivative.join('_') + '_' + cacheKey;
  var cachedEvaluator = evaluatorCache[cacheKey];
  if (debug) {
    var logger = typeof debug === 'function' ? debug : console.log;
  }

  if (cachedEvaluator) {
    if (debug) {
      logger(codeCache[cacheKey]);
    }

    return cachedEvaluator.bind(nurbs);
  }

  var code = [];
  var functionName = 'evaluate' + cacheKey;

  var pointAccessor = accessors.point;
  if (isBasis) {
    pointAccessor = function (src, period) {
      var terms = [];
      for (var i = 0; i < src.length; i++) {
        var accessor = src[i];
        var terms2 = [];
        for (var j = 0; j < accessor.length; j++) {
          if (accessor[j] !== 0) terms2.push(accessor[j]);
        }
        accessor = terms2.join(' + ');
        if (period[i]) {
          accessor = '(' + accessor + ' + ' + period[i] + ') % ' + period[i];
        }
        terms.push(accessor + ' === ' + indexVar(i));
      }
      return '((' + terms.join(' && ') + ') ? 1 : 0)';
    };
  }
  var weightAccessor = accessors.weight;
  var knotAccessor = accessors.knot;

  var knotVar = variable('k');
  var pointVar = variable('x');
  var weightVar = variable('w');
  var indexVar = variable('i');
  var tVar = variable('t');
  var domainVar = debug ? 'domain' : 'd';
  var sizeVar = variable(debug ? 'size' : 's');
  var knotIndex = variable(debug ? 'knotIndex' : 'j');

  var allDimensionUniform = true;
  for (d = 0; d < splineDimension; d++) {
    if (isArrayLike(knots) && isArrayLike(knots[d])) {
      allDimensionUniform = false;
    }
  }

  // Just to indent properly and save lots of typing
  function line (str) {
    code.push('  ' + (str || ''));
  }
  function debugLine (str) {
    if (debug) line(str);
  }
  //function clog (str) {
    //if (debug) code.push('console.log("' + str + ' =", ' + str + ');');
  //}

  if (isBasis) {
    var indexArgs = [];
  }
  var parameterArgs = [];
  for (i = 0; i < splineDimension; i++) {
    if (isBasis) {
      indexArgs.push(indexVar([i]));
    }
    parameterArgs.push(tVar([i]));
  }

  code.push('function ' + functionName + ' (' +
    (isBasis ? '' : 'out, ') +
    parameterArgs.join(', ') +
    (isBasis ? ', ' + indexArgs.join(', ') : '') +
    ') {');

  line('var h, m, a, b;');

  if (checkBounds) {
    line('var ' + domainVar + ' = this.domain;');
    line('for (var i = 0; i < this.splineDimension; i++) {');
    line('  a = arguments[i + 1];');
    line('  if (a < ' + domainVar + '[i][0] || a > ' + domainVar + '[i][1] || a === undefined || isNaN(a)) {');
    line('    throw new Error(\'Invalid Spline parameter in dimension \'+i+\'. Valid domain is [\'+' + domainVar + '[i][0]+\', \'+' + domainVar + '[i][1]+\']. but got t\'+i+\' = \'+arguments[i + 1]+\'.\');');
    line('  }');
    line('}');
  }

  for (d = 0; d < splineDimension; d++) {
    line('var ' + sizeVar(d) + ' = ' + sizeGetter(points, 'this.points', d) + ';');
  }
  code.push(accessorPreamble(nurbs, 'x', 'this.points', points));

  if (hasWeights) {
    code.push(accessorPreamble(nurbs, 'w', 'this.weights', weights));
  }

  if (!allDimensionUniform) {
    code.push(accessorPreamble(nurbs, 'k', 'this.knots', knots));
  }

  function ternary (cond, a, b) {
    return '(' + cond + ') ? (' + a + ') : (' + b + ')';
  }

  var hasKnots = [];
  for (d = 0; d < splineDimension; d++) {
    switch (inferType(knots)) {
      case inferType.NDARRAY:
        hasKnots[d] = true;
        break;
      case inferType.ARRAY_OF_ARRAYS:
        hasKnots[d] = isArrayLike(knots[d]);
        break;
    }
  }

  for (d = 0; d < splineDimension; d++) {
    if (hasKnots[d]) {
      //
      // LOCATE KNOTS
      //
      debugLine('\n  // Bisect to locate the knot interval in dimension ' + d + '\n');
      line('var ' + knotIndex(d) + ' = 0;');
      line('h = ' + sizeVar(d) + ';');
      line('while(h > ' + knotIndex(d) + ' + 1) {');
      line('  m = 0.5 * (h + ' + knotIndex(d) + ') | 0;');
      line('  if (' + knotAccessor([d, 'm']) + ' > ' + tVar(d) + ') h = m;');
      line('  else ' + knotIndex(d) + ' = m;');
      line('}');

      debugLine('\n  // Fetch knots for dimension ' + d + '\n');

      for (i = -degree[d] + 1; i <= degree[d]; i++) {
        if (boundary[d] === 'closed') {
          if (i < 0) {
            // line('var ' + knotVar([d, i + degree[d] - 1]) + ' = ' + knotAccessor([d, [knotIndex(d), i]]) + ';');
            // EDIT THIS SECTION
            line('var ' + knotVar([d, i + degree[d] - 1]) + ' = ' + ternary(
              knotIndex(d) + ' < ' + (-i),
              knotAccessor([d, 0]) + ' + ' + knotAccessor([d, [sizeVar(d), knotIndex(d), i]]) + ' - ' + knotAccessor([d, [sizeVar(d)]]),
              knotAccessor([d, [knotIndex(d), i]])
            ) + ';');
          } else if (i > 0) {
            line('var ' + knotVar([d, i + degree[d] - 1]) + ' = ' + ternary(
              knotIndex(d) + ' + ' + i + ' > ' + sizeVar(d),
              // knotAccessor([d, sizeVar(d)]) + ' + ' + knotAccessor([d, i]) + ' - ' + knotAccessor([d, 0]),
              knotAccessor([d, sizeVar(d)]) + ' + ' + knotAccessor([d, i + ' + ' + knotIndex(d) + ' - ' + sizeVar(d)]) + ' - ' + knotAccessor([d, 0]),
              knotAccessor([d, [knotIndex(d), i]])
            ) + ';');
          } else {
            line('var ' + knotVar([d, i + degree[d] - 1]) + ' = ' + knotAccessor([d, [knotIndex(d), i]]) + ';');
          }
        } else {
          line('var ' + knotVar([d, i + degree[d] - 1]) + ' = ' + knotAccessor([d, [knotIndex(d), i]]) + ';');
        }
      }
    } else {
      //
      // UNIFORM B-SPLINE
      //
      debugLine('\n  // Directly compute knot interval for dimension ' + d + '\n');

      if (boundary[d] === 'closed') {
        line(knotIndex(d) + ' = (' + tVar(d) + ' | 0) % ' + sizeVar(d) + ';');
      } else {
        line(knotIndex(d) + ' = (' + tVar(d) + ' | 0);');
        line('if (' + knotIndex(d) + ' < ' + degree[d] + ') ' + knotIndex(d) + ' = ' + degree[d] + ';');
        line('if (' + knotIndex(d) + ' > ' + sizeVar(d) + ' - 1) ' + knotIndex(d) + ' = ' + sizeVar(d) + ' - 1;');
      }

      debugLine('\n  // Compute and clamp knots for dimension ' + d + '\n');
      for (i = -degree[d] + 1; i <= degree[d]; i++) {
        kvar = knotVar([d, i + degree[d] - 1]);
        line('var ' + kvar + ' = ' + knotIndex(d) + ' + ' + (i) + ';');
      }

      if (boundary[d] === 'clamped') {
        for (i = -degree[d] + 1; i <= degree[d]; i++) {
          kvar = knotVar([d, i + degree[d] - 1]);
          if (i < 0) {
            line('if (' + kvar + ' < ' + degree[d] + ') ' + kvar + ' = ' + degree[d] + ';');
          }
          if (i > 0) {
            line('if (' + kvar + ' > ' + sizeVar(d) + ') ' + kvar + ' = ' + sizeVar(d) + ';');
          }
        }
      }

      if (boundary[d] === 'closed') {
        debugLine('\n  // Wrap the B-Spline parameter for closed boundary');
        line(tVar(d) + ' %= ' + sizeVar(d) + ';');
      }
    }
  }

  for (d = 0, n = []; d < splineDimension; d++) {
    n[d] = degree[d] + 1;
  }

  if (hasWeights) {
    debugLine('\n  // Fetch weights\n');
    ndloop(n, function (dst) {
      var readIdx = [];
      var period = [];
      for (var d = 0; d < splineDimension; d++) {
        readIdx[d] = [knotIndex(d), dst[d] - degree[d]];
        if (boundary[d] === 'closed' && dst[d] - degree[d] < 0) period[d] = sizeVar(d);
      }
      line('var ' + weightVar(dst) + ' = ' + weightAccessor(readIdx, period) + ';');
    });
  }

  if (debug) {
    if (hasWeights) {
      line('\n  // Fetch points and project into homogeneous (weighted) coordinates\n');
    } else {
      line('\n  // Fetch points\n');
    }
  }

  ndloop(n, function (dst) {
    var readIdx = [];
    var period = [];
    for (var d = 0; d < splineDimension; d++) {
      readIdx[d] = [knotIndex(d), dst[d] - degree[d]];
      if (boundary[d] === 'closed' && dst[d] - degree[d] < 0) period[d] = sizeVar(d);
    }
    if (isBasis) {
      if (hasWeights) {
        line('var ' + pointVar(dst) + ' = ' + pointAccessor(readIdx, period) + ' * ' + weightVar(dst) + ';');
      } else {
        line('var ' + pointVar(dst) + ' = ' + pointAccessor(readIdx, period) + ';');
      }
    } else {
      for (d = 0; d < spaceDimension; d++) {
        var dstWithDim = dst.concat(d);
        readIdx[splineDimension] = d;
        if (hasWeights) {
          line('var ' + pointVar(dstWithDim) + ' = ' + pointAccessor(readIdx, period) + ' * ' + weightVar(dst) + ';');
        } else {
          line('var ' + pointVar(dstWithDim) + ' = ' + pointAccessor(readIdx, period) + ';');
        }
      }
    }
  });
  debugLine('\n');

  debugLine('// Perform De Boor\'s algorithm');
  for (d = n.length - 1; d >= 0; d--) {
    n[d] = [degree[d], degree[d] + 1];
    for (i = 0; i < degree[d]; i++) {
      debugLine('\n  // Degree ' + degree[d] + ' evaluation in dimension ' + d + ', step ' + (i + 1) + '\n');
      for (j = degree[d]; j > i; j--) {
        /*if (derivative) {
          console.log('derivative, degree[d], i:', derivative, degree[d], i);
          console.log('degree[d] - i - derivative[d]:', degree[d] - i - derivative[d]);
        }*/
        var isDerivative = derivative && (degree[d] - i - derivative[d] <= 0);

        if (isDerivative) {
          line('m = 1 / (' + knotVar([d, j - i + degree[d] - 1]) + ' - ' + knotVar([d, j - 1]) + ');');
          if (hasWeights) {
            line('a = (' + tVar(d) + ' - ' + knotVar([d, j - 1]) + ') * m;');
            line('b = 1 - a;');
          }
        } else {
          line('a = (' + tVar(d) + ' - ' + knotVar([d, j - 1]) + ') / (' + knotVar([d, j - i + degree[d] - 1]) + ' - ' + knotVar([d, j - 1]) + ');');
          line('b = 1 - a;');
        }

        if (hasWeights) {
          ndloop(n, function (ii) {
            var ij = ii.slice();
            var ij1 = ii.slice();
            ij[d] = j;
            ij1[d] = j - 1;
            if (isDerivative && hasWeights) line('h = ' + weightVar(ij) + ';');
            line(weightVar(ij) + ' = b * ' + weightVar(ij1) + ' + a * ' + weightVar(ij) + ';');
          });
        }
        ndloop(n, function (ii) {
          var weightFactor, pt1, pt2;
          var ij = ii.slice();
          var ij1 = ii.slice();
          // Replace the dimension being interpolated with the interpolation indices
          ij[d] = j;
          ij1[d] = j - 1;
          // Create a version to which we can append the dimension when we loop over spatial dimension
          if (isDerivative) {
            var derivCoeff = i + 1;
            if (isBasis) {
              weightFactor = hasWeights ? 'h * ' + weightVar(ij1) + ' / ' + weightVar(ij) + ' * ' : '';
              pt1 = pointVar(ij) + (hasWeights ? ' / h' : '');
              pt2 = pointVar(ij1) + (hasWeights ? ' / ' + weightVar(ij1) : '');
              line(pointVar(ij) + ' = ' + derivCoeff + ' * ' + weightFactor + '(' + pt1 + ' - ' + pt2 + ') * m;');
            } else {
              var ijWithDimension = ij.slice();
              var ij1WithDimension = ij1.slice();
              for (m = 0; m < spaceDimension; m++) {
                ijWithDimension[splineDimension] = ij1WithDimension[splineDimension] = m;
                //if (i === degree[d] - 1) {
                  //weightFactor = hasWeights ? 'h * ' + weightVar(ij1) + ' / (' + weightVar(ij) + ' * '+weightVar(ij)+') * ' : '';
                //} else {
                  weightFactor = hasWeights ? 'h * ' + weightVar(ij1) + ' / ' + weightVar(ij) +' * ' : '';
                //}
                pt1 = pointVar(ijWithDimension) + (hasWeights ? ' / h' : '');
                pt2 = pointVar(ij1WithDimension) + (hasWeights ? ' / ' + weightVar(ij1) : '');
                line(pointVar(ijWithDimension) + ' = ' + derivCoeff + ' * ' + weightFactor + '(' + pt1 + ' - ' + pt2 + ') * m;');
              }
            }
          } else {
            if (isBasis) {
              line(pointVar(ij) + ' = b * ' + pointVar(ij1) + ' + a * ' + pointVar(ij) + ';');
            } else {
              for (m = 0; m < spaceDimension; m++) {
                ij[splineDimension] = ij1[splineDimension] = m;
                line(pointVar(ij) + ' = b * ' + pointVar(ij1) + ' + a * ' + pointVar(ij) + ';');
              }
            }
          }
        });
        debugLine('\n');
      }
    }
  }

  if (debug) {
    if (hasWeights) {
      line('\n  // Project back from homogeneous coordinates and return final output\n');
    } else {
      line('\n  // Return final output\n');
    }
  }
  if (isBasis) {
    if (hasWeights) {
      line('return ' + pointVar(degree) + ' / ' + weightVar(degree) + ';');
    } else {
      line('return ' + pointVar(degree) + ';');
    }
  } else {
    for (d = 0; d < spaceDimension; d++) {
      if (hasWeights) {
        line('out[' + d + '] = ' + pointVar(degree.concat([d])) + ' / ' + weightVar(degree) + ';');
      } else {
        line('out[' + d + '] = ' + pointVar(degree.concat([d])) + ';');
      }
    }
  }
  if (!isBasis) {
    line('return out;');
  }
  code.push('}');

  if (debug) {
    var codeStr = code.join('\n');
    logger(codeStr);

    codeCache[cacheKey] = codeStr;
  }

  var evaluator = new Function([code.join('\n'), '; return ', functionName].join(''))();
  evaluatorCache[cacheKey] = evaluator;
  return evaluator.bind(nurbs);
};
