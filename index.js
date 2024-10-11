const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const config = require('./config');
const { unzipFile } = require('./utils');
const directoryToWatch = path.resolve(__dirname, config.directoryToWatch);
const outputPath = path.resolve(__dirname, config.outputPath);
const readline = require('readline')


// 创建readline接口实例，异步函数
function askQuestion(query) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
  
      rl.question(query, (answer) => {
        rl.close(); // 用户输入后关闭readline接口
        resolve(answer); // 将用户输入的值通过resolve传递出去，完成Promise
      });
    });
  }

// 初始化监视器，只关注 .zip 文件的变化
const watcher = chokidar.watch(directoryToWatch, {
    ignored: [
        /(^|[\/\\])node_modules([\/\\]|$)/, // 忽略 node_modules 目录
        /(^|[\/\\])[^\/\\]*\.(?!zip)[^\/\\]*$/, // 忽略非.zip文件
    ],

    persistent: true // 使监视器持久运行
});

let addFiles = [];
let unzipPassword = '';

// 获取最后修改的文件
async function getLastModifiedFile(addFiles) {
    addFiles.sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
    console.log(`最后修改的文件是: ${addFiles[0]}`);
    return addFiles[0];
}

// 定义一个解压文件的异步函数
// async function unzipFile(filePath) {
//     const targetDir = filePath.replace('.zip', '');
//     await fs.createReadStream(filePath)
//         .pipe(unzip.Extract({ path: targetDir }))
//         .promise();
//     console.log(`解压完成: ${filePath}`);
// }

// 定义一个删除文件的异步函数（可以根据实际需要修改）
async function deleteFile(filePath) {
    await fs.unlink(filePath);
    console.log(`文件已删除: ${filePath}`);
}

// 添加文件新增事件处理器
watcher.on('add', async filePath => {
    try {
        console.log(`新增 .zip 文件: ${filePath}`);
        addFiles.push(filePath);

        let zipFile = await getLastModifiedFile(addFiles);

        unzipPassword = await askQuestion('请输入加压密码：');
        console.log(`输入解压缩密码为: ${unzipPassword}`);

        await unzipFile(zipFile ,outputPath,unzipPassword);
    } catch (error) {
        console.error(`处理新增文件时出错: ${error}`);
    }
});

// 添加文件删除事件处理器
watcher.on('unlink', async filePath => {
    try {
        console.log(`移除 .zip 文件: ${filePath}`);
        await deleteFile(filePath); // 如果需要异步删除其他资源，可以在这里实现
    } catch (error) {
        console.error(`处理移除文件时出错: ${error}`);
    }
});

// 添加错误事件处理器
watcher.on('error', async error => {
    console.error(`监视器错误: ${error}`);
    // 在这里可以进行异步错误处理
    // await someAsyncErrorHandlingFunction(error);
});


// watcher
//     .on('add', path => console.log(`新增 .zip 文件: ${path}`))
//     .on('unlink', path => console.log(`移除 .zip 文件: ${path}`))
//     .on('error', error => console.error(`监视器错误: ${error}`));

console.log(`开始监控目录: ${directoryToWatch}`);