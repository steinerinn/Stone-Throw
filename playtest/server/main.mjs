import {monitorEventLoopDelay} from 'node:perf_hooks';
import {requestMetrics,metricValues,measuredRequest} from './request-metrics.mjs';
import {transactionQueue,serialDurableQueue} from './transaction-queue.mjs';
import {publicAssetCache} from './static-cache.mjs';
import {publicStreamWriter} from './public-stream-compression.mjs';
import {incrementalPublicStream} from './public-stream.mjs';
import {devRoomGames,devRoomHealthReader,localPlayActivity} from './dev-room.mjs';
import {persistenceContract} from './persistence-contract.mjs';
import {registryClientIp} from './client-ip.mjs';
import {protectServerRecovery} from './shared-incidents.mjs';
import {persistenceDetails} from './durable-file.mjs';
import {livenessStore} from './liveness-store.mjs';
import {spectatorView,spectatorFeed} from './spectator.mjs';
import {createRingService} from './ring-pvp.mjs';
import {AVATARS} from '../assets/avatars/catalog.mjs';
import {serveMusic} from './music-assets.mjs';
import {storyContext,completedStory} from './story-progress.mjs';
import {prepareStatistics} from './statistics-capture.mjs';
import {openRegistry,registryDirectory,countries} from './registry.mjs';
import {metric,metricsContext,measured,measuredAsync} from './beta-metrics.mjs';
import {checkpointId} from './store.mjs';
import {openAsyncStore} from './async-store.mjs';
import {cloneHost} from '../canonical/compiled/archives.js';
import {createHash} from 'node:crypto';
import os from 'node:os';import {createPvpService} from './multiplayer.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {randomBytes,randomInt} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {createLocalSession} from '../canonical/compiled/local-host/session.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const roster={inf:5,cav:3,archer:3,monk:1,castle:2,dwarf:1,goblin:1,catapult:2,elf:2,cleric:1,demon:1,dragon:1,wizard:1,necro:2,hero:1,assassin:1};
// Upgrade only the retired Guest placeholder; immutable random guestId gives a stable pool choice.
const guestAvatars=AVATARS.filter(a=>a.access==='guest-goblin');
function guestAvatar(identity){if(identity?.kind!=='guest'||identity.avatarId!=='guest-goblin-fallback')return identity;const a=guestAvatars[createHash('sha256').update(identity.guestId).digest().readUInt32BE(0)%guestAvatars.length];return {...identity,avatarId:a.id,avatarSrc:a.assetPath};}
const initial=()=>({size:15,story:false,battle:0,player:{size:15,...roster},enemy:{size:15,...roster}});
function configuration(c,seed){
 if(c?.singlePlayer&&(c.story||!Array.isArray(c.singlePlayer.npcNames)||![1,2,3].includes(c.singlePlayer.npcNames.length)||new Set(c.singlePlayer.npcNames).size!==c.singlePlayer.npcNames.length||c.singlePlayer.npcNames.some(n=>!['Cruns','Snurk','Rackler'].includes(n))))throw Error('invalid-configuration');
 if(!c||Object.keys(c).filter(k=>k!=='singlePlayer').sort().join(',')!=='battle,enemy,player,size,story'||typeof c.story!=='boolean'||!Number.isInteger(c.size)||c.size<5||c.size>15||!Number.isInteger(c.battle)||c.battle<0||c.battle>100)throw Error('invalid-configuration');
 const army=a=>{if(!a||typeof a!=='object'||Array.isArray(a))throw Error('invalid-configuration');const out={};for(const[k,v]of Object.entries(a)){if(k==='size'){if(v!==c.size)throw Error('invalid-configuration');continue;}if(!Object.hasOwn(roster,k)||!Number.isInteger(v)||v<0||v>20)throw Error('invalid-configuration');out[k]=v;}return out;};
 return {matchId:'node-private-match',rulesVersion:'stone-throw-pacing-v1',size:c.size,story:c.story,seed,players:[{id:'node-human',boardId:'node-home',roster:army(c.player),decisionMode:'interactive'},{id:'node-ai',boardId:'node-away',roster:army(c.enemy),decisionMode:'policy'}]};
}
export async function startServer({registryDir=registryDirectory(),port=3211,betaGameLog=false,development=false,seed,now=Date.now,lan=false,bind,stateDir,publicOrigin,secureCookies=false,trustLoopbackProxy=false,playtestSnapshotOnly=false,statisticsInspector=false,hofPlaytest=false,recoverLocalSession,logger=event=>console.log(JSON.stringify(event))}={}){
 const devHealth=devRoomHealthReader();let currentHealth=null,healthAt=null,dashboardIssue=false;
 if(path.resolve(registryDir)===root||path.resolve(registryDir).startsWith(root+path.sep))throw Error('Registry directory must be outside the build');
 let registry;const getRegistry=()=>registry||(registry=openRegistry(registryDir,{now}));
 betaGameLog=!!betaGameLog&&!publicOrigin; // Explicit local launcher option; never a URL/global toggle.
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('invalid-port');
 if(publicOrigin){const u=new URL(publicOrigin);if(!['http:','https:'].includes(u.protocol)||u.origin!==publicOrigin)throw Error('invalid-public-origin');secureCookies=u.protocol==='https:';}
 const log=(event,extra={})=>logger({event,...extra});
 const build=createHash('sha256').update(fs.readFileSync(path.join(root,'build-manifest.json'))).digest('hex'),started=Date.now();let recovery='disabled',fatal=false,stopping=false,mutationPending=0;const mutations=transactionQueue();const serializeSave=serialDurableQueue();
 const localActivity=localPlayActivity(now);
 const sessions=new Map(),pvp=createPvpService(roster,{seed,now,stateDir,reliability:id=>getRegistry().statistics.reliability(id),refreshIdentity:i=>i?.kind==='account'?(getRegistry().identityById(i.playerId)||i):i});let origin;const addresses=['127.0.0.1',...Object.values(os.networkInterfaces()).flat().filter(a=>a?.family==='IPv4').map(a=>a.address)];const address=bind||(lan?'0.0.0.0':'127.0.0.1');if(!['0.0.0.0',...addresses].includes(address))throw Error('Select a local interface');if(!lan&&address!=='127.0.0.1')throw Error('Non-loopback bind requires --lan');
 // Persist browser credentials across a browser close; revocation remains authoritative.
 const cookieFlags='; HttpOnly; SameSite=Strict; Path=/'+(secureCookies?'; Secure':'');
 const startupMetrics=betaGameLog?{}:undefined;let store;try{store=await metricsContext.run(startupMetrics,()=>openAsyncStore(stateDir,build,development?'development':'production',{journalEnabled:!playtestSnapshotOnly}));}catch(e){log('restore-failed',{reason:['checkpoint-unavailable','incompatible-checkpoint','state-locked'].includes(e.message)?e.message:'state-unavailable'});throw Error('Server state unavailable; inspect operator checkpoint');}
 const leases=livenessStore(stateDir);
 const localGroups=createRingService(roster,{seed,now,workers:false});
 const localSession=(c,checkpoint,identity)=>c.singlePlayer?.npcNames.length>1?localGroups.localSession({identity,npcNames:c.singlePlayer.npcNames},checkpoint):createLocalSession(configuration(c,seed??randomInt(0,0x100000000)),checkpoint,development);
 const make=(c=initial(),checkpoint)=>{const token=randomBytes(32).toString('hex'),config=configuration(c,seed??randomInt(0,0x100000000)),session=createLocalSession(config,checkpoint,development),entry={session,configuration:structuredClone(c),queue:Promise.resolve()};sessions.set(token,entry);log('session-created');return {token,entry};};
 // Each browser identity owns independent local sessions; multiplayer retains its seat token.
 const modeOf=c=>c.story?'story':'single';
 function slots(e){return e.slots||(e.slots={[modeOf(e.configuration)]:{session:e.session,configuration:e.configuration}});}
 function select(e,mode){const slot=slots(e)[mode];if(!slot)return false;e.session=slot.session;e.configuration=slot.configuration;e.mode=mode;return true;}
 const ordered=(e,fn)=>{const task=e.queue.then(fn);e.queue=task.catch(()=>{});return task;};
 function detachFormerPlayers(){for(const r of pvp.rooms.values()){for(const seat of r.seats){if(seat?.controller!=='ai'||!seat.takeover)continue;const e=sessions.get(seat.binding);if(!e||e.seatToken!==seat.token)continue;e.seatToken=null;e.mode='main-menu';e.recoveryNotice={available:false,noticeId:seat.takeover.id,replacement:seat.takeover.replacement};}}}
 const resumable=(slot,u)=>u.snapshot.phase!=='finished'&&(slot.configuration.story||u.snapshot.phase!=='placement'||u.snapshot.owned.length>0);
 async function localResumeModes(e,identity){const found=[];for(const [mode,slot]of Object.entries(slots(e))){if(mode==='story'&&slot.storyOwnerId&&getRegistry().storyState(slot.storyOwnerId).runId!==(slot.storyRunId||'legacy'))continue;if(mode==='story'&&slot.storyOwnerId!==undefined&&(slot.storyOwnerId||null)!==(identity?.playerId||null))continue;const u=await slot.session.client.read();if(resumable(slot,u))found.push(mode);}return found;}
 async function save(){const queuedAt=performance.now();return serializeSave(()=>{metric('persistence-queue',performance.now()-queuedAt);return measuredAsync('persistence',saveInner);});}
 async function saveInner(){
  detachFormerPlayers();const captures=[],prepareStart=performance.now();
  for(const e of sessions.values())for(const slot of Object.values(slots(e)))await slot.session.visitStatistics((h,epoch,gaveUp)=>{const progress=completedStory(slot,h,epoch,gaveUp);if(progress){getRegistry().completeStory(slot.storyOwnerId,progress,slot.storyRunId||'legacy');slot.storyCapturedEpoch=epoch;}const d=prepareStatistics(slot,h,epoch,{mode:'Single Player',build,now,gaveUp,participants:slot.session.participants?slot.session.participants.map((p,i)=>i===0?{...p,identity:slot.statIdentity||p.identity}:p):[{controller:'human',identity:slot.statIdentity||null},{controller:'ai',name:slot.configuration.singlePlayer?.npcNames?.[0]||'AI'}]});if(d)captures.push([d,h]);});
  // The active session is also a mode slot: capture it once per durable save.
  let checkpoint;if(store){const local=[];for(const [token,e]of sessions){const savedSlots={},savedSessions=new Map();const persist=async session=>{if(!savedSessions.has(session))savedSessions.set(session,await (session.persistPrivate?session.persistPrivate():session.serializePrivate()));return savedSessions.get(session);};for(const [mode,slot]of Object.entries(slots(e)))savedSlots[mode]={configuration:slot.configuration,checkpoint:await persist(slot.session),matchStatistics:slot.matchStatistics,statIdentity:slot.statIdentity,storyOwnerId:slot.storyOwnerId,storyRunId:slot.storyRunId,storyContext:slot.storyContext,storyCapturedEpoch:slot.storyCapturedEpoch};local.push({token,guestIdentity:e.guestIdentity||null,seatToken:e.seatToken||null,recoveryNotice:e.recoveryNotice||null,localRecoveryToken:e.localRecoveryToken||null,unavailableLocalRecoveryToken:e.unavailableLocalRecoveryToken||null,configuration:e.configuration,checkpoint:await persist(e.session),mode:e.mode||modeOf(e.configuration),slots:savedSlots});}checkpoint={local};}
  // Capture and post the complete snapshot before yielding to another room.
  // The worker owns encoding and disk I/O; its reply is the durability boundary.
  for(const r of pvp.rooms.values()){const d=prepareStatistics(r,r.host,r.epoch,{mode:r.seats.length===2?'Duel':r.seats.length+' Players',build,now,participants:r.seats,news:r.news,closed:r.closed});if(d)captures.push([d,r.host]);}
  // Registry facts must describe this exact durable snapshot, even if another
  // room finishes while the worker is writing it.
  metric('snapshot-prepare',performance.now()-prepareStart);
  const frozenCaptures=store?measured('statistics-freeze',()=>captures.map(([d,h])=>[structuredClone(d),cloneHost(h)])):captures;
  if(store){checkpoint.multiplayer=measured('snapshot-export',()=>pvp.exportState(true));await measuredAsync('durable-store',()=>store.write(checkpoint));}
  // Commit facts only after the durable game snapshot. Recovery retries safely by Match ID.
  measured('statistics-capture',()=>{for(const [d,h]of frozenCaptures)getRegistry().statistics.capture(d,h);});
  if(await measuredAsync('room-retirement',()=>pvp.retireClosed())&&store)await store.write({...checkpoint,multiplayer:pvp.exportState(true)});
 }

 // Local two-board playback has no room seat names; use configured identities.
 function nameDoublePlague(frame,entry){const cue=frame?.animation;if(cue?.kind!=='double-plague'||cue.ownerName)return frame;const slot=entry&&slots(entry)[modeOf(entry.configuration)],names=[slot?.statIdentity?.displayName||'Player',slot?.configuration?.singlePlayer?.npcNames?.[0]||'Enemy'];cue.ownerName=names[cue.ownerSide==='self'?0:1];return frame;}
 // Attach only the authenticated seat's persisted score, after save/finalization.
 function resultScore(body,req){
  const u=body?.snapshot?body:body?.update,s=u?.snapshot;if(!s)return body;
  const plagueCookie=Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')));
  for(const frame of u.presentation||[])nameDoublePlague(frame,sessions.get(plagueCookie.st11sid));
  if(s.phase!=='finished'||s.online&&!s.online.complete)return body;
  const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('='))),e=sessions.get(cookies.st11sid);if(!e)return body;
  let d,participant,aiControlled=false;
  if(e.mode==='multiplayer'){const r=[...pvp.rooms.values()].find(r=>r.seats.some(x=>x?.token===cookies.st12seat&&x.binding===cookies.st11sid));const seat=r?.seats.findIndex(x=>x?.token===cookies.st12seat);d=r?.matchStatistics;participant=d?.participants.find(p=>p.seat===seat);aiControlled=r?.seats[seat]?.controller==='ai';}
  else if(e.mode!=='story'&&!e.configuration.story){d=slots(e).single?.matchStatistics;participant=d?.participants[0];}
  if(!d?.endedAt||!participant)return body;const score=aiControlled?null:getRegistry().statistics.matchResultScore(d.id,participant.actor);if(!score&&!aiControlled)return body;
  const participantScores=d.participants.map(p=>({seat:p.seat,name:p.displayName,ai:p.kind==='ai',matchScore:getRegistry().statistics.matchResultScore(d.id,p.actor)}));
  const update={...u,snapshot:{...s,matchScore:score,participantScores,...(s.groupResult?{groupResult:{...s.groupResult,matchScore:score,players:s.groupResult.players.map(p=>({...p,rewards:p.playerId?getRegistry().identityById(p.playerId)?.rewards||{}:{},matchScore:participantScores.find(q=>q.seat===p.seat)?.matchScore||null}))}}:{})}};return body===u?update:{...body,update};
 }
 function restoreEntry(e){
  const restore=(c,checkpoint,metadata={})=>{const saved=typeof checkpoint==='string'?JSON.parse(checkpoint):checkpoint;let session;if(saved.contract==='local-group-session-v1'){session=localSession(c,checkpoint);}else{saved.epoch=randomInt(1,2**48);saved.revision++;saved.unitHandles=[];saved.choiceHandles=[];saved.presentation=[];session=createLocalSession(configuration(c,0),JSON.stringify(saved),development);}const epoch=session.epoch??saved.epoch;return {...metadata,configuration:c,session,matchStatistics:metadata.matchStatistics?{...metadata.matchStatistics,epoch}:null,storyCapturedEpoch:metadata.storyCapturedEpoch===saved.epoch?epoch:undefined};};
  const entry={...restore(e.configuration,e.checkpoint),queue:Promise.resolve()};if(e.slots){entry.slots={};for(const [mode,slot]of Object.entries(e.slots)){if(!['single','story'].includes(mode)||modeOf(slot.configuration)!==mode)throw Error('invalid-slot');const {checkpoint,...metadata}=slot;entry.slots[mode]=restore(slot.configuration,checkpoint,metadata);}select(entry,e.mode==='multiplayer'?modeOf(e.configuration):e.mode);entry.mode=e.mode;}entry.localRecoveryToken=e.localRecoveryToken||null;entry.unavailableLocalRecoveryToken=e.unavailableLocalRecoveryToken||null;entry.guestIdentity=guestAvatar(e.guestIdentity)||null;entry.seatToken=e.seatToken||null;entry.recoveryNotice=e.recoveryNotice||null;return entry;
 }
 try{if(store?.value){for(const e of store.value.local){sessions.set(e.token,restoreEntry(e));}leases?.restore(store.value.multiplayer);pvp.restoreState(store.value.multiplayer);protectServerRecovery(pvp.rooms.values(),now());for(const r of pvp.rooms.values())for(const seat of r.seats)if(seat?.identity)seat.identity=guestAvatar(seat.identity);store.value=null;recovery='restored';await save();log('restore-success');}else if(store)recovery='new';}catch{await store?.release();log('restore-failed',{reason:'checkpoint-unavailable'});throw Error('Checkpoint unavailable; no sessions served');}
 const assets=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'))).assets.map(a=>a.file);
 const narrationAssets=Object.values(JSON.parse(fs.readFileSync(path.join(root,'assets/story/audio/narration-manifest.json')))).map(chapter=>chapter.wav);
 const musicAssets=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/music/manifest.json'))).tracks.map(t=>t.file);
 function feedbackContext(cookies){const entry=sessions.get(cookies.st11sid),room=[...pvp.rooms.values()].find(r=>r.seats.some(s=>s&&s.token===cookies.st12seat&&s.binding===cookies.st11sid)),d=room?.matchStatistics|| (entry?slots(entry)[modeOf(entry.configuration)]?.matchStatistics:null);return {build,mode:entry?.mode||null,matchId:d?.id||null,guest:entry?.guestIdentity?.kind==='guest'?{guestId:entry.guestIdentity.guestId,displayName:entry.guestIdentity.displayName}:null};}
 const serveCachedAsset=publicAssetCache();
 const staticFiles=new Set(['client-v13/public-playback.js','client-v13/public-playback-audio.js','client-v13/public-playback-effects.css','client-v13/replay-cells.css','client-v13/about-photo.js','assets/about/early-paper-game.jpeg','assets/result-screen/badges-simple-v2.png','client-v13/avatar-badges.js','client-v13/revolt-viewport.js','client-v13/feedback.js','styles-feedback.css','client-v13/spectator.js','styles-spectator.css','client-v13/options-ui.js','styles-options.css','client-v13/reliability-bar.js','styles-main-menu.css','client-v13/main-menu.js','client-v13/revolt-playback.js','client-v13/profile.js','client-v13/replay-viewer.js','client-v13/replay-state.js','styles-profile.css','client-v13/afk.js','assets/unit-info/assassin.png','assets/units/assassin/assassin.png','client-v13/chaos-presentation.js','client-v13/deployment-overlay.js',...['turn-pointer','turn-medallion','route-broad','route-curved'].map(x=>'assets/battlefield/'+x+'.png'),...["assets/result-screen/1st place duo.png", "assets/result-screen/1st place solo.png", "assets/result-screen/2nd place.png", "assets/result-screen/3rd place.png", "assets/result-screen/4th place no player.png", "assets/result-screen/4th place.png", "assets/result-screen/Background.png", "assets/result-screen/fantasy_medal_icon_collection.png"],"client-v13/result-screen.js","styles-result-screen.css","client-v13/online-overview.js","client-v13/overview-board.js","styles-online-overview.css","assets/avatars/catalog.mjs","client-v13/avatar-picker.js","styles-avatars.css",...AVATARS.map(a=>a.assetPath),...countries.map(c=>'assets/ui/flags/'+c.toLowerCase()+'.svg'),...assets,...narrationAssets,...musicAssets,'styles-phase3.css','client/audio-options.js','client-v13/hall-of-fame.js','styles-startup.css','styles-registry.css','client-v13/registry.js','client-v13/single-entry.js','client-v13/local-group.js','styles-online-entry.css','client-v13/online-entry.js','styles-multiplayer.css','asset-manifest.json','client/story-presentation.js','client/loading-screen.js',...Array.from({length:23},(_,i)=>'styles-'+String(i).padStart(2,'0')+'.css'),...['placement','coordinates','footprints'].map(x=>'public-rules/'+x+'.js'),...['startup','music','strength-public','strength-dataset','strength-renderer','game-log','combat-playback','legacy-animations','shell','presentation','action-instructions','resurrection-sparks','combat-feedback','battle-log','placement-feedback','castle-art-ready','story-account','story-browser','story-policy','story-tutorials','transport','bootstrap-production','lan','group-lan','rejoin',...(development?['bootstrap-development','node-development']:[])].map(x=>'client-v13/'+x+'.js'),'StoneThrow-v1.427-stage13-'+(development?'development':'production')+'.html']);
 const handle=async(req,res)=>metricsContext.run((betaGameLog||req.url==='/api/command')&&req.headers['x-st-game-log']==='1'?{}:undefined,()=>handleInner(req,res));
 const handleInner=async(req,res)=>{const betaStart=performance.now(),betaWall=new Date().toISOString();const betaData=()=>({wall:betaWall,...(req.url==='/api/open'?{startupMetrics}:{}),requestMs:performance.now()-req.betaArrival,queueMs:betaStart-req.betaArrival,metrics:metricsContext.getStore()});
  // Public diagnostics expose only this fixed numeric allowlist and build ID.
  const commandTiming=()=>{const m=metricsContext.getStore();return m&&req.url==='/api/command'?{build,totalMs:performance.now()-req.betaArrival,queueMs:betaStart-req.betaArrival,persistenceMs:m.persistence?.ms||0,fsyncMs:m['disk-write-fsync']?.ms||0}:undefined;};
  const devRoomRead=req.url.split('?')[0].startsWith('/api/dev-room/');
  const readOnly=['/api/read','/api/pvp/heartbeat','/api/pvp/list','/api/pvp/spectate','/api/pvp/watch'].includes(req.url.split('?')[0]),policyBefore=readOnly?pvp.policyVersion():null;
  const reply=async(status,body)=>{if(body?.snapshot||body?.update?.snapshot)metricsContext.getStore()&&(metricsContext.getStore()['public-result-boundary']={ms:performance.now()-betaStart,count:1});detachFormerPlayers();if(!devRoomRead&&!req.groupLight&&req.url.startsWith('/api/')&&!fatal&&(!readOnly||policyBefore!==pvp.policyVersion())){try{await save();}catch(error){fatal=true;log('checkpoint-write-failed',persistenceDetails(error));status=503;body={error:'server-recovery-unavailable'};}}else if(readOnly&&status===200&&!fatal){try{leases?.write(pvp.rooms);}catch(error){log('liveness-write-failed',persistenceDetails(error));try{await save();log('liveness-recovered',{via:'durable-checkpoint'});}catch(checkpointError){fatal=true;log('checkpoint-write-failed',persistenceDetails(checkpointError));status=503;body={error:'server-recovery-unavailable'};}}}body=resultScore(body,req);if(body?.snapshot)body={...body,presentationClock:Date.now()};const text=measured('response-serialization',()=>JSON.stringify(body));if(betaGameLog&&metricsContext.getStore())res.setHeader('X-St-Beta-Metrics',JSON.stringify(betaData()));const timing=commandTiming();if(timing)res.setHeader('X-St-Command-Timing',JSON.stringify(timing));res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(text);};
  try{
   if(!(publicOrigin?req.headers.host===new URL(publicOrigin).host:addresses.some(a=>req.headers.host===a+':'+server.address().port)))return reply(403,{error:'invalid-host'});
   const url=new URL(req.url,origin);
   if(fatal||stopping)return reply(503,{error:'server-recovering'});
   if(url.pathname==='/welcome-message'&&req.method==='GET')return reply(200,getRegistry().welcomeMessage());
   if(url.pathname==='/health'&&req.method==='GET')return reply(200,{healthy:true,checkpoint:checkpointId,build,persistence:persistenceContract,stateRecovery:store?.diagnostics,mode:development?'development':'production',recovery,uptimeSeconds:Math.floor((Date.now()-started)/1000),sessions:sessions.size,games:pvp.rooms.size});
   if(['/dev-room','/dev-room/','/dev-room/index.html','/dev-room/app.js','/dev-room/style.css','/dev-room/labels.js'].includes(url.pathname)){
    if(req.method!=='GET')return reply(405,{error:'method-not-allowed'});
    try{getRegistry().requireDeveloper((req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('csAccount='))?.slice(10));}catch{return reply(403,{error:'Developer access required. Log in through the game with an authorized account.'});}
    if(['/dev-room/','/dev-room/index.html'].includes(url.pathname)){res.writeHead(302,{'Location':'/dev-room','Cache-Control':'no-store'});return res.end();}
    const name=url.pathname.endsWith('/labels.js')?'labels.js':url.pathname.endsWith('.js')?'app.js':url.pathname.endsWith('.css')?'style.css':'index.html';
    res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});return res.end(fs.readFileSync(path.join(root,'dev-room',name)));
   }
   if(!url.pathname.startsWith('/api/')){let name=decodeURIComponent(url.pathname.slice(1));if(!name)name='StoneThrow-v1.427-stage13-'+(development?'development':'production')+'.html';if(req.method!=='GET'||!staticFiles.has(name))return reply(404,{error:'not-found'});const file=path.join(root,name);if(path.extname(file)==='.mp3')return serveMusic(req,res,file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.jpeg':'image/jpeg','.png':'image/png','.wav':'audio/wav','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]);res.setHeader('X-Content-Type-Options','nosniff');if(path.extname(file)!=='.html')return serveCachedAsset(req,res,file);res.writeHead(200,{'Cache-Control':'no-store'});return res.end(fs.readFileSync(file));}
   if(req.method!=='POST')return reply(405,{error:'method-not-allowed'});
   if(req.headers.origin&&req.headers.origin!==(publicOrigin||'http://'+req.headers.host))return reply(403,{error:'invalid-origin'});
   if(req.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json')return reply(400,{error:'malformed-request'});
let body;try{body=JSON.parse(req.intake||Buffer.alloc(0));if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return reply(400,{error:'malformed-request'});}
   if(devRoomRead){
    if(req.headers.origin!==(publicOrigin||'http://'+req.headers.host))return reply(403,{error:'invalid-origin'});
    const accountToken=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('csAccount='))?.slice(10);
    try{const developer=getRegistry().requireDeveloper(accountToken);
     if(url.pathname==='/api/dev-room/overview'&&Object.keys(body).every(k=>k==='range')){const games=await devRoomGames(pvp.rooms,sessions,lan,now(),localActivity.active);return reply(200,{developer,build,version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,uptimeSeconds:Math.floor((Date.now()-started)/1000),...getRegistry().devRoomCounts(accountToken),dashboard:getRegistry().dashboard.read(body.range??'24h',started),dashboardIssue,health:currentHealth||devHealth(registryDir),healthAt,announcement:getRegistry().welcomeMessage(),activeGames:games.length});}
     if(url.pathname==='/api/dev-room/message'&&Object.keys(body).join(',')==='text')return reply(200,getRegistry().setWelcomeMessage(accountToken,body.text));
     if(url.pathname==='/api/dev-room/games'&&Object.keys(body).length===0)return reply(200,{games:await devRoomGames(pvp.rooms,sessions,lan,now(),localActivity.active)});
     if(url.pathname==='/api/dev-room/spectate'&&Object.keys(body).every(k=>['code','after','epoch'].includes(k))&&(body.after===undefined||Number.isSafeInteger(body.after)&&body.after>=0)&&(body.epoch===undefined||typeof body.epoch==='string'&&body.epoch.length<=80)&&typeof body.code==='string'&&/^[A-Z0-9]{6}$/.test(body.code)){if(!lan)return reply(403,{error:'lan-disabled'});const room=pvp.getRoom(body.code);if(!room)return reply(404,{error:'bad-game-code'});return reply(200,Object.hasOwn(body,'after')?spectatorFeed(room,body):spectatorView(room));}
     return reply(400,{error:'invalid-request'});
    }catch(e){return reply(e.status||503,{error:e.status?e.message:'Dev Room temporarily unavailable.'});}
   }
   if(url.pathname.startsWith('/api/registry/')){
    // Account persistence and credentials are independent of gameplay snapshots and seat cookies.
    if(req.headers.origin!==(publicOrigin||'http://'+req.headers.host))return reply(403,{error:'invalid-origin'});
    const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
    let browser=cookies.csRegistryBrowser;const setCookies=[];
    if(!/^[a-f0-9]{48}$/.test(browser||'')){browser=randomBytes(24).toString('hex');setCookies.push('csRegistryBrowser='+browser+cookieFlags+'; Max-Age=2592000');}
    try{if(url.pathname==='/api/registry/global-stats'){if(Object.keys(body).length)return reply(400,{error:'malformed-request'});return reply(200,getRegistry().statistics.globalMenuStats());}if(url.pathname==='/api/registry/reliability'){if(Object.keys(body).length)return reply(400,{error:'malformed-request'});const identity=getRegistry().identity(cookies.csAccount);return reply(200,getRegistry().statistics.reliability(identity?.playerId));}if(url.pathname==='/api/registry/hall-of-fame'){if(Object.keys(body).some(k=>k!=='mode')||!['All','Duel','3 Players','4 Players'].includes(body.mode))return reply(400,{error:'malformed-request'});const identity=getRegistry().identity(cookies.csAccount);return reply(200,getRegistry().statistics.globalHallOfFame(body.mode,identity?.playerId||null,{}));}if(url.pathname==='/api/registry/statistics'){if(!statisticsInspector||publicOrigin)return reply(404,{error:'not-found'});if(Object.keys(body).length!==0)return reply(400,{error:'malformed-request'});const identity=getRegistry().identity(cookies.csAccount);return reply(200,getRegistry().statistics.inspect(identity?.playerId||null));}const result=await getRegistry().handle(url.pathname.slice('/api/registry/'.length),body,{token:cookies.csAccount,browser,ip:registryClientIp(req,trustLoopbackProxy),feedbackContext:feedbackContext(cookies)});
     if(url.pathname==='/api/registry/usage-visit'&&body.playing===false){const e=sessions.get(cookies.st11sid);for(const slot of Object.values(e?.slots||{}))localActivity.forget(slot);}
     if(url.pathname==='/api/registry/me')result.statisticsInspector=!!statisticsInspector&&!publicOrigin;
     if(result.token){setCookies.push('csAccount='+result.token+cookieFlags+'; Max-Age=2592000');delete result.token;}
     if(result.clearCookie){setCookies.push('csAccount='+cookieFlags+'; Max-Age=0');delete result.clearCookie;}
     if(setCookies.length)res.setHeader('Set-Cookie',setCookies);return reply(200,result);
    }catch(e){if(setCookies.length)res.setHeader('Set-Cookie',setCookies);return reply(e.status||503,{error:e.status?e.message:'Registry temporarily unavailable. Gameplay remains available.'});}
   }
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st11sid='))?.slice(8);let entry=token&&sessions.get(token);
   if(url.pathname==='/api/open'&&token&&!entry&&!body.fresh&&!body.menuOnly&&recoverLocalSession){try{const prior=recoverLocalSession(token);if(prior){entry=restoreEntry(prior);sessions.set(token,entry);log('local-session-handoff');}}catch(e){return reply(409,{error:e.message==='local-session-in-use'?'local-session-in-use':'local-recovery-unavailable'});}}
   const seatToken=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st12seat='))?.slice(9);
   function onlineIdentity(){
    const accountToken=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('csAccount='))?.slice(10);
    const account=accountToken?getRegistry().identity(accountToken):null;if(account)return account;
    if(!entry.guestIdentity){const pool=AVATARS.filter(a=>a.access==='guest-goblin').map(a=>({avatarId:a.id,avatarSrc:a.assetPath}));entry.guestIdentity={kind:'guest',playerId:null,guestId:'guest-'+randomBytes(16).toString('hex'),displayName:'Guest'+randomInt(100,1000),...pool[randomInt(pool.length)]};}
    return structuredClone(entry.guestIdentity);
   }
   if(['/api/pvp/identity','/api/single/identity'].includes(url.pathname)){if(url.pathname==='/api/pvp/identity'&&!lan)return reply(403,{error:'lan-disabled'});if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});return reply(200,{identity:onlineIdentity()});}
   detachFormerPlayers();
   // Reload resumes live games only. Finalized results remain in Registry, not a return prompt.
   if(entry&&['/api/open','/api/pvp/return-status'].includes(url.pathname)&&Object.keys(body).length===0){
    const completedRoom=[...pvp.rooms.values()].find(r=>r.host?.status==='complete'&&r.seats.some(s=>s?.binding===token&&((s.token&&s.token===(entry.seatToken||seatToken))||(entry.recoveryNotice?.noticeId&&s.takeover?.id===entry.recoveryNotice.noticeId))));
    if(completedRoom){
     await save();const own=completedRoom.seats.find(s=>s?.binding===token&&((s.token&&s.token===(entry.seatToken||seatToken))||(entry.recoveryNotice?.noticeId&&s.takeover?.id===entry.recoveryNotice.noticeId)));
     if(own?.token&&!own.left&&own.controller!=='ai')await pvp.route(own.token,token,'leave');
     entry.seatToken=null;entry.recoveryNotice=null;entry.mode='main-menu';res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');
     if(url.pathname==='/api/pvp/return-status')return reply(200,{mainMenu:true});
    }
    if(url.pathname==='/api/open')for(const [mode,slot]of Object.entries(slots(entry))){
     const snapshot=(await slot.session.client.read()).snapshot;if(snapshot.phase!=='finished'||snapshot.online&&!snapshot.online.complete)continue;
     await save();delete slots(entry)[mode];if(entry.session===slot.session){entry.configuration=initial();entry.session=localSession(entry.configuration);if(entry.mode!=='multiplayer')entry.mode='main-menu';}
    }
   }
   if(entry?.recoveryNotice&&['/api/open','/api/pvp/return-status'].includes(url.pathname)){res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,{returning:true,rejoin:entry.recoveryNotice});}
   if(entry?.recoveryNotice&&['/api/read','/api/command','/api/configure'].includes(url.pathname))return reply(409,{error:'seat-handed-to-ai'});
   if(url.pathname==='/api/leave-match'){
    if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});
    if(entry.mode==='multiplayer'){
     try{if(seatToken)await pvp.route(seatToken,token,'leave',{permanent:true});}catch(e){if(!['unknown-seat','seat-handed-to-ai'].includes(e.message))return reply(409,{error:e.message});}
     entry.seatToken=null;entry.recoveryNotice=null;res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');
    }else if(entry.mode!=='main-menu'){
     const mode=modeOf(entry.configuration),slot=slots(entry)[mode];if(slot){const u=await slot.session.client.read(),s=u.snapshot;
      if(!['placement','finished'].includes(s.phase)){const out=await slot.session.client.dispatch({contract:s.contract,battle:s.battle,revision:s.revision,intent:{kind:'give-up'}});if(!out.accepted)return reply(409,{error:out.error||'leave-unavailable'});}
      // Finalize the old participation before removing its resumable slot.
      await save();delete slots(entry)[mode];
      entry.configuration=initial();entry.session=localSession(entry.configuration);
     }
    }
    entry.mode='main-menu';return reply(200,{left:true,mainMenu:true});
   }
   if(url.pathname==='/api/single/rematch'){
    if(!entry||entry.mode!=='single'||Object.keys(body).length)return reply(400,{error:'invalid-request'});const target=slots(entry).single;if(!target||!target.session.participants)return reply(400,{error:'invalid-request'});const current=await target.session.client.read();if(current.snapshot.phase!=='finished')return reply(400,{error:'not-complete'});const update=await target.session.configure();return reply(200,{configuration:target.configuration,update});
   }
   if(url.pathname==='/api/single/setup'){
    if(!entry)return reply(404,{error:'unknown-session'});
    if(Object.keys(body).join(',')!=='npcNames')return reply(400,{error:'malformed-request'});
    const c={...initial(),singlePlayer:{npcNames:body.npcNames}};try{configuration(c,0);}catch{return reply(400,{error:'invalid-configuration'});}
    const identity=onlineIdentity(),target={configuration:c,session:localSession(c,undefined,identity),statIdentity:identity};slots(entry).single=target;select(entry,'single');return reply(200,{configuration:c,update:await target.session.client.read()});
   }
   if(url.pathname==='/api/pvp/recover-missing-seat'){
    if(Object.keys(body).length)return reply(400,{error:'malformed-request'});
    // Confirm absence without leaving, surrendering, or changing a live seat.
    if(seatToken){try{await pvp.route(seatToken,token,'return-status');return reply(409,{error:'seat-still-available'});}catch(e){if(e.message!=='unknown-seat')return reply(409,{error:'seat-still-available'});}}
    if(entry){entry.seatToken=null;entry.mode='main-menu';}
    res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,{mainMenu:true});
   }
   if(url.pathname==='/api/pvp/dismiss-return'){if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});if(entry.seatToken)return reply(409,{error:'seat-still-available'});entry.recoveryNotice=null;entry.mode='main-menu';res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,{released:true});}
   if(url.pathname==='/api/pvp/watch'){
    if(!entry||entry.mode!=='multiplayer'||!pvp.requiresExplicitReturn(seatToken))return reply(403,{error:'unknown-seat'});
    if(Object.keys(body).some(k=>!['after','cursor'].includes(k))||!Number.isSafeInteger(body.after)||body.after<0||typeof body.cursor!=='string'||body.cursor.length>100)return reply(400,{error:'invalid-cursor'});
    const started=Date.now();await new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);res.off('close',finish);resolve();};res.once('close',finish);const check=()=>{if(res.destroyed||stopping||fatal){if(!res.destroyed){res.writeHead(503);res.end();}return finish();}try{const u=mutations.busy(pvp.watchLane(seatToken,token))&&!pvp.isBusy(seatToken)?null:pvp.watchRead(seatToken,token,body.after,body.cursor);if(u||Date.now()-started>=15000){void reply(200,u||{idle:true});return finish();}}catch{void reply(403,{error:'unknown-seat'});return finish();}timer=setTimeout(check,40);};check();});return;
   }
   if(req.groupLight&&pvp.isGroup(seatToken)){try{if(url.pathname==='/api/pvp/heartbeat'){if(Object.keys(body).length)throw Error('malformed-request');return reply(200,pvp.heartbeat(seatToken,token));}if(url.pathname==='/api/read'&&entry?.mode==='multiplayer'){if(Object.keys(body).some(k=>k!=='after'))throw Error('malformed-request');const live=pvp.liveRead(seatToken,token,body.after??0);if(live)return reply(200,live);}}catch(e){return reply(400,{error:e.message});}}
   if(url.pathname==='/api/command'&&entry?.mode==='multiplayer'&&pvp.isGroup(seatToken)&&req.headers.accept?.includes('application/x-ndjson')){const writer=publicStreamWriter(req,res);res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});const incremental=incrementalPublicStream(req.headers['x-st-incremental-stream']==='1');const send=value=>{if(res.destroyed)return;const v=incremental(value);writer.write(measured('stream-serialization',()=>JSON.stringify(v.type==='result'?{...v,commandTiming:commandTiming(),...(betaGameLog&&metricsContext.getStore()?{betaGameLog:betaData()}:{})}:v))+'\n');};try{const update=await pvp.stream(seatToken,token,body,u=>send({type:'progress',update:{...u,presentationClock:Date.now()}}));if(metricsContext.getStore())metricsContext.getStore()['authoritative-commit-boundary']={ms:performance.now()-betaStart,count:1};await save();send({type:'result',update:resultScore(update,req)});}catch(e){log('group-command-failed',persistenceDetails(e));send({type:'error',error:'group-command-failed'});}return writer.end();}
   if(url.pathname==='/api/pvp/spectate'){if(!lan)return reply(403,{error:'lan-disabled'});if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).some(k=>!['code','after','epoch'].includes(k))||(body.after!==undefined&&(!Number.isSafeInteger(body.after)||body.after<0))||(body.epoch!==undefined&&(typeof body.epoch!=='string'||body.epoch.length>80))||typeof body.code!=='string'||!/^[A-Z0-9]{6}$/.test(body.code))return reply(400,{error:'bad-game-code'});const room=pvp.getRoom(body.code);if(!room)return reply(404,{error:'bad-game-code'});return reply(200,Object.hasOwn(body,'after')?spectatorFeed(room,body):spectatorView(room));}
   if(url.pathname==='/api/pvp/list'){if(!lan)return reply(403,{error:'lan-disabled'});if(!entry)return reply(404,{error:'unknown-session'});if(Object.keys(body).length)return reply(400,{error:'malformed-request'});return reply(200,{games:pvp.list(token)});}
   if(url.pathname==='/api/mode'){
    if(!entry)return reply(404,{error:'unknown-session'});
    if(Object.keys(body).some(k=>!['mode','fallback'].includes(k))||!['single','story','multiplayer'].includes(body.mode)||body.fallback!==undefined&&body.fallback!==true||body.mode==='multiplayer'&&body.fallback!==undefined)return reply(400,{error:'malformed-request'});
    if(body.mode==='multiplayer'){if(!lan||!seatToken)return reply(200,{available:false});try{const opened=await pvp.route(seatToken,token,pvp.requiresExplicitReturn(seatToken)?'return':'open',{});entry.mode='multiplayer';if(opened.returning)return reply(409,{error:'rejoin-required'});return reply(200,{available:true,...opened});}catch(e){return reply(400,{error:e.message==='seat-handed-to-ai'?'seat-handed-to-ai':'unknown-seat'});}}
    if(entry.localRecoveryToken){try{const prior=recoverLocalSession?.(entry.localRecoveryToken);if(!prior)throw Error('local-recovery-unavailable');const restored=restoreEntry(prior);if(restored.localRecoveryToken)throw Error('local-recovery-unavailable');entry.slots=slots(restored);entry.session=restored.session;entry.configuration=restored.configuration;entry.localRecoveryToken=null;}catch(e){if(!body.fallback)return reply(409,{error:e.message==='local-session-in-use'?'local-session-in-use':'local-recovery-unavailable'});entry.unavailableLocalRecoveryToken=entry.localRecoveryToken;entry.localRecoveryToken=null;entry.mode='main-menu';return reply(200,{available:false,localRecoveryFallback:true});}}
    if(body.mode==='story'&&slots(entry).story?.storyOwnerId&&getRegistry().storyState(slots(entry).story.storyOwnerId).runId!==(slots(entry).story.storyRunId||'legacy'))return reply(200,{available:false});
    if(body.mode==='story'&&slots(entry).story?.storyOwnerId!==undefined&&(slots(entry).story?.storyOwnerId||null)!==(onlineIdentity()?.playerId||null))return reply(200,{available:false});
    const target=slots(entry)[body.mode];if(!target||!resumable(target,await target.session.client.read()))return reply(200,{available:false});
    if(!select(entry,body.mode))return reply(200,{available:false});
    localActivity.observe(target);
    return reply(200,{available:true,configuration:entry.configuration,storyContext:slots(entry)[body.mode]?.storyContext,update:await entry.session.client.read()});
   }
   if(url.pathname==='/api/pvp/leave'){if(lan&&seatToken){try{const out=await pvp.route(seatToken,token,'leave');detachFormerPlayers();if(out.reclaimable){entry.mode='multiplayer';log('game-left-reclaimable');return reply(200,out);}if(out.mainMenu){entry.mode='main-menu';entry.seatToken=null;res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');return reply(200,out);}}catch{}}if(entry){entry.mode='multiplayer-menu';entry.seatToken=null;}res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');log('game-left');return reply(200,{left:true});}
   if(url.pathname.startsWith('/api/pvp/')||(seatToken&&(!entry?.mode||entry.mode==='multiplayer')&&['/api/open','/api/read','/api/command','/api/configure'].includes(url.pathname))){
    if(!lan)return reply(403,{error:'lan-disabled'});
    try{const action=url.pathname.split('/').at(-1);if(['make','join'].includes(action)){if(!entry)return reply(404,{error:'unknown-session'});const identity=onlineIdentity();const result=await pvp.lobby(action,{...body,name:identity.displayName,identity},token);res.setHeader('Set-Cookie',`st12seat=${result.token}${cookieFlags}; Max-Age=86400`);entry.seatToken=result.token;entry.recoveryNotice=null;delete result.token;entry.mode='multiplayer';log(action==='make'?'game-created':'seat-joined');return reply(200,result);}if(action==='configure'&&pvp.rooms.get(body.code)?.seats.length===2)return reply(403,{error:'lan-configuration-locked'});const result=await pvp.route(seatToken,token,action==='open'&&url.pathname==='/api/open'&&pvp.requiresExplicitReturn(seatToken)?'return':action,body);if(action==='command'&&result?.accepted===false){const room=[...pvp.rooms.values()].find(r=>r.seats.some(s=>s?.token===seatToken&&s.binding===token)),seat=room?.seats.find(s=>s?.token===seatToken&&s.binding===token);if(seat?.controller==='human'&&!seat.absence&&!seat.left&&seat.identity?.kind==='account'&&room.matchStatistics?.id)getRegistry().recordRejectedReview({playerId:seat.identity.playerId,matchId:room.matchStatistics.id,request:body,result,size:room.host.config.size});}if(result.token&&entry){entry.seatToken=result.token;entry.recoveryNotice=null;entry.mode='multiplayer';res.setHeader('Set-Cookie',`st12seat=${result.token}${cookieFlags}; Max-Age=86400`);delete result.token;result.movedToRematch=true;}if((['surrender','give-up'].includes(action)||action==='command'&&result.released)&&entry){detachFormerPlayers();entry.seatToken=null;entry.recoveryNotice=null;entry.mode='main-menu';res.setHeader('Set-Cookie','st12seat='+cookieFlags+'; Max-Age=0');}if(action==='open'&&entry){result.modes=Object.keys(slots(entry));result.localRecoveryPending=!!entry.localRecoveryToken;}return reply(200,result);}catch(e){return reply(400,{error:['stale','rejoin-required','kick-unavailable','seat-handed-to-ai','unknown-seat','bad-game-code','game-full','invalid-name','already-seated','not-complete','invalid-configuration','unknown-session'].includes(e.message)||/^reliability-required-(?:100|[1-9]?[0-9])$/.test(e.message)?e.message:'invalid-request'});}
   }
   if(url.pathname==='/api/open'&&entry?.mode==='multiplayer'&&!seatToken)return reply(409,{error:'missing-seat-credential'});
   if(url.pathname==='/api/open'){
    if(Object.keys(body).some(k=>!['fresh','menuOnly'].includes(k))||body.fresh!==undefined&&body.fresh!==true||body.menuOnly!==undefined&&body.menuOnly!==true||body.fresh&&body.menuOnly)return reply(400,{error:'malformed-request'});
    if(body.menuOnly&&seatToken)return reply(409,{error:'missing-seat-credential'});
    if(token&&!entry&&!body.fresh&&!body.menuOnly)return reply(404,{error:'unknown-session'});
    const deferred=body.menuOnly&&!entry&&/^[a-f0-9]{64}$/.test(token||'')?token:null;
    const reconnected=!!entry&&!body.fresh;if(!reconnected){const made=make();entry=made.entry;if(deferred){entry.localRecoveryToken=deferred;entry.mode='main-menu';}res.setHeader('Set-Cookie',`st11sid=${made.token}${cookieFlags}; Max-Age=86400`);}
    return await ordered(entry,async()=>reply(200,{configuration:entry.configuration,reconnected,development,localRecoveryPending:!!entry.localRecoveryToken,mainMenu:entry.mode==='main-menu',multiplayerMenu:entry.mode==='multiplayer-menu',modes:Object.keys(slots(entry)),localResume:await localResumeModes(entry,onlineIdentity()),update:await entry.session.client.read()}));
   }
   if(!entry)return reply(404,{error:'unknown-session'});
   return await ordered(entry,async()=>{
    if(entry.localRecoveryToken&&['/api/command','/api/configure'].includes(url.pathname))return reply(409,{error:'local-recovery-unavailable'});
    if(url.pathname==='/api/read'){if(Object.keys(body).some(k=>k!=='after'))return reply(400,{error:'malformed-request'});try{return reply(200,await entry.session.client.read(body.after??0));}catch{return reply(400,{error:'invalid-cursor'});}}
    if(url.pathname==='/api/command'){
     const slot=slots(entry)[modeOf(entry.configuration)];if(!slot.matchStatistics?.startedAt)slot.statIdentity=onlineIdentity();
     const bindStory=update=>{if(update.accepted)localActivity.observe(slot);if(slot.configuration.story&&update.accepted&&body.intent?.kind==='start'){try{getRegistry().dashboard.storyStart();}catch{dashboardIssue=true;log('dashboard-recording-failed');}if(slot.storyOwnerId===undefined)slot.storyOwnerId=onlineIdentity()?.playerId||null;if(slot.storyRunId===undefined)slot.storyRunId=slot.storyOwnerId?getRegistry().storyState(slot.storyOwnerId).runId:null;}return update;};
     if(req.headers.accept!=='application/x-ndjson')return reply(200,bindStory(await entry.session.client.dispatch(body)));
     const send=value=>{if(res.destroyed)return;if(!res.headersSent){res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.flushHeaders();}res.write(JSON.stringify(value.type==='result'?{...value,commandTiming:commandTiming(),...(betaGameLog&&metricsContext.getStore()?{betaGameLog:betaData()}:{})}:value)+'\n');};
     const update=bindStory(await entry.session.dispatchWithProgress(body,async frame=>{send({type:'preview',frame:nameDoublePlague(frame,entry)});await new Promise(resolve=>setImmediate(resolve));}));
     try{if(!fatal)await save();}catch{fatal=true;log('checkpoint-write-failed');send({type:'error',error:'server-recovery-unavailable'});res.end();return;}
     send({type:'result',update:resultScore(update,req)});res.end();return;
    }
    if(url.pathname==='/api/configure'){
     if(Object.keys(body).filter(k=>k!=='storyContext').sort().join(',')!=='battle,configuration,revision')return reply(400,{error:'malformed-request'});
     const current=await entry.session.client.read();if(body.battle!==current.snapshot.battle||body.revision!==current.snapshot.revision)return reply(409,{error:'stale'});
     let config,context;try{config=configuration(body.configuration,0);context=storyContext(body.storyContext);if(context&&!body.configuration.story)throw Error();}catch{return reply(400,{error:'invalid-configuration'});}
     try{const mode=modeOf(body.configuration),all=slots(entry);let target=all[mode],update;if(target){if(!!target.session.participants!==(body.configuration.singlePlayer?.npcNames.length>1)){target.session=localSession(body.configuration,undefined,onlineIdentity());delete target.matchStatistics;update=await target.session.client.read();}else update=await target.session.configure(config);target.configuration=structuredClone(body.configuration);}else{target={session:createLocalSession(configuration(body.configuration,seed??randomInt(0,0x100000000)),undefined,development),configuration:structuredClone(body.configuration)};if(!target.session.participants){const saved=JSON.parse(await target.session.serializePrivate());saved.epoch=randomInt(1,2**48);target.session=createLocalSession(config,JSON.stringify(saved),development);}update=await target.session.client.read();all[mode]=target;}target.storyContext=context;target.storyOwnerId=body.configuration.story?(onlineIdentity()?.playerId||null):null;target.storyRunId=target.storyOwnerId?getRegistry().storyState(target.storyOwnerId).runId:null;delete target.storyCapturedEpoch;select(entry,mode);return reply(200,{configuration:entry.configuration,update});}catch{return reply(400,{error:'invalid-configuration'});}
    }
    if(url.pathname.startsWith('/api/dev/')){if(!development)return reply(403,{error:'development-denied'});if(url.pathname==='/api/dev/inspect')return reply(200,await entry.session.dev.inspect());if(url.pathname==='/api/dev/takeover'&&typeof body.enabled==='boolean')return reply(200,await entry.session.dev.takeover(body.enabled));if(url.pathname==='/api/dev/shoot')return reply(200,await entry.session.dev.shoot(body.cell));}
    return reply(404,{error:'not-found'});
   });
  }catch{log('request-failed');return reply(400,{error:'malformed-request'});}
 };
 const metrics=requestMetrics(),loopDelay=monitorEventLoopDelay({resolution:20});loopDelay.enable();
 const server=http.createServer(async(req,res)=>{req.betaArrival=performance.now();const measured=measuredRequest(req.method,req.url);if(measured){res.once('finish',()=>metrics.response(performance.now()-req.betaArrival));}try{if(req.method==='POST'){let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>(req.url==='/api/registry/feedback-submit'?24*1024*1024:65536)){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'request-too-large'}));return;}chunks.push(chunk);}req.intake=Buffer.concat(chunks);}if(req.url.startsWith('/api/registry/')||req.url==='/api/pvp/watch'){req.groupLight=true;await handle(req,res);return;}const st=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st12seat='))?.slice(9);if((req.url==='/api/pvp/heartbeat'&&pvp.requiresExplicitReturn(st))||(req.url==='/api/read'&&pvp.isGroup(st)&&pvp.isBusy(st))){req.groupLight=true;await handle(req,res);return;}/* Read-only allowlisted assets must not wait behind an active combat transaction. */if(req.method==='GET'&&!req.url.startsWith('/api/')){await handle(req,res);return;}const binding=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('st11sid='))?.slice(8);const lane=req.url==='/api/command'?pvp.commandLane(st,binding):null;const enqueued=performance.now();mutations.run(async()=>{if(measured)metrics.queue(performance.now()-enqueued);mutationPending++;try{await handle(req,res);}finally{mutationPending--;}},lane).catch(()=>{log('unexpected-server-error');if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'server-error'}));});}catch{if(!res.destroyed)res.destroy();}});
 server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.setTimeout(20000,socket=>socket.destroy());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,address,resolve);}).catch(async e=>{await store?.release();throw e;});origin='http://127.0.0.1:'+server.address().port;
 const sampleHealth=()=>{try{const timing=metrics.take(loopDelay.count?loopDelay.max/1e6:null);loopDelay.reset();currentHealth={...devHealth(registryDir),...metricValues(timing)};healthAt=now();getRegistry().dashboard.sample(currentHealth,null,timing);}catch{dashboardIssue=true;log('dashboard-recording-failed');}};
 sampleHealth();const dashboardTimer=setInterval(sampleHealth,300000);dashboardTimer.unref();
 let policyPending=false;const policyTimer=setInterval(()=>{if(policyPending)return;policyPending=true;mutations.run(async()=>{if(stopping||fatal)return;mutationPending++;try{if(await pvp.tick()||pvp.hasRetirable())await save();detachFormerPlayers();}finally{mutationPending--;}}).catch(()=>{fatal=true;log('disconnect-policy-failed');}).finally(()=>{policyPending=false;});},500);policyTimer.unref();
 log('startup',{checkpoint:checkpointId,build,mode:development?'development':'production',address,port:server.address().port,lan,persistence:!!store,recovery});
 return {origin,lan,address,pvp,close:async()=>{stopping=true;clearInterval(policyTimer);clearInterval(dashboardTimer);loopDelay.disable();const closed=new Promise(resolve=>server.close(resolve));await closed;await mutations.idle();await pvp.close();try{if(!fatal)await save();}finally{await closed;await store?.release();registry?.close();log('shutdown');}},
  // Process-local test/restart capabilities. Never routed over production HTTP.
  checkpoint:token=>sessions.get(token)?.session.serializePrivate(),
  install:(c,checkpoint)=>make(c,checkpoint).token,
  sessions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const mode=process.env.ST_MODE||'production';if(!['production','development'].includes(mode))throw Error('Invalid ST_MODE');const app=await startServer({port:Number(process.env.PORT||3211),development:mode==='development'||process.argv.includes('--development'),lan:process.argv.includes('--lan'),bind:process.env.ST_BIND||process.env.LAN_BIND,stateDir:process.env.ST_STATE_DIR,publicOrigin:process.env.ST_PUBLIC_ORIGIN,secureCookies:process.env.ST_SECURE_COOKIES==='1',trustLoopbackProxy:process.env.ST_TRUST_LOOPBACK_PROXY==='1'});console.log(app.origin);let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();process.exit(0);});}catch{console.error('Stone Throw startup failed: check configuration, state lock and checkpoint compatibility.');process.exitCode=1;}
}
