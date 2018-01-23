const normalize = require('gl-vec3/normalize');
const cross = require('gl-vec3/cross');

module.exports = function (mesh, nurbs, opts) {
  var resolution, i, j, idx, u, v;
  opts = opts || {};
  mesh = mesh || {};
  var positions = mesh.positions = mesh.positions || [];
  var normals = mesh.normals = mesh.normals || [];
  var cells = mesh.cells = mesh.cells || [];

  if (Array.isArray(opts.resolution)) {
    resolution = opts.resolution;
  } else {
    var res = opts.resolution === undefined ? 31 : opts.resolution;
    resolution = new Array(nurbs.curveDimension).fill(res);
  }
  console.log('resolution:', resolution);

  switch (nurbs.curveDimension) {
    case 1:

      break;
    case 2:
      var nu = resolution[0];
      var nv = resolution[1];
      var domain = nurbs.domain;
      var uDomain = domain[0];
      var vDomain = domain[1];
      var tmp1 = [];
      var tmp2 = [];

      normals.length = nu;
      positions.length = nu;
      for (i = 0; i < nu; i++) {
        u = uDomain[0] + (uDomain[1] - uDomain[0]) * i / (nu - 1);
        for (j = 0; j < nv; j++) {
          v = vDomain[0] + (vDomain[1] - vDomain[0]) * j / (nv - 1);

          idx = i + nu * j;

          if (!positions[idx]) positions[idx] = [];
          if (!normals[idx]) normals[idx] = [];

          nurbs.evaluate(positions[idx], u, v);

          normalize(normals[idx], cross(tmp1,
          nurbs.derivative(tmp1, 0, u, v),
          nurbs.derivative(tmp2, 1, u, v)
        ));
        }
      }

      var cell;
      var c = 0;
      for (i = 0; i < nu - 1; i++) {
        for (j = 0; j < nv - 1; j++) {
          idx = i + nu * j;

          cell = cells[c] ? cell[c] : (cells[c] = []);
          cell[0] = idx;
          cell[1] = idx + 1;
          cell[2] = idx + 1 + nu;
          c++;

          cell = cells[c] ? cell[c] : (cells[c] = []);
          cell[0] = idx;
          cell[1] = idx + 1 + nu;
          cell[2] = idx + nu;
          c++;
        }
      }
      cells.length = c;

    /*

    for (i = 0; i < nx; i++) {
      u = surface.domain[0][0] + (surface.domain[0][1] - surface.domain[0][0]) * i / (nx - 1);
      for (j = 0; j < ny; j++) {
        v = surface.domain[1][0] + (surface.domain[1][1] - surface.domain[1][0]) * j / (ny - 1);
        positions[i + nx * j] = surface.evaluate([], u, v);

        var normal = cross([],
          surface.derivative(tmp1, 0, u, v),
          surface.derivative(tmp2, 1, u, v)
        );
        normals[i + nx * j] = normalize(normal, normal);
      }
    }
    positions.length = nx * ny;
    normals.length = nx * ny;
    for (i = 0; i < nx; i++) {
      u = surface.domain[0][0] + (surface.domain[0][1] - surface.domain[0][0]) * i / (nx - 1);
      for (j = 0; j < ny; j++) {
        v = surface.domain[1][0] + (surface.domain[1][1] - surface.domain[1][0]) * j / (ny - 1);
        positions[i + nx * j] = surface.evaluate([], u, v);

        var normal = cross([],
          surface.derivative([], 0, u, v),
          surface.derivative([], 1, u, v)
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
    */

      break;
    default:
      throw new Error('Can only sample curves and surfaces');
  }

  return mesh;
};
