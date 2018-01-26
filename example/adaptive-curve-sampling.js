var gd = window.gd = document.createElement('div');
gd.style.position = 'absolute';
document.body.appendChild(gd);
require('insert-css')('body, head {margin: 0; padding: 0;}');

var Plotly = require('plotly.js/lib/core');
var nurbs = require('../nurbs');
var isNdarray = require('../src/utils/is-ndarray');

var curve = nurbs({
  points: new Array(10).fill(0).map((d, i) => [Math.cos(i) * Math.sin(i) - 0.5, Math.sin(0.1 * i) - 0.5]),
  // [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
  degree: 2
});

function curveToTrace (c) {
  var i;
  var n = 101;
  var x = [];
  var y = [];
  var xp = [];
  var yp = [];
  var t = [];
  var pt = [];
  for (i = 0; i < c.size[0]; i++) {
    if (isNdarray(c.points)) {
      xp[i] = c.points.get(i, 0);
      yp[i] = c.points.get(i, 1);
    } else {
      xp[i] = c.points[i][0];
      yp[i] = c.points[i][1];
    }
  }
  for (i = 0; i < n; i++) {
    var d0 = c.domain[0][0];
    var d1 = c.domain[0][1];
    t[i] = d0 + (d1 - d0) * i / (n - 1);
    c.evaluate(pt, t[i]);
    x[i] = pt[0];
    y[i] = pt[1];
  }

  return [{
    x: xp,
    y: yp,
    mode: 'lines',
    line: {width: 2, color: 'rgba(50, 50, 50, 0.3)', dash: 'dash'}
  }, {
    x: x,
    y: y,
    mode: 'markers',
    text: t.map(t => 't = ' + t),
    line: {color: 'rgb(50, 110, 200)', width: 2},
    marker: {size: 4}
  }, {
    x: xp,
    y: yp,
    mode: 'markers',
    marker: {size: 10, color: 'rgb(200, 50, 150)'}
  }];
}

Plotly.plot(gd, curveToTrace(curve), {
  margin: {t: 10, r: 10, b: 30, l: 40},
  width: window.innerWidth, // * 0 + 640,
  height: window.innerHeight, // * 0 + 480,
  xaxis: {scaleanchor: 'y', scaleratio: 1},
  yaxis: {scaleratio: 1},
  showlegend: false,
  dragmode: 'pan',
  hovermode: 'closest'
}, {scrollZoom: true});
