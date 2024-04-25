const chalk=require('chalk');
const {readFileSync}=require('fs');
const {join}=require('path');

function help(){
   const commands=readFileSync(join(process.cwd(),'help.txt'),'utf8');
   console.log(chalk.hex('#ffe0a0')(commands));
}

help();