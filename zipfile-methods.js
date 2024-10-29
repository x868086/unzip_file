// 解压缩加密zip文件

import StreamZip from "node-stream-zip";
import unzipper from "unzipper";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import chalk from "chalk";
import iconv from "iconv-lite";

import languageEncoding from "detect-file-encoding-and-language";

import { userInquirer } from "./inquirer-methods.js";
import config from "./config.js";

const outputPath = path.join(process.cwd());
let answers = null;
// const addFiles=[]

//验证.zip文件是否需要解压缩密码
async function needsPassword(filePath) {
  return new Promise((resolve, reject) => {
    const zip = new StreamZip({
      file: filePath,
      storeEntries: true, // 内存中缓存.zip文件的条目信息
    });

    zip.on("ready", () => {
      let requiresPassword = false;
      for (const entry of Object.values(zip.entries())) {
        if (entry.encrypted) {
          requiresPassword = true;
          break;
        }
      }
      zip.close();
      resolve(requiresPassword);
    });

    zip.on("error", (err) => {
      zip.close();
      reject(err);
    });
  });
}

//检测文件编码格式
async function detectEncode(filePath) {
  try {
    const fileInfo = await languageEncoding(filePath);
    let sourceType = fileInfo.encoding;
    let dict = {
      "UTF-8": chalk.bgGreen(`${sourceType}`),
      GB18030: chalk.bgYellow(`${sourceType}`),
    };
    return sourceType ?? "GB18030"; //为null或undefined时设置默认值
  } catch (error) {
    throw new Error(`检测文件编码格式错误, ${error}`);
  }
}

//获取文件信息
async function getFileInfo(filePath) {
  try {
    const { size, birthtime } = await fsPromises.stat(filePath);
    const birthtimeLocal = birthtime.toLocaleString();
    const fileSizeInMB = `${Math.round(size / 1024, 1)}KB`;
    const fileName = path.basename(filePath);
    const needsPWD = await needsPassword(filePath);
    const sourceType = await detectEncode(filePath);
    return {
      fileName,
      fileSizeInMB,
      birthtime,
      birthtimeLocal,
      filePath,
      needsPWD,
      sourceType,
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
    chalk.white(`最后新增的文件是: `) +
      chalk.green(`${addFiles[0].fileName}`) +
      `  ` +
      `${
        addFiles[0].needsPWD ? chalk.yellow("已加密") : chalk.white("未加密")
      }` +
      `  ` +
      `${
        addFiles[0].sourceType === "UTF-8"
          ? chalk.green(addFiles[0].sourceType)
          : chalk.yellow(addFiles[0].sourceType)
      }` +
      `  ` +
      chalk.white(addFiles[0].fileSizeInMB) +
      `  ` +
      chalk.white(addFiles[0].birthtimeLocal) +
      `  ` +
      chalk.gray(`监测文件数量:${addFiles.length}`)
  );
  return addFiles[0];
}

// 确认是否解压文件
async function isConfirmed(latestModifiedFile, addFiles) {
    answers = null;
  let prompt = [
    {
      type: "confirm",
      name: "confirmed",
      // message: `${chalk.yellow(msg)}`
      message: chalk.yellow(`是否解压缩文件:${latestModifiedFile.filePath}`),
    },
  ];
  // let {confirmed} = await userInquirer(prompt)
  answers = userInquirer(prompt);
  let { confirmed } = await answers;

  if (confirmed) {
  // unzipFile(
  //     latestModifiedFile.filePath,
  //     outputPath,
  //     latestModifiedFile.sourceType,
  //     null,
  //     addFiles
  //   )
  //     .then(({ fileSize, fileName,filePath }) => {
  //       deleteFromAddList(latestModifiedFile.filePath, addFiles);
  //       // resolve({fileSize, fileName,filePath}) 
  //       return {fileSize, fileName,filePath}
  //     })
  //     .catch(async (e) => {
  //       await chooseTargetFile(addFiles);
  //     });
    let { fileSize, fileName } = await unzipFile(
      latestModifiedFile.filePath,
      outputPath,
      latestModifiedFile.sourceType,
      null,
      addFiles
    );
    deleteFromAddList(latestModifiedFile.filePath, addFiles);
    return {fileSize, fileName}
  } else {
    // let targetFile = await chooseTargetFile(addFiles)
    // await needsPasswordUnzip(targetFile,addFiles)
    let {fileSize, fileName} = await chooseTargetFile(addFiles);
    return {fileSize, fileName}
  }
}
//确认解压缩文件是否需要密码
async function needsPasswordUnzip(latestModifiedFile, addFiles) {
  try {
    if (latestModifiedFile.needsPWD) {
        answers = null;
      let prompt = [
        {
          type: "input",
          name: "zipPassword",
          message: chalk.yellow(`请输入解压密码: `),
          mask: null,
          validate: function (value) {
            if (value.length) {
              return true;
            } else {
              return "密码不能为空!";
            }
          },
        },
      ];
      // let {zipPassword} = await userInquirer(prompt);
      answers = userInquirer(prompt);
      let { zipPassword } = await answers;

      let { fileSize, fileName } = await unzipFile(
        latestModifiedFile.filePath,
        outputPath,
        latestModifiedFile.sourceType,
        zipPassword,
        addFiles
      );
      deleteFromAddList(latestModifiedFile.filePath, addFiles);
      return {fileSize, fileName}
      // 以下写法是promise的用法，上面是promise async await的用法
      // unzipFile(latestModifiedFile.filePath,outputPath,latestModifiedFile.sourceType, zipPassword,addFiles)
      // .then(({fileSize,fileName})=>{
      //     console.log(
      //         chalk.white.bgGreen(`解压成功`)
      //         + chalk.white(`    文件名:${fileName}  文件大小:${fileSize}KB`)
      //     )
      //     deleteFromAddList(latestModifiedFile.filePath,addFiles)
      // })
      // .catch(async (e)=>{
      //      console.log(e)
      //     await chooseTargetFile(addFiles)
      // })
    } else {
      let {fileSize, fileName} = await isConfirmed(latestModifiedFile, addFiles);
      return {fileSize, fileName}
    }
  } catch (error) {
    // console.log(error)
    let {fileSize,fileName} = await chooseTargetFile(addFiles);
    return {fileSize,fileName}
  }
}

//从列表中选择一个文件
async function chooseTargetFile(addFiles) {
  if (addFiles.length === 0) {
    console.log(`${chalk.red.bold}(没有跟踪到任何文件,请重启程序:)`);
    return null;
  }
  let showList = addFiles.map((e) => {
    return e.filePath;
  });

  answers = null;
  let prompt = [
    {
      type: "list",
      name: "choice",
      message: "请选择一个.zip文件解压",
      choices: showList,
    },
  ];
  // let targetFile = await userInquirer(prompt)
  answers = userInquirer(prompt);
  let targetFile = await answers;
  let chooseIndex = addFiles.findIndex(
    (fileInfo) => fileInfo.filePath === targetFile.choice
  );
  if (chooseIndex > -1) {
    let {fileSize,fileName} = await needsPasswordUnzip(addFiles[chooseIndex], addFiles);
    return {fileSize,fileName}
  }
}

// 解压缩成功后重addList中删除已经解压缩过的文件
function deleteFromAddList(filePath, addFiles) {
  if (addFiles.length === 1) {
    //跟踪文件列表中留一个文件
    return;
  }
  let chooseIndex = addFiles.findIndex(
    (fileInfo) => fileInfo.filePath === filePath
  );
  if (chooseIndex > -1) {
    return addFiles.splice(chooseIndex, 1);
  }
}

//解压缩文件
async function unzipFile(
  filePath,
  outputPath,
  sourceType,
  unzipPassword,
  addFiles
) {
  const directory = await unzipper.Open.file(filePath);
  // console.log('directory', directory);
  var isUnicode = directory.files[0].isUnicode;
  var decodedPath = isUnicode
    ? directory.files[0].path
    : iconv.decode(directory.files[0].pathBuffer, sourceType);
  return new Promise((resolve, reject) => {
    const fileStream = directory.files[0].stream(unzipPassword);
    // 监听解压流的错误事件,如密码错误
    fileStream.on("error", (err) => {
      console.log(
        chalk.white.bgRed(`解压失败`) +
          chalk.white(
            `    文件名:${decodedPath}  文件大小:${(
              directory.files[0]["compressedSize"] / 1024
            ).toFixed(1)}KB`
          ) +
          chalk.white(`    错误信息:${err.message}`)
      );
      reject({
        err: err.message,
        fileSize: (directory.files[0]["compressedSize"] / 1024).toFixed(1),
        fileName: decodedPath,
        addFiles: addFiles
      });
    });

    const writeStream = fs.createWriteStream(decodedPath);

    writeStream.on("error", (err) => {
      console.log(
        chalk.white.bgRed(`写入文件失败`) +
          chalk.white(
            `    文件名:${decodedPath}  文件大小:${(
              directory.files[0]["compressedSize"] / 1024
            ).toFixed(1)}KB`
          )
      );
      reject(err);
    });

    writeStream.on("finish", () => {
      console.log(
        chalk.white.bgGreen(`解压成功`) +
          chalk.white(
            `    文件名:${decodedPath}  文件大小:${(
              directory.files[0]["uncompressedSize"] / 1024
            ).toFixed(1)}KB`
          )
      );
      resolve({
        fileSize: (directory.files[0]["uncompressedSize"] / 1024).toFixed(1),
        fileName: decodedPath
      });
    });

    fileStream.pipe(writeStream);
  });
}

export {
  needsPassword,
  detectEncode,
  getFileInfo,
  getLastModifiedFile,
  isConfirmed,
  needsPasswordUnzip,
  chooseTargetFile,
  unzipFile,
};
