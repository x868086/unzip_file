import inquirer from "inquirer";
import chalk from "chalk";
import readline from "readline";

import { input, select, confirm } from "@inquirer/prompts";

function input2(msg) {
  return input({
    message: msg
  });
}

function showList2(addFiles) {
  return select({
    message: "请选择一个.zip文件解压",
    choices: addFiles,
  });
}

function showConfirm(msg) {
  return confirm({ message: `${chalk.yellow(msg)}` });
}

export { input2, showList2,showConfirm };
