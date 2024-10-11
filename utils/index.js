// 解压缩加密zip文件

const StreamZip = require('node-stream-zip');
const path = require('path');
const fs = require('fs').promises;

// 解压缩函数
async function unzipFile(filePath, outputPath, password) {
    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: filePath,
            storeEntries: true
        });

        // 设置密码
        zip.on('ready', () => {
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

module.exports = {
    unzipFile
}

