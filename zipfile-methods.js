// 解压缩加密zip文件

import StreamZip from 'node-stream-zip';
import path from 'path';
import { promises as fs } from 'fs';

//验证.zip文件是否需要解压缩密码
async function needsPassword(filePath) {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: filePath,
            storeEntries: true // 内存中缓存.zip文件的条目信息
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


// 解压缩文件
async function unzipFile(filePath, outputPath, password = null) {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: filePath,
            storeEntries: true
        });

        zip.on('ready', () => {
            // 仅在提供了密码时设置密码
            if (password) {
                zip.password = password;
            }

            // 创建解压目标目录
            fs.mkdir(outputPath, { recursive: true })
                .then(() => {
                    zip.extract(null, outputPath, (err, count) => {
                        zip.close(); // 关闭 zip 文件
                        if (err) {
                            reject(err);
                        } else {
                            resolve(count);
                        }
                    });
                })
                .catch(err => reject(err));
        });

        zip.on('error', (err) => {
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
    unzipFile
}

