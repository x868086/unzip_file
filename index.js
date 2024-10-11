const path = require('path');
const fs = require('fs').promises;
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

let addFiles = []; // 维护当前目录下所有.zip文件的数组
let unzipPassword = ''; //解压密码
let latestAddedFile = ''; //维护最新添加的文件
let timerAdd = null; //维护新增文件定时器
let timerUnlink = null; //维护删除文件定时器
// 获取最后创建的文件
async function getLastModifiedFile(addFiles) {

    // addFiles.sort((a, b) => fs.statSync(b).birthtime.getTime() - fs.statSync(a).birthtime.getTime());
    // console.log(`最后创建的文件是: ${addFiles[0]}`);
    // return addFiles[0];
    if (addFiles.length > 100) {
        console.log(`跟踪监控的.zip文件数量已超过100个，继续增加会影响程序响应时间，请删除一些.zip文件。`);
    }    
    const stats = await Promise.all(addFiles.map(file => fs.stat(file)));
    addFiles.sort((a, b) => {
        const aStat = stats[addFiles.indexOf(a)];
        const bStat = stats[addFiles.indexOf(b)];
        return bStat.birthtime.getTime() - aStat.birthtime.getTime();
    });
    console.log(`最后新增的文件是: ${addFiles[0]}`);
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


// 添加文件新增事件处理器
watcher.on('add', async filePath => {
    timerAdd = setTimeout(async () => {
        try {
            console.log(`新增 .zip 文件: ${filePath}`);
            addFiles.push(filePath);
            latestAddedFile = filePath;
    
            let zipFile = await getLastModifiedFile(addFiles);
            clearTimeout(timerAdd);
            unzipPassword = await askQuestion('请输入加压密码：');
            console.log(`输入解压缩密码为: ${unzipPassword}`);
    
            // await unzipFile(zipFile ,outputPath,unzipPassword);
        } catch (error) {
            let errorFileIndex = addFiles.indexOf(error.path);
            if (errorFileIndex > -1) {
                addFiles.splice(errorFileIndex, 1);
            }
            console.error(`新增文件不存在: ${error.path}`);
        }        
    },1500) //延迟1000ms，当有zip文件名修改时，等待删除原有文件后调用getLastModifiedFile遍历正确的addFiles
});


// 添加文件删除事件处理器
watcher.on('unlink', async filePath => {
        try {
            console.log(`已移除 .zip 文件: ${filePath}`);
            if (latestAddedFile === filePath) {
                latestAddedFile = '';
            }
            const index = addFiles.indexOf(filePath);
            if (index > -1) {
                addFiles.splice(index, 1);
            }        
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


// watcher.on('change', async filePath => {
//     try {
//         console.log(`修改 .zip 文件: ${filePath}`);
//         // Here you can add additional logic to handle file changes
//         // let zipFile = await getLastModifiedFile(addFiles);

//         // unzipPassword = await askQuestion('请输入加压密码：');
//         // console.log(`输入解压缩密码为: ${unzipPassword}`);
//     } catch (error) {
//         console.error(`处理文件修改时出错: ${error}`);
//     }    
// })


// watcher
//     .on('add', path => console.log(`新增 .zip 文件: ${path}`))
//     .on('unlink', path => console.log(`移除 .zip 文件: ${path}`))
//     .on('error', error => console.error(`监视器错误: ${error}`));

console.log(`开始监控目录: ${directoryToWatch}`);