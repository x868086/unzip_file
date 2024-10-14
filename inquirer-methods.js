import inquirer from 'inquirer';
// import colors from 'colors';
import chalk from 'chalk';



// 示例：提示用户输入密码
async function askForPassword() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'zipPassword',
                message: `${chalk.yellow.bold}(请输入压缩文件密码:)`,
            }
        ]);
        return answers.zipPassword;        
    } catch (error) {
        console.log('输入密码时发生错误:', error);
    }
}

//显示当前加载文件的列表
async function showLoadingFiles(addFiles){
    if (addFiles.length === 0) {
        console.log(`${chalk.red.bold}(没有跟踪到任何文件,请重启程序:)`);
        return null;
    }

    try {
        const answers = await inquirer.prompt([
            {
            // type: 'rawlist',
            // name: 'topping',
            type: 'list',
            name: 'choice',
            message: '请选择一个.zip文件',
            choices: addFiles
            }
        ])
        // return answers.topping;         
        return answers.choice;         
    } catch (error) {
        console.error('选择文件时发生错误:', error);
        return null;
    }

}

// 确认当前加载文件是否正确
async function confirmFile(file){
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name:'confirmed',
                message: `${chalk.yellow.bold}(是否确认解压缩文件:) ${file}`
            }
        ])
        return answers.confirmed;        
    } catch (error) {
        console.error('确认文件时发生错误:', error);
    }

}


async function testFiles(){
    try {
        const promptList = [
            {
                type: 'list',
                message: '请选择一个选项:',
                name: 'choice',
                choices: ['a','b','c'],
            },
        ];

        let answers = await inquirer.prompt(promptList)
        return answers.choice
    } catch (error) {
        throw new Error(`打印文件信息错误 ${error}`)
    }

}


export {
    askForPassword,
    showLoadingFiles,
    testFiles,
    confirmFile   
}

