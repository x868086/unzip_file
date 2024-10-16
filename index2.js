
import path from 'path';
import unzipper  from 'unzipper';
import fs from 'fs';
import iconv from 'iconv-lite'


const outputPath = path.join(process.cwd());

import { detectEncode } from './zipfile-methods.js';

// let latestModifiedFile={
//     filePath:'D:\\Project\\unzip_file\\新建 XLSX 工作表.xlsx',
//     fileName:'新建 XLSX 工作表.xlsx'
// }

let latestModifiedFile={
    filePath:'D:\\Project\\unzip_file\\免加密的文件.zip',
    fileName:'免加密的文件.zip',
    fileSizeInMB:'1.4MB',
    birthtime:'2023-06-06T06:06:06.000Z',
    birthtimeLocal:'2023-06-06 14:06:06',
    needsPWD:true,
    souceType:'GB18030'
}

async function unzipFile2(latestModifiedFile) {
    // 创建可读流
    let souceType=await detectEncode(latestModifiedFile.filePath)
    console.log(`编码格式为：${souceType}`)
    


    const readStream = fs.createReadStream(latestModifiedFile.filePath);

    const sourceEncoding = (souceType.toLowerCase());

    // // 创建一个解码流转换原始编码到UTF-8
    const decodeStream = iconv.decodeStream(sourceEncoding);
    const encodeStream = iconv.encodeStream('utf8');

// 监听数据事件

readStream
.pipe(decodeStream)  // 解码到中间编码（通常是 UTF-8）
.pipe(encodeStream)  // 重新编码回 UTF-8 (确保处理后是有效的 UTF-8 数据)

readStream.on('data', (chunk) => {
    console.log(chunk.toString());  // 此处的 chunk 将是正确编码的字符串
});


// 监听结束事件
readStream.on('end', () => {
console.log('读取完成');
});

// 监听错误事件
readStream.on('error', (err) => {
console.error('读取过程中发生错误:', err);
});
}


//解压缩文件
async function unzipFile(file, outputDir, password) {
    return new Promise((resolve, reject) => {
        // 创建可读流
        const readStream = fs.createReadStream(file.filePath);

        //创建解压流
        const unzipStream = readStream.pipe(unzipper.Parse());


        // 处理解压事件
        unzipStream
            .on('entry', (entry) => {
                var isUnicode = entry.props.flags.isUnicode;
                // Archives created by legacy tools usually have filenames encoded with IBM PC (Windows OEM) character set.
                // You can decode filenames with preferred character set
                var decodedPath = isUnicode ? entry.path : iconv.decode(entry.props.pathBuffer, file.souceType);

                // 检查是否为文件
                if (entry.type === 'File') {
                    // 设置密码
                    entry.password = password;
                    // 获取输出路径
                    const outputPath = path.join(outputDir, decodedPath);
                    
                    // 创建写入流
                    const writeStream = fs.createWriteStream(outputPath);

                    // 将数据写入文件
                    entry.pipe(writeStream);

                    // 监听写入完成事件
                    writeStream.on('finish', () => {
                        writeStream.close();
                    });

                    // 错误处理
                    writeStream.on('error', (err) => {
                        reject(err);
                    });
                }

                // 移动到下一个条目
                entry.autodrain();
            })
            .on('close', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

async function unzipFile3(latestModifiedFile) {

    fs.createReadStream(latestModifiedFile.filePath)
    .pipe(unzipper.Parse())
    .on('entry', function (entry) {
    // if some legacy zip tool follow ZIP spec then this flag will be set
    const isUnicode = entry.props.flags.isUnicode;
    // decode "non-unicode" filename from OEM Cyrillic character set
    const fileName = isUnicode ? entry.path : iconv.decode(entry.props.pathBuffer, 'GB18030');
    const type = entry.type; // 'Directory' or 'File'
    const size = entry.vars.uncompressedSize; // There is also compressedSize;
    // if (fileName === "Текстовый файл.txt") {
    //     entry.pipe(fs.createWriteStream(fileName));
    // } else {
    //     entry.autodrain();
    // }
    if (entry.type === "File") {
        entry.pipe(fs.createWriteStream(fileName));
    } else {
        entry.autodrain();
    }
    });
}

// 解压缩加密文件的方法
async function unzipFile4(file) {
        const directory = await unzipper.Open.file(file.filePath);
        console.log('directory', directory);
        var isUnicode = directory.files[0].isUnicode;
        var decodedPath = isUnicode ? directory.files[0].path : iconv.decode(directory.files[0].pathBuffer, file.souceType);
        return new Promise( (resolve, reject) => {
        directory.files[0]
            .stream('a123')
            .pipe(fs.createWriteStream(decodedPath))
            .on('error',reject)
            .on('finish',resolve)
        });
}

// 解压缩非加密文件的方法
async function unzipFile5(file) {
    const directory = await unzipper.Open.file(file.filePath);
    console.log('directory', directory);
    var isUnicode = directory.files[0].isUnicode;
    var decodedPath = isUnicode ? directory.files[0].path : iconv.decode(directory.files[0].pathBuffer, file.souceType);
    return new Promise( (resolve, reject) => {
    directory.files[0]
        .stream()
        .pipe(fs.createWriteStream(decodedPath))
        .on('error',reject)
        .on('finish',resolve)
    });
}





(async () => {
    try {
        // await unzipFile(latestModifiedFile,outputPath,'a123')
        // await unzipFile3(latestModifiedFile) //非加密的zip文件
        // await unzipFile4(latestModifiedFile) //可解压缩加密zip文件
        await unzipFile5(latestModifiedFile)

    } catch (error) {
        console.log(error)
    }
})()

