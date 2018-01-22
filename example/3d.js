const glsl = require('glslify');
const ndarray = require('ndarray');
const pack = require('ndarray-pack');
const unpack = require('ndarray-unpack');
const nurbs = require('../nurbs');
const wireframe = require('screen-projected-lines');
const controlPanel = require('control-panel');
const cross = require('gl-vec3/cross');
const normalize = require('gl-vec3/normalize');

var error = document.createElement('span');
error.style.color = '#cc3333';
error.style.fontFamily = 'sans-serif';
error.style.fontStyle = 'italic';
error.style.position = 'absolute';
error.style.left = '10px';
error.style.bottom = '10px';
error.style.zIndex = '1';

const showError = str => (error.textContent = str);
const clearError = () => (error.textContent = '');
document.body.appendChild(error);

require('regl')({
  onDone: require('fail-nicely')(run),
  pixelRatio: Math.min(window.devicePixelRatio, 1.5),
  attributes: {
    antialias: true,
    alpha: false
  }
});

function run (regl) {
  var i, j;

  const camera = require('./regl-camera')(regl, {
    phi: 0.5,
    theta: 0.2,
    damping: 0,
    distance: 15,
    noScroll: true
  });

  const state = {
    hull: true,
    uDegree: 2,
    vDegree: 3,
    uPoints: 6,
    vPoints: 6,
    uBoundary: 'closed',
    vBoundary: 'closed',
    uFrequency: 4,
    vFrequency: 4,
    minorRadius: 1,
    majorRadius: 3,
    weightStrength: 0,
    twist: 0
  };

  controlPanel([
    {label: 'uDegree', type: 'range', min: 1, max: 8, step: 1, initial: state.uDegree},
    {label: 'vDegree', type: 'range', min: 1, max: 8, step: 1, initial: state.vDegree},
    {label: 'uPoints', type: 'range', min: 3, max: 31, step: 1, initial: state.uPoints},
    {label: 'vPoints', type: 'range', min: 3, max: 101, step: 1, initial: state.vPoints},
    {label: 'uBoundary', type: 'select', options: ['closed', 'open', 'clamped'], initial: state.uBoundary},
    {label: 'vBoundary', type: 'select', options: ['closed', 'open', 'clamped'], initial: state.vBoundary},
    {label: 'uFrequency', type: 'range', min: 0, max: 8, step: 1, initial: state.uFrequency},
    {label: 'vFrequency', type: 'range', min: 0, max: 16, step: 1, initial: state.vFrequency},
    {label: 'minorRadius', type: 'range', min: 0.1, max: 3, step: 0.1, initial: state.minorRadius},
    {label: 'majorRadius', type: 'range', min: 1, max: 6, step: 0.1, initial: state.majorRadius},
    {label: 'weightStrength', type: 'range', min: 0, max: 1, step: 0.01, initial: state.weightStrength},
    {label: 'twist', type: 'range', min: -2, max: 2, step: 0.01, initial: state.twist},
    {label: 'hull', type: 'checkbox', initial: state.hull}
  ]).on('input', function (data) {
    var needsUpdate = false;
    if (data.uDegree !== state.uDegree ||
      data.vDegree !== state.vDegree ||
      data.uPoints !== state.uPoints ||
      data.vPoints !== state.vPoints ||
      data.uBoundary !== state.uBoundary ||
      data.vBoundary !== state.vBoundary ||
      data.uFrequency !== state.uFrequency ||
      data.vFrequency !== state.vFrequency ||
      data.minorRadius !== state.minorRadius ||
      data.majorRadius !== state.majorRadius ||
      data.weightStrength !== state.weightStrength ||
      data.twist !== state.twist
    ) {
      needsUpdate = true;
    }
    Object.assign(state, data);
    if (needsUpdate) remesh();
    camera.taint();
  });

  var controlPositionBuffer, flatPositions, surface;
  var normalBuffer, positionBuffer, cellBuffer;
  var wireframePositionBuffer, wireframeNextBuffer;
  var wireframeDirectionBuffer, wireframeCellBuffer;
  var positions = [];
  var normals = [];
  var cells = [];
  var hullCells = [];

  var controlPoints = [];
  var controlWeights = [];
  for (i = 0; i < state.uPoints; i++) {
    controlPoints[i] = [];
    controlWeights[i] = [];
    for (j = 0; j < state.vPoints; j++) {
      controlPoints[i][j] = [];
      controlWeights[i][j] = [];
    }
  }

  function remesh () {
    var i, idx1, idx2, idx, u, v;
    if (state.uDegree > state.uPoints) {
      showError('Number of points in the u direction must be greater than the degree');
      return;
    }
    if (state.vDegree > state.vPoints) {
      showError('Number of points in the v direction must be greater than the degree');
      return;
    }
    clearError();
    controlPoints.length = state.uPoints;
    controlWeights.length = state.uPoints;
    for (i = 0; i < state.uPoints; i++) {
      if (!controlPoints[i]) controlPoints[i] = [];
      if (!controlWeights[i]) controlWeights[i] = [];
      controlPoints[i].length = state.vPoints;
      controlWeights[i].length = state.vPoints;
      for (j = 0; j < state.vPoints; j++) {
        var theta2 = j / state.vPoints * Math.PI * 2;
        var theta1 = (i + 0.5) / state.uPoints * Math.PI * 2 + (theta2 - Math.PI) * state.twist;
        var r2 = state.minorRadius * (1.0 + 0.5 * Math.cos(theta1 * state.uFrequency) * Math.sin(theta2 * state.vFrequency));
        var a = state.majorRadius + r2 * Math.cos(theta1);
        if (!controlPoints[i][j]) controlPoints[i][j] = [];
        controlPoints[i][j][0] = a * Math.cos(theta2);
        controlPoints[i][j][1] = r2 * Math.sin(theta1);
        controlPoints[i][j][2] = a * Math.sin(theta2);
        controlWeights[i][j] = 1.0 / (1.0 + 0.99 * state.weightStrength * Math.cos(theta2) * Math.sin(theta1));
      }
    }
    var ndControlPoints = pack(controlPoints);
    var ndControlWeights = pack(controlWeights);
    flatPositions = unpack(ndarray(ndControlPoints.data, [ndControlPoints.shape[0] * ndControlPoints.shape[1], ndControlPoints.shape[2]]));
    controlPositionBuffer = (controlPositionBuffer || regl.buffer)(flatPositions);

    surface = (surface || nurbs)({
      points: ndControlPoints,
      weights: ndControlWeights,
      degree: [state.uDegree, state.vDegree],
      boundary: [state.uBoundary, state.vBoundary]
    });

    var uDer = surface.derivativeEvaluator(1, 0);
    var vDer = surface.derivativeEvaluator(1, 1);

    var nx = Math.max(31, Math.min(101, 6 * state.uPoints + 1));
    var ny = Math.max(31, Math.min(101, 6 * state.uPoints + 1));
    positions.length = nx * ny;
    normals.length = nx * ny;
    for (i = 0; i < nx; i++) {
      u = surface.domain[0][0] + (surface.domain[0][1] - surface.domain[0][0]) * i / (nx - 1);
      for (j = 0; j < ny; j++) {
        v = surface.domain[1][0] + (surface.domain[1][1] - surface.domain[1][0]) * j / (ny - 1);
        positions[i + nx * j] = surface.evaluate([], u, v);

        var normal = cross([],
          uDer([], u, v),
          vDer([], u, v)
        );
        normals[i + nx * j] = normalize(normal, normal);
      }
    }
    cells.length = 0;
    for (i = 0; i < nx - 1; i++) {
      for (j = 0; j < ny - 1; j++) {
        idx = i + nx * j;
        cells.push([idx, idx + 1, idx + 1 + nx]);
        cells.push([idx, idx + 1 + nx, idx + nx]);
      }
    }
    normalBuffer = (normalBuffer || regl.buffer)(normals);
    positionBuffer = (positionBuffer || regl.buffer)(positions);
    cellBuffer = (cellBuffer || regl.elements)(cells);

    hullCells.length = 0;
    for (j = 0; j < state.vPoints; j++) {
      for (i = 0; i < state.uPoints - (surface.boundary[0] === 'closed' ? 0 : 1); i++) {
        idx1 = i * state.vPoints + j;
        idx2 = ((i + 1) % state.uPoints) * state.vPoints + j;
        hullCells.push([idx1, idx2]);
      }
    }
    for (i = 0; i < state.uPoints; i++) {
      for (j = 0; j < state.vPoints - (surface.boundary[1] === 'closed' ? 0 : 1); j++) {
        idx1 = i * state.vPoints + j % state.vPoints;
        idx2 = i * state.vPoints + (j + 1) % state.vPoints;
        hullCells.push([idx1, idx2]);
      }
    }
    var hullWireframe = wireframe({
      cells: hullCells,
      positions: flatPositions
    });

    wireframePositionBuffer = (wireframePositionBuffer || regl.buffer)(hullWireframe.positions);
    wireframeNextBuffer = (wireframeNextBuffer || regl.buffer)(hullWireframe.nextPositions);
    wireframeDirectionBuffer = (wireframeDirectionBuffer || regl.buffer)(hullWireframe.directions);
    wireframeCellBuffer = (wireframeCellBuffer || regl.elements)(hullWireframe.cells);
  }

  remesh();

  var drawHull = regl({
    vert: glsl`
      #pragma glslify: linevoffset = require('screen-projected-lines')
      precision mediump float;
      uniform mat4 projection, view;
      uniform float aspect, pixelRatio;
      attribute vec3 position, nextpos;
      attribute float direction;
      void main () {
        mat4 proj = projection * view;
        vec4 p = proj * vec4(position,1);
        vec4 n = proj * vec4(nextpos,1);
        vec4 offset = linevoffset(p, n, direction, aspect);
        gl_Position = p + offset * 0.002 * pixelRatio * p.z;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(0, 0.3, 0.3, 0.3);
      }
    `,
    attributes: {
      position: wireframePositionBuffer,
      nextpos: wireframeNextBuffer,
      direction: wireframeDirectionBuffer
    },
    blend: {
      enable: true,
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 'src alpha',
        dstRGB: 'one minus src alpha',
        dstAlpha: 'one minus src alpha'
      }
    },
    elements: wireframeCellBuffer,
    uniforms: {
      aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
      pixelRatio: regl.context('pixelRatio')
    }
  });

  var drawPoints = regl({
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      uniform float pixelRatio;
      attribute vec3 position;
      void main () {
        gl_Position = projection * view * vec4(position, 1);
        gl_PointSize = 9.0 * pixelRatio;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        vec2 uv = gl_PointCoord.xy - 0.5;
        if (dot(uv, uv) > 0.25) discard;
        gl_FragColor = vec4(0, 0.5, 1, 1);
      }
    `,
    attributes: {position: controlPositionBuffer},
    uniforms: {pixelRatio: regl.context('pixelRatio')},
    primitive: 'points',
    count: () => state.uPoints * state.vPoints
  });

  var drawSurface = regl({
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 n;
      void main () {
        n = normal;
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 n;
      void main () {
        gl_FragColor = vec4(0.5 + 0.5 * normalize(n), 1);
      }
    `,
    attributes: {
      position: positionBuffer,
      normal: normalBuffer
    },
    elements: cellBuffer
  });

  regl.frame(() => {
    camera(({dirty}) => {
      if (!dirty) return;
      regl.clear({color: [1, 1, 1, 0]});
      drawSurface();
      if (state.hull) {
        drawHull();
        drawPoints();
      }
    });
  });

  window.addEventListener('resize', camera.taint, false);
}
