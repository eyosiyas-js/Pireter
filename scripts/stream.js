const fs=require('fs');
const path=require('path');
const { encrypt } = require('./crypto');

function stream(socket,cwd,filename,callback,config){

    if(fs.existsSync(path.join(cwd,filename))){

        const file=fs.createReadStream(path.join(cwd,filename));

        socket.emit('start-stream',config.secure?encrypt(config.key,filename):filename);

        file.on('data',chunk=>{
            socket.emit('stream',config.secure?encrypt(config.key,chunk):chunk);
        });
    
        file.on('close',()=>{
            callback('Stream successful!');
        });
    }else{
        callback(`${filename} does not exist.`);
    }

}

module.exports=stream