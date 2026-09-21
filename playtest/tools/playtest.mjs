import {localRecovery} from './local-recovery.mjs';
import {registryDirectory} from '../server/registry.mjs';
import fs from 'node:fs';
import os from 'node:os';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {startServer} from '../server/main.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function openBrowser(url){
 const child=spawn(process.env.ComSpec||'cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'});
 child.on('error',()=>console.error('Browser could not open. Open '+url+' manually.'));
}
// Recovery checkpoints are build-bound. Keep each build's saves/locks separate;
// never erase, relabel or bypass an earlier build's recovery state.
export function playtestStateDirectory(lan=false){
 const build=createHash('sha256').update(fs.readFileSync(path.join(root,'build-manifest.json'))).digest('hex');
 return path.resolve(root,'..','playtest-state-registry-phase2-'+(lan?'lan':'local'),'build-'+build);
}
export async function startPlaytest({lan=false,stateDir=playtestStateDirectory(lan),open=openBrowser}={}){
 if(lan){process.env.ST_PLAGUE_CAPTURE_DIR=path.join(stateDir,'plague-diagnostics');console.log('Game Log private capture folder (Settings OFF by default): '+process.env.ST_PLAGUE_CAPTURE_DIR+' (bounded; checkpoint journal disabled)');}
 const options={hofPlaytest:true,statisticsInspector:true,recoverLocalSession:localRecovery(root,stateDir),playtestSnapshotOnly:true,betaGameLog:lan,development:false,lan,bind:lan?'0.0.0.0':'127.0.0.1',stateDir,publicOrigin:undefined,secureCookies:false};
 let app;try{app=await startServer({...options,port:3212});}catch(e){if(!['EADDRINUSE','EACCES'].includes(e.code))throw e;console.log('Port 3212 is unavailable ('+e.code+'); selecting an available local port.');app=await startServer({...options,port:0});}
 console.log('Chain Siege private Registry: '+registryDirectory());
 console.log('Chain Siege playtest: '+app.origin+' — keep this window open. Press Ctrl+C to stop.');
 if(lan){const port=new URL(app.origin).port;for(const address of Object.values(os.networkInterfaces()).flat().filter(a=>a?.family==='IPv4'&&!a.internal))console.log('Phone / second device: http://'+address.address+':'+port);}
 open(app.origin);return app;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const app=await startPlaytest({lan:process.argv.includes('--lan')});let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;try{await app.close();process.exit(0);}catch(e){console.error(e.message);process.exit(1);}});}catch(e){console.error('Playtest startup failed: '+e.message+'. Close any other copy using this playtest state and retry.');process.exitCode=1;}
}
