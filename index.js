
import path from 'path';
import fs from 'fs/promises';

// const directoryToWatch = path.join(process.cwd(), config.directoryToWatch);
// const outputPath = path.join(process.cwd(), config.outputPath);

const directoryToWatch = path.join(process.cwd());
const outputPath = path.join(process.cwd());

import chokidar from 'chokidar';
import chalk from 'chalk';

import config from './config.js';
import { unzipFile, unzipFile2,needsPassword,detectEncode } from './zipfile-methods.js';
import { askForPassword,showLoadingFiles,confirmFile} from './inquirer-methods.js';


let addFiles = []; // 维护当前目录下所有.zip文件的数组
let unzipPassword = ''; //解压密码
let latestModifiedFile = ''; //维护最新添加的文件
let timerAdd = null; //维护新增文件定时器
let isLoading = false;



// 初始化监视器，只关注 .zip 文件的变化
const watcher = chokidar.watch(directoryToWatch, {
    ignored: [
        /(^|[\/\\])node_modules([\/\\]|$)/, // 忽略 node_modules 目录
        /(^|[\/\\])szxc([\/\\]|$)/, // 忽略 service_project 目录
        /(^|[\/\\])[^\/\\]*\.(?!zip)[^\/\\]*$/, // 忽略非.zip文件
    ],
    ignoreInitial: false,  // 阻止监视器启动时触发 'add' 事件
    persistent: true // 使监视器持久运行
});


//获取文件信息
async function getFileInfo(filePath) {
    try {
        const {size,birthtime} = await fs.stat(filePath);
        const birthtimeLocal = birthtime.toLocaleString();
        const fileSizeInMB = `${Math.round(size / 1024,1)}KB`;
        const fileName = path.basename(filePath);
        const needsPWD = await needsPassword(filePath);
        const souceType = await detectEncode(filePath)
        return {
            fileName,
            fileSizeInMB,
            birthtime,
            birthtimeLocal,
            filePath,
            needsPWD,
            souceType
        };
    } catch (error) {
        throw new Error(`文件不存在: ${filePath}`);
    }
}

// 获取最后创建的文件
async function getLastModifiedFile(addFiles) {
    addFiles.sort((a, b) => {
        const aStat = a.birthtime.getTime();
        const bStat = b.birthtime.getTime();
        return bStat - aStat;
    });
    addFiles.splice(config.fileListLength);
    console.log(
    chalk.gray(`最后新增的文件是: `)
    + chalk.green(`${addFiles[0].fileName}`) + `  `
    + `${addFiles[0].needsPWD ? chalk.yellow('已加密') : chalk.white('未加密')}` + `  `
    + `${(addFiles[0].souceType ==='UTF-8') ? chalk.green(addFiles[0].souceType) : chalk.yellow(addFiles[0].souceType)}` + `  `
    + chalk.white(addFiles[0].fileSizeInMB) + `  ` 
    + chalk.white(addFiles[0].birthtimeLocal) + `  `
    + chalk.gray(`监测文件数量:${addFiles.length}`))
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


//添加文件新增事件处理器
watcher.on('add', async filePath => {
    timerAdd = setTimeout(async () => {
        try {
            const fileInfo = await getFileInfo(filePath);
            console.log(`新增 .zip 文件: ${filePath}`);
            addFiles.push(fileInfo);
            // latestAddedFile = fileInfo;
            clearTimeout(timerAdd);
            // latestModifiedFile = await getLastModifiedFile(addFiles);

            latestModifiedFile={
                filePath:'D:\\Project\\unzip_file\\zip带密码.zip',
                fileName:'zip带密码.zip',
                fileSizeInMB:'1.4MB',
                birthtime:'2023-06-06T06:06:06.000Z',
                birthtimeLocal:'2023-06-06 14:06:06',
                needsPWD:true,
                souceType:'GB18030'
            }
            if(latestModifiedFile.needsPWD) {
                unzipPassword = await askForPassword();
                // 免密码的方式node-stream-zip
                // await unzipFile(latestModifiedFile.filePath, outputPath, latestModifiedFile.souceType, unzipPassword);
                

                // await unzipFile(latestModifiedFile, outputPath, unzipPassword);
                await unzipFile2(latestModifiedFile, outputPath, unzipPassword);


            } else {
                // await unzipFile(latestModifiedFile.filePath, outputPath, latestModifiedFile.souceType);
            }
        } catch (error) {
            // let errorFileIndex = addFiles.indexOf(error.path);
            let errorFileIndex = addFiles.findIndex(fileInfo => fileInfo.filePath === error.path);
            if (errorFileIndex > -1) {
                addFiles.splice(errorFileIndex, 1);
            }
            console.error(`新增文件不存在: ${error.path}`);
        }        
    },1500) //延迟1000ms，当有zip文件名修改时，等待删除原有文件后调用getLastModifiedFile遍历正确的addFiles
});



//添加文件删除事件处理器
watcher.on('unlink', async filePath => {
        try {
            console.log(`已移除 .zip 文件: ${filePath}`);
            if (latestModifiedFile.filePath === filePath) {
                latestModifiedFile = '';
            }
            // const index = addFiles.indexOf(filePath);
            const index = addFiles.findIndex(fileInfo => fileInfo.filePath === filePath);
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