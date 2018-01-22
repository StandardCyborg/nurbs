/* eslint-disable no-new-func */

'use strict';

var ndloop = require('./utils/ndloop');
var variable = require('./utils/variable');
var accessorPreamble = require('./utils/accessor-preamble');
var inferType = require('./utils/infer-type');
var isArrayLike = require('./utils/is-array-like');

var supportCache = {};

module.exports = function (cacheKey, nurbs, accessors, debug, checkBounds) {
  var cachedSupport = supportCache[cacheKey];
  if (cachedSupport) {
    return cachedSupport.bind(nurbs);
  }

  var degree = nurbs.degree;
  var knots = nurbs.knots;
  var splineDimension = nurbs.splineDimension;
  var boundary = nurbs.boundary;

  var i, n, d;
  var code = [];
  var functionName = 'support' + cacheKey;

  var knotAccessor = accessors.knot;

  var tVar = variable('t');
  var domainVar = debug ? 'domain' : 'd';
  var sizeVar = variable(debug ? 'size' : 's');
  var knotIndex = variable(debug ? 'knotIndex' : 'i');

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

  var parameterArgs = [];
  for (i = 0; i < splineDimension; i++) {
    parameterArgs.push(tVar([i]));
  }

  code.push('function ' + functionName + ' (out, ' + parameterArgs.join(', ') + ') {');

  var c = 0;
  function pushSupport (args, period) {
    if (period === undefined) {
      line('out[' + (c++) + '] = ' + args.join(' + ') + ';');
    } else {
      line('out[' + (c++) + '] = (' + args.join(' + ') + ' + ' + period + ') % ' + period + ';');
    }
  }

  line('var h, m;');
  line('var c = 0;');

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
    line('var ' + sizeVar(d) + ' = this.size[' + d + '];');
  }

  if (!allDimensionUniform) {
    code.push(accessorPreamble(nurbs, 'k', 'this.knots', knots));
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
      line('var ' + knotIndex(d) + ' = 0;');
      line('h = ' + sizeVar(d) + ';');
      line('while(h > ' + knotIndex(d) + ' + 1) {');
      line('  m = 0.5 * (h + ' + knotIndex(d) + ') | 0;');
      line('  if (' + knotAccessor([d, 'm']) + ' > ' + tVar(d) + ') h = m;');
      line('  else ' + knotIndex(d) + ' = m;');
      line('}');
    } else {
      if (boundary[d] === 'closed') {
        line(knotIndex(d) + ' = (' + tVar(d) + ' | 0) % ' + sizeVar(d) + ';');
      } else {
        line(knotIndex(d) + ' = (' + tVar(d) + ' | 0);');
        line('if (' + knotIndex(d) + ' < ' + degree[d] + ') ' + knotIndex(d) + ' = ' + degree[d] + ';');
        line('if (' + knotIndex(d) + ' > ' + sizeVar(d) + ' - 1) ' + knotIndex(d) + ' = ' + sizeVar(d) + ' - 1;');
      }
    }
  }

  for (d = 0, n = []; d < splineDimension; d++) {
    n[d] = degree[d] + 1;
  }

  ndloop(n, function (dst) {
    var readIdx = [];
    var period = [];
    for (var d = 0; d < splineDimension; d++) {
      readIdx[d] = [knotIndex(d), dst[d] - degree[d]];
      if (boundary[d] === 'closed' && dst[d] - degree[d] < 0) period[d] = sizeVar(d);
    }
    for (d = 0; d < splineDimension; d++) {
      pushSupport(readIdx[d], period[d]);
    }
  });

  line('out.length = ' + c + ';');

  line('return out;');
  code.push('}');

  if (debug) console.log(code.join('\n'));

  var evaluator = new Function([code.join('\n'), '; return ', functionName].join(''))();
  supportCache[cacheKey] = evaluator;
  return evaluator.bind(nurbs);
};
