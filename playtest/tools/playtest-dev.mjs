import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {startServer} from '../server/main.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function openBrowser(url){
 const child=spawn(process.env.ComSpec||'cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'});
 child.on('error',()=>console.error('Browser could not open. Open '+url+' manually.'));
}
export async function startPlaytest({stateDir=path.resolve(root,'..','playtest-state-batch4-dev'),open=openBrowser}={}){
 const options={development:true,lan:false,bind:'127.0.0.1',stateDir,publicOrigin:undefined,secureCookies:false};
 let app;try{app=await startServer({...options,port:3213});}catch(e){if(e.code!=='EADDRINUSE')throw e;console.log('Port 3213 is busy; selecting an available local port.');app=await startServer({...options,port:0});}
 console.log('Stone Throw DEVELOPMENT playtest: '+app.origin+' — keep this window open. Press Ctrl+C to stop.');
 open(app.origin);return app;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const app=await startPlaytest();let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;try{await app.close();process.exit(0);}catch(e){console.error(e.message);process.exit(1);}});}catch(e){console.error('Playtest startup failed: '+e.message+'. Close any other copy using this playtest state and retry.');process.exitCode=1;}
}
