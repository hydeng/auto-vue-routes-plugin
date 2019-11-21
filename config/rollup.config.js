import resolve from 'rollup-plugin-node-resolve';

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs"
  },
  plugins: [resolve({
    // 将自定义选项传递给解析插件
    customResolveOptions: {
      moduleDirectory: 'node_modules'
    }
  })],
  // 指出应将哪些模块视为外部模块
  external: ['chokidar']
};
