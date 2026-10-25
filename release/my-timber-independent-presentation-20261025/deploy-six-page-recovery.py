from pathlib import Path
import json,re,urllib.request,email,uuid,hashlib,datetime,subprocess
base=Path('/Users/shiftsometimberltd/SST/my-timber-independent-presentation-20261025');repo=base/'recovery-worktree';src=repo/'release/my-timber-independent-presentation-20261025';receipt=base/'recovery-deployment.json'
assert not receipt.exists(),'An attempt exists: inspect, do not replay'
manifest=json.loads((src/'manifest.json').read_text());baseline=json.loads((base/'recovery-provider-baseline.json').read_text());prior=json.loads((base/'integration-deployment.json').read_text());checks=json.loads((base/'recovery-adapter-verification.json').read_text());assert checks['passed']
assert not subprocess.check_output(['git','status','--porcelain'],cwd=repo,text=True).strip(),'Commit reviewed source first'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
workers='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/';routeInfo=json.loads(Path('/Users/shiftsometimberltd/SST/about-book-upgrade-20261024/current-route-readonly-20261025.json').read_text());routesPath='/zones/'+routeInfo['zoneId']+'/workers/routes'
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(b):return hashlib.sha256(b).hexdigest()
def call(path,method='GET',data=None,headers=None):
 h={'Authorization':'Bearer '+token};h.update(headers or {})
 with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers=h,data=data,method=method),timeout=45) as f:return dict(f.headers),f.read()
def get(path):
 h,b=call(path);d=json.loads(b);assert d['success'],d.get('errors');return d['result']
def modules(h,b):
 ct=next(v for k,v in h.items() if k.lower()=='content-type');msg=email.message_from_bytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+b);assert msg.is_multipart();return {x.get_filename() or x.get_param('name',header='content-disposition'):x.get_payload(decode=True) for x in msg.walk() if not x.is_multipart()}
def public(path):
 p=subprocess.run(['curl','-sS','--max-time','30','-w','\n%{http_code}','https://shiftsometimber.co.uk'+path],capture_output=True);assert p.returncode==0;pbody,status=p.stdout.rsplit(b'\n',1);return int(status),pbody
GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh'
def phase():
 coord=json.loads(Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024/recovery-state.json').read_text());runs=coord['releaseCoordination']['singleReleaseManager'].get('actualActivePublishers',[]);rows=[]
 for r in runs:
  rid=r['run'] if isinstance(r,dict) else r;q=subprocess.run([GH,'api','repos/shiftsometimber/shift-core/actions/runs/'+str(rid)+'/jobs?per_page=100'],capture_output=True,text=True,timeout=30);assert q.returncode==0,'Release phase read failed'
  for j in json.loads(q.stdout)['jobs']:
   if j['name']=='promote' and j['status']=='in_progress':
    assert not any(s['number']>=25 and s['status'] in ['in_progress','completed'] for s in j['steps']),'Core baseline capture has begun; no overlapping presentation write'
    rows.append({'run':rid,'step':next((s['number'] for s in j['steps'] if s['status']=='in_progress'),None)})
 return {'at':stamp(),'active':rows}
def multipart(files):
 boundary='ShiftTimberRecovery'+uuid.uuid4().hex;parts=[]
 def add(name,data,kind,filename=None):
  dis='form-data; name="'+name+'"'+('; filename="'+filename+'"' if filename else '');parts.append(('--'+boundary+'\r\nContent-Disposition: '+dis+'\r\nContent-Type: '+kind+'\r\n\r\n').encode()+data+b'\r\n')
 add('metadata',json.dumps({'main_module':'presentation-entry.mjs'}).encode(),'application/json')
 for n,b in files.items():add(n,b,'application/javascript+module',n)
 return b''.join(parts)+('--'+boundary+'--\r\n').encode(),{'Content-Type':'multipart/form-data; boundary='+boundary}
routesBefore=get(routesPath);coreBefore=get(workers+'shift-core/deployments');assert coreBefore['deployments'][0]==baseline['shift-core'],'Core advanced: reconcile'
homeBefore=public('/');assert homeBefore[0]==200
apiBefore={p:public(p) for p in ['/v1/me','/v1/progress/summary','/v1/life-back']};assert all(v[0] in [401,403] for v in apiBefore.values())
state={'state':'PREPARED','at':stamp(),'head':head,'repository':str(repo),'authority':manifest['authority'],'phase':phase(),'workers':{},'coreDeploymentBefore':coreBefore['deployments'][0],'routesChanged':0,'productionMemberWrites':0,'communicationsSent':0,'behaviourLimits':manifest['recovery']['behaviourLimits']}
prepared=[]
for name,row in prior['workers'].items():
 p=workers+name;dep=get(p+'/deployments')['deployments'][0];assert dep==baseline[name],name+' advanced: reconcile'
 h,b=call(p+'/content/v2');current=modules(h,b);original=row['originalModule'];assert set(current)=={original,'data.mjs','presentation.mjs','presentation-entry.mjs'};assert sha(current[original])==row['originalSHA256']
 for n in ['data.mjs','presentation.mjs']:assert current[n]==(base/'source-worktree/release/my-timber-independent-presentation-20261025'/n).read_bytes(),name+' source preimage changed: '+n
 assert current['presentation-entry.mjs']==(src/(name+'-entry.mjs')).read_bytes()
 settings=get(p+'/settings');schedules=get(p+'/schedules');assert settings==row['settingsBefore'];assert schedules==row['schedulesBefore']
 files=dict(current);files['data.mjs']=(src/'data.mjs').read_bytes();assert sha(files['data.mjs'])==manifest['workers'][name]['candidateNewModuleHashes']['data.mjs']
 beforeDir=base/name/'six-page-before';beforeDir.mkdir(exist_ok=True)
 for n,b in current.items():(beforeDir/n).write_bytes(b)
 state['workers'][name]={'state':'prepared','priorDeployment':dep,'originalModule':original,'originalSHA256':sha(current[original]),'settingsBefore':settings,'schedulesBefore':schedules};prepared.append((name,files))
receipt.write_text(json.dumps(state,indent=2)+'\n')
for name,files in prepared:
 state['phase']=phase();assert get(workers+name+'/deployments')['deployments'][0]==state['workers'][name]['priorDeployment']
 state['state']='WRITE_STARTED_DO_NOT_REPLAY';state['workers'][name]['state']='upload_started';receipt.write_text(json.dumps(state,indent=2)+'\n')
 body,headers=multipart(files);h,b=call(workers+name+'/content','PUT',body,headers);response=json.loads(b);assert response['success'],response.get('errors');state['workers'][name]['deployment']=get(workers+name+'/deployments')['deployments'][0];state['workers'][name]['state']='uploaded';receipt.write_text(json.dumps(state,indent=2)+'\n')
 h,b=call(workers+name+'/content/v2');assert modules(h,b)==files;assert get(workers+name+'/settings')==state['workers'][name]['settingsBefore'];assert get(workers+name+'/schedules')==state['workers'][name]['schedulesBefore'];state['workers'][name]['state']='provider_verified';receipt.write_text(json.dumps(state,indent=2)+'\n');print(json.dumps({'worker':name,'state':'provider_verified','deployment':state['workers'][name]['deployment']['id']}),flush=True)
assert get(routesPath)==routesBefore;assert get(workers+'shift-core/deployments')==coreBefore;assert public('/')==homeBefore;assert {p:public(p) for p in apiBefore}==apiBefore
status,body=public('/assets/my-timber-layout.mjs');assert status==200;assert sha(body)==manifest['recovery']['layoutAssetSHA256'],'Live asset mismatch'
state.update({'state':'DEPLOYED_VERIFIED_EXACT_ASSET','verifiedAt':stamp(),'layoutAssetSHA256':sha(body),'homepageByteIdentical':True,'routesSettingsBindingsSchedulesOriginalModulesPreserved':True,'coreUnchanged':True,'anonymousApiBoundariesIdentical':True,'installedNativeAcceptance':'not performed'});receipt.write_text(json.dumps(state,indent=2)+'\n');print(json.dumps({'state':state['state'],'head':head,'asset':sha(body),'coreUnchanged':True}),flush=True)
