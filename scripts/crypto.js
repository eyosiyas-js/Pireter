const {createReadStream,createWriteStream,unlinkSync,existsSync,renameSync}=require('fs');
const {join}=require('path');
const {scryptSync,createCipheriv,createDecipheriv}=require('crypto');
const {readFileSync}=require('fs');

const config=JSON.parse(readFileSync(join(__dirname,'../config.json')));

const ALGORITHM={
    name:'aes-192-cbc',
    keySize:24,
    ivSize:16
}

function lock(wd,file,password,callback){

    if(existsSync(join(wd,file))){
        
        const key=scryptSync(password,'GFG',ALGORITHM.keySize);
        const iv=scryptSync(password,'GFG',ALGORITHM.ivSize);
    
        const cipher = createCipheriv(ALGORITHM.name,key,iv);
    
        const input = createReadStream(join(wd,file));
        const output = createWriteStream(join(wd,`${file}.enc`));
    
        input.pipe(cipher).pipe(output);
    
        output.on('finish',()=>{
            unlinkSync(join(wd,file));
            renameSync(join(wd,`${file}.enc`),join(wd,`${file}.enc`).replace('.enc',''));
            callback(`Encrypted ${file}`);
        });
    }else{
        callback(`Couldn't find ${file}`);
    }

};

function unlock(wd,file,password,callback){

    if(existsSync(join(wd,file))){

        const key=scryptSync(password,'GFG',ALGORITHM.keySize);
        const iv=scryptSync(password,'GFG',ALGORITHM.ivSize);
    
        const cipher = createDecipheriv(ALGORITHM.name,key,iv);
    
        const input = createReadStream(join(wd,file));
        const output = createWriteStream(join(wd,`${file}.dec`));
    
        input.pipe(cipher).pipe(output);
    
        output.on('finish',()=>{
            unlinkSync(join(wd,file));
            renameSync(join(wd,`${file}.dec`),join(wd,`${file}.dec`).replace('.dec',''));
            callback(`Decrypted ${file}`);
        });        
    }else{
        callback(`Couldn't find ${file}`);
    }

};

function encrypt(password,data){
    
        const key=scryptSync(password,'GFG',ALGORITHM.keySize);
        const iv=scryptSync(password,'GFG',ALGORITHM.ivSize);

        const cipher=createCipheriv(ALGORITHM.name,key,iv);

        return cipher.update(data,'utf-8','hex')+cipher.final('hex');

}

function decrypt(password,data){

        const key=scryptSync(password,'GFG',ALGORITHM.keySize);
        const iv=scryptSync(password,'GFG',ALGORITHM.ivSize);

        const cipher=createDecipheriv(ALGORITHM.name,key,iv);

        return cipher.update(data,'hex','utf-8')+cipher.final('utf-8');

}

module.exports={
    lock,
    unlock,
    encrypt,
    decrypt
}