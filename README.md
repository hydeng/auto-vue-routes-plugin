# auto-vue-routes-plugin
webpack插件，用于根据vue视图文件自动生成路由配置文件。

## 使用

 ```javascript
  const AutoVueRoutesPlugin = require('auto-vue-routes-plugin');

  module.exports = {
    plugins: [
      // 实例
      new AutoVueRoutesPlugin({
        entry: path.resolve(__dirname, '../src/pages/'), //监听的视图文件夹
        output: path.resolve(__dirname, '../src/routes/index.js') //输出的路由配置文件
      })
    ]
  }
  
 ```