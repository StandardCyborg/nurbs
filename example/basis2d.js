var gd = window.gd = document.createElement('div');
gd.style.position = 'absolute';
document.body.appendChild(gd);
require('insert-css')(`
body, head {
  margin: 0;
  padding: 0;
}
`);

var Plotly = require('plotly.js');
var nurbs = require('../nurbs');

var surface = nurbs({
  size: [5, 5],
  degree: 4,
  boundary: 'clamped'
});

var u0 = surface.domain[0][0];
var u1 = surface.domain[0][1];
var v0 = surface.domain[1][0];
var v1 = surface.domain[1][1];

var x = [];
var y = [];
var z = [];

var nu = 41;
var nv = 41;
for (var i = 0; i < nu; i++) {
  z[i] = [];
  var u = x[i] = u0 + (u1 - u0) * i / (nu - 1);
  for (var j = 0; j < nv; j++) {
    var v = y[j] = v0 + (v1 - v0) * j / (nv - 1);
    z[i][j] = surface.basis(u, v, 1, 1);
  }
}
Plotly.plot(gd, [{
  type: 'surface',
  x: x,
  y: y,
  z: z,
  colorscale: 'Viridis'
}], {
  margin: {t: 10, r: 10, b: 30, l: 40},
  width: window.innerWidth, // * 0 + 640,
  height: window.innerHeight, // * 0 + 480,
  hovermode: 'closest'
}, {
  scrollZoom: true
});
