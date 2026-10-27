"""Release the authorised support add-on to existing Worker owners, once.
No Core upload, account creation, schema change or member communication.
"""
from pathlib import Path
import json,re,urllib.request,urllib.error,email,uuid,hashlib,datetime,subprocess,sys
root=Path.cwd();release=Path(sys.argv[1]).resolve();receipt=release/'deployment-receipt.json'
assert not receipt.exists(),'An attempt exists. Inspect the receipt and provider state; do not replay.'
baseline=json.loads((release/('correction-provider-baseline.json' if (release/'correction-provider-baseline.json').exists() else 'provider-baseline.json')).read_text());build=json.loads((release/'build-manifest.json').read_text())
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert not subprocess.check_output(['git','diff','HEAD','--','member-experience','scripts/build-my-timber-support-release.mjs','scripts/deploy-my-timber-support-release.py'],text=True).strip(),'Commit the exact scoped source before publishing'
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
workers='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/';routePath=baseline['routePath']
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(b):return hashlib.sha256(b).hexdigest()
def call(path,method='GET',data=None,headers=None):
 h={'Authorization':'Bearer '+token};h.update(headers or {})
 try:
  with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers=h,data=data,method=method),timeout=55) as r:return dict(r.headers),r.read()
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)+' '+e.read().decode()[:2000]) from None

def get(path):
 _,b=call(path);d=json.loads(b);assert d['success'],d.get('errors');return d['result']
def modules(h,b):
 ct=next(v for k,v in h.items() if k.lower()=='content-type');m=email.message_from_bytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+b);assert m.is_multipart();return {p.get_filename() or p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in m.walk() if not p.is_multipart()}
def public(path):
 p=subprocess.run(['curl','-sS','--max-time','25','-w','\n%{http_code}','https://shiftsometimber.co.uk'+path],capture_output=True);assert p.returncode==0,'Live read failed';body,status=p.stdout.rsplit(b'\n',1);return int(status),body

def multipart(files):
 boundary='MyTimberSupport'+uuid.uuid4().hex;parts=[]
 def add(name,b,kind,filename=None):
  disposition='form-data; name="'+name+'"'+('; filename="'+filename+'"' if filename else '');parts.append(('--'+boundary+'\r\nContent-Disposition: '+disposition+'\r\nContent-Type: '+kind+'\r\n\r\n').encode()+b+b'\r\n')
 add('metadata',json.dumps({'main_module':'presentation-entry.mjs'}).encode(),'application/json')
 for n,b in files.items():add(n,b,'application/javascript+module',n)
 return b''.join(parts)+('--'+boundary+'--\r\n').encode(),{'Content-Type':'multipart/form-data; boundary='+boundary}

def save():receipt.write_text(json.dumps(state,indent=2)+'\n')
plans=[('programme',baseline),('member-document',baseline['memberDocumentOwner'])]
# Existing programme routes cover all support aliases. No route mutations.
newRoutes=[]
routes=get(routePath);routeIndex={r['pattern']:r for r in routes}
for r in newRoutes:
 assert r['pattern'] not in routeIndex or routeIndex[r['pattern']].get('script')==r['script'],'Existing route has another owner: '+r['pattern']
homeBefore=public('/');assert homeBefore[0]==200
coreBefore=get(workers+'shift-core/deployments')['deployments'][0]
state={'state':'PREPARED','at':stamp(),'source':head,'authority':'Matt: Cut the bottleneck, get this deployed and fixed please. And LIVE.','workers':{},'routesAdded':[],'coreBefore':coreBefore,'homepageSHA256':sha(homeBefore[1]),'realMemberWrites':0,'communicationsSent':0}
prepared=[]
for name,b in plans:
 worker=b['worker'];dep=get(workers+worker+'/deployments')['deployments'][0];assert dep==b['deployment'],'Worker advanced: '+worker
 settings=get(workers+worker+'/settings');schedules=get(workers+worker+'/schedules');assert settings==b['settings'];assert schedules==b['schedules']
 h,body=call(workers+worker+'/content/v2');current=modules(h,body);assert {n:sha(v) for n,v in current.items()}==b['moduleHashes'],'Live source advanced: '+worker
 candidate=build['candidates'][name];files={f['name']:(Path(candidate['directory'])/f['name']).read_bytes() for f in candidate['files']}
 assert {n:sha(v) for n,v in files.items()}=={f['name']:f['sha256'] for f in candidate['files']},'Candidate bytes changed'
 shared=json.loads((release/'shared-catalogue-proof.json').read_text()) if name=='programme' else None
 for n,v in current.items():
  if shared and n=='worker.mjs':
   assert shared['owner']['sourceSHA256']==sha(v),'Original owner changed'
   binding=shared['owner']['binding'];assert re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*',binding)
   addition=('\nexport {'+binding+' as UK_FULL_PUBLICATION};\n').encode()
   assert files[n]==v or files[n]==v+addition,'Owner changed beyond one native export'
   continue
  if shared and n=='support-service-prior.mjs':
   assert shared['priorSHA256']==sha(v),'Original support module changed'
   if shared['priorAlreadyShared']:assert files[n]==v
   else:
    start,end=shared['literalStart'],shared['literalEnd'];literal=v[start:end]
    assert sha(literal)==shared['literalSHA256'],'Shared literal changed'
    assert shared['reference']=='__myTimberExactFullCatalogue' and shared['importStatement']=="\nimport {UK_FULL_PUBLICATION as __myTimberExactFullCatalogue} from './worker.mjs';\n"
    assert files[n]==v[:start]+shared['reference'].encode()+v[end:]+shared['importStatement'].encode(),'Support functions changed'
   continue
  if n not in ['presentation-entry.mjs','support-service.mjs','support-markup.mjs','support-service-next.mjs','support-markup-next.mjs','support-release-gate.mjs']:assert files[n]==v,'Existing module changed: '+n
 state['workers'][worker]={'state':'prepared','beforeDeployment':dep,'settings':settings,'schedules':schedules,'candidateHashes':{n:sha(v) for n,v in files.items()}}
 prepared.append((worker,files))
save()
for worker,files in prepared:
 assert get(workers+worker+'/deployments')['deployments'][0]==state['workers'][worker]['beforeDeployment'],'Concurrent publisher: '+worker
 state['state']='WRITE_STARTED_DO_NOT_REPLAY';state['workers'][worker]['state']='upload_started';save()
 data,headers=multipart(files);_,body=call(workers+worker+'/content','PUT',data,headers);result=json.loads(body);assert result['success'],result.get('errors')
 state['workers'][worker]['deployment']=get(workers+worker+'/deployments')['deployments'][0];state['workers'][worker]['state']='uploaded';save()
 h,body=call(workers+worker+'/content/v2');assert modules(h,body)==files,'Provider byte verification failed'
 assert get(workers+worker+'/settings')==state['workers'][worker]['settings'],'Bindings/settings changed'
 assert get(workers+worker+'/schedules')==state['workers'][worker]['schedules'],'Schedules changed'
 state['workers'][worker]['state']='provider_verified';save();print(json.dumps({'worker':worker,'state':'provider_verified','deployment':state['workers'][worker]['deployment']['id']}),flush=True)
for r in newRoutes:
 fresh={x['pattern']:x for x in get(routePath)}
 if r['pattern'] in fresh:
  assert fresh[r['pattern']].get('script')==r['script'];continue
 state['routeWriteStarted']=r['pattern'];save();_,body=call(routePath,'POST',json.dumps(r).encode(),{'Content-Type':'application/json'});result=json.loads(body);assert result['success'],result.get('errors');state['routesAdded'].append(result['result']);state.pop('routeWriteStarted',None);save()
after={r['id']:r for r in get(routePath)}
assert all(after.get(r['id'])==r for r in routes),'An existing route changed'
assert get(workers+'shift-core/deployments')['deployments'][0]==coreBefore,'Core changed concurrently'
assert public('/')==homeBefore,'Homepage output changed'
checks={}
for path in ['/v1/life-back','/v1/life-back/member-support','/v1/life-back/check-in','/v1/life-back/support-inbox']:
 status,body=public(path);checks[path]={'status':status,'bytes':len(body)};assert status in [401,403],'Anonymous private API boundary: '+path
for path in ['/member/get-started/try','/member/life-back/support','/assets/member-experience/programme-support-plan.mjs','/assets/member-experience/programme-support-plan.css','/assets/my-timber-layout.mjs']:
 status,body=public(path);assert status==200,path+' live HTTP '+str(status);checks[path]={'status':status,'sha256':sha(body),'bytes':len(body)}
 if path=='/member/get-started/try':assert b'fictional' in body.lower()
 if path=='/member/life-back/support':assert b'window.SST_API_BASE=location.origin' in body
 if path.endswith('support-plan.mjs'):assert b'No health records are attached automatically.' in body and b'data-contact-form' in body
 if path.endswith('my-timber-layout.mjs'):
  marker=b'/* My Timber six-page presentation recovery. No fabricated member data. */';before=(release/'live-layout-before.mjs').read_bytes();assert body.count(marker)==1;assert body.split(marker)[0]==before.split(marker)[0],'Independent layout prefix changed';assert b'sst:support-context' in body
status,dashboard=public('/member/dashboard');assert status==200;assert dashboard.count(b'src="/assets/member-experience/programme-support-plan.mjs"')==1,'Dashboard support integration missing/duplicated'
checks['/member/dashboard']={'status':status,'supportClientCopies':1}
state.update({'state':'DEPLOYED_PROVIDER_AND_ANONYMOUS_LIVE_VERIFIED','verifiedAt':stamp(),'liveChecks':checks,'homepageByteIdentical':True,'coreUnchanged':True,'existingRoutesModulesBindingsSchedulesPreserved':True,'remaining':'Signed-in live acceptance to follow; Shed loop and native device checks not included.'});save();print(json.dumps({'state':state['state'],'source':head,'routesAdded':len(state['routesAdded']),'checks':checks}),flush=True)
