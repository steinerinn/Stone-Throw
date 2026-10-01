#!/usr/bin/python3
"""One-command deployment. No state/Registry copying, migration or compaction."""
import datetime,fcntl,hashlib,http.client,json,os,pathlib,pwd,re,signal,socket,ssl,subprocess,sys,tempfile,time,urllib.parse
REPO=pathlib.Path('/home/steinerinn/chainsiege-live')
ROOT=pathlib.Path('/var/lib/chainsiege-deploy-v2')
PENDING=ROOT/'pending.json'
CONTRACT='playtest/persistence-contract.json'
KEYS=('deployProtocol','state','registry','semantics','checkpointFormat')
INITIAL={'deployProtocol':1,'state':'chainsiege-state-v1','registry':'chainsiege-registry-v1','semantics':'chainsiege-persistence-v1','checkpointFormat':'controlled-playtest-v1'}
# Initial protocol adoption: these serializers, Registry/migration implementations
# and persisted gameplay structures must remain identical. No commit exceptions.
LEGACY_INPUTS=('playtest/canonical','playtest/server/registry.mjs','playtest/server/statistics-store.mjs','playtest/server/score-store.mjs','playtest/server/replay-store.mjs','playtest/server/anomaly-review.mjs','playtest/server/feedback.mjs','playtest/server/room-recovery.mjs','playtest/server/ring-pvp.mjs','playtest/server/cold-rooms.mjs','playtest/server/liveness-store.mjs')

def run(args,user=False,timeout=120,check=True):
    if user: args=['runuser','-u','steinerinn','--',*args]
    p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
    if check and p.returncode: raise RuntimeError('Command failed: '+repr(args)+'\n'+p.stdout+'\n'+p.stderr)
    return p

def git(*args): return run(['git','-C',str(REPO),*args],user=True).stdout.strip()
def sha(path):
    h=hashlib.sha256()
    with pathlib.Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
    return h.hexdigest()
def sync(directory):
    fd=os.open(directory,os.O_RDONLY|os.O_DIRECTORY)
    try:os.fsync(fd)
    finally:os.close(fd)
def save(path,data):
    fd,name=tempfile.mkstemp(prefix='.transaction-',dir=path.parent)
    try:
        with os.fdopen(fd,'w') as f:json.dump(data,f);f.flush();os.fsync(f.fileno())
        os.replace(name,path);sync(path.parent)
    finally:
        if os.path.exists(name):os.unlink(name)
def log(event,**fields):
    row={'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'event':event,**fields}
    text=json.dumps(row);print(text,flush=True)
    with (ROOT/'deploy.log').open('a') as f:f.write(text+'\n');f.flush()
def active(service):return run(['systemctl','is-active','--quiet',service],check=False).returncode==0
def clean():
    if git('status','--porcelain','--untracked-files=all'):raise RuntimeError('Production checkout is not clean.')
def contract(ref):
    exists=run(['git','-C',str(REPO),'cat-file','-e',ref+':'+CONTRACT],user=True,check=False)
    if exists.returncode:return None
    c=json.loads(git('show',ref+':'+CONTRACT))
    if set(c)!=set(KEYS) or c.get('deployProtocol')!=1 or any(not isinstance(c[k],str) or not c[k] for k in KEYS[1:]):raise RuntimeError('Unsupported persistence/deploy contract; special migration deployment required.')
    return c

def compatible(previous,target):
    old,new=contract(previous),contract(target)
    if new is None:raise RuntimeError('Target has no persistence contract; special migration deployment required.')
    if old is None:
        legacy=git('show',previous+':playtest/server/store.mjs')
        if new!=INITIAL or "checkpointId='controlled-playtest-v1'" not in legacy or git('diff','--name-only',previous,target,'--',*LEGACY_INPUTS):
            raise RuntimeError('Legacy format differs; special migration deployment required.')
        return old,new
    if old!=new:raise RuntimeError('Persistence state/Registry/semantics version changed; special migration deployment required.')
    return old,new

def environment():
    pid=int(run(['systemctl','show','chainsiege.service','-p','MainPID','--value']).stdout)
    if pid<=0:raise RuntimeError('CHAIN SIEGE is not running.')
    if pathlib.Path('/proc/'+str(pid)).stat().st_uid!=pwd.getpwnam('steinerinn').pw_uid:raise RuntimeError('Unexpected service user.')
    env=dict(item.decode().split('=',1) for item in pathlib.Path(f'/proc/{pid}/environ').read_bytes().split(b'\0') if b'=' in item)
    expected={'ST_STATE_DIR':'/home/steinerinn/chainsiege-data/state','ST_REGISTRY_DIR':'/home/steinerinn/chainsiege-data/registry','ST_BIND':'127.0.0.1','ST_TRUST_LOOPBACK_PROXY':'1','ST_PUBLIC_ORIGIN':'https://chainsiege.com'}
    if any(env.get(k)!=v for k,v in expected.items()) or env.get('ST_MODE','production')!='production':raise RuntimeError('Unexpected production environment.')
    node=str(pathlib.Path(f'/proc/{pid}/exe').resolve())
    if not run([node,'--version'],user=True).stdout.startswith('v24.'):raise RuntimeError('Node 24 required.')
    return node,env['ST_PUBLIC_ORIGIN']

def request(origin,path='/health',proxy=False,bad_origin=False,bad_host=False):
    public=urllib.parse.urlsplit(origin)
    headers={'Host':'invalid.example' if bad_host else public.netloc,'Connection':'close'}
    body=None
    if path.startswith('/api/'):
        # /api/read is the read-only route; malformed bodies fail before state,
        # session or Registry handling. Neither verification probe creates data.
        body=b'{';headers.update({'Origin':'https://invalid.example' if bad_origin else origin,'Content-Type':'application/json'})
    if proxy:
        context=ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.load_verify_locations('/etc/nginx/ssl/chainsiege-origin.pem')
        context.verify_flags|=ssl.VERIFY_X509_PARTIAL_CHAIN
        context.minimum_version=ssl.TLSVersion.TLSv1_2
        class LocalTLS(http.client.HTTPSConnection):
            def connect(self):
                raw=socket.create_connection(('192.168.11.103',443),self.timeout)
                try:self.sock=self._context.wrap_socket(raw,server_hostname=public.hostname)
                except BaseException:raw.close();raise
        connection=LocalTLS(public.hostname,443,timeout=2,context=context)
    else:connection=http.client.HTTPConnection('127.0.0.1',3211,timeout=2)
    try:
        connection.request('POST' if body is not None else 'GET',path,body=body,headers=headers)
        r=connection.getresponse();payload=r.read()
        try:return r.status,json.loads(payload)
        except ValueError as e:raise RuntimeError('Non-JSON verification response: HTTP '+str(r.status)) from e
    finally:connection.close()

def checks(origin,build,expected):
    for proxy in (False,True):
        status,body=request(origin,proxy=proxy)
        if status!=200 or body.get('healthy') is not True or body.get('build')!=build or body.get('mode')!='production':raise RuntimeError('Health/build verification failed.')
        if expected is not None and body.get('persistence')!=expected:raise RuntimeError('Running persistence contract mismatch.')
        if request(origin,'/api/read',proxy=proxy)!=(400,{'error':'malformed-request'}):raise RuntimeError('Canonical Origin probe failed.')
        if request(origin,'/api/read',proxy=proxy,bad_origin=True)!=(403,{'error':'invalid-origin'}):raise RuntimeError('Invalid Origin was not rejected.')
    if request(origin,bad_host=True)!=(403,{'error':'invalid-host'}):raise RuntimeError('Invalid Host was not rejected.')
    listeners=[r.split()[3] for r in run(['ss','-H','-lnt']).stdout.splitlines() if r.split()[3].rsplit(':',1)[-1]=='3211']
    if listeners!=['127.0.0.1:3211']:raise RuntimeError('Node is not exclusively loopback-bound.')
    if not active('chainsiege.service') or not active('nginx.service'):raise RuntimeError('Services are not active.')

def wait_health(t,old=False):
    build=t['old_build'] if old else t['new_build'];expected=t['old_contract'] if old else t['new_contract'];deadline=time.monotonic()+20
    while True:
        try:checks(t['origin'],build,expected);return
        except Exception:
            if time.monotonic()>=deadline:raise
            time.sleep(.2)

def stop():
    run(['systemctl','stop','chainsiege.service'],timeout=20)
    if active('chainsiege.service'):raise RuntimeError('Service did not stop.')
    if any(r.split()[3].rsplit(':',1)[-1]=='3211' for r in run(['ss','-H','-lnt']).stdout.splitlines()):raise RuntimeError('Node is still listening.')
def start():
    run(['systemctl','reset-failed','chainsiege.service'])
    run(['systemctl','start','chainsiege.service'],timeout=20)
def finish(t,result):
    save(ROOT/(t['id']+'.json'),{**t,'result':result});PENDING.unlink(missing_ok=True);sync(ROOT)
    log(result,previous=t['previous'],target=t['target'],registry='untouched',state='reused unchanged by deploy tool')
def recover(t):
    log('rollback-start',previous=t['previous'])
    stop();clean();git('checkout','--detach',t['previous']);start();wait_health(t,old=True);finish(t,'rollback-pass')

def deploy(t):
    # Persist only a tiny control record. Never open/copy/rewrite game state.
    save(PENDING,t);started=time.monotonic()
    try:
        stop();git('checkout','--detach',t['target']);start();wait_health(t)
        t['downtimeSeconds']=round(time.monotonic()-started,3)
        finish(t,'deploy-pass')
    except BaseException:
        try:recover(t)
        except BaseException as e:log('recovery-required',error=str(e),command='chainsiege-deploy --recover')
        raise

def main(args):
    if args==['--recover']:
        if PENDING.exists():recover(json.loads(PENDING.read_text()))
        else:log('no-pending-deployment')
        return
    if PENDING.exists():
        if args==['--verify'] or (args and args[0]=='--dry-run'):raise RuntimeError('Pending deployment; run chainsiege-deploy --recover first.')
        recover(json.loads(PENDING.read_text()))
    for path in ['/var/lib/chainsiege-deploy/pending.json','/var/lib/chainsiege-fast-deploy/pending.json']:
        if pathlib.Path(path).exists():raise RuntimeError('Older unresolved transaction exists; evidence preserved.')
    clean();node,origin=environment();previous=git('rev-parse','HEAD');old_build=sha(REPO/'playtest/build-manifest.json')
    checks(origin,old_build,contract(previous));run(['nginx','-t'])
    if args==['--verify']:log('verify-pass',commit=previous);return
    dry=len(args)==2 and args[0]=='--dry-run'
    if not (len(args)==1 or dry) or not re.fullmatch('[a-fA-F0-9]{40}',args[-1]):raise RuntimeError('Usage: chainsiege-deploy <full-sha> | --verify | --dry-run <full-sha> | --recover')
    target=args[-1].lower()
    if target==previous:log('already-deployed',commit=target);return
    git('fetch','--no-tags','origin',target)
    if git('rev-parse',target+'^{commit}')!=target:raise RuntimeError('Explicit commit mismatch.')
    old_contract,new_contract=compatible(previous,target)
    user=pwd.getpwnam('steinerinn');parent=pathlib.Path('/home/steinerinn/.chainsiege-deploy-staging');parent.mkdir(mode=0o700,exist_ok=True);os.chown(parent,user.pw_uid,user.pw_gid)
    ident=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+str(os.getpid());stage=parent/ident
    git('worktree','add','--detach',str(stage),target)
    try:
        run([node,str(stage/'playtest/tools/verify.mjs')],user=True)
        if git('rev-parse','HEAD')!=previous:raise RuntimeError('Checkout changed during preflight.')
        clean()
        t={'id':ident,'previous':previous,'target':target,'origin':origin,'old_build':old_build,'new_build':sha(stage/'playtest/build-manifest.json'),'old_contract':old_contract,'new_contract':new_contract}
        if dry:log('dry-run-pass',previous=previous,target=target,contract=new_contract);return
        deploy(t)
    finally:
        # A staging cleanup failure must never trigger production rollback.
        result=run(['git','-C',str(REPO),'worktree','remove',str(stage)],user=True,check=False)
        if result.returncode:log('staging-retained',path=str(stage))

def cli():
    if os.geteuid()!=0:raise SystemExit('Run as root.')
    ROOT.mkdir(mode=0o700,exist_ok=True)
    def interrupted(signum,frame):raise RuntimeError('Interrupted by signal '+str(signum))
    signal.signal(signal.SIGINT,interrupted);signal.signal(signal.SIGTERM,interrupted)
    lock=pathlib.Path('/var/lib/chainsiege-deploy/deploy.lock');lock.parent.mkdir(mode=0o700,exist_ok=True)
    with lock.open('a') as stream:
        fcntl.flock(stream,fcntl.LOCK_EX|fcntl.LOCK_NB)
        try:main(sys.argv[1:])
        except BaseException as e:log('failed',error=str(e));raise SystemExit(1)
if __name__=='__main__':cli()

