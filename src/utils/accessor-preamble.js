var inferType = require('./infer-type');

module.exports = function (nurbs, variableName, propertyName, data) {
  var i;
  var code = [];

  switch (inferType(data)) {
    case inferType.NDARRAY:
      code.push('  var ' + variableName + ' = ' + propertyName + '.data;');
      code.push('  var ' + variableName + 'Offset = ' + propertyName + '.offset;');

      for (i = 0; i < data.dimension; i++) {
        code.push('  var ' + variableName + 'Stride' + i + ' = ' + propertyName + '.stride[' + i + '];');
      }
      break;
    case inferType.ARRAY_OF_ARRAYS:
      code.push('  var ' + variableName + ' = ' + propertyName + ';');
  }

  return code.join('\n');
};
