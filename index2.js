import inquirer from 'inquirer';

async function diyFiles(lists) {
    try {
        const promptList = [
            {
                type: 'list',
                message: '请选择一个选项:',
                name: 'choice',
                choices: lists,
            },
        ];

        let answers = await inquirer.prompt(promptList)
        return answers.choice
    } catch (error) {
        throw new Error(`打印文件信息错误 ${error}`)
    }

}

let choice = await diyFiles(['a','b','c'])


