# unzip_file

##### 1. 需求1. 命令行中增加当前文件的列表，并显示最后新增的文件或者最后重命名的文件，提供光标可移动选择项
 - 将path.resolve改城path.join，参考file_encode/index.js项目
 - 只跟踪最近添加的5个文件，通过inquirer向用户展示可选列表
 - https://github.com/SBoudrias/Inquirer.js/tree/inquirer%408.2.6?tab=readme-ov-file#examples
 - 将项目改成esm模块，将inquirer升级到9.2.12，验证文件选择是否能用方向按键
 - 添加ora库，显示进度条
 - 解压最后新增的文件，如果输入密码错误，则加载文件列表。包含路径，创建日期，文件大小（灰色字体），是否加密（黄色，绿色）
