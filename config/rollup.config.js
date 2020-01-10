import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs"
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      // // non-CommonJS modules will be ignored, but you can also
      // // specifically include/exclude files
      include: ['src/**', 'node_modules/**'],  // Default: undefined
      // exclude: [ 'node_modules/**'],  // Default: undefined
      // // these values can also be regular expressions
      // // include: /node_modules/

      // search for files other than .js files (must already
      // be transpiled by a previous plugin!)
      extensions: [ '.js', '.coffee' ],  // Default: [ '.js' ]

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false,  // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false,  // Default: true
    })
  ],
  // 指出应将哪些模块视为外部模块
  external: ['chokidar']
};
