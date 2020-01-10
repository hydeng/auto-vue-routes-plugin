/*
 * JSON.stringify() 做对象序列化时，如果一个属性为函数，那这个属性就会被忽略 https://github.com/ccforward/cc/issues/69
 */
function getPathID(dirPath = "") {
  let id = "";
  dirPath.split("/").forEach((item, index) => {
    id =
      id +
      (index > 0
        ? item.replace(/^\S/, function(s) {
            return s.toUpperCase();
          })
        : item); //子级的首字母大写
  });
  return id;
}

const replace = (k, v) => {
  if (typeof v === "function") {
    return Function.prototype.toString.call(v);
  }
  if (v === undefined) {
    return "undefined";
  }
  return v;
};
const reviver = (k, v) => {
  if (typeof v === "string" && v.indexOf("function component") !== -1) {
    return eval("(" + v + ")");
  }
  if (v === "undefined") {
    return undefined;
  }
  return v;
};

function filterRoutes(arrays = [], condition) {
  let arrayTemp = JSON.parse(JSON.stringify(arrays, replace), reviver); //多维数组深复制
  for (let i = 0; i < arrayTemp.length; i++) {
    if (arrayTemp[i].children.length > 0) {
      arrayTemp[i].children = filterRoutes(arrayTemp[i].children, condition);
    }
  }
  return arrayTemp.filter(condition);
}
/**
 * 获得不需要权限要求的路由表，根据meta中的auth字段
 * @param {Array} routes 已有路由表
 * @param {Array} noauth 子路由
 * @return 不需要权限要求的路由表
 */
function getRoutesNoRequireAuth(routes = []) {
  return filterRoutes(routes, item => {
    if (item.component !== undefined && item.component.length) {
      item.component = eval("(" + item.component + ")");
    }
    if (item.meta && item.meta.auths) return false;
    return true;
  });
}

/**
 * 获得权限验证已通过的路由表，根据meta中的auth字段是否与后台返回的权限接口字段匹配
 * @param {Array} routes 已有路由表
 * @return 权限验证已通过的路由表
 */
function getRoutesHaveAuth(routes = [], auths = {}) {
  return filterRoutes(routes, item => {
    if (item.component !== undefined && item.component.length) {
      item.component = eval("(" + item.component + ")");
    }
    let flag = false;
    if (item.meta && item.meta.auths) {
      for (let i = 0; i < item.meta.auths.length; i++) {
        const key = item.meta.auths[i];
        if (auths[key]) {
          flag = true;
        }
      }
    }
    return flag;
  });
}

module.exports = { getRoutesNoRequireAuth, getRoutesHaveAuth, getPathID, filterRoutes };