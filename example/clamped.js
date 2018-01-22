var nurbs = require('../');

var curve = nurbs({
  points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
  degree: 2
});

console.log(curve.domain);

console.log(curve.evaluate([], 2.0));
// => [0, 0]
