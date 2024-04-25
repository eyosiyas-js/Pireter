const localtunnel=require('localtunnel');
const chalk=require('chalk');

async function tunnel(port,domain){
    const host=await localtunnel({port:port,subdomain:domain||undefined});

    host.url;

    console.log(`${chalk.yellowBright(host.url)}`);
  
    host.on('close', () => {
        console.log('Tunnel Closed');
    });
};

module.exports=tunnel
