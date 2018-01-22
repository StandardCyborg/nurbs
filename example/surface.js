var gd = document.createElement('div');
gd.style.position = 'absolute';
document.body.appendChild(gd);
gd.addEventListener('mousewheel', e => e.preventDefault(), false);

var Plotly = require('plotly.js');
var nurbs = require('../nurbs');
// var shapes = require('../src/shapes');

var curve = window.curve = nurbs({
  /* points: [
    [[-0.2, 0], [0.3, 0.3], [1, 0.4], [2, 0.4]],
    [[-0.2, 0.6], [0.2, 1.0], [0.8, 1.2], [2.0, 1.4]],
    [[-0.5, 1.5], [-0.2, 1.8], [0.4, 2.2], [1.4, 2.4]],
    [[-0.9, 1.8], [-0.8, 2.2], [-0.4, 2.8], [0.0, 3.2]],
    [[-1.2, 1.8], [-1.2, 2.2], [-1.2, 2.8], [-1.2, 3.2]],
  ], */
  /* weights: [
    [1, 1, 1, 1],
    [1, 0.5, 0.5, 1],
    [1, 0.5, 0.5, 1],
    [1, 0.5, 0.5, 1],
    [1, 1, 1, 1]
  ], */
  // knots: [
    // [0, 0, 0, 0, 0.5, 1, 1, 1, 1],
    // [0, 0, 0, 1, 1, 1],
  // ],
  points: [
    [[1, 0], [1, 1], [0, 1]],
    [[2, 0], [2, 2], [0, 2]]
  ],
  weights: [
    [1, 0.707, 1],
    [1, 0.707, 1]
  ],
  degree: [1, 2],
  debug: true
});

var i, j;
var x = [];
var y = [];
var xp = [];
var yp = [];
var p = [];
for (i = 0; i < curve.points.length; i++) {
  for (j = 0; j < curve.points[0].length; j++) {
    xp.push(curve.points[i][j][0]);
    yp.push(curve.points[i][j][1]);
  }
  xp.push(undefined);
  yp.push(undefined);
}
for (j = 0; j < curve.points[0].length; j++) {
  for (i = 0; i < curve.points.length; i++) {
    xp.push(curve.points[i][j][0]);
    yp.push(curve.points[i][j][1]);
  }
  xp.push(undefined);
  yp.push(undefined);
}
var l = 21;
var m = 31;

var n = 21;
for (i = 0; i < l; i++) {
  for (j = 0; j < n; j++) {
    p = curve.evaluate(p, i / (l - 1), j / (n - 1));
    x.push(p[0]);
    y.push(p[1]);
  }
  x.push(undefined);
  y.push(undefined);
}
for (j = 0; j < m; j++) {
  for (i = 0; i < n; i++) {
    curve.evaluate(p, i / (n - 1), j / (m - 1));
    x.push(p[0]);
    y.push(p[1]);
  }
  x.push(undefined);
  y.push(undefined);
}

Plotly.plot(gd, [{
  type: 'scattergl',
  x: x,
  y: y,
  mode: 'lines',
  hoverinfo: 'skip',
  line: {color: 'rgba(180, 50, 80, 0.5)', width: 1},
  marker: {size: 4}
}, {
  type: 'scattergl',
  x: xp,
  y: yp,
  mode: 'lines+markers',
  marker: {size: 10, color: 'rgb(50, 80, 180)'},
  line: {width: 2, color: 'rgba(50, 80, 180, 0.8)', dash: 'dash'}
}], {
  margin: {t: 20, r: 20, b: 30, l: 30},
  width: window.innerWidth,
  height: window.innerHeight,
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
