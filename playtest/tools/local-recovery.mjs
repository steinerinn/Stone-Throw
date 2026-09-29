import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
// Local save compatibility is bound to authoritative code, not presentation assets.
export function recordLocalCompatibility(root,stateDir){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json')));
 const files=Object.entries(manifest.files).filter(([f])=>f.startsWith('canonical/')||f.startsWith('server/')).sort(([a],[b])=>a.localeCompare(b));
 const record={build:digest(fs.readFileSync(path.join(root,'build-manifest.json'))),signature:digest(JSON.stringify(files))};
 fs.writeFileSync(path.join(stateDir,'local-compatibility.json'),JSON.stringify(record));
}
// Never search by account/name or guess a seat. Only the original session credential can recover.

export function localRecovery(root,stateDir){
 const contract=JSON.parse(fs.readFileSync(path.join(root,'tools/local-recovery-contract.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'))),engine=Object.entries(manifest.files).filter(([f])=>f.startsWith('canonical/')).sort(([a],[b])=>a.localeCompare(b));
 const engineDigest=digest(JSON.stringify(engine));
 const reviewed=engineDigest===contract.engineDigest?contract.predecessors:(contract.additional||[]).find(c=>c.engineDigest===engineDigest)?.predecessors||[];
 const signature=digest(JSON.stringify(Object.entries(manifest.files).filter(([f])=>f.startsWith('canonical/')||f.startsWith('server/')).sort(([a],[b])=>a.localeCompare(b))));
 const compatible=(name)=>{if(reviewed.includes(name.slice(6)))return true;try{const c=JSON.parse(fs.readFileSync(path.join(parent,name,'local-compatibility.json')));return c.build===name.slice(6)&&c.signature===signature;}catch{return false;}};
 const parent=path.dirname(path.resolve(stateDir));
 return token=>{if(!/^[a-f0-9]{64}$/.test(token))return null;
  // Do not fall back to an older reviewed save if this credential has moved to an unreviewed build.
  for(const name of fs.readdirSync(parent)){if(!/^build-[a-f0-9]{64}$/.test(name)||compatible(name)||path.join(parent,name)===path.resolve(stateDir))continue;const file=path.join(parent,name,'checkpoint.json');if(!fs.existsSync(file))continue;let candidate;try{const envelope=JSON.parse(fs.readFileSync(file,'utf8'));candidate=JSON.parse(envelope.payload);}catch{continue;}if(candidate?.local?.some(e=>e.token===token))throw Error('local-recovery-unavailable');}

  for(const build of fs.readdirSync(parent).filter(n=>/^build-[a-f0-9]{64}$/.test(n)&&compatible(n)&&fs.existsSync(path.join(parent,n,'checkpoint.json'))).sort((a,b)=>fs.statSync(path.join(parent,b,'checkpoint.json')).mtimeMs-fs.statSync(path.join(parent,a,'checkpoint.json')).mtimeMs).map(n=>n.slice(6))){const directory=path.join(parent,'build-'+build);if(directory===path.resolve(stateDir))continue;const file=path.join(directory,'checkpoint.json');if(!fs.existsSync(file))continue;
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
