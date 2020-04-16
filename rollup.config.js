// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import browserifyPlugin from 'rollup-plugin-browserify-transform'
import es2020 from 'es2020'

export default [{
  input: 'nurbs.js',
  output: {
    file: 'dist/nurbs.js',
    name: 'nurbs',
    format: 'umd'
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    browserifyPlugin(es2020),
  ]
}];
