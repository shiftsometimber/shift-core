#!/usr/bin/env python3
"""Replace only the approved stylesheet in each exact current Worker graph."""
import datetime,email,hashlib,json,re,runpy,sys,time,urllib.request,urllib.error,uuid
from email import policy
COMMIT=sys.argv[1];assert re.fullmatch('[a-f0-9]{40}',COMMIT)
TOKEN=runpy.run_path('scripts/cloudflare-route-capacity.py')['token']()
ACCOUNT='accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'
cache={}
def emit(stage,**values):print(json.dumps({'stage':stage,**values}),flush=True)
def sha(data):return hashlib.sha256(data).hexdigest()
def cf(method,path,data=None,kind='application/json',raw=False):
 if data is not None and not isinstance(data,bytes):data=json.dumps(data).encode()
 for attempt in range(3):
  try:
   request=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,method=method,data=data,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':kind})
   with urllib.request.urlopen(request,timeout=60) as response:body=response.read();headers=response.headers
   break
  except urllib.error.HTTPError as error:
   if method=='GET' and error.code in [429,500,502,503,504] and attempt<2:time.sleep(2**(attempt+1));continue
   raise
 if raw:return body,headers
 value=json.loads(body);assert value.get('success'),value.get('errors');return value['result']
def source(path):
 if path not in cache:
  with urllib.request.urlopen('https://raw.githubusercontent.com/shiftsometimber/shift-core/'+COMMIT+'/'+path,timeout=40) as response:cache[path]=response.read()
 return cache[path]
def graph(raw,headers):
 message=email.message_from_bytes(('Content-Type: '+headers['Content-Type']+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw,policy=policy.default)
 assert message.is_multipart()
 return {p.get_filename() or p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in message.iter_parts()},headers.get('cf-entrypoint')
def hashes(modules):return {k:sha(v) for k,v in modules.items()}
def bindings(settings):return sorted(json.dumps(b,sort_keys=True) for b in settings['bindings'])
def kind(name,data):
 if name.endswith(('.mjs','.js')):return 'application/javascript+module'
 if name.endswith('.webp') and data[:4]==b'RIFF' and data[8:12]==b'WEBP':return 'application/octet-stream'
 raise AssertionError('Unrecognised retained module type: '+name)
def handlers(version):return {k:version['resources']['script'].get(k,[]) for k in ['handlers','named_handlers']}
release=json.loads(source('health-page-heroes/layout-theme-release.json'))
for target in release['workers']:
 base=ACCOUNT+target['worker'];before=cf('GET',base+'/deployments')['deployments'][0]
 assert before['id']==target['deployment'] and before['versions']==target['versions'],('Current deployment changed',target['worker'])
 settings=cf('GET',base+'/settings');schedules=cf('GET',base+'/schedules')['schedules']
 modules,entry=graph(*cf('GET',base,raw=True));original=hashes(modules)
 assert original==target['moduleHashes'] and entry==target['entry'],('Current module graph changed',target['worker'])
 previousVersion=cf('GET',base+'/versions/'+before['versions'][0]['version_id'])
 spec=target['stylesheet'];updated=source(spec['source']);assert sha(updated)==spec['sha256'] and len(updated)==spec['size'];assert sha(modules[spec['name']])==spec['previousSha256']
 modules[spec['name']]=updated;assert [n for n,v in modules.items() if original[n]!=sha(v)]==[spec['name']]
 metadata={'main_module':entry,'bindings':settings['bindings'],'compatibility_date':settings['compatibility_date'],'compatibility_flags':settings.get('compatibility_flags',[]),'annotations':{'workers/message':'Black SHIFT Bloods page background and compact spacing above item heroes. Preserve current content, assets and operations.','workers/tag':'health-compact-layout-20261029'}}
 for k in ['usage_model','tags','tail_consumers','logpush','observability','limits']:
  if k in settings:metadata[k]=settings[k]
 if settings.get('placement',{}).get('mode'):metadata['placement']=settings['placement']
 boundary='shift-health-layout-'+uuid.uuid4().hex;parts=[]
 for name,data,mime in [('metadata',json.dumps(metadata).encode(),'application/json')]+[(n,v,kind(n,v)) for n,v in modules.items()]:
  parts.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('; filename="'+name+'"' if name!='metadata' else '')+'\r\nContent-Type: '+mime+'\r\n\r\n').encode(),data,b'\r\n'])
 parts.append(('--'+boundary+'--\r\n').encode())
 emit('preflight',worker=target['worker'],entry=entry,changedModule=spec['name'],retainedModules=len(modules)-1)
 candidate=cf('POST',base+'/versions',b''.join(parts),'multipart/form-data; boundary='+boundary)
 assert handlers(cf('GET',base+'/versions/'+candidate['id']))==handlers(previousVersion),'Exported handlers changed'
 assert cf('GET',base+'/deployments')['deployments'][0]['id']==before['id'],'Concurrent deployment appeared'
 assert bindings(cf('GET',base+'/settings'))==bindings(settings),'Bindings changed'
 assert cf('GET',base+'/schedules')['schedules']==schedules,'Schedules changed'
 deployment=cf('POST',base+'/deployments',{'strategy':'percentage','versions':[{'version_id':candidate['id'],'percentage':100}],'annotations':{'workers/message':'Apply the requested page background and spacing correction only.'}})
 emit('deployed',worker=target['worker'],deploymentId=deployment['id'],versionId=candidate['id'])
 try:
  current,currentEntry=graph(*cf('GET',base,raw=True));assert hashes(current)==hashes(modules) and currentEntry==entry,'Published graph differs'
  assert cf('GET',base+'/deployments')['deployments'][0]['id']==deployment['id']
  after=cf('GET',base+'/settings');assert bindings(after)==bindings(settings)
  for k in ['compatibility_date','compatibility_flags']:assert after.get(k)==settings.get(k)
  assert cf('GET',base+'/schedules')['schedules']==schedules
  emit('verified',sourceCommit=COMMIT,worker=target['worker'],deploymentId=deployment['id'],versionId=candidate['id'],previousDeployment=before['id'],previousVersions=before['versions'],entry=entry,changedModule=spec['name'],moduleHashes=hashes(current),retainedModules=len(modules)-1,bindingsUnchanged=True,handlersUnchanged=True,schedulesUnchanged=True,routesChanged=0,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 except Exception:
  if cf('GET',base+'/deployments')['deployments'][0]['id']==deployment['id']:
   rollback=cf('POST',base+'/deployments',{'strategy':'percentage','versions':before['versions'],'annotations':{'workers/message':'Restore previous version after layout verification failed'}});emit('rolled_back',worker=target['worker'],deploymentId=rollback['id'])
  raise
emit('batch_verified',sourceCommit=COMMIT,workers=len(release['workers']),routesChanged=0)
