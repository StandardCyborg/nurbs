'use strict';

var inferType = require('./infer-type');
var createVariable = require('./variable');

function wrapAccessor (callback) {
  return function (i, period) {
    if (i !== undefined && !Array.isArray(i)) i = [i];
    var dimAccessors = [];
    for (var j = 0; j < i.length; j++) {
      dimAccessors.push(createVariable.sum(i[j]));
    }
    if (period) {
      for (i = 0; i < dimAccessors.length; i++) {
        if (period[i] === undefined) continue;
        dimAccessors[i] = '(' + dimAccessors[i] + ' + ' + period[i] + ') % ' + period[i];
      }
    }
    return callback(dimAccessors);
  };
}

function createAccessor (name, data) {
  var i;
  if (!data) return undefined;
  switch (inferType(data)) {
    case inferType.ARRAY_OF_ARRAYS:
      return wrapAccessor(function (accessors) {
        return name + '[' + accessors.join('][') + ']';
      });
    case inferType.GENERIC_NDARRAY:
      return wrapAccessor(function (accessors) {
        return name + '.get(' + accessors.join(',') + ')';
      });
    case inferType.NDARRAY:
      return wrapAccessor(function (accessors) {
        var code = [name + 'Offset'];
        for (i = 0; i < accessors.length; i++) {
          code.push(name + 'Stride' + i + ' * (' + accessors[i] + ')');
        }
        return name + '[' + code.join(' + ') + ']';
      });
    case inferType.PACKED:
    default:
      return undefined;
  }
}

module.exports = function (nurbs) {
  var accessors = {};
  var accessor;

  accessor = createAccessor('x', nurbs.points);
  if (accessor) accessors.point = accessor;

  accessor = createAccessor('w', nurbs.weights);
  if (accessor) accessors.weight = accessor;

  accessor = createAccessor('k', nurbs.knots);
  if (accessor) accessors.knot = accessor;

  return accessors;
};
