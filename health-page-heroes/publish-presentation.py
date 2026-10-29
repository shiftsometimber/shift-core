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
release=json.loads(source('health-page-heroes/presentation-release.json'))
routes=json.loads(source('health-page-heroes/route-baseline.json'))
base=ACCOUNT+release['worker'];zone='zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes'
def routes_by_pattern():return {r['pattern']:r for r in cf('GET',zone)}
prior=routes_by_pattern()
for spec in routes:
 current=prior.get(spec['pattern']);expected=spec['before']
 assert (current is None)==(expected is None),('Route ownership changed',spec['pattern'])
 if expected:assert current['id']==expected['id'] and current['script']==expected['script'],spec['pattern']
try:
 existing=cf('GET',base+'/settings')
except urllib.error.HTTPError as error:
 if error.code!=404:raise
 assert not release.get('expectedCurrentDeployment'),'Expected hero publisher is missing'
else:
 assert release.get('expectedCurrentDeployment'),'Hero worker already exists; inspect its current release before updating'
 assert cf('GET',base+'/deployments')['deployments'][0]['id']==release['expectedCurrentDeployment'],'Hero deployment changed'
 assert signatures(graph(*cf('GET',base,raw=True)))==release['expectedCurrentModuleHashes'],'Hero modules changed'
 assert sorted((b['name'],b['type'],b.get('service')) for b in existing['bindings'])==sorted((b['name'],b['type'],b.get('service')) for b in release['bindings']),'Hero bindings changed'
modules={}
for spec in release['modules']:
 data=source(spec['source']);assert sha(data)==spec['sha256'] and len(data)==spec['size'],spec['source'];modules[spec['name']]=(data,'application/javascript+module')
metadata={'main_module':release['entry'],'bindings':release['bindings'],'compatibility_date':'2026-10-01','annotations':{'workers/message':'Publish the seven signed-off SHIFT Health heroes, preserving existing publishers.','workers/tag':release['version']}}
boundary='shift-health-hero-presentation-'+uuid.uuid4().hex;parts=[]
for name,data,kind in [('metadata',json.dumps(metadata).encode(),'application/json')]+[(n,d,k) for n,(d,k) in modules.items()]:
 parts.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('; filename="'+name+'"' if name!='metadata' else '')+'\r\nContent-Type: '+kind+'\r\n\r\n').encode(),data,b'\r\n'])
parts.append(('--'+boundary+'--\r\n').encode())
emit('preflight',sourceCommit=COMMIT,worker=release['worker'],moduleCount=len(modules),routes=len(routes),existingPublishersUntouched=True)
if release.get('expectedCurrentDeployment'):assert cf('GET',base+'/deployments')['deployments'][0]['id']==release['expectedCurrentDeployment'],'Hero deployment changed before upload'
created=cf('PUT',base,b''.join(parts),'multipart/form-data; boundary='+boundary)
deployment=cf('GET',base+'/deployments')['deployments'][0];assert len(deployment['versions'])==1 and deployment['versions'][0]['percentage']==100
version=deployment['versions'][0]['version_id'];settings=cf('GET',base+'/settings')
actualBindings=sorted((b['name'],b['type'],b.get('service')) for b in settings['bindings']);expectedBindings=sorted((b['name'],b['type'],b.get('service')) for b in release['bindings']);assert actualBindings==expectedBindings
assert settings['compatibility_date']=='2026-10-01'
graphVerified=False
try:download=graph(*cf('GET',base,raw=True))
except urllib.error.HTTPError as error:
 if error.code not in [500,502,503,504]:raise
 emit('content_download_unavailable',worker=release['worker'],status=error.code,alternative='Uploaded source hashes, compiled deployment/version metadata and subsequent live browser checks')
else:
 assert signatures(download)==signatures(modules),'Hero module graph differs from uploaded source';graphVerified=True
emit('publisher_ready',worker=release['worker'],versionId=version,deploymentId=deployment['id'],graphVerified=graphVerified)
try:
 for spec in routes:
  now=routes_by_pattern().get(spec['pattern']);before=spec['before'];payload={'pattern':spec['pattern'],'script':release['worker'],'request_limit_fail_open':False}
  if before:
   assert now and now['id']==before['id'] and now['script']==before['script'],('Route changed',spec['pattern'])
   if now['script']!=release['worker']:cf('PUT',zone+'/'+before['id'],payload)
  else:
   assert now is None,('Route appeared',spec['pattern']);cf('POST',zone,payload)
 current=routes_by_pattern();published=[current[s['pattern']] for s in routes];assert all(r['script']==release['worker'] for r in published)
 assert cf('GET',base+'/deployments')['deployments'][0]['id']==deployment['id']
 emit('verified',sourceCommit=COMMIT,worker=release['worker'],deploymentId=deployment['id'],versionId=version,moduleHashes=signatures(modules),downloadGraphVerified=graphVerified,bindingsVerified=True,publishedRoutes=published,previousRoutes=routes,existingPublishersUntouched=True,scheduledTasksAdded=0,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
except Exception:
 current=routes_by_pattern()
 for spec in reversed(routes):
  now=current.get(spec['pattern'])
  if not now or now.get('script')!=release['worker']:continue
  before=spec['before']
  if before:cf('PUT',zone+'/'+now['id'],{'pattern':before['pattern'],'script':before['script'],'request_limit_fail_open':before.get('request_limit_fail_open',False)})
  else:cf('DELETE',zone+'/'+now['id'])
 emit('routes_restored',worker=release['worker']);raise
