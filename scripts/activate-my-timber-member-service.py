"""Activate the browser-qualified member service on existing owners.
The real community remains disabled. No route, schedule or member data change.
"""
from pathlib import Path
import json,re,urllib.request,urllib.error,hashlib,email,subprocess,datetime,sys
root=Path.cwd();base=root.parent;release=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else base/'v6-release-inherited-layout';out=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else base/'v6-member-service-activation-native';assert not out.exists(),'Inspect the existing activation receipt before any retry.'
oauth=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
api='https://api.cloudflare.com/client/v4';prefix='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'
def call(path,method='GET',data=None,headers={}):
 try:
  with urllib.request.urlopen(urllib.request.Request(api+path,data=data,method=method,headers={'Authorization':'Bearer '+oauth,**headers}),timeout=55)as r:return dict(r.headers),r.read()
 except urllib.error.HTTPError as e:raise RuntimeError('Provider '+str(e.code)+' '+e.read().decode()[:1500])from None
def get(path):
 _,b=call(path);d=json.loads(b);assert d['success'];return d['result']
def module_hashes(worker):
 h,b=call(prefix+worker+'/content/v2');ct=next(v for k,v in h.items()if k.lower()=='content-type');m=email.message_from_bytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+b)
 return{p.get_filename()or p.get_param('name',header='content-disposition'):hashlib.sha256(p.get_payload(decode=True)).hexdigest()for p in m.walk()if not p.is_multipart()}
def public(path):
 r=subprocess.run(['curl','-sS','--max-time','30','-w','\n%{http_code}','https://shiftsometimber.co.uk'+path],capture_output=True,check=True);b,s=r.stdout.rsplit(b'\n',1);assert s==b'200';return b
def sha(b):return hashlib.sha256(b).hexdigest()
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def clean(settings):
 return{k:v for k,v in settings.items()if k not in ['annotations','bindings']}
# Existing browser receipts apply to the exact unchanged serving programme code.
qual=base/'v6-live-acceptance';evidence={}
for name in ['safety-widths-receipt.json','community-entrances-receipt.json','feedback-privacy-receipt.json']:
 d=json.loads((qual/name).read_text());evidence[name]={'sha256':sha((qual/name).read_bytes()),'at':d.get('at')}
 assert not any(x.get('status')=='FAIL'for x in d.get('cases',[])),name
assert '"status":"PASS"' in (qual/'community-chromium-finish.log').read_text()
assert '"engine":"webkit","status":"PASS"' in (qual/'full-community-roundtrip-focused.log').read_text()
for name in ['personal-review.log','support-roundtrip.log','support-roundtrip-webkit.log','record-controls-corrected.log']:
 text=(qual/name).read_text();assert 'PASS' in text,name;evidence[name]={'sha256':sha((qual/name).read_bytes())}
owned=json.loads((release/'deployment-receipt.json').read_text());assert owned['state']=='DEPLOYED_PROVIDER_AND_ANONYMOUS_LIVE_VERIFIED'
login=json.loads((base/'v6-login-pattern-release/deployment-receipt.json').read_text());assert login['state'] in ['DEPLOYED_PROVIDER_AND_PUBLIC_BYTES_VERIFIED','DEPLOYED_BOUNDED_LOGIN_FIX_VERIFIED_FORM_VALIDITY']
plans=[]
for worker in ['shift-programme-member-20261023','shift-hq-member-comms-20261023']:
 expected=owned['workers'][worker]['deployment'];current=get(prefix+worker+'/deployments')['deployments'][0];assert current==expected,'Owner advanced: '+worker
 plans.append((worker,current))
# Core retains its exact native sign-in repair; its separate canonical build is not switched by this overlay release.
assert get(prefix+'shift-core/deployments')['deployments'][0]==login['deployment']
home=public('/');health=public('/shift-health');before={}
for worker,dep in plans:
 assert get(prefix+worker+'/deployments')['deployments'][0]==dep,'Concurrent publisher: '+worker
 settings=get(prefix+worker+'/settings')
 assert not any(x['name']=='MY_TIMBER_SHED_ENABLED'and x.get('text')=='true'for x in settings['bindings']),'Real Shed activation not authorised here'
 before[worker]={'deployment':dep,'settings':settings,'schedules':get(prefix+worker+'/schedules'),'moduleHashes':module_hashes(worker)}
out.mkdir();receipt=out/'activation-receipt.json';state={'state':'PREPARED','at':stamp(),'authority':'Matt: Can we action this? Deploy all now','source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'browserEvidence':evidence,'workers':before,'homepageSHA256':sha(home),'healthSHA256':sha(health),'realShedEnabled':False,'realMemberDatabaseWrites':0,'communicationsSent':0,'routesChanged':False}
def save():receipt.write_text(json.dumps(state,indent=2)+'\n')
save()
for worker,dep in plans:
 p=prefix+worker+'/';assert get(p+'deployments')['deployments'][0]==dep,'Concurrent publisher'
 state['state']='ACTIVATION_WRITE_STARTED';state['workers'][worker]['activationStartedAt']=stamp();save()
 _,body=call(p+'secrets','PUT',json.dumps({'name':'MY_TIMBER_V6_RELEASE_ENABLED','text':'true','type':'secret_text'}).encode(),{'Content-Type':'application/json'});d=json.loads(body);assert d['success']
 now=get(p+'settings');old=before[worker]['settings'];oldBindings={x['name']:x for x in old['bindings']if x['name']!='MY_TIMBER_V6_RELEASE_ENABLED'};newBindings={x['name']:x for x in now['bindings']};flag=newBindings.pop('MY_TIMBER_V6_RELEASE_ENABLED');assert flag['type']=='secret_text';assert newBindings==oldBindings,'Existing bindings changed'
 assert clean(now)==clean(old),'Operating settings changed';assert get(p+'schedules')==before[worker]['schedules'];assert module_hashes(worker)==before[worker]['moduleHashes'],'Code changed during activation'
 state['workers'][worker]['afterDeployment']=get(p+'deployments')['deployments'][0];state['workers'][worker]['activationVerifiedAt']=stamp();save();print(json.dumps({'worker':worker,'state':'ACTIVATED_PROVIDER_VERIFIED'}),flush=True)
assert public('/')==home;assert public('/shift-health')==health;assert get(prefix+'shift-core/deployments')['deployments'][0]==login['deployment']
state.update(state='MEMBER_SERVICE_ENABLED_PROVIDER_VERIFIED',verifiedAt=stamp(),homepageByteIdentical=True,healthByteIdentical=True,realShedEnabled=False,postActivationBrowser='PENDING');save()
print(json.dumps({k:state[k]for k in['state','homepageByteIdentical','healthByteIdentical','realShedEnabled','postActivationBrowser']}),flush=True)
