const AutoLaunch=require('auto-launch');
const {platform}=require('os');

function install(path,name){

    let extension='';

    if(platform()=='win32'){
        extension='.exe';
    }
    else if(platform()=='darwin'){
        extension='.app';
    }

    const App=new AutoLaunch({
        name:name,
        path:path+extension
    });
     
    App.enable();     
     
    App.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            return;
        }
        App.enable();
    })
    .catch(function(err){
        
    });
}

function uninstall(path,name,callback){

    let extension='';

    if(platform()=='win32'){
        extension='.exe';
    }
    else if(platform()=='darwin'){
        extension='.app';
    }

    const App=new AutoLaunch({
        name:name,
        path:path+extension
    });
     
    App.disable();     
     
    App.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            App.disable();
        }else{
            callback('Uninstalled successfully');
        }
    })
    .catch(function(err){
        callback(err);
    });
}

module.exports={
    install,
    uninstall
}