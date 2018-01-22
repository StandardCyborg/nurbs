'use strict';

module.exports = function isArrayLike (data) {
  return Array.isArray(data) || ArrayBuffer.isView(data);
};
