import path from "path";
import fs from "fs/promises";

// const directoryToWatch = path.join(process.cwd(), config.directoryToWatch);
// const outputPath = path.join(process.cwd(), config.outputPath);

const directoryToWatch = path.join(process.cwd());
const outputPath = path.join(process.cwd());

import chokidar from "chokidar";
import chalk from "chalk";

import config from "./config.js";
import {
  getFileInfo,
  getLastModifiedFile,
  needsPasswordUnzip,
} from "./zipfile-methods.js";
import { clearScreen } from "./inquirer-methods.js";

import {csvMethods} from './csv-methods.js'

let addFiles = []; // 维护当前目录下所有.zip文件的数组
let latestModifiedFile = ""; //维护最新添加的文件
let timerAdd = null; //维护新增文件定时器
let isLoading = false; //维护首次读取频率，提高性能，还未实现？？？

// 初始化监视器，只关注 .zip 文件的变化
const watcher = chokidar.watch(directoryToWatch, {
  ignored: [
    /(^|[\/\\])node_modules([\/\\]|$)/, // 忽略 node_modules 目录
    /(^|[\/\\])szxc([\/\\]|$)/, // 忽略 service_project 目录
    /(^|[\/\\])[^\/\\]*\.(?!zip)[^\/\\]*$/, // 忽略非.zip文件
  ],
  ignoreInitial: true, // 阻止监视器启动时触发 'add' 事件
  persistent: true, // 使监视器持久运行
});

//添加文件新增事件处理器
watcher.on("add", async (filePath) => {
  timerAdd = setTimeout(async () => {
    try {
      clearScreen();
      const fileInfo = await getFileInfo(filePath);
      console.log(`新增 .zip 文件: ${filePath}`);
      addFiles.push(fileInfo);
      clearTimeout(timerAdd);
      latestModifiedFile = await getLastModifiedFile(addFiles);
      let {fileName} = await needsPasswordUnzip(latestModifiedFile, addFiles);
      console.log(fileName)
    } catch (error) {
      // let errorFileIndex = addFiles.indexOf(error.path);
      let errorFileIndex = addFiles.findIndex(
        (fileInfo) => fileInfo.filePath === error.path
      );
      if (errorFileIndex > -1) {
        addFiles.splice(errorFileIndex, 1);
      }
      console.error(`新增文件不存在: ${error}`);
    }
  }, 1500); //延迟1000ms，当有zip文件名修改时，等待删除原有文件后调用getLastModifiedFile遍历正确的addFiles
});

//添加文件删除事件处理器
watcher.on("unlink", async (filePath) => {
  try {
    console.log(`已移除 .zip 文件: ${filePath}`);
    if (latestModifiedFile.filePath === filePath) {
      latestModifiedFile = "";
    }
    // const index = addFiles.indexOf(filePath);
    const index = addFiles.findIndex(
      (fileInfo) => fileInfo.filePath === filePath
    );
    if (index > -1) {
      addFiles.splice(index, 1);
    }
  } catch (error) {
    console.error(`处理移除文件时出错: ${error}`);
  }
});

// 添加错误事件处理器
watcher.on("error", async (error) => {
  console.error(`监视器错误: ${error}`);
  // 在这里可以进行异步错误处理
  // await someAsyncErrorHandlingFunction(error);
  console.log(chalk.red(`请重启程序`));
});

console.log(`开始监控目录: ${directoryToWatch}`);
