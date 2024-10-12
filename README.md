# unzip_file

##### 1. 需求1. 命令行中增加当前文件的列表，并显示最后新增的文件或者最后重命名的文件，提供光标可移动选择项
 - 将path.resolve改城path.join，参考file_encode/index.js项目
 - 只跟踪最近添加的5个文件，通过inquirer向用户展示可选列表
