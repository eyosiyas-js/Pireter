const {exec}=require('child_process');
const {platform}=require('os');
const path=require('path');
const fs=require('fs');
const ora=require('ora');

function compile(file,name){

  const spinner=ora('Compiling').start();

  let extension='';

  if(platform()=='win32'){
    extension='.exe';
  }
  else if(platform()=='darwin'){
    extension='.app';
  }

  exec(`npx caxa -i . -o "./dist/${name+extension}" -- "{{caxa}}/node_modules/.bin/pm2" "start" "{{caxa}}/src/${file}"`,(err,stdout,stderr)=>{
	if(err){
	spinner.stop('Error');
	console.log(err);
	}
	else if(stderr){
	spinner.stop('Error');
	console.log(stderr);
	}
	else{
	spinner.succeed('Compiled Successfully');
	}
  });

}

const configFile=path.join(__dirname,'../config.json');
const config=JSON.parse(fs.readFileSync(configFile,'utf-8'));

const file=process.argv[2];
const name=config.name;

compile(file,name);