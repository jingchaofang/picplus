## images

`npm install images`

https://github.com/zhangyuanwei/node-images

##  bluebird

https://github.com/petkaantonov/bluebird

http://bluebirdjs.com/docs/api-reference.html

## sharp

https://github.com/lovell/sharp

## read-chunk

## image-type

https://github.com/sindresorhus/image-type

## meow 喵

cli app helper 应用程序助手

`npm install meow`

### Features 功能

- Parses arguments 解析命令参数
- Converts flags to camelCase 将标志转换为驼峰命名，例如`out-dir => outDir`
- Outputs version when `--version` 输出版本号
- Outputs description and supplied help text when `--help` 输出描述并提供帮助文本
- Makes unhandled rejected promises fail loudly instead of the default silent fail 使未处理的拒绝承诺失败，而不是默认的沉默失败
- Sets the process title to the binary name defined in package.json 将进程标题设置为package.json中定义的二进制名称

`process.stdin.isTTY`  判断 Node.js 是否运行在一个文本终端（TTY）上下文。

## imagemin

`npm install imagemin`

## [arrify](https://github.com/sindresorhus/arrify) 数组化

```
'use strict';
module.exports = function (val) {
    if (val === null || val === undefined) {
        return [];
    }

    return Array.isArray(val) ? val : [val];
};
```

## [get-stdin](https://github.com/sindresorhus/get-stdin)

`npm install get-stdin`

## [ora](https://github.com/sindresorhus/ora) loading状态

`npm install ora`

## plur 返回单词的复数形式（不规则复数由irregular-plurals模块提供匹配集）

`npm install plur`

## [strip-indent](https://github.com/sindresorhus/strip-indent)从字符串的每一行中删除前导空格，用于删除多余的缩进。

```
'use strict';
const minIndent = require('min-indent');

module.exports = str => {
    const indent = minIndent(str);

    if (indent === 0) {
        return str;
    }

    const re = new RegExp(`^[ \\t]{${indent}}`, 'gm');

    return str.replace(re, '');
};
```




