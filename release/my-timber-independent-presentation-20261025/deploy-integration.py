from pathlib import Path
import json,re,urllib.request,email,uuid,hashlib,datetime,subprocess,os
root=Path('/Users/shiftsometimberltd/SST/my-timber-independent-presentation-20261025')
receipt=root/'integration-deployment.json';assert not receipt.exists(),'Inspect prior attempt, never replay an uncertain write'
coord=Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024/recovery-state.json')
source=json.loads((root/'source.json').read_text())
assert source['head']!='52747058070c9f265fba1edc9baacf3fcf8aedb2'
manifest=json.loads((Path(source['sourceDirectory'])/'manifest.json').read_text())
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=source['repository'],text=True).strip()==source['head']
assert not subprocess.check_output(['git','status','--porcelain'],cwd=source['repository'],text=True).strip()
assert json.loads((root/'adapter-verification.json').read_text())['passed'];assert json.loads((root/'integration-adapter-verification.json').read_text())['pass']
assert json.loads((root/'original-worker-preservation-verification.json').read_text())['passed']
browser=json.loads((root/'candidate-full-runtime.json').read_text());assert len(browser['rows'])==4 and all(not x['uncaughtErrors'] and x['quickLogCancelDraftSingleSaveReceiptJourneyRefresh'] for x in browser['rows'])
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M)[1]
account='/accounts/9e5386dcf455be34c582d93f8bfc79e6';workers=account+'/workers/scripts/'
routeInfo=json.loads(Path('/Users/shiftsometimberltd/SST/about-book-upgrade-20261024/current-route-readonly-20261025.json').read_text());routesPath='/zones/'+routeInfo['zoneId']+'/workers/routes'
GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh'
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def call(path,method='GET',data=None,headers=None):
 h={'Authorization':'Bearer '+token};h.update(headers or {})
 with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers=h,data=data,method=method),timeout=65) as f:return dict(f.headers),f.read()
def get(path):
 h,b=call(path);d=json.loads(b);assert d['success'],d.get('errors');return d['result']
def modules(h,b):
 ct=next(v for k,v in h.items() if k.lower()=='content-type');msg=email.message_from_bytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+b);assert msg.is_multipart()
 return {x.get_filename() or x.get_param('name',header='content-disposition'):x.get_payload(decode=True) for x in msg.walk() if not x.is_multipart()}
def phase():
 d=json.loads(coord.read_text());runs=d['releaseCoordination']['singleReleaseManager'].get('actualActivePublishers',[]);rows=[]
 for run in runs:
  q=subprocess.run([GH,'api','repos/shiftsometimber/shift-core/actions/runs/'+str(run)+'/jobs?per_page=100'],capture_output=True,text=True,timeout=30);assert q.returncode==0,'Authenticated phase read failed'
  for j in json.loads(q.stdout)['jobs']:
   if j['name']=='promote' and j['status']=='in_progress':
    assert not any(s['number']>=25 and s['status'] in ['in_progress','completed'] for s in j['steps']),'Core public baselines captured; stop this independent mutation'
    rows.append({'run':run,'job':j['id'],'step':next((s['number'] for s in j['steps'] if s['status']=='in_progress'),None)})
 return {'at':stamp(),'rows':rows}
def public(path):
 r=subprocess.run(['curl','-sS','--max-time','35','-w','\n%{http_code}','https://shiftsometimber.co.uk'+path],capture_output=True);assert r.returncode==0,r.stderr.decode();body,status=r.stdout.rsplit(b'\n',1);return int(status),body
def write_state():receipt.write_text(json.dumps(state,indent=2)+'\n')
def multipart(files,main):
 boundary='SHIFTMyTimberPresentation'+uuid.uuid4().hex;parts=[]
 def add(name,data,kind,filename=None):
  dis='form-data; name="'+name+'"'+('; filename="'+filename+'"' if filename else '')
  parts.append(('--'+boundary+'\r\nContent-Disposition: '+dis+'\r\nContent-Type: '+kind+'\r\n\r\n').encode()+data+b'\r\n')
 add('metadata',json.dumps({'main_module':main}).encode(),'application/json')
 for name,data in files.items():add(name,data,'application/javascript+module',name)
 return b''.join(parts)+('--'+boundary+'--\r\n').encode(),{'Content-Type':'multipart/form-data; boundary='+boundary}

previous=json.loads((root/'correction-deployment.json').read_text());assert all(x['state']=='provider_verified' for x in previous['workers'].values())
routesBefore=json.loads((root/'routes-before.json').read_text());assert get(routesPath)==routesBefore,'Routes changed: reconcile'
coreBefore=get(workers+'shift-core/deployments')
apiBefore={p:public(p) for p in json.loads((root/'deployment.json').read_text())['apiBefore']};assert all(s in [401,403] for s,b in apiBefore.values())
homeBefore=public('/');assert homeBefore[0]==200
state={'at':stamp(),'state':'CORRECTION_QUALIFIED_NO_NEW_ROUTES','source':source,'priorAttempt':str(root/'correction-deployment.json'),'routeLimit':1000,'routesChanged':0,'coreDeploymentBefore':coreBefore['deployments'][0],'phase':phase(),'workers':{},'productionMemberWrites':0,'communicationsSent':0}
prepared=[]
for name,row in previous['workers'].items():
 path=workers+name;before=get(path+'/deployments');assert before['deployments'][0]['id']==row['deployment']['id'],name+' advanced'
 h,b=call(path+'/content/v2');current=modules(h,b);file=row['originalModule'];assert set(current)=={file,'data.mjs','presentation.mjs','presentation-entry.mjs'}
 assert hashlib.sha256(current[file]).hexdigest()==row['originalSHA256']
 for n in ['data.mjs','presentation.mjs']:assert current[n]==(root/name/'integration-before'/n).read_bytes(),name+' preimage '+n
 assert current['presentation-entry.mjs']==(root/name/'candidate/presentation-entry.mjs').read_bytes()
 assert get(path+'/settings')==row['settingsBefore'];assert get(path+'/schedules')==row['schedulesBefore']
 files={n:(root/name/'candidate'/n).read_bytes() for n in current}
 for n in ['data.mjs','presentation.mjs','presentation-entry.mjs']:assert hashlib.sha256(files[n]).hexdigest()==manifest['workers'][name]['candidateNewModuleHashes'][n]
 assert files[file]==current[file];prepared.append((name,files));state['workers'][name]={'state':'prepared','priorDeployment':before['deployments'][0],'originalRollbackDeployment':row['originalRollbackDeployment'],'originalModule':file,'originalSHA256':row['originalSHA256'],'settingsBefore':row['settingsBefore'],'schedulesBefore':row['schedulesBefore']}
write_state()
for name,files in prepared:
 phase();assert get(workers+name+'/deployments')['deployments'][0]['id']==state['workers'][name]['priorDeployment']['id']
 state['state']='CORRECTION_WRITE_STARTED_DO_NOT_REPLAY';state['workers'][name]['state']='upload_started';write_state()
 body,headers=multipart(files,'presentation-entry.mjs');h,b=call(workers+name+'/content','PUT',body,headers);(root/name/'integration-upload-result.json').write_bytes(b);response=json.loads(b);assert response['success'],response.get('errors')
 state['workers'][name]['deployment']=get(workers+name+'/deployments')['deployments'][0];state['workers'][name]['state']='uploaded';write_state()
 h,b=call(workers+name+'/content/v2');assert modules(h,b)==files
 assert get(workers+name+'/settings')==state['workers'][name]['settingsBefore'];assert get(workers+name+'/schedules')==state['workers'][name]['schedulesBefore']
 state['workers'][name]['state']='provider_verified';write_state();print(json.dumps({'worker':name,'state':'corrected_provider_verified','version':state['workers'][name]['deployment']['versions']}),flush=True)
assert get(routesPath)==routesBefore,'Routes changed'
apiAfter={p:public(p) for p in apiBefore};assert apiAfter==apiBefore,'Anonymous boundary responses changed'
homeAfter=public('/');assert homeAfter==homeBefore,'Homepage changed'
live=[]
for path,name in [('/member/dashboard','dashboard'),('/member/grub','grub'),('/member/fit','fit')]:
 status,body=public(path);assert status==200;html=body.decode()
 assert 'data-my-timber-approved-chrome' in html and '/assets/member-experience/chrome.mjs' not in ''.join(re.findall(r'<script\\b[^>]*>',html))
 if name=='dashboard':assert 'data-my-timber-approved-progress' in html and 'data-my-timber-approved-tools' in html
 (root/('live-'+name+'.html')).write_bytes(body);live.append({'path':path,'http':status,'inlineApprovedChrome':True,'inlineApprovedProgress':name=='dashboard','sha256':hashlib.sha256(body).hexdigest()})
status,body=public('/assets/my-timber-layout.mjs');assert status==200;assert hashlib.sha256(body).hexdigest()=='66c340f4af1bb9ba47fdda476119802acafe9b34630e80d57228b05f0d71e816'
state.update({'state':'DEPLOYED_TAB_HEADER_COACH_CORRECTION_LIVE_BROWSER_PENDING','verifiedAt':stamp(),'livePages':live,'actualApprovedLayoutAssetExact':True,'allOriginalWorkerModulesByteIdentical':True,'allSettingsBindingsSchedulesAndRoutesUnchanged':True,'homepageByteIdentical':True,'anonymousApiBoundariesIdentical':True,'coreDeploymentUnchanged':get(workers+'shift-core/deployments')==coreBefore,'PagesWrites':0,'newWorkers':0})
write_state();print(json.dumps({'state':state['state'],'workers':{k:v['deployment']['versions'] for k,v in state['workers'].items()},'routesChanged':0,'coreUnchanged':state['coreDeploymentUnchanged']}),flush=True)
