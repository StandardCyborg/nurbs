'use strict';

var inferType = require('./src/utils/infer-type');
var computeCacheKey = require('./src/utils/cache-key');
var isNdarray = require('./src/utils/is-ndarray');
var createAccessors = require('./src/utils/create-accessors');
var numericalDerivative = require('./src/numerical-derivative');
var isArrayLike = require('./src/utils/is-array-like');

var createEvaluator = require('./src/evaluate');
var createTransform = require('./src/transform');
var createSupport = require('./src/support');

var BOUNDARY_TYPES = {
  open: 'open',
  closed: 'closed',
  clamped: 'clamped'
};

function isBlank (x) {
  return x === undefined || x === null;
}

// Evaluate Non-Uniform Rational B-Splines (NURBS)
// @param points {Array} - data array
// @param degree {Array} - spline curve degree
// @param knots {Array} - knot vector
// @param weights {Array} - weight vector
// @param opts {object} - additional options
function nurbs (points, degree, knots, weights, boundary, opts) {
  var debug, cacheKey, checkBounds;

  function parseNURBS (points, degree, knots, weights, boundary, opts) {
    var i, dflt;
    var self = parseNURBS;

    if (points && !isArrayLike(points) && !isNdarray(points)) {
      opts = points;
      debug = !!points.debug;
      checkBounds = !!points.checkBounds;
      self.weights = points.weights;
      self.knots = points.knots;
      self.degree = points.degree;
      self.boundary = points.boundary;
      self.points = points.points;
      self.size = points.size;
    } else {
      opts = opts || {};
      self.weights = weights;
      self.knots = knots;
      self.degree = degree;
      self.points = points;
      self.boundary = boundary;
      self.size = opts.size;
      debug = !!opts.debug;
      checkBounds = !!opts.checkBounds;
    }

    var pointType = inferType(self.points);
    var weightType = inferType(self.weights);
    var knotType = inferType(self.knots);

    if (self.points) {
      //
      // Sanitize the points
      //
      self.size = [];
      switch (pointType) {
        case inferType.GENERIC_NDARRAY:
        case inferType.NDARRAY:
          self.size = self.points.shape.slice(0, self.points.shape.length - 1);
          self.splineDimension = self.points.shape.length - 1;
          self.dimension = self.points.shape[self.points.shape.length - 1];
          break;

        case inferType.ARRAY_OF_ARRAYS:
          // Follow the zeroth entries until we hit something that's not an array
          self.splineDimension = 0;
          self.size.length = 0;
          for (var ptr = self.points; isArrayLike(ptr[0]); ptr = ptr[0]) {
            self.splineDimension++;
            self.size.push(ptr.length);
          }
          if (self.splineDimension === 0) {
            throw new Error('Expected an array of points');
          }
          self.dimension = ptr.length;
          break;
        case inferType.PACKED:
        default:
          throw new Error('Expected either a packed array, array of arrays, or ndarray of points');
      }
    } else {
      if (self.size === undefined || self.size === null) {
        throw new Error('Either points or a control hull size must be provided.');
      }
      if (!isArrayLike(self.size)) {
        self.size = [self.size];
      }
      if (self.size.length === 0) {
        throw new Error('`size` must be a number or an array of length at least one.');
      }

      self.splineDimension = self.size.length;
      self.dimension = 0;
    }

    //
    // Sanitize the degree into an array
    //
    if (isArrayLike(self.degree)) {
      for (i = 0; i < self.splineDimension; i++) {
        if (isBlank(self.degree[i])) {
          throw new Error('Missing degree in dimension ' + (i + 1));
        }
      }
    } else {
      var hasBaseDegree = !isBlank(self.degree);
      var baseDegree = isBlank(self.degree) ? 2 : self.degree;
      self.degree = [];
      for (i = 0; i < self.splineDimension; i++) {
        if (self.size[i] <= baseDegree) {
          if (hasBaseDegree) {
            throw new Error('Expected at least ' + (baseDegree + 1) + ' points for degree ' + baseDegree + ' spline in dimension ' + (i + 1) + ' but got only ' + self.size[i]);
          } else {
            self.degree[i] = self.size[i] - 1;
          }
        } else {
          self.degree[i] = baseDegree;
        }
      }
    }

    //
    // Sanitize boundaries
    //
    dflt = (typeof self.boundary !== 'string') ? 'open' : self.boundary;
    if (!BOUNDARY_TYPES[dflt]) {
      throw new Error('Boundary type must be one of ' + Object.keys(BOUNDARY_TYPES) + '. Got ' + dflt);
    }
    self.boundary = isArrayLike(self.boundary) ? self.boundary : [];
    self.boundary.length = self.splineDimension;
    for (i = 0; i < self.splineDimension; i++) {
      self.boundary[i] = isBlank(self.boundary[i]) ? dflt : self.boundary[i];

      if (!BOUNDARY_TYPES[dflt]) {
        throw new Error('Boundary type must be one of ' + Object.keys(BOUNDARY_TYPES) + '. Got ' + dflt + ' for dimension ' + (i + 1));
      }
    }

    //
    // Sanitize knots
    //
    switch (knotType) {
      case inferType.ARRAY_OF_ARRAYS:
        // Wrap flat arrays in an array so that curves are more natural
        if (isArrayLike(self.knots) && self.knots.length > 0 && !isArrayLike(self.knots[0])) {
          self.knots = [self.knots];
        }

        for (i = 0; i < self.splineDimension; i++) {
          if (self.size[i] <= self.degree[i]) {
            throw new Error('Expected at least ' + (self.degree[i] + 1) + ' points in dimension ' + (i + 1) + ' but got ' + self.size[i] + '.');
          }

          if (isArrayLike(self.knots[i])) {
            if (self.boundary[i] !== 'closed' && self.knots[i].length !== self.degree[i] + self.size[i] + 1) {
              throw new Error('Expected ' + (self.degree[i] + self.size[i] + 1) + ' knots in dimension ' + (i + 1) + ' but got ' + self.knots[i].length + '.');
            } else if (self.boundary[i] === 'closed' && self.knots[i].length !== self.size[i] + 1) {
              // Fudge factor allowance for just ignoring extra knots. This makes some allowance
              // for passing regular clamped/open spline knots to a closed spline by ignoring extra
              // knots instead of simply truncating.
              var canBeFudged = self.knots[i].length === self.size[i] + self.degree[i] + 1;
              if (!canBeFudged) {
                throw new Error('Expected ' + (self.size[i] + 1) + ' knots for closed spline in dimension ' + (i + 1) + ' but got ' + self.knots[i].length + '.');
              }
            }
          }
        }
        break;
      case inferType.NDARRAY:
        break;
    }

    //
    // Create evaluator
    //
    var newCacheKey = computeCacheKey(self, debug, checkBounds, pointType, weightType, knotType);

    if (newCacheKey !== cacheKey) {
      cacheKey = newCacheKey;

      var accessors = createAccessors(self);

      self.evaluate = createEvaluator(cacheKey, self, accessors, debug, checkBounds);
      self.transform = createTransform(cacheKey, self, accessors, debug);
      self.support = createSupport(cacheKey, self, accessors, debug, checkBounds);

      self.basisEvaluator = function () {
        return createEvaluator(cacheKey, self, accessors, debug, checkBounds, true);
      };

      self.derivativeEvaluator = function (order, dimension) {
        if (order !== 1) {
          throw new Error('Analytical derivative not implemented for order n = ' + order + '.');
        }
        return createEvaluator(cacheKey, self, accessors, debug, checkBounds, false, order, dimension);
      };
    }

    self.numericalDerivative = numericalDerivative.bind(self);

    return self;
  }

  Object.defineProperty(parseNURBS, 'domain', {
    get: function () {
      var ret = [];
      for (var d = 0; d < this.splineDimension; d++) {
        var p = this.degree[d];
        var isClosed = this.boundary[d] === 'closed';
        if (this.knots && this.knots[d]) {
          var k = this.knots[d];
          ret[d] = [k[isClosed ? 0 : p], k[this.size[d]]];
        } else {
          ret[d] = [isClosed ? 0 : p, this.size[d]];
        }
      }
      return ret;
    }
  });

  return parseNURBS(points, degree, knots, weights, boundary, opts);
}

module.exports = nurbs;
