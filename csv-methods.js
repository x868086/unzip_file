import { createReadStream, createWriteStream, fstat } from 'node:fs';
import fastCsv from 'fas-csv'
import config from "./config.js";

// const directoryToWatch = path.join(process.cwd(), config.directoryToWatch);
const outputPath = path.join(process.cwd(), config.outputPath);





async function csvMethods(fileName) {
    const readStream = createReadStream(fileName);
    const writeStream = createWriteStream(outputPath);
    fastCsv
    .parseStream(readStream,{ headers: true })
    .transform((row,next)=>{
        console.log(row)
        return {
            ...row
        }
    })
    .pipe(fastCsv.format({headers: true}))
    .pipe(writeStream)
    .on('error', error => console.error(error))
    .on('end', rowCount => console.log(`总结 Parsed ${rowCount} rows`))
    .on('finish', () => console.log('done'))
}



export {
    csvMethods
}


// .transform((row, next) => {
//     someAsyncFunction(row, (err, transformedRow) => {
//         if (err) {
//             return next(err);
//         }
//         next(null, transformedRow);
//     });
// })