/* eslint-disable no-new-func */

'use strict';

var transformerCache = {};
var accessorPreamble = require('./utils/accessor-preamble');
var sizeGetter = require('./utils/size-getter');
var variable = require('./utils/variable');

module.exports = function createTransform (cacheKey, nurbs, accessors, debug) {
  var i, j, iterator, iterators, terms, n, rvalue, lvalue;
  var cachedTransformer = transformerCache[cacheKey];
  if (cachedTransformer) {
    return cachedTransformer.bind(nurbs);
  }

  var code = [];
  var functionName = 'transform' + cacheKey;

  code.push('function ' + functionName + '(m) {');
  code.push('var i, w;');
  code.push(accessorPreamble(nurbs, 'x', 'this.points', nurbs.points));

  var sizeVar = variable(debug ? 'size' : 's');
  for (i = 0; i < nurbs.splineDimension; i++) {
    code.push('var ' + sizeVar(i) + ' = ' + sizeGetter(nurbs.points, 'this.points', i) + ';');
  }

  iterators = [];
  for (i = 0; i < nurbs.splineDimension; i++) {
    iterator = 'i' + i;
    iterators.push(iterator);
    code.push('for (' + iterator + ' = ' + sizeVar(i) + '- 1; ' + iterator + ' >= 0; ' + iterator + '--) {');
  }

  for (i = 0; i < nurbs.dimension; i++) {
    code.push('x' + i + ' = ' + accessors.point(iterators.concat([i])));
  }

  terms = [];
  for (i = 0; i < nurbs.dimension; i++) {
    terms.push('m[' + ((nurbs.dimension + 1) * (i + 1) - 1) + '] * x' + i);
  }
  terms.push('m[' + ((nurbs.dimension + 1) * (nurbs.dimension + 1) - 1) + ']');
  code.push('var w = (' + terms.join(' + ') + ') || 1.0;');

  for (i = 0; i < nurbs.dimension; i++) {
    terms = [];
    n = nurbs.dimension;
    for (j = 0; j < n; j++) {
      terms.push('m[' + (j * (n + 1) + i) + '] * x' + j);
    }
    terms.push('m[' + (j * (n + 1) + i) + ']');
    lvalue = accessors.point(iterators.concat([i]));
    rvalue = '(' + terms.join(' + ') + ') / w';
    code.push(lvalue + ' = ' + rvalue + ';');
  }

  for (i = nurbs.splineDimension - 1; i >= 0; i--) {
    code.push('}');
  }

  code.push('return this;');
  code.push('}');

  var transform = new Function([code.join('\n'), '; return ', functionName].join(''))();

  if (debug) console.log(code.join('\n'));

  transformerCache[cacheKey] = transform;
  return transform.bind(nurbs);
};
