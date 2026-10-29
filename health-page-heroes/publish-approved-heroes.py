#!/usr/bin/env python3
"""Publish the approved page heroes around the exact current Worker module graphs."""
import datetime,email,hashlib,json,re,runpy,sys,time,urllib.request,urllib.error,uuid
from email import policy
COMMIT=sys.argv[1]
assert re.fullmatch('[a-f0-9]{40}',COMMIT)
TOKEN=runpy.run_path('scripts/cloudflare-route-capacity.py')['token']()
ACCOUNT='accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'
cache={}
def emit(stage,**values):print(json.dumps({'stage':stage,**values}),flush=True)
def sha(data):return hashlib.sha256(data).hexdigest()
def cf(method,path,data=None,kind='application/json',raw=False):
 if data is not None and not isinstance(data,bytes):data=json.dumps(data).encode()
 request=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,method=method,data=data,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':kind})
 for attempt in range(4):
  try:
   with urllib.request.urlopen(request,timeout=60) as response:body=response.read();content_type=response.headers.get('Content-Type','')
   break
  except urllib.error.HTTPError as error:
   if method!='GET' or error.code not in [429,500,502,503,504] or attempt==3:raise
   emit('read_retry',path=path,status=error.code,attempt=attempt+1);time.sleep(2**(attempt+1))
 if raw:return body,content_type
 value=json.loads(body);assert value.get('success'),value.get('errors');return value['result']
def source(path):
 if path not in cache:
  with urllib.request.urlopen('https://raw.githubusercontent.com/shiftsometimber/shift-core/'+COMMIT+'/'+path,timeout=40) as response:cache[path]=response.read()
 return cache[path]
def graph(raw,kind):
 message=email.message_from_bytes(('Content-Type: '+kind+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw,policy=policy.default)
 assert message.is_multipart(),'Expected module Worker'
 return {part.get_filename() or part.get_param('name',header='content-disposition'):(part.get_payload(decode=True),part.get_content_type()) for part in message.iter_parts()}
def signatures(modules):return {key:sha(value[0]) for key,value in modules.items()}
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'))
def binding_signature(settings):return sorted(canonical(item) for item in settings['bindings'])
release=json.loads(source('health-page-heroes/release.json'))
for target in release['workers']:
 base=ACCOUNT+target['worker'];before=cf('GET',base+'/deployments')['deployments'][0]
 assert before['id']==target['deployment'] and before['versions']==target['versions'],('Deployment changed',target['worker'])
 settings=cf('GET',base+'/settings');schedules=cf('GET',base+'/schedules')['schedules']
 assert settings['compatibility_date']==target['compatibility_date']
 modules=graph(*cf('GET',base,raw=True));original=signatures(modules)
 assert original==target['moduleHashes'],('Module graph changed',target['worker'])
 assert target['entry'] not in modules
 for spec in target['modules']:
  assert spec['name'] not in modules,('New module collision',spec['name'])
  data=source(spec['source']);assert sha(data)==spec['sha256'] and len(data)==spec['size'],spec['source']
  modules[spec['name']]=(data,'application/javascript+module')
 metadata={'main_module':target['entry'],'bindings':settings['bindings'],'compatibility_date':settings['compatibility_date'],'compatibility_flags':settings.get('compatibility_flags',[]),'annotations':{'workers/message':'Deploy the seven signed-off SHIFT Health page heroes with live text and page buttons.','workers/tag':release['version']}}
 for key in ['usage_model','tags','tail_consumers','logpush','observability','limits']:
  if key in settings:metadata[key]=settings[key]
 if settings.get('placement',{}).get('mode'):metadata['placement']=settings['placement']
 boundary='shift-approved-heroes-'+uuid.uuid4().hex;upload=[]
 parts=[('metadata',json.dumps(metadata).encode(),'application/json')]+[(key,data,kind) for key,(data,kind) in modules.items()]
 for name,data,kind in parts:
  upload.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('; filename="'+name+'"' if name!='metadata' else '')+'\r\nContent-Type: '+kind+'\r\n\r\n').encode(),data,b'\r\n'])
 upload.append(('--'+boundary+'--\r\n').encode())
 emit('preflight',worker=target['worker'],previousDeployment=before['id'],unchangedModules=len(original),newModules=len(target['modules']),pages=target['pages'])
 candidate=cf('POST',base+'/versions',b''.join(upload),'multipart/form-data; boundary='+boundary)
 assert cf('GET',base+'/deployments')['deployments'][0]['id']==before['id'],'Deployment changed during upload'
 assert binding_signature(cf('GET',base+'/settings'))==binding_signature(settings)
 assert cf('GET',base+'/schedules')['schedules']==schedules
 deployment=cf('POST',base+'/deployments',{'strategy':'percentage','versions':[{'version_id':candidate['id'],'percentage':100}],'annotations':{'workers/message':'Publish signed-off health page heroes; preserve all current modules, bindings and schedules.'}})
 emit('deployed',worker=target['worker'],deploymentId=deployment['id'],versionId=candidate['id'])
 try:
  deadline=time.monotonic()+45
  while True:
   assert cf('GET',base+'/deployments')['deployments'][0]['id']==deployment['id'],'A later deployment superseded this release'
   current=graph(*cf('GET',base,raw=True))
   if signatures(current)==signatures(modules):break
   assert time.monotonic()<deadline,'Deployed graph verification timed out'
   time.sleep(2)
  afterSettings=cf('GET',base+'/settings')
  assert binding_signature(afterSettings)==binding_signature(settings)
  assert afterSettings['compatibility_date']==settings['compatibility_date']
  assert afterSettings.get('compatibility_flags',[])==settings.get('compatibility_flags',[])
  assert cf('GET',base+'/schedules')['schedules']==schedules
  assert all(signatures(current)[key]==value for key,value in original.items())
  emit('verified',worker=target['worker'],sourceCommit=COMMIT,deploymentId=deployment['id'],versionId=candidate['id'],previousDeployment=before['id'],previousVersions=before['versions'],retainedModuleHashes=original,newModuleHashes={s['name']:s['sha256'] for s in target['modules']},bindingsUnchanged=True,schedulesUnchanged=True,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 except Exception:
  if cf('GET',base+'/deployments')['deployments'][0]['id']==deployment['id']:
   rollback=cf('POST',base+'/deployments',{'strategy':'percentage','versions':before['versions'],'annotations':{'workers/message':'Restore prior page hero graph after release verification failed'}});emit('rolled_back',worker=target['worker'],deploymentId=rollback['id'])
  raise
emit('batch_api_verified',sourceCommit=COMMIT,workers=len(release['workers']),pages=sum(len(w['pages']) for w in release['workers']))
