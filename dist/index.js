'use strict';

/**
 * 根据视图文件夹自动生成默认的路由配置
 */
// const path = require("path");
const chokidar = require("chokidar");

const fileManager = require("./fileManager");
const routeManager = require("./routeManager");

// import fileManager from "./fileManager";
// import routeManager from "./routeManager";

function AutoVueRoutesPlugin(options) {
  this.data = {
    isWatch: options.isWatch !== undefined ? options.isWatch : true,
    entry: options.entry,
    output: options.output,
    test: options.test || /\.(vue)$/
  };
}

AutoVueRoutesPlugin.prototype.apply = function(compiler) {
  const that = this;
  compiler.plugin("done", function() {
    install(that.data);
  });
};

// 简单cache存储视图配置信息
// TODO 待优化
let cache = [];

/**
 * 给视图配置信息加上meta相关信息
 * @param {Object} pages 视图的配置信息
 */
async function addMeta(pages) {
  for (let i = 0; i < pages.length; i++) {
    let item = pages[i];
    const metaFilePath = item.filePath + "/meta.js";
    item.meta = (await fileManager.isExist(metaFilePath))
      ? await fileManager.getES6Module(metaFilePath)
      : {};
  }
  return pages;
}

/**
 * 默认方法
 * @param {Object} config 配置信息，默认为false是为了照顾在最外层config文件中写了vueRoutesAutoBuilder这个key就开启该功能的场景
 */
function install(config = false) {
  if (config) {
    config.isWatch ? watch(config, build) : build(config);
  }
}

/**
 * 检查cache是否已过期
 * @param {Object} newArray 新的视图配置信息
 */
function isCacheExpired(newArray) {
  if (cache.length !== newArray.length) return true;
  for (let i = 0; i < cache.length; i++) {
    if (JSON.stringify(cache[i]) !== JSON.stringify(newArray[i])) return true;
  }
  return false;
}

/**
 * 根据配置信息构建routes并写文件
 * @param {Object} config 配置信息
 */
async function build(config = {}) {
  // 获取视图文件夹下所有视图配置
  let pages =
    Object.keys(config).length === 0
      ? []
      : await addMeta(await fileManager.getAllPages(config.entry, config.test, config.output));
  if (isCacheExpired(pages)) {
    const routes = routeManager.getRoutes(pages);
    fileManager.setES6ModuleFile(config.output, routes);
    cache = pages;
  }
}

/**
 * 监听文件夹
 * @param {Object} config 配置信息
 * @param {Object} callback 回调
 */
function watch(config = {}, callback) {
  chokidar
    .watch(
      [config.entry], //监听文件夹
      {
        ignored: /[\/\\]\./, //所要忽略监听的文件或者文件夹，另：值/(^|[\/\\])\../为忽略点文件
        ignoreInitial: true, //chokidar实例化时是否忽略add/addDir事件
        persistent: true, //是否保护进程不退出持久监听
        depth: 4 //限定递归监听多少个子目录
        //... 其他
      }
    )
    .on("add", () => {
      callback(config);
    })
    .on("addDir", () => {
      callback(config);
    })
    .on("ready", () => {
      callback(config);
    })
    .on("change", () => {
      callback(config);
    })
    .on("unlinkDir", () => {
      callback(config);
    });
}

// export default AutoVueRoutesPlugin;

module.exports = AutoVueRoutesPlugin;
