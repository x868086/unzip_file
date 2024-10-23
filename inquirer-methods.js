import inquirer from "inquirer";
import chalk from "chalk";
import readline from "readline";

function clearScreen() {
  // const rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  // });

  // rl.output.write('\x1Bc'); // 发送 ANSI 清屏命令
  // rl.close();
    process.stdout.write("\u001b[2J\u001b[0;0H");
}

// 示例：提示用户输入密码
async function askForPassword() {
    try {
    const answers = await inquirer.prompt([
        {
        type: "input",
        name: "zipPassword",
        message: chalk.yellow(`请输入解压密码: `),
        mask: null,
        validate: function (value) {
            if (value.length) {
            return true;
            } else {
            return "密码不能为空!";
            }
        },
        },
    ]);
    // return answers.zipPassword;
    return answers;
    } catch (error) {
    console.log("输入密码时发生错误:", error);
    }
}

//显示当前加载文件的列表
async function showLoadingFiles(addFiles) {
    try {
    const answers = await inquirer.prompt([
        {
        // type: 'rawlist',
        // name: 'topping',
        type: "list",
        name: "choice",
        message: "请选择一个.zip文件解压",
        choices: addFiles,
        },
    ]);
    // return answers.topping;
    return answers;
    } catch (error) {
    console.error("选择文件时发生错误:", error);
    return null;
    }
}

// 确认界面
async function confirmedFile(msg) {
    try {
    const answers = await inquirer.prompt([
        {
        type: "confirm",
        name: "confirmed",
        message: `${chalk.yellow(msg)}`,
        },
    ]);
    // return answers.confirmed;
    return answers;
    } catch (error) {
    console.error("确认时发生错误:", error);
    }
}

function userInquirer(prompt) {
    const answers = inquirer.prompt(prompt);
    return answers;
}

// async function userInquirer(prompt) {
//     const answers = await inquirer.prompt(prompt);
//     return answers;
// }

// const prompts = {
//     askForPassword:[
//         {
//             type: 'input',
//             name: 'zipPassword',
//             message: chalk.yellow(`请输入解压密码: `),
//             mask:null,
//             validate: function (value) {
//                 if (value.length) {
//                     return true;
//                 } else {
//                     return '密码不能为空!';
//                 }
//             }
//         }
//     ],
//     showLoadingFiles:[
//             {
//             type: 'list',
//             name: 'choice',
//             message: '请选择一个.zip文件解压',
//             choices: addFiles
//             }
//     ],
//     confirmedFile:[
//         {
//             type: 'confirm',
//             name:'confirmed',
//             message: `${chalk.yellow(msg)}`
//         }
//     ]
// }

export { userInquirer, clearScreen };
