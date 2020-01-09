/**
 * 路由相关操作
 */
// const utils = require('./_utils');
import utils from "./_utils";

/**
 * 生成单个路由
 * @param {Object} pageConfig 视图的配置信息
 * @return 单个路由配置
 */
function getRoute(pageConfig) {
  const webpackChunkName = pageConfig.meta.webpackChunkName
    ? pageConfig.meta.webpackChunkName
    : pageConfig.id;
  const requireFile = pageConfig.realeasePath + "/" + pageConfig.path + "/" + pageConfig.name;
  

  return {
    path: "/" + pageConfig.path,
    fullPath: "/" + pageConfig.path,
    name: pageConfig.id,
    parentName: utils.getPageID(
      pageConfig.path.substring(0, pageConfig.path.lastIndexOf("/"))
    ),
    redirect:
      pageConfig.meta.redirect && pageConfig.meta.redirect !== "/"
        ? pageConfig.meta.redirect
        : "",
    // component: "r => require.ensure([], () => r(require('" + requireFile + "').default), '" + routeName[1] + "')"
    component: () => {
      return (
        '() => import(/* webpackChunkName: "' +
        webpackChunkName +
        "\" */ '" +
        requireFile +
        "')"
      );
    },
    meta: pageConfig.meta,
    children: []
  };
}

/**
 * 生成完整路由
 * @param {Object} pageList 视图的配置信息
 * @return 完整路由配置
 */
function getRoutes(pageList) {
  let routes = [];
  let itemLast = [];
  for (let i = 0; i < pageList.length; i++) {
    const item = getRoute(pageList[i]);
    if (item.name === "404") {
      item.path = "*";
      itemLast.push(item);
    }
    if (item.meta && item.meta.dynamic) {
      item.path = item.path + "/:" + item.meta.dynamic;
    } else if (!item.meta.isIgnore) {
      // item.meta.isChildren ? routes = addRouteChildren(routes, item) : routes.push(item);
      // 默认为meta.isChildren 为 true
      if (item.meta.isChildren === undefined) {
        routes = addRouteChildren(routes, item);
      } else {
        item.meta.isChildren
          ? (routes = addRouteChildren(routes, item))
          : routes.push(item);
      }
      if (item.meta.redirect === "/") {
        routes.push({
          path: "/",
          redirect: item.path,
          meta: item.meta,
          children: []
        });
      }
    }
  }
  for (let i = 0; i < itemLast.length; i++) {
    routes.push(itemLast[i]);
  }
  return utils.sortArrayChildren(routes);
  // return routes;
}

/**
 * 子路由挂靠在父路由的children下
 * @param {Array} routes 视图的配置信息
 * @param {Object} routeItem 子路由
 * @return 已有路由配置
 */
function addRouteChildren(routes = [], routeItem = {}, isEnd = true) {
  // let hasParent = false;
  for (let i = 0; i < routes.length; i++) {
    const item = routes[i];
    if (item.name === routeItem.parentName) {
      routeItem.path = routeItem.path.substring(
        routeItem.path.lastIndexOf("/") + 1,
        routeItem.path.length
      );
      item.children.push(routeItem);
      // hasParent = true;
    } else if (item.children.length > 0) {
      item.children = addRouteChildren(item.children, routeItem, false);
    }
  }
  if (routeItem.parentName === "") {
    routes.push(routeItem);
  }
  return routes;
}

const routeManager = {
  getRoutes: getRoutes
};

export default routeManager;
// module.exports = routeManager;