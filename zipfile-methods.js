// 解压缩加密zip文件

import StreamZip from 'node-stream-zip';
import unzipper  from 'unzipper';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import chalk from 'chalk';
import iconv from 'iconv-lite'

import languageEncoding from 'detect-file-encoding-and-language'




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
        return souceType ?? 'GB18030'  //???
    } catch (error) {
        throw new Error(`检测文件编码格式错误, ${error}`)
    }

}


async function unzipFile2(file, outputDir,password) {
    // 创建可读流
    const readStream = fs.createReadStream(file.filePath);

    const sourceEncoding = (file.souceType).toLowerCase();

    // 创建一个解码流转换原始编码到UTF-8
    const decodeStream = iconv.decodeStream(sourceEncoding);
    const encodeStream = iconv.encodeStream('utf8');

// 监听数据事件

readStream
.pipe(decodeStream)  // 解码到中间编码（通常是 UTF-8）
.pipe(encodeStream)  // 重新编码回 UTF-8 (确保处理后是有效的 UTF-8 数据)
.on('data', (chunk) => {
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


export {
    needsPassword,
    detectEncode,
    unzipFile,
    unzipFile2
}

