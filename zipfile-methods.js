// 解压缩加密zip文件

import StreamZip from 'node-stream-zip';
import unzipper  from 'unzipper';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import chalk from 'chalk';
import iconv from 'iconv-lite'

import languageEncoding from 'detect-file-encoding-and-language'
import chardet from 'chardet';



//验证.zip文件是否需要解压缩密码
async function needsPassword(filePath) {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: filePath,
            storeEntries: true, // 内存中缓存.zip文件的条目信息
        });

        zip.on('ready', () => {
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

        zip.on('error', (err) => {
            zip.close();
            reject(err);
        });
    });
}


//检测文件编码格式
async function detectEncode(filePath) {
    try {
        const fileInfo = await languageEncoding(filePath)
        let souceType = fileInfo.encoding
        let dict = {
            'UTF-8': chalk.bgGreen(`${souceType}`),
            'GB18030': chalk.bgYellow(`${souceType}`)
        }
        const buffer = fs.readFileSync(filePath)
        const detectedEncoding = chardet.detect(buffer)
        // return souceType
        return detectedEncoding
        // console.log(`文件当前编码格式:${dict[souceType]} 文件路径:${filePath}`)
        //     let dict = {
        //         ['UTF-8']:'utf8',
        //         GBK:'gbk',
        //         GB18030:'gb2312'
        //     }
        // return dict[souceType] ?? 'gbk' //空值合并运算符 (??) 在只有当值为 null 或 undefined 时才使用默认值
    } catch (error) {
        throw new Error(`检测文件编码格式错误, ${error}`)
    }

}

// 解压缩文件
// async function unzipFile(filePath, outputPath, encode,password = null) {
//     return new Promise((resolve, reject) => {
//         const zip = new StreamZip({
//             file: filePath,
//             storeEntries: true,
//             nameEncoding:encode
//         });

//         zip.on('ready', () => {
//             // 仅在提供了密码时设置密码
//             if (password) {
//                 zip.password = password;
//             }

//             // 创建解压目标目录
//             fs.mkdir(outputPath, { recursive: true })
//                 .then(() => {
//                     zip.extract(null, outputPath, (err, count) => {
//                         zip.close(); // 关闭 zip 文件
//                         if (err) {
//                             reject(`解压失败: ${err.message}`);
//                         } else {
//                             resolve(count);
//                         }
//                     });
//                 })
//                 .catch(err => reject(`创建目标目录失败: ${err.message}`));
//         });

//         zip.on('error', (err) => {
//             reject(`打开 ZIP 文件失败: ${err.message}`);
//         });
//     });
// }


//解压缩文件
async function unzipFile(file, outputDir, password) {
    return new Promise((resolve, reject) => {
        // // 创建可读流
        // const readStream = fs.createReadStream(file.filePath);
        
        // // 创建解压流
        // const unzipStream = readStream.pipe(iconv.decodeStream((file.souceType).toLowerCase()))
        // .pipe(iconv.encodeStream('utf8'))
        // .pipe(unzipper.Parse());

        // // 创建可读流
        // const readStream = fs.createReadStream(file.filePath);

        // // 创建解压流
        // const unzipStream = readStream.pipe(unzipper.Parse());


        const readStream = fs.createReadStream(file.filePath);
        // const writeStream = createWriteStream(outputDir);

        // readStream.on('data', e => {
        //     loading.text = 'Loading...'
        //     loading.start()
        // })

        readStream
            .pipe(iconv.decodeStream((file.souceType).toLowerCase()))
            .pipe(iconv.encodeStream('utf8'))
        const unzipStream = readStream.pipe(unzipper.Parse());
            // .pipe(writeStream);


        // 处理解压事件
        unzipStream
            .on('entry', (entry) => {
                const originalPath = entry.path;
                // 转换文件名编码
                const decodedPath = iconv.decode(new Buffer(originalPath, 'binary'), file.souceType).toString();
                // 检查是否为文件
                if (entry.type === 'File') {
                    // 设置密码
                    entry.password = password;

                    // 获取输出路径
                    // const outputPath = `${outputDir}/${entry.path}`;
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




// // 示例：解压一个加密的 .zip 文件
// const zipFilePath = path.resolve(__dirname, 'your-file.zip');
// const extractToPath = path.resolve(__dirname, 'extracted-files');
// const zipPassword = 'your-password';

// unzipFile(zipFilePath, extractToPath, zipPassword)
//     .then(count => console.log(`成功解压 ${count} 个文件到 ${extractToPath}`))
//     .catch(err => console.error(`解压文件时出错: ${err}`));

export {
    needsPassword,
    detectEncode,
    unzipFile
}

