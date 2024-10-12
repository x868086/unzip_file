const inquirer = require('inquirer');
const colors = require('colors');

// 示例：提示用户输入密码
async function askForPassword() {
    const answers = await inquirer.prompt([
        {
            type: 'password',
            name: 'zipPassword',
            message: '请输入压缩文件密码:'.yellow,
            mask: '*'
        }
    ]);

    return answers.zipPassword;
}


module.exports = {
    askForPassword
}


