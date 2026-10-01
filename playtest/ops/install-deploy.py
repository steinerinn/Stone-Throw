#!/usr/bin/python3
"""Install from an explicit, already fetched Git commit; never deploy game code."""
import datetime,fcntl,hashlib,json,os,pathlib,re,subprocess,sys,tempfile
REPO='/home/steinerinn/chainsiege-live'
DEST=pathlib.Path('/usr/local/sbin/chainsiege-deploy')
ROOT=pathlib.Path('/var/lib/chainsiege-deploy-v2')
def git(*args):return subprocess.check_output(['runuser','-u','steinerinn','--','git','-C',REPO,*args])
def replace(data,mode):
    fd,name=tempfile.mkstemp(prefix='.chainsiege-deploy-',dir=DEST.parent)
    try:
        with os.fdopen(fd,'wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
        os.chmod(name,mode);os.replace(name,DEST)
        fd=os.open(DEST.parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(fd)
        finally:os.close(fd)
    finally:
        if os.path.exists(name):os.unlink(name)
def main():
    if os.geteuid()!=0:raise RuntimeError('Run as root.')
    if len(sys.argv)!=2 or not re.fullmatch('[a-fA-F0-9]{40}',sys.argv[1]):raise RuntimeError('An explicit full source commit is required.')
    ref=sys.argv[1].lower()
    if git('rev-parse',ref+'^{commit}').decode().strip()!=ref:raise RuntimeError('Source commit mismatch.')
    for p in ('/var/lib/chainsiege-deploy/pending.json','/var/lib/chainsiege-fast-deploy/pending.json',str(ROOT/'pending.json')):
        if pathlib.Path(p).exists():raise RuntimeError('Unresolved transaction; installation stopped, evidence preserved: '+p)
    if git('status','--porcelain').strip():raise RuntimeError('Live checkout is not clean.')
    manifest=json.loads(git('show',ref+':playtest/build-manifest.json'))
    source=git('show',ref+':playtest/ops/chainsiege-deploy.py')
    if hashlib.sha256(source).hexdigest()!=manifest['files']['ops/chainsiege-deploy.py']:raise RuntimeError('Deploy tool manifest mismatch.')
    source=source.replace(b'\r\n',b'\n');compile(source,str(DEST),'exec')
    ROOT.mkdir(mode=0o700,exist_ok=True);DEST.parent.mkdir(exist_ok=True)
    old=DEST.read_bytes() if DEST.exists() else None
    oldmode=DEST.stat().st_mode&0o777 if old is not None else 0o755
    stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+str(os.getpid())
    if old is not None:
        backup=ROOT/('previous-tool-'+stamp)
        fd=os.open(backup,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'wb') as f:f.write(old);f.flush();os.fsync(f.fileno())
    replace(source,0o755)
    # Release installer lock before the tool takes the same deployment lock.
    return old,oldmode,stamp
if __name__=='__main__':
    lock=pathlib.Path('/var/lib/chainsiege-deploy/deploy.lock');lock.parent.mkdir(mode=0o700,exist_ok=True)
    with lock.open('a') as stream:
        fcntl.flock(stream,fcntl.LOCK_EX|fcntl.LOCK_NB)
        old,mode,stamp=main()
        # Run read-only verification in the same process while holding the lock.
        try:
            scope={'__name__':'chainsiege_installer_verify'}
            exec(compile(DEST.read_bytes(),str(DEST),'exec'),scope)
            scope['main'](['--verify'])
        except BaseException:
            if old is not None:replace(old,mode)
            else:DEST.unlink()
            raise
        print(json.dumps({'installed':str(DEST),'verified':True,'productionUnchanged':True,'evidence':str(ROOT),'sourceCommit':sys.argv[1]}))
