"""Focused deploy state-machine checks; never contacts production."""
import importlib.util,pathlib,sys,types,tempfile,json,unittest,subprocess
from unittest.mock import patch
if sys.platform=='win32':
    sys.modules['fcntl']=types.SimpleNamespace()
    sys.modules['pwd']=types.SimpleNamespace()
source=pathlib.Path(__file__).resolve().parents[1]/'ops/chainsiege-deploy.py'
spec=importlib.util.spec_from_file_location('deploy',source);d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
class Deployment(unittest.TestCase):
    def test_contract_rules(self):
        with patch.object(d,'contract',side_effect=[d.INITIAL,d.INITIAL]):self.assertEqual(d.compatible('old','new'),(d.INITIAL,d.INITIAL))
        for key in ('state','registry','semantics'):
            changed={**d.INITIAL,key:'next'}
            with patch.object(d,'contract',side_effect=[d.INITIAL,changed]):
                with self.assertRaisesRegex(RuntimeError,'special migration'):d.compatible('old','new')
        with patch.object(d,'contract',side_effect=[None,d.INITIAL]),patch.object(d,'git',side_effect=["checkpointId='controlled-playtest-v1'",'']):d.compatible('old','new')
        with patch.object(d,'contract',side_effect=[None,d.INITIAL]),patch.object(d,'git',side_effect=["checkpointId='controlled-playtest-v1'",'registry.mjs']):
            with self.assertRaisesRegex(RuntimeError,'special migration'):d.compatible('old','new')
    def exercise(self,fail=False):
        with tempfile.TemporaryDirectory() as folder:
            folder=pathlib.Path(folder);state=folder/'state';registry=folder/'registry';state.write_bytes(b'authoritative');registry.write_bytes(b'registry');events=[]
            t={'id':'test','previous':'a'*40,'target':'b'*40,'old_build':'x','new_build':'y','old_contract':d.INITIAL,'new_contract':d.INITIAL,'origin':'https://chainsiege.com'}
            def health(t,old=False):
                events.append('old-health' if old else 'new-health')
                if fail and not old:raise RuntimeError('verification failed')
            def save(p,data):p.write_text(json.dumps(data))
            with patch.object(d,'ROOT',folder),patch.object(d,'PENDING',folder/'pending.json'),patch.object(d,'save',save),patch.object(d,'sync'),patch.object(d,'log'),patch.object(d,'stop',lambda:events.append('stop')),patch.object(d,'start',lambda:events.append('start')),patch.object(d,'clean',lambda:events.append('clean')),patch.object(d,'git',lambda *a:events.append(a)),patch.object(d,'wait_health',health):
                if fail:
                    with self.assertRaisesRegex(RuntimeError,'verification failed'):d.deploy(t)
                else:d.deploy(t)
            self.assertEqual(state.read_bytes(),b'authoritative');self.assertEqual(registry.read_bytes(),b'registry');self.assertFalse((folder/'pending.json').exists())
            self.assertEqual(events[:4],['stop',('checkout','--detach','b'*40),'start','new-health'])
            if fail:self.assertEqual(events[4:],['stop','clean',('checkout','--detach','a'*40),'start','old-health'])
    def test_deploy(self):self.exercise()
    def test_rollback(self):self.exercise(True)
    def test_recovery_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            folder=pathlib.Path(folder);pending=folder/'pending.json'
            with patch.object(d,'PENDING',pending),patch.object(d,'save',lambda p,t:p.write_text(json.dumps(t))),patch.object(d,'stop',side_effect=RuntimeError('stop failed')),patch.object(d,'log'):
                with self.assertRaisesRegex(RuntimeError,'stop failed'):d.deploy({'previous':'old','target':'new'})
            self.assertTrue(pending.exists())
    def test_first_upgrade_waits_for_large_journal_replay(self):
        t={'old_build':'old','new_build':'new','old_contract':None,'new_contract':d.INITIAL,'origin':'https://chainsiege.com'}
        clock=[0]
        def checks(*a):
            if clock[0]<35:raise RuntimeError('Still restoring')
        with patch.object(d.time,'monotonic',lambda:clock[0]),patch.object(d.time,'sleep',lambda n:clock.__setitem__(0,clock[0]+n)),patch.object(d,'checks',checks):d.wait_health(t)
        self.assertGreaterEqual(clock[0],35)
        t['old_contract']=d.INITIAL;clock[0]=0
        with patch.object(d.time,'monotonic',lambda:clock[0]),patch.object(d.time,'sleep',lambda n:clock.__setitem__(0,clock[0]+n)),patch.object(d,'checks',checks):
            with self.assertRaisesRegex(RuntimeError,'Still restoring'):d.wait_health(t)
        self.assertLess(clock[0],21)
    def test_requests_are_read_only_and_origin_method_valid(self):
        calls=[]
        class Connection:
            def __init__(self,*a,**k):pass
            def request(self,*a,**k):calls.append((a,k))
            def getresponse(self):return types.SimpleNamespace(status=400,read=lambda:b'{"error":"malformed-request"}')
            def close(self):pass
        with patch.object(d.http.client,'HTTPConnection',Connection):d.request('https://chainsiege.com','/api/read',bad_origin=True)
        a,k=calls[0];self.assertEqual(a,('POST','/api/read'));self.assertEqual(k['body'],b'{');self.assertEqual(k['headers']['Origin'],'https://invalid.example');self.assertEqual(k['headers']['Host'],'chainsiege.com')
    def test_no_maintenance_or_registry_operations(self):
        text=source.read_text()
        for forbidden in ('copytree','copy2','compact.mjs','registry.sqlite','systemctl\',\'stop\',\'nginx','git reset','--hard'):self.assertNotIn(forbidden,text)
        self.assertNotIn('e723ec5',text)
        self.assertNotIn('checkpoint.journal',text[text.index('def deploy('):text.index('def main(')])
    def test_host_and_origin_fail_closed(self):
        def response(origin,path='/health',proxy=False,bad_origin=False,bad_host=False):
            if bad_host:return 403,{'error':'invalid-host'}
            if bad_origin:return 403,{'error':'invalid-origin'}
            if path=='/api/read':return 400,{'error':'malformed-request'}
            return 200,{'healthy':True,'mode':'production','build':'build','persistence':d.INITIAL}
        with patch.object(d,'request',response),patch.object(d,'active',return_value=True),patch.object(d,'run',return_value=types.SimpleNamespace(stdout='LISTEN 0 511 127.0.0.1:3211 0.0.0.0:*')):d.checks('https://chainsiege.com','build',d.INITIAL)
        with patch.object(d,'request',lambda *a,**k:(200,{})):
            with self.assertRaises(RuntimeError):d.checks('https://chainsiege.com','build',d.INITIAL)
if __name__=='__main__':unittest.main()
