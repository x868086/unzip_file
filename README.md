使用caxa打包nodejs应用
1. 安装caxa 
npm install caxa --save-dev
2. 在nodejs项目目录下执行
`npx caxa --input ./ --output ./test.exe -- node index.js `
- 参数说明,源目录在当前项目目录下,打包程序的输出目录在当前目项目目录下，且打包后的应用名称为test.exe
3. 注意事项，caxa打包后的应用程序，仍然需要项目目录下的node_modules目录，且打包后的程序需要依赖项目下的源代码，所以打包后的程序不能仅依靠test.ext文件单独运行
