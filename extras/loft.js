var uniformKnots = require('./uniform-knots');

function assert (condition, message) {
  if (!condition) throw new Error(message);
}

module.exports = function (sections, opts) {
  var i, j, section;

  opts = opts || {};
  var degree = opts.degree === undefined ? 2 : opts.degree;
  var boundary = opts.boundary === undefined ? 'clamped' : opts.boundary;

  // Validate comatibility of sections
  assert(sections, 'Expected list of sections for loft');
  assert(sections.length > 1, 'Loft requires more than one section');

  var firstSection = sections[0];
  var sectionDegree = firstSection.degree[0];
  var sectionBoundary = firstSection.boundary[0];
  var sectionSize = firstSection.size[0];
  var hasWeights = false;
  var loft = {};

  for (i = 0; i < sections.length; i++) {
    section = sections[i];
    assert(section.curveDimension === 1, 'Loft only supports one-dimensional curve sections');
    assert(section.degree[0] === sectionDegree, 'Loft sections must have the same degree');
    assert(section.boundary[0] === sectionBoundary, 'Loft sections must have the same boundary condition');
    assert(section.size[0] === sectionSize, 'Loft sections must have the same number of points');

    if (section.knots && !loft.knots) {
      loft.knots = [
        uniformKnots([], sections.length, degree),
        section.knots[0]
      ];
    }

    if (section.weights) {
      hasWeights = true;
    }
  }

  loft.points = [];
  if (hasWeights) {
    loft.weights = [];
  }
  for (i = 0; i < sections.length; i++) {
    section = sections[i];
    loft.points[i] = [];
    for (j = 0; j < section.points.length; j++) {
      loft.points[i][j] = section.points[j];
    }
    if (hasWeights) {
      loft.weights[i] = [];
      for (j = 0; j < section.points.length; j++) {
        loft.weights[i][j] = section.weights[j];
      }
    }
  }

  loft.degree = [degree, sectionDegree];
  loft.boundary = [boundary, sectionBoundary];

  console.log('loft:', loft);

  return loft;
};
