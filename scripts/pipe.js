const fs=require('fs');
const path=require('path');
const {encrypt,decrypt}=require('../scripts/crypto');

function pipe(socket,filename,config){

    if(fs.existsSync(filename)){

        const file=fs.createReadStream(path.join(process.cwd(),filename));

        socket.emit('start-pipe',config.secure?encrypt(config.key,filename):filename);

        file.on('data',chunk=>{
            socket.emit('pipe',config.secure?encrypt(config.key,chunk):chunk);
        });
    
        file.on('close',()=>{
            socket.emit('end-pipe',config.secure?'Pipe successful!':'Pipe successful!');
        });
    }else{
        socket.emit('err-pipe',config.secure?encrypt(config.key,`${filename} does not exist.`):`${filename} does not exist.`);
    }

}

module.exports=pipe