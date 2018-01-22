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

var curve = nurbs({
  size: [4],
  // weights: [1, 1, 0.5, 2, 1, 1],
  // knots: [[2, 2, 2, 2, 2.5, 4.1, 6, 6, 6, 6]],
  degree: 3,
  boundary: 'closed',
  debug: true
});

var t0 = curve.domain[0][0];
var t1 = curve.domain[0][1];
var n = 301;
var t = new Array(n).fill(0).map((d, i) => t0 + (t1 - t0) * i / (n - 1));

function curveToTrace (i) {
  return {
    x: t,
    y: t.map(t => curve.basis(t, i)),
    mode: 'lines',
    showlegend: false
  };
}

var traces = new Array(curve.size[0]).fill(0).map((d, i) => curveToTrace(i));

Plotly.plot(gd, traces, {
  margin: {t: 10, r: 10, b: 30, l: 40},
  width: window.innerWidth, // * 0 + 640,
  height: window.innerHeight, // * 0 + 480,
  xaxis: {
    scaleanchor: 'y',
    scaleratio: 1
  },
  yaxis: {
    scaleanchor: 'x',
    scaleratio: 1
  },
  dragmode: 'pan',
  hovermode: 'closest'
}, {
  scrollZoom: true
});
