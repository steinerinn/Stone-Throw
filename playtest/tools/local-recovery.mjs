import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
// Explicitly reviewed predecessor formats only. Never search by account/name or guess a seat.
export function localRecovery(root,stateDir){
 const contract=JSON.parse(fs.readFileSync(path.join(root,'tools/local-recovery-contract.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'))),engine=Object.entries(manifest.files).filter(([f])=>f.startsWith('canonical/')).sort(([a],[b])=>a.localeCompare(b));
 if(digest(JSON.stringify(engine))!==contract.engineDigest)return ()=>null;
 const parent=path.dirname(path.resolve(stateDir));
 return token=>{if(!/^[a-f0-9]{64}$/.test(token))return null;
  // Do not fall back to an older reviewed save if this credential has moved to an unreviewed build.
  for(const name of fs.readdirSync(parent)){if(!/^build-[a-f0-9]{64}$/.test(name)||contract.predecessors.includes(name.slice(6))||path.join(parent,name)===path.resolve(stateDir))continue;const file=path.join(parent,name,'checkpoint.json');if(!fs.existsSync(file))continue;let candidate;try{const envelope=JSON.parse(fs.readFileSync(file,'utf8'));candidate=JSON.parse(envelope.payload);}catch{continue;}if(candidate?.local?.some(e=>e.token===token))throw Error('local-recovery-unavailable');}

  for(const build of contract.predecessors){const directory=path.join(parent,'build-'+build);if(directory===path.resolve(stateDir))continue;const file=path.join(directory,'checkpoint.json');if(!fs.existsSync(file))continue;
   const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.build!==build||saved.format!=='controlled-playtest-v1'||saved.mode!=='production'||saved.journal===true||typeof saved.payload!=='string'||digest(saved.payload)!==saved.sha256)throw Error('local-recovery-unavailable');
   const prior=JSON.parse(saved.payload).local?.find(e=>e.token===token);if(!prior)continue;
   const lock=path.join(directory,'server.lock');if(fs.existsSync(lock)){const pid=JSON.parse(fs.readFileSync(lock,'utf8')).pid;if(!Number.isInteger(pid)||pid<=0)throw Error('local-session-in-use');try{process.kill(pid,0);throw Error('local-session-in-use');}catch(e){if(e.code!=='ESRCH')throw Error('local-session-in-use');}}
   if(!prior.slots||Object.keys(prior.slots).some(m=>!['single','story'].includes(m)))throw Error('local-recovery-unavailable');
   const selected=prior.slots[prior.configuration?.story?'story':'single']||prior.slots.single||prior.slots.story;if(!selected)throw Error('local-recovery-unavailable');
   // Copy local slots only. Prior room/seat credentials and multiplayer state stay in their original store.
   return {token,configuration:selected.configuration,checkpoint:selected.checkpoint,slots:prior.slots,mode:'main-menu',localRecoveryToken:prior.localRecoveryToken,unavailableLocalRecoveryToken:prior.unavailableLocalRecoveryToken,guestIdentity:prior.guestIdentity};
  }return null;
 };
}
