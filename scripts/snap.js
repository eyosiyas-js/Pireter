const screenshot=require('screenshot-desktop');
const fs=require('fs');
const path=require('path');
const {homedir}=require('os');
const {encrypt}=require('../scripts/crypto');

function snap(socket,format,callback,config){
    screenshot({format:format}).then((img) => {

        const file=path.join(homedir(),`./shot.${format}`);

        socket.emit('start-snap',config.secure?encrypt(config.key,format):format);

        fs.writeFileSync(file,img);
        const shot=fs.createReadStream(file);

        shot.on('data',chunk=>{
            socket.emit('snap',config.secure?encrypt(config.key,chunk):chunk);
        });

        shot.on('close',()=>{
            callback('Screenshot taken!');
            fs.unlinkSync(file);
        })

      }).catch((err) => {
        callback(err);
      })
}

module.exports=snap