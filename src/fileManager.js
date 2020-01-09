/**
 * 文件操作与管理
 */
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const utils = require('./_utils');
// import utils from "./_utils";

/**
 * 确保目录路径存在，若不存在则自动创建
 * @param {String} dirPath - 目录路径
 */
function mkdir(dirPath = "") {
  if (dirPath.length > 0) {
    if (!fs.existsSync(path.dirname(dirPath))) {
      mkdir(path.dirname(dirPath));
    }
    fs.mkdirSync(dirPath);
  }
}

/**
 * 判断目录路径是否存在
 * @param {String} dirPath - 目录路径
 */
function isExist(dirPath = "") {
  return new Promise(resolve => {
    fs.stat(dirPath, function(err, stat) {
      if (stat && stat.isFile()) {
        resolve(dirPath);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * 写文件
 * @param {String} filePath - 文件路径，//TODO 注意文件是否有写权限
 * @param {String} cont - 写内容
 * @return {Boolean} 读写成功则返回true，失败则false
 */
function fileWrite(filePath = "", cont = "") {
  const fileUrl = filePath.replace(/\\/g, "/");
  const dirPath = fileUrl.substring(0, fileUrl.lastIndexOf("/"));
  // const dirPath = fileUrl.substring(0, fileUrl.lastIndexOf('/'));
  // fs.existsSync(dirPath) === false ? mkdir(dirPath);
  if (fs.existsSync(dirPath) === false) {
    mkdir(dirPath);
  }

  return new Promise(resolve => {
    fs.writeFile(filePath, cont, () => {
      resolve(true);
    });
  });
}

/**
 * 读文件内容
 * @param {String} filePath - 文件路径
 */
function fileRead(filePath = "") {
  return new Promise(resolve => {
    fs.readFile(filePath, function(err, data) {
      if (err) {
        resolve(false);
      } else {
        resolve(data);
      }
    });
  });
}

// glob输出顺序是按首字母排序，需要统一为按路径长短排序
function sortGlobOutput(globOutputArray) {
  let temp = {};
  for (let i = 0; i < globOutputArray.length; i++) {
    const item = globOutputArray[i];
    const key = item.split("/").length;
    if (!temp[key]) {
      temp[key] = [];
    }
    temp[key].push(item);
  }
  let newOutput = [];
  for (let item in temp) {
    for (let i = 0; i < temp[item].length; i++) {
      newOutput.push(temp[item][i]);
    }
  }
  return newOutput;
}

/**
 * 遍历目录下所有视图文件
 * @param {String} entryPath - 入口
 */
function getAllPages(entryPath = "", fileTest = /\.vue$/, outputPath = "") {
  let realeasePath = '';
  let commonPath = '';
  let deep = 0;
  for (let i = 0; i < outputPath.length; i++) {
    if (entryPath.indexOf(outputPath.substr(0, i)) < 0) {
      commonPath = outputPath.substr(0, i-1);
      realeasePath = entryPath.replace(commonPath, '');
      deep = (outputPath.replace(commonPath, '').split('\\')).length;
      break;
    }
  }
  return new Promise(resolve => {
    let files = {};
    let allFiles = glob.sync(entryPath + path.sep + "**", {});

    const basePath = entryPath.replace(/\\/g, "/");

    allFiles = sortGlobOutput(allFiles); //统一排序

    for (let i = 0; i < allFiles.length; i++) {
      const f = allFiles[i];
      const fileName = f.split('/').pop();
      const key = f.replace(basePath + "/", "").replace("/" + fileName, "");
      if (fileTest.test(f) && !files[key]) {
        files[key] = {
          filePath: f.replace("/" + fileName, ""),
          name: fileName,
          id: utils.getPageID(key),
          path: key,
          realeasePath: (new Array(deep)).join('../') + realeasePath.replace(/\\/g, "/")
        };
      }
    }
    //以数组形式返回
    let filesArray = [];
    for (let key in files) {
      filesArray.push(files[key]);
    }
    resolve(filesArray);
  });
}

/**
 * 获取文件中的es6模块内容
 * @param {String} filePath - 文件路径
 */
async function getES6Module(filePath = "") {
  const fileCont = (await fileRead(filePath)).toString();
  const es6ModuleDefault =
    fileCont.indexOf("export default") !== -1 ? "export default" : "export";
  return eval(
    "(function() {" + fileCont.replace(es6ModuleDefault, "return") + "}())"
  );
}

/**
 * 创建文件，并写入es6模块内容
 * @param {Array} jsonConfig - 配置内容
 */
function setES6ModuleFile(filePath = "", jsonConfig) {
  fileWrite(filePath, getES6ModuleString(jsonConfig));
}

const templateRules = {
  fileStart: "/**\r\n * 默认路由配置\r\n */\r\nexport default ",
  fileEnd: ";\r\n",
  br: "\r\n",
  space: "    "
};

/**
 * 获得格式化后的ES6模块内容
 * @param {Array} arrayConfig 配置对象
 * @return {String} 返回格式化后的ES6模块文件内容
 */
function getES6ModuleString(arrayConfig = []) {
  let cont =
    arrayConfig.length === 0
      ? "[" +
        templateRules.br +
        _repeatString(templateRules.space, 1) +
        "// 无自动生成路由配置" +
        templateRules.br +
        "]"
      : _deleteLastSign(getFormatValue(arrayConfig, 0, false), ",", 0);
  return templateRules.fileStart + cont + templateRules.fileEnd;
}

/**
 * 获得格式化后的各项
 * @param {Object} value 值
 * @param {Number} indentNumber 缩进次数，默认0
 * @return {String} 返回格式化后的值
 */
function getFormatValue(value, indentNumber = 0, isValueBr = false) {
  let cont;
  switch (typeof value) {
    case "string":
      cont = getFormatString(value);
      break;
    case "number":
      cont = getFormatNumber(value);
      break;
    case "boolean":
      cont = getFormatBoolean(value);
      break;
    case "function":
      cont = getFormatFunction(value);
      break;
    case "object":
      cont =
        value instanceof Array
          ? getFormatArray(value, indentNumber, isValueBr)
          : getFormatJson(value, indentNumber, isValueBr); //只处理array和json对象
      break;
  }
  return cont;
}

/**
 * 获取格式化后的所有信息
 * @param {String} data 描述文本
 * @param {Number} indentNumber 缩进次数，默认0
 * @param {Boolean} isBr 开始时标记符是否折行，默认false
 * @return {String} 返回格式化后的单行注释文本
 */
function getFormatArray(arrayConfig = [], indentNumber = 0, isBr = false) {
  let cont =
    (isBr
      ? templateRules.br + _repeatString(templateRules.space, indentNumber)
      : "") + "["; //数组开头字符是否要折行缩进
  let isBlock = typeof arrayConfig[0] === "object" ? true : false; //数组内值若是数组或json则要折行
  let valueIndent = isBlock ? indentNumber + 1 : indentNumber; //若折行则要缩进+1

  for (let i = 0; i < arrayConfig.length; i++) {
    cont =
      cont +
      (i !== 0 && typeof arrayConfig[i] !== "object" ? " " : "") +
      getFormatValue(arrayConfig[i], valueIndent, isBlock); //数组内为字符串或布尔值或数字，则彼此之间加空格
  }

  // 删除最后一条value的,符号
  cont = _deleteLastSign(cont, ",", 0);

  // 数组字符结尾时是否要折行缩进
  return (
    cont +
    (isBlock
      ? templateRules.br + _repeatString(templateRules.space, indentNumber)
      : "") +
    "],"
  );
}

/**
 * 获取格式化后的json对象
 * @param {Object} jsonConfig json对象
 * @param {Number} indentNumber 缩进次数，默认0
 * @param {Boolean} isBr 开始时标记符是否折行，默认false
 * @return {String} 返回格式化后的数组
 */
function getFormatJson(jsonConfig = {}, indentNumber = 0, isBr = false) {
  let cont =
    (isBr
      ? templateRules.br + _repeatString(templateRules.space, indentNumber)
      : "") + "{"; //json开头字符是否要折行缩进
  const valueIndent = indentNumber + 1; // 子级缩进+1

  for (let key in jsonConfig) {
    cont =
      cont +
      templateRules.br +
      _repeatString(templateRules.space, valueIndent) +
      key +
      ": " +
      getFormatValue(jsonConfig[key], valueIndent, false);
  }

  // 删除最后一条key-value的,符号
  cont = _deleteLastSign(cont, ",", 0);

  // json字符结尾时是否要折行缩进
  return (
    cont +
    (Object.keys(jsonConfig).length === 0
      ? ""
      : templateRules.br + _repeatString(templateRules.space, indentNumber)) +
    "},"
  );
}

/**
 * 获取格式化后的单行注释文本
 * @param {String} str 描述文本
 * @param {Number} indentTimes 缩进次数，默认0
 * @return {String} 返回格式化后的单行注释文本
 */
function getFormatNotes(str = "", indentTimes = 0) {
  return (
    templateRules.br +
    _repeatString(templateRules.space, indentTimes) +
    str +
    templateRules.br
  );
}

/**
 * 获取格式化后的函数
 * @param {function} funcObj 函数
 * @return {String} 返回格式化后的函数
 */
function getFormatFunction(funcObj) {
  //TODO 目前特殊处理，待解决
  return funcObj() + ",";
}

/**
 * 获取格式化后的字符串
 * @param {String} str 文本
 * @return {String} 返回格式化后的文本
 */
function getFormatString(str = "") {
  // if (typeof(item) === 'string') {
  //     return key === 'component' ? item + ',' : '\'' + item + '\',';
  // }
  return "'" + str + "',";
}

/**
 * 获取格式化后的数字
 * @param {Number} num 数字
 * @return {String} 返回格式化后的数字
 */
function getFormatNumber(num = 0) {
  return num + ",";
}

/**
 * 获取格式化后的布尔值
 * @param {Boolean} booleanValue 布尔值
 * @return {String} 返回格式化后的布尔值
 */
function getFormatBoolean(booleanValue = false) {
  return booleanValue + ",";
}

/**
 * 删除倒数位置的特定符号
 * @param {String} str 待删除的字符串
 * @param {String} sign 想要删除的标记符
 * @param {Number} lastNumber 想要删除的位置
 * @return {String} 返回删除特定标记符后的字符串
 */
function _deleteLastSign(str = "", sign = "", lastNumber = 0) {
  let index = str.lastIndexOf(",");
  for (let i = 0; i < lastNumber; i++) {
    index = str.substring(0, index).lastIndexOf(",");
  }
  return index > -1
    ? str.substring(0, index) + str.substring(index + 1, str.length)
    : str;
}

/**
 * 重复n次的字符串
 * @param {String} str 待重复的字符串
 * @param {Number} num 想要重复的次数
 * @return {String} 返回重复n次后的字符串
 */
function _repeatString(str = "", num = 0) {
  let cont = "";
  for (let i = 0; i < num; i++) {
    cont = cont + str;
  }
  return cont;
}

const fileManager = {
  read: fileRead,
  write: fileWrite,
  isExist: isExist,
  mkdir: mkdir,
  getAllPages: getAllPages,
  getES6Module: getES6Module,
  setES6ModuleFile: setES6ModuleFile
};

// export default fileManager;

module.exports = fileManager;
