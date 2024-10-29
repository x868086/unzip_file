import path from "path";
import { createReadStream, createWriteStream } from 'node:fs';
import fs from "fs/promises";
import fastCsv from 'fast-csv'
import ora from 'ora'
import chalk from "chalk";
import config from "./config.js";

// const directoryToWatch = path.join(process.cwd(), config.directoryToWatch);
// const outputPath = path.join(process.cwd(), config.outputPath,'test123.csv');
// const filePath = path.join(process.cwd(), 'test.csv');


// let fileName = 'test.csv'
// const cleanedData = data.replace(/[\x00-\x1F\x7F-\x9F]/g, '');




function processValues(obj, processor) {
    const result = {};
    for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
    result[key] = processor(obj[key]);
    }
}
return result;
}


async function csvTransform(filePath,outputPath) {
    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(outputPath);
    let rowCount=0;
    const spinner = ora('解析CSV...').start();

    fastCsv
    .parseStream(readStream,{ headers: true })
    .transform((data, cb) => {
        rowCount += 1;
        setImmediate(() => {
            // console.log(data)
            // console.log(`当前处理第${rowCount}行`)
            const processedObj = processValues(data, value => value.replace(/[\x00-\x1F\x7F-\x9F]/g, ''));
            // cb(null, {...data})
            // console.log(processedObj)
            cb(null,{...processedObj})
        });
    })
    .pipe(fastCsv.format({headers: true}))
    .on('error', error => {
        console.error(error) 
    })
    .on('data', row => {
        // console.log(JSON.stringify(row))
    })
    .on('end', () => {
        // console.log(`文件解析完成 ${rowCount} rows`)
    })
    .pipe(writeStream)
    .on('finish', async () => {
        // spinner.succeed(`文件写入完成  总计:${rowCount}行  路径:${outputPath}`);
        spinner.succeed(`${chalk.bgGreen(`转存成功`)}  总计 ${chalk.green(rowCount)} 行    路径 ${outputPath}`);
        await deleteCSVFile(filePath)
        // console.log(`文件写入完成, 总计${rowCount}行`)
    })
}

async function deleteCSVFile(filePath) {
    try {
        // await fs.promises.unlink(filePath);
        await fs.unlink(filePath)
        console.log(`文件 ${filePath} 已删除`);
    } catch (err) {
        console.error(`删除文件 ${filePath} 失败: ${err}`);
    }
}


export {
    csvTransform,
}



// .transform((row, next) => {
//     someAsyncFunction(row, (err, transformedRow) => {
//         if (err) {
//             return next(err);
//         }
//         next(null, transformedRow);
//     });
// })