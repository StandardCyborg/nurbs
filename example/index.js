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
var pack = require('ndarray-pack');
var isNdarray = require('../src/utils/is-ndarray');
// var mat3 = require('gl-mat3');
var arc = require('../extras/arc');
var circle = require('../extras/circle');
var curve;

switch (9) {
  case 1:
    curve = nurbs({
      points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
      degree: 2
    });
    break;
  case 2:
    curve = nurbs({
      points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
      degree: 2,
      boundary: 'open'
    });
    break;
  case 3:
    curve = nurbs({
      points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
      degree: 2,
      boundary: 'closed'
    });
    break;
  case 4:
    curve = nurbs({
      points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
      weights: [0.5, 4, 1, 0.5],
      knots: [[0, 1, 3, 7, 15]],
      boundary: 'closed',
      degree: 2
    });
    break;
  case 5:
    curve = nurbs({
      points: [[-1, 0], [-0.5, 0.5], [0.5, -0.5], [1, 0]],
      weights: [0.5, 4, 1, 0.5],
      boundary: 'closed',
      degree: 2
    });
    break;
  case 6:
    curve = nurbs(circle(5, false));
    break;
  case 7:
    curve = nurbs(arc(0, 5));
    break;
  case 8:
    var n = 6;
    curve = nurbs({
      points: pack(new Array(n).fill(0).map((d, i) => [
        Math.cos(i / n * Math.PI * 2) * n / (n - 1),
        Math.sin(i / n * Math.PI * 2) * n / (n - 1)
      ])),
      degree: 3,
      boundary: 'closed'
    });
    break;
  case 9:
    curve = nurbs({
      points: [
        [1, 1],
        [1.5, 1],
        [3, 1],
        [4.5, 2.5],
        [5, 3]
      ],
      degree: 2,
      knots: [[2, 2, 2, 3.5, 5, 6.5, 6.5, 6.5]]
    });
    break;
}

console.log('curve.domain:', curve.domain);

// var m = mat3.identity([]);
// mat3.translate(m, m, [3, 2, 0]);
// mat3.rotate(m, m, Math.PI * 0.5);
// curve.transform(m);

// console.log(curve.evaluate([], curve.domain[0][0]));

curve(Object.assign(curve, {debug: false}));

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

  return [/* {
    x: xp,
    y: yp,
    mode: 'lines',
    line: {width: 2, color: 'rgba(200, 50, 150, 0.7)', dash: 'dash'},
    showlegend: false
    }, */ {
      x: x,
      y: y,
      mode: 'markers',
      text: t.map(t => 't = ' + t),
      showlegend: false,
      line: {color: 'rgb(50, 110, 200)', width: 2},
      marker: {size: 4}
    }, {
      x: xp,
      y: yp,
      mode: 'markers',
      marker: {size: 10, color: 'rgb(200, 50, 150)'},
      showlegend: false
    }];
}

var traces = window.traces = [];
traces = traces.concat(curveToTrace(curve));
// traces = traces.concat(curveToTrace(curve2));

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
