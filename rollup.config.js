const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')
const json = require('rollup-plugin-json')

const dependencies = Object.keys(require('./package.json').dependencies)

module.exports = {
  input: 'src/index.js',
  external: dependencies,

  output: {
    format: 'cjs',
    name: 'ReactFeathers',
    file: './dist/index.js',
    sourcemap: true
  },

  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    resolve(),
    commonjs(),
    json()
  ]
}
