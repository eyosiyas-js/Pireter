const {exec}=require('child_process');

function shell(cwd,command,callback){
exec(command,{cwd:cwd,stdio:'inherit'},(error, stdout, stderr) => {
        if (error) {
            callback(error);
        }
        else if(stderr){
            callback(stderr);
        }
        else{
            callback(stdout);
        }
    });

}

module.exports=shell;