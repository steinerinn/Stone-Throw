import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
// Only the initial rollback to an unversioned reader needs this operation.
// That reader cannot decode journals above V8's string limit. Preserve every
// original file and publish a legacy-compatible snapshot of the LATEST state.
export async function legacyRollback({storeModule,stateDir,build,id}){
 if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Invalid transaction ID');
 const dir=path.resolve(stateDir),evidence=path.join(dir,'.deploy-legacy-rollback-'+id),checkpoint=path.join(dir,'checkpoint.json'),journal=path.join(dir,'checkpoint.journal'),replacement=path.join(evidence,'replacement.json'),planFile=path.join(evidence,'plan.json');
 fs.mkdirSync(evidence,{recursive:true,mode:0o700});const digest=s=>createHash('sha256').update(s).digest('hex');
 const syncDir=d=>{if(process.platform==='win32')return;const fd=fs.openSync(d,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
 const write=(file,text)=>{const fd=fs.openSync(file+'.tmp','w',0o600);try{fs.writeFileSync(fd,text);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(file+'.tmp',file);syncDir(path.dirname(file));};
 if(fs.existsSync(path.join(evidence,'complete.json')))return {restored:true,evidence,reused:true};
 let plan;
 if(fs.existsSync(planFile)){plan=JSON.parse(fs.readFileSync(planFile,'utf8'));if(plan.build!==build)throw Error('Rollback build mismatch');}
 else{
  const moduleDir=path.dirname(storeModule),load=name=>import(pathToFileURL(path.join(moduleDir,name)));
  const [{journalRecords},{archiveDecoder},{loadRecoveryCache},{stateVersion}]=await Promise.all(['journal-reader.mjs','archive-wire.mjs','recovery-cache.mjs','persistence-contract.mjs'].map(load));
  const base=JSON.parse(fs.readFileSync(checkpoint,'utf8'));
  if(base.format!=='controlled-playtest-v1'||base.mode!=='production'||digest(base.payload)!==base.sha256||(base.stateVersion!==undefined&&base.stateVersion!==stateVersion))throw Error('Invalid legacy rollback checkpoint');
  let value=JSON.parse(base.payload,(_,v)=>v&&v.$map?new Map(v.$map):v),sequence=0,previous='',end=0,decode=archiveDecoder();
  if(base.journal&&!fs.existsSync(journal))throw Error('Missing authoritative journal');
  if(fs.existsSync(journal)){
   const cache=loadRecoveryCache(path.join(dir,'recovery-cache.json'),journal,stateVersion,'production',base.build);
   if(cache)try{value=decode(cache.packet);sequence=cache.sequence;previous=cache.previous;end=cache.end;}catch{decode=archiveDecoder();}
   for(const row of journalRecords(journal,end)){const r=JSON.parse(row.line);if(r.sequence!==sequence+1||r.previous!==previous||digest(r.payload)!==r.sha256)throw Error('Invalid rollback journal checksum');const entry=JSON.parse(r.payload);if(entry.format!=='controlled-playtest-v1'||entry.mode!=='production'||entry.build!==base.build||(entry.stateVersion!==undefined&&entry.stateVersion!==stateVersion))throw Error('Incompatible rollback journal');if(entry.reset)decode=archiveDecoder();value=decode(entry.packet);sequence=r.sequence;previous=r.sha256;}
  }
  if(!value||(base.journal&&!sequence))throw Error('Missing rollback state');
  // Do not truncate even an unacknowledged tail: the entire original journal
  // is retained as evidence, including bytes the normal reader would discard.
  const payload=JSON.stringify(value,(_,v)=>v instanceof Map?{$map:[...v]}:v),text=JSON.stringify({format:'controlled-playtest-v1',build,mode:'production',payload,sha256:digest(payload)});
  write(replacement,text);const check=JSON.parse(fs.readFileSync(replacement,'utf8'));if(check.sha256!==digest(check.payload))throw Error('Rollback snapshot checksum mismatch');
  plan={build,snapshotHash:digest(text)};write(planFile,JSON.stringify(plan));
 }
 const oldCheckpoint=path.join(evidence,'checkpoint.before.json'),oldJournal=path.join(evidence,'checkpoint.journal.before');
 // Crash-resumable renames on the same filesystem. No evidence is overwritten.
 if(fs.existsSync(replacement)){
  if(digest(fs.readFileSync(replacement))!==plan.snapshotHash)throw Error('Rollback replacement changed');
  if(!fs.existsSync(oldCheckpoint)){fs.renameSync(checkpoint,oldCheckpoint);syncDir(evidence);syncDir(dir);}
  if(!fs.existsSync(oldJournal)&&fs.existsSync(journal)){fs.renameSync(journal,oldJournal);syncDir(evidence);syncDir(dir);}
  fs.renameSync(replacement,checkpoint);syncDir(evidence);syncDir(dir);
 }else if(!fs.existsSync(checkpoint)||digest(fs.readFileSync(checkpoint))!==plan.snapshotHash)throw Error('Incomplete rollback evidence');
 write(path.join(evidence,'complete.json'),JSON.stringify({build,restored:true}));return {restored:true,evidence,reused:false};
}
if(import.meta.url.startsWith('file:')&&process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [storeModule,stateDir,build,id]=process.argv.slice(2);console.log(JSON.stringify(await legacyRollback({storeModule,stateDir,build,id})));
}
