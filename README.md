# unzip_file

##### 1. 需求1. 命令行中增加当前文件的列表，并显示最后新增的文件或者最后重命名的文件，提供光标可移动选择项
 - 将path.resolve改城path.join，参考file_encode/index.js项目
 - 只跟踪最近添加的5个文件，通过inquirer向用户展示可选列表
 - https://github.com/SBoudrias/Inquirer.js/tree/inquirer%408.2.6?tab=readme-ov-file#examples
 - https://github.com/SBoudrias/Inquirer.js/tree/inquirer%409.2.12?tab=readme-ov-file
 - https://github.com/SBoudrias/Inquirer.js/tree/main/packages/core
 - 将项目改成esm模块，将inquirer升级到9.2.12，验证文件选择是否能用方向按键
 - 添加ora库，显示进度条
 - 解压最后新增的文件，如果输入密码错误，则加载文件列表。包含路径，创建日期，文件大小（灰色字体），是否加密（黄色，绿色）
- nodemon 会影响inquirer的输入，需要修改nodemon命令为     "demo": "nodemon -I index2.js"
- https://github.com/SBoudrias/Inquirer.js/issues/586

- 解决首次加载时，重复扫描解压的问题


- 加压缩带密码文件 https://zhuanlan.zhihu.com/p/474840546
- 验证压缩文件在vscode中是什么编码，用detect方法检测压缩文件编码格式，检测excel文件编码格式

- 实现，根据directory.files的文件数， 解压缩多个文件

- unzip -O utf-8 -l zipfile.zip   unzip -O gbk -l zipfile.zip   
GBK GB2312 gbk gb2312 GB18030 cp437  cp1251 cp1252 windows-1252 windows-1251



```js

@@ -162,6 +162,30 @@ fs.createReadStream('path/to/archive.zip')
  .then( () => console.log('done'), e => console.log('error',e));
```

### Parse zip created by DOS ZIP or Windows ZIP Folders
Archives created by legacy tools usually have filenames encoded with IBM PC (Windows OEM) character set.
You can decode filenames with preferred character set:
```js
var il = require('iconv-lite');
fs.createReadStream('path/to/archive.zip')
  .pipe(unzipper.Parse())
  .on('entry', function (entry) {
    // if some legacy zip tool follow ZIP spec then this flag will be set
    var isUnicode = entry.props.flags.isUnicode;
    // decode "non-unicode" filename from OEM Cyrillic character set
    var fileName = isUnicode ? entry.path : il.decode(entry.props.pathBuffer, 'cp866');
    var type = entry.type; // 'Directory' or 'File'
    var size = entry.size;
    if (fileName === "Текстовый файл.txt") {
      entry.pipe(fs.createWriteStream(fileName));
    } else {
      entry.autodrain();
    }
  });
```

```


`iconv.decode(entry.props.pathBuffer, file.souceType) ` 解释这段代码的作用

这段代码是在使用 iconv 库将 entry.props.pathBuffer 从 file.souceType 编码转换为 Node.js 的内部字符串编码（UTF-8）。简单来说，它是在对路径名进行正确的字符编码转换。
让我们分解这段代码以深入理解：
1. iconv.decode(): 这是 iconv 库的一个方法，用于执行字符集的解码操作。它接收两个参数：一个 Buffer（或能转换为 Buffer 的数据）和源字符集的编码类型。它返回转换为字符串的结果。
2. entry.props.pathBuffer: 这是你希望解码的数据。在这种情况下，它是一个包含路径名称的 Buffer 对象。
3. file.souceType: 这是源数据的编码类型。iconv.decode() 将会用这个编码读取 entry.props.pathBuffer。
这条命令的作用，一般来说，就是将从 ZIP 文件中获取到的条目路径名（这个路径名被编码并存储在 Buffer 对象 entry.props.pathBuffer 中）从其原始编码 (file.souceType) 转换为 UTF-8 编码的字符串。
例如，如果你从一个由 Windows 系统创建的 ZIP 文件中取出一个条目，该条目的路径可能被编码为 GBK。这样，你就可以使用 iconv.decode(entry.props.pathBuffer, 'gbk') 来得到正确显示的路径名。


