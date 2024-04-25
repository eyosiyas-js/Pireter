const NodeWebcam=require('node-webcam');
const fs=require('fs');
const path=require('path');
const {encrypt,decrypt}=require('../scripts/crypto');
const {homedir}=require('os');

function capture(socket,format,callback,config){
const opts = {
    output:format,
};

const file=path.join(homedir(),'./cam')

NodeWebcam.capture(file, opts, function(err,data){
    if(err){
        callback(err);
    }
        socket.emit('start-capture',config.secure?encrypt(format):format);

    const pic=fs.createReadStream(`${file}.${format}`);

    pic.on('data',chunk=>{
        socket.emit('capture',config.secure?encrypt(config.key,chunk):chunk);
    });

    pic.on('close',()=>{
        callback('Capture complete!');
        fs.unlinkSync(`${file}.${format}`);
    })


})
}

module.exports=capture