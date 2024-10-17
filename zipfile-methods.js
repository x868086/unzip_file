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
        let sourceType = fileInfo.encoding
        let dict = {
            'UTF-8': chalk.bgGreen(`${sourceType}`),
            'GB18030': chalk.bgYellow(`${sourceType}`)
        }
        return sourceType ?? 'GB18030'  //为null或undefined时设置默认值
    } catch (error) {
        throw new Error(`检测文件编码格式错误, ${error}`)
    }

}




//解压缩文件
async function unzipFile(filePath,outputPath,sourceType,unzipPassword) {

    try {
        const directory = await unzipper.Open.file(filePath);
        console.log('directory', directory);
        var isUnicode = directory.files[0].isUnicode;
        var decodedPath = isUnicode ? directory.files[0].path : iconv.decode(directory.files[0].pathBuffer, sourceType);
        return new Promise( (resolve, reject) => {
            const fileStream = directory.files[0].stream(unzipPassword);
        // 监听解压流的错误事件
        fileStream.on('error', (err) => {
            reject(err);
        });
        const writeStream = fs.createWriteStream(decodedPath);
        writeStream.on('error', (err) => {
            reject(err);
        });

        writeStream.on('finish', () => {
            resolve({
                fileSize:(directory.files[0]['uncompressedSize']/1024).toFixed(1),
                fileName:decodedPath                
            });
        });

        fileStream.pipe(writeStream);        

            // directory.files[0]
            // .stream(unzipPassword)
            // .pipe(fs.createWriteStream(decodedPath))
            // .on('finish',resolve)
            // .on('error',reject)



            // directory.files[0]
            // .stream(unzipPassword)
            // .pipe(fs.createWriteStream(decodedPath))
            // .on('finish',resolve)
            // .on('error',reject('error'))
            // .on('finish',()=>{ // 这里是否改成resolve() ???
            //     resolve({
            //         fileSize:(directory.files[0]['uncompressedSize']/1024).toFixed(1),
            //         fileName:decodedPath
            //     })
            // })
            // .on('finish',
            //     resolve({
            //         fileSize:(directory.files[0]['uncompressedSize']/1024).toFixed(1),
            //         fileName:decodedPath
            //     })
            // )

            // let abc = stream  stream.on() ???
        });        
    } catch (error) {
        console.log(error)
    }
    
}


export {
    needsPassword,
    detectEncode,
    unzipFile
}

