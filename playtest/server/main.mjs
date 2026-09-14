import {openStore,checkpointId} from './store.mjs';
import {createHash} from 'node:crypto';
import os from 'node:os';import {createPvpService} from './multiplayer.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {randomBytes,randomInt} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {createLocalSession} from '../canonical/compiled/local-host/session.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const roster={inf:5,cav:3,archer:3,monk:1,castle:2,dwarf:1,goblin:1,catapult:2,elf:1,cleric:1,demon:1,dragon:1,wizard:1,necro:2,hero:1};
const initial=()=>({size:15,story:false,battle:0,player:{size:15,...roster},enemy:{size:15,...roster}});
function configuration(c,seed){
 if(!c||Object.keys(c).sort().join(',')!=='battle,enemy,player,size,story'||typeof c.story!=='boolean'||!Number.isInteger(c.size)||c.size<5||c.size>15||!Number.isInteger(c.battle)||c.battle<0||c.battle>100)throw Error('invalid-configuration');
 const army=a=>{if(!a||typeof a!=='object'||Array.isArray(a))throw Error('invalid-configuration');const out={};for(const[k,v]of Object.entries(a)){if(k==='size'){if(v!==c.size)throw Error('invalid-configuration');continue;}if(!Object.hasOwn(roster,k)||!Number.isInteger(v)||v<0||v>20)throw Error('invalid-configuration');out[k]=v;}return out;};
 return {matchId:'node-private-match',rulesVersion:'stone-throw-v1.427',size:c.size,story:c.story,seed,players:[{id:'node-human',boardId:'node-home',roster:army(c.player),decisionMode:'interactive'},{id:'node-ai',boardId:'node-away',roster:army(c.enemy),decisionMode:'policy'}]};
}
export async function startServer({port=3211,development=false,seed,now=Date.now,lan=false,bind,stateDir,publicOrigin,secureCookies=false,logger=event=>console.log(JSON.stringify(event))}={}){
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('invalid-port');
 if(publicOrigin){const u=new URL(publicOrigin);if(!['http:','https:'].includes(u.protocol)||u.origin!==publicOrigin)throw Error('invalid-public-origin');secureCookies=u.protocol==='https:';}
 const log=(event,extra={})=>logger({event,...extra});
 const build=createHash('sha256').update(fs.readFileSync(path.join(root,'build-manifest.json'))).digest('hex'),started=Date.now();let recovery='disabled',fatal=false,stopping=false,requestQueue=Promise.resolve();
 const sessions=new Map(),pvp=createPvpService(roster,{seed,now});let origin;const addresses=['127.0.0.1',...Object.values(os.networkInterfaces()).flat().filter(a=>a?.family==='IPv4').map(a=>a.address)];const address=bind||(lan?'0.0.0.0':'127.0.0.1');if(!['0.0.0.0',...addresses].includes(address))throw Error('Select a local interface');if(!lan&&address!=='127.0.0.1')throw Error('Non-loopback bind requires --lan');
 // Persist browser credentials across a browser close; revocation remains authoritative.
 const cookieFlags='; HttpOnly; SameSite=Strict; Path=/'+(secureCookies?'; Secure':'');
 let store;try{store=openStore(stateDir,build,development?'development':'production');}catch(e){log('restore-failed',{reason:['checkpoint-unavailable','incompatible-checkpoint','state-locked'].includes(e.message)?e.message:'state-unavailable'});throw Error('Server state unavailable; inspect operator checkpoint');}
 const make=(c=initial(),checkpoint)=>{const token=randomBytes(32).toString('hex'),config=configuration(c,seed??randomInt(0,0x100000000)),session=createLocalSession(config,checkpoint,development),entry={session,configuration:structuredClone(c),queue:Promise.resolve()};sessions.set(token,entry);log('session-created');return {token,entry};};
 // Each browser identity owns independent local sessions; multiplayer retains its seat token.
 const modeOf=c=>c.story?'story':'single';
 function slots(e){return e.slots||(e.slots={[modeOf(e.configuration)]:{session:e.session,configuration:e.configuration}});}
 function select(e,mode){const slot=slots(e)[mode];if(!slot)return false;e.session=slot.session;e.configuration=slot.configuration;e.mode=mode;return true;}
 const ordered=(e,fn)=>{const task=e.queue.then(fn);e.queue=task.catch(()=>{});return task;};
 function detachFormerPlayers(){for(const r of pvp.rooms.values()){if(r.seats.length!==2)continue;for(const seat of r.seats){if(seat?.controller!=='ai'||!seat.takeover)continue;const e=sessions.get(seat.binding);if(!e||e.seatToken!==seat.token)continue;e.seatToken=null;e.mode='main-menu';e.recoveryNotice={available:false,noticeId:seat.takeover.id,replacement:seat.takeover.replacement};}}}
 async function save(){detachFormerPlayers();if(!store)return;const local=[];for(const [token,e]of sessions){const savedSlots={};for(const [mode,slot]of Object.entries(slots(e)))savedSlots[mode]={configuration:slot.configuration,checkpoint:await slot.session.serializePrivate()};local.push({token,seatToken:e.seatToken||null,recoveryNotice:e.recoveryNotice||null,configuration:e.configuration,checkpoint:await e.session.serializePrivate(),mode:e.mode||modeOf(e.configuration),slots:savedSlots});}store.write({local,multiplayer:pvp.exportState()});}
 try{if(store?.value){for(const e of store.value.local){const saved=JSON.parse(e.checkpoint);saved.epoch=randomInt(1,2**48);saved.revision++;saved.unitHandles=[];saved.choiceHandles=[];saved.presentation=[];const entry={configuration:e.configuration,session:createLocalSession(configuration(e.configuration,0),JSON.stringify(saved),development),queue:Promise.resolve()};if(e.slots){entry.slots={};for(const [mode,slot]of Object.entries(e.slots)){if(!['single','story'].includes(mode)||modeOf(slot.configuration)!==mode)throw Error('invalid-slot');const cp=JSON.parse(slot.checkpoint);cp.epoch=randomInt(1,2**48);cp.revision++;cp.unitHandles=[];cp.choiceHandles=[];cp.presentation=[];entry.slots[mode]={configuration:slot.configuration,session:createLocalSession(configuration(slot.configuration,0),JSON.stringify(cp),development)};}select(entry,e.mode==='multiplayer'?modeOf(e.configuration):e.mode);entry.mode=e.mode;}entry.seatToken=e.seatToken||null;entry.recoveryNotice=e.recoveryNotice||null;sessions.set(e.token,entry);}pvp.restoreState(store.value.multiplayer);recovery='restored';await save();log('restore-success');}else if(store)recovery='new';}catch{store?.release();log('restore-failed',{reason:'checkpoint-unavailable'});throw Error('Checkpoint unavailable; no sessions served');}
 const assets=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'))).assets.map(a=>a.file);
 const staticFiles=new Set([...assets,'styles-multiplayer.css','asset-manifest.json','client/story-presentation.js','client/loading-screen.js',...Array.from({length:23},(_,i)=>'styles-'+String(i).padStart(2,'0')+'.css'),...['placement','coordinates','footprints'].map(x=>'public-rules/'+x+'.js'),...['combat-playback','legacy-animations','shell','presentation','action-instructions','resurrection-sparks','combat-feedback','battle-log','placement-feedback','castle-art-ready','story-browser','story-policy','story-tutorials','transport','bootstrap-production','lan','rejoin',...(development?['bootstrap-development','node-development']:[])].map(x=>'client-v13/'+x+'.js'),'StoneThrow-v1.427-stage13-'+(development?'development':'production')+'.html']);
 const handle=async(req,res)=>{
  const reply=async(status,body)=>{detachFormerPlayers();if(store&&req.url.startsWith('/api/')&&!fatal){try{await save();}catch{fatal=true;log('checkpoint-write-failed');status=503;body={error:'server-recovery-unavailable'};}}res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  try{
   if(!(publicOrigin?req.headers.host===new URL(publicOrigin).host:addresses.some(a=>req.headers.host===a+':'+server.address().port)))return reply(403,{error:'invalid-host'});
   const url=new URL(req.url,origin);
   if(fatal||stopping)return reply(503,{error:'server-recovering'});
   if(url.pathname==='/health'&&req.method==='GET')return reply(200,{healthy:true,checkpoint:checkpointId,build,mode:development?'development':'production',recovery,uptimeSeconds:Math.floor((Date.now()-started)/1000),sessions:sessions.size,games:pvp.rooms.size});
   if(!url.pathname.startsWith('/api/')){let name=decodeURIComponent(url.pathname.slice(1));if(!name)name='StoneThrow-v1.427-stage13-'+(development?'development':'production')+'.html';if(req.method!=='GET'||!staticFiles.has(name))return reply(404,{error:'not-found'});const file=path.join(root,name);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(file));}
   if(req.method!=='POST')return reply(405,{error:'method-not-allowed'});
   if(req.headers.origin&&req.headers.origin!==(publicOrigin||'http://'+req.headers.host))return reply(403,{error:'invalid-origin'});
   if(req.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json')return reply(400,{error:'malformed-request'});
let body;try{body=JSON.parse(req.intake||Buffer.alloc(0));if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return reply(400,{error:'malformed-request'});}
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st11sid='))?.slice(8);let entry=token&&sessions.get(token);
   const seatToken=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st12seat='))?.slice(9);
   detachFormerPlayers();
   if(entry?.recoveryNotice&&['/api/open','/api/pvp/return-status'].includes(url.pathname)){res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,{returning:true,rejoin:entry.recoveryNotice});}
   if(entry?.recoveryNotice&&['/api/read','/api/command','/api/configure'].includes(url.pathname))return reply(409,{error:'seat-handed-to-ai'});
   if(url.pathname==='/api/pvp/dismiss-return'){if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});if(entry.seatToken)return reply(409,{error:'seat-still-available'});entry.recoveryNotice=null;entry.mode='main-menu';res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,{released:true});}
   if(url.pathname==='/api/pvp/list'){if(!lan)return reply(403,{error:'lan-disabled'});if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});return reply(200,{games:pvp.list(token)});}
   if(url.pathname==='/api/mode'){
    if(!entry)return reply(404,{error:'unknown-session'});
    if(Object.keys(body).join(',')!=='mode'||!['single','story','multiplayer'].includes(body.mode))return reply(400,{error:'malformed-request'});
    if(body.mode==='multiplayer'){if(!lan||!seatToken)return reply(200,{available:false});try{const opened=await pvp.route(seatToken,token,pvp.isDuel(seatToken)?'return':'open',{});entry.mode='multiplayer';if(opened.returning)return reply(409,{error:'rejoin-required'});return reply(200,{available:true,...opened});}catch(e){return reply(400,{error:e.message==='seat-handed-to-ai'?'seat-handed-to-ai':'unknown-seat'});}}
    if(!select(entry,body.mode))return reply(200,{available:false});
    return reply(200,{available:true,configuration:entry.configuration,update:await entry.session.client.read()});
   }
   if(url.pathname==='/api/pvp/leave'){if(lan&&seatToken){try{const out=await pvp.route(seatToken,token,'leave');if(out.reclaimable){entry.mode='multiplayer';log('game-left-reclaimable');return reply(200,out);}if(out.mainMenu){entry.mode='main-menu';entry.seatToken=null;res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,out);}}catch{}}if(entry){entry.mode='multiplayer-menu';entry.seatToken=null;}res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');log('game-left');return reply(200,{left:true});}
   if(url.pathname.startsWith('/api/pvp/')||(seatToken&&(!entry?.mode||entry.mode==='multiplayer')&&['/api/open','/api/read','/api/command','/api/configure'].includes(url.pathname))){
    if(!lan)return reply(403,{error:'lan-disabled'});
    try{const action=url.pathname.split('/').at(-1);if(['make','join'].includes(action)){if(!entry)return reply(404,{error:'unknown-session'});const result=await pvp.lobby(action,body,token);res.setHeader('Set-Cookie',`st12seat=${result.token}${cookieFlags}; Max-Age=86400`);entry.seatToken=result.token;entry.recoveryNotice=null;delete result.token;entry.mode='multiplayer';log(action==='make'?'game-created':'seat-joined');return reply(200,result);}if(action==='configure')return reply(403,{error:'lan-configuration-locked'});const result=await pvp.route(seatToken,token,action==='open'&&url.pathname==='/api/open'&&pvp.isDuel(seatToken)?'return':action,body);if(action==='surrender'&&entry){detachFormerPlayers();entry.seatToken=null;entry.recoveryNotice=null;entry.mode='main-menu';res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');}if(action==='open'&&entry)result.modes=Object.keys(slots(entry));return reply(200,result);}catch(e){return reply(400,{error:['stale','rejoin-required','kick-unavailable','seat-handed-to-ai','unknown-seat','bad-game-code','game-full','invalid-name','already-seated','not-complete','invalid-configuration','unknown-session'].includes(e.message)?e.message:'invalid-request'});}
   }
   if(url.pathname==='/api/open'&&entry?.mode==='multiplayer'&&!seatToken)return reply(409,{error:'missing-seat-credential'});
   if(url.pathname==='/api/open'){
    if(Object.keys(body).some(k=>k!=='fresh')||body.fresh!==undefined&&body.fresh!==true)return reply(400,{error:'malformed-request'});
    if(token&&!entry&&!body.fresh)return reply(404,{error:'unknown-session'});
    const reconnected=!!entry&&!body.fresh;if(!reconnected){const made=make();entry=made.entry;res.setHeader('Set-Cookie',`st11sid=${made.token}${cookieFlags}; Max-Age=86400`);}
    return await ordered(entry,async()=>reply(200,{configuration:entry.configuration,reconnected,development,mainMenu:entry.mode==='main-menu',multiplayerMenu:entry.mode==='multiplayer-menu',modes:Object.keys(slots(entry)),update:await entry.session.client.read()}));
   }
   if(!entry)return reply(404,{error:'unknown-session'});
   return await ordered(entry,async()=>{
    if(url.pathname==='/api/read'){if(Object.keys(body).some(k=>k!=='after'))return reply(400,{error:'malformed-request'});try{return reply(200,await entry.session.client.read(body.after??0));}catch{return reply(400,{error:'invalid-cursor'});}}
    if(url.pathname==='/api/command'){
     if(req.headers.accept!=='application/x-ndjson')return reply(200,await entry.session.client.dispatch(body));
     const send=value=>{if(res.destroyed)return;if(!res.headersSent){res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.flushHeaders();}res.write(JSON.stringify(value)+'\n');};
     const update=await entry.session.dispatchWithProgress(body,async frame=>{send({type:'preview',frame});await new Promise(resolve=>setImmediate(resolve));});
     try{if(store&&!fatal)await save();}catch{fatal=true;log('checkpoint-write-failed');send({type:'error',error:'server-recovery-unavailable'});res.end();return;}
     send({type:'result',update});res.end();return;
    }
    if(url.pathname==='/api/configure'){
     if(Object.keys(body).sort().join(',')!=='battle,configuration,revision')return reply(400,{error:'malformed-request'});
     const current=await entry.session.client.read();if(body.battle!==current.snapshot.battle||body.revision!==current.snapshot.revision)return reply(409,{error:'stale'});
     let config;try{config=configuration(body.configuration,0);}catch{return reply(400,{error:'invalid-configuration'});}
     try{const mode=modeOf(body.configuration),all=slots(entry);let target=all[mode],update;if(target){update=await target.session.configure(config);target.configuration=structuredClone(body.configuration);}else{target={session:createLocalSession(configuration(body.configuration,seed??randomInt(0,0x100000000)),undefined,development),configuration:structuredClone(body.configuration)};const saved=JSON.parse(await target.session.serializePrivate());saved.epoch=randomInt(1,2**48);target.session=createLocalSession(config,JSON.stringify(saved),development);update=await target.session.client.read();all[mode]=target;}select(entry,mode);return reply(200,{configuration:entry.configuration,update});}catch{return reply(400,{error:'invalid-configuration'});}
    }
    if(url.pathname.startsWith('/api/dev/')){if(!development)return reply(403,{error:'development-denied'});if(url.pathname==='/api/dev/inspect')return reply(200,await entry.session.dev.inspect());if(url.pathname==='/api/dev/takeover'&&typeof body.enabled==='boolean')return reply(200,await entry.session.dev.takeover(body.enabled));if(url.pathname==='/api/dev/shoot')return reply(200,await entry.session.dev.shoot(body.cell));}
    return reply(404,{error:'not-found'});
   });
  }catch{log('request-failed');return reply(400,{error:'malformed-request'});}
 };
 const server=http.createServer(async(req,res)=>{try{if(req.method==='POST'){let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>65536){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'request-too-large'}));return;}chunks.push(chunk);}req.intake=Buffer.concat(chunks);}requestQueue=requestQueue.then(()=>handle(req,res)).catch(()=>{log('unexpected-server-error');if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'server-error'}));});}catch{if(!res.destroyed)res.destroy();}});
 server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.setTimeout(20000,socket=>socket.destroy());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,address,resolve);}).catch(e=>{store?.release();throw e;});origin='http://127.0.0.1:'+server.address().port;
 const policyTimer=setInterval(()=>{requestQueue=requestQueue.then(async()=>{if(stopping||fatal)return;if(await pvp.tick())await save();detachFormerPlayers();}).catch(()=>{fatal=true;log('disconnect-policy-failed');});},500);policyTimer.unref();
 log('startup',{checkpoint:checkpointId,build,mode:development?'development':'production',address,port:server.address().port,lan,persistence:!!store,recovery});
 return {origin,lan,address,pvp,close:async()=>{stopping=true;clearInterval(policyTimer);const closed=new Promise(resolve=>server.close(resolve));await requestQueue;try{if(!fatal)await save();}finally{await closed;store?.release();log('shutdown');}},
  // Process-local test/restart capabilities. Never routed over production HTTP.
  checkpoint:token=>sessions.get(token)?.session.serializePrivate(),
  install:(c,checkpoint)=>make(c,checkpoint).token,
  sessions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const mode=process.env.ST_MODE||'production';if(!['production','development'].includes(mode))throw Error('Invalid ST_MODE');const app=await startServer({port:Number(process.env.PORT||3211),development:mode==='development'||process.argv.includes('--development'),lan:process.argv.includes('--lan'),bind:process.env.ST_BIND||process.env.LAN_BIND,stateDir:process.env.ST_STATE_DIR,publicOrigin:process.env.ST_PUBLIC_ORIGIN,secureCookies:process.env.ST_SECURE_COOKIES==='1'});console.log(app.origin);let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();process.exit(0);});}catch{console.error('Stone Throw startup failed: check configuration, state lock and checkpoint compatibility.');process.exitCode=1;}
}
