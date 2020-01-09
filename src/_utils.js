/**
 * 获取视图文件的文件ID
 */
function getPageID(dirPath = "") {
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

function sortArrayChildren(arrays = []) {
  let haveIndex = [];
  let noIndex = [];
  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].children.length > 0)
      arrays[i].children = sortArrayChildren(arrays[i].children);
    if (arrays[i].meta.index > -1) {
      haveIndex[arrays[i].meta.index] = arrays[i];
    } else {
      noIndex.push(arrays[i]);
    }
  }
  let noUndefined = [];
  for (let i = 0; i < haveIndex.length; i++) {
    if (haveIndex[i] !== undefined) noUndefined.push(haveIndex[i]);
  }
  for (let i = 0; i < noIndex.length; i++) {
    noUndefined.push(noIndex[i]);
  }
  return noUndefined;
}

// export default {
//   getPageID: getPageID,
//   sortArrayChildren: sortArrayChildren
// };

module.exports = {
  getPageID: getPageID,
  sortArrayChildren: sortArrayChildren
};
