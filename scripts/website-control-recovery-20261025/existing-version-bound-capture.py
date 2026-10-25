from pathlib import Path
import json,re,urllib.request,urllib.error,concurrent.futures,datetime,subprocess,time,hashlib
ROOT=Path(__file__).parent; P=ROOT/'private'; A='9e5386dcf455be34c582d93f8bfc79e6'; BASE='https://api.cloudflare.com/client/v4/'
errors=[]
def api(route,body=None,binary=False):
 t=re.search(r'oauth_token\s*=\s*"([^"]+)"',(Path.home()/'Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
 req=urllib.request.Request(BASE+route,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+t,'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=90) as r:
  raw=r.read();ct=r.headers.get('Content-Type','')
 if binary:return raw,ct
 d=json.loads(raw)
 if d.get('success') is False:raise RuntimeError(json.dumps(d.get('errors')))
 return d

def save(name,d):
 p=P/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,indent=2));return d

def worker(w):
 import base64,hashlib
 n=w['id'];base=f'accounts/{A}/workers/scripts/{n}';dest=P/'workers'/n;dest.mkdir(parents=True,exist_ok=True)
 try:
  before=api(base+'/deployments');rows=before['result'].get('deployments',[])
  save(f'workers/{n}/deployments-before.json',before)
  if not rows:
   save(f'workers/{n}/code-capture-receipt.json',{'status':'not_deployed','serving_code_claimed':False})
   return n,{'bindings':[]}
  active=max(rows,key=lambda x:x['created_on']);assert active.get('versions'),'Active version distribution required'
  bindings=[];versions=[]
  for traffic in active['versions']:
   vid=traffic['version_id'];metadata=api(base+'/versions/'+vid);assert metadata['result']['id']==vid,'Version metadata identity differs'
   content=api(f'accounts/{A}/workers/workers/{n}/versions/{vid}?include=modules');assert content['result']['id']==vid,'Version content identity differs'
   modules=content['result'].get('modules');assert isinstance(modules,list) and modules,'Specific version modules unavailable'
   fingerprints=[]
   for module in modules:
    raw=base64.b64decode(module['content_base64'],validate=True)
    fingerprints.append({'name':module['name'],'content_type':module.get('content_type'),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
   save(f'workers/{n}/versions/{vid}/metadata.json',metadata)
   save(f'workers/{n}/versions/{vid}/specific-version-modules.json',content)
   save(f'workers/{n}/versions/{vid}/module-fingerprints.json',fingerprints)
   bindings.extend(metadata['result'].get('resources',{}).get('bindings',[]))
   versions.append({'version_id':vid,'percentage':traffic['percentage'],'modules':fingerprints})
  save(f'workers/{n}/global-settings.json',api(base+'/settings'))
  after=api(base+'/deployments');current=max(after['result']['deployments'],key=lambda x:x['created_on']);assert current==active,'Serving deployment changed during capture'
  save(f'workers/{n}/deployments-after.json',after)
  save(f'workers/{n}/code-capture-receipt.json',{'status':'verified_specific_serving_versions','deployment_id':active['id'],'created_on':active['created_on'],'versions':versions,'ownership_checked_before_and_after':True,'unversioned_content_used':False,'production_mutations':0})
  return n,{'bindings':bindings}
 except Exception as e:
  errors.append({'component':n,'error':str(e)})
  save(f'workers/{n}/code-capture-error.json',{'status':'incomplete','error':str(e),'serving_code_claimed':False})
  return n,{}

print('CAPTURE_STARTED',datetime.datetime.now(datetime.timezone.utc).isoformat(),flush=True)
workers=json.loads((P/'workers.json').read_text())['result']
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: settings=dict(ex.map(worker,workers))
print('WORKERS_CAPTURED',len(settings),'errors',len(errors),flush=True)
routed=set(x.get('script') for x in json.loads((P/'routes.json').read_text())['result'])|set(x.get('service') for x in json.loads((P/'custom-domains.json').read_text())['result'])
for _ in range(5):
 for n in list(routed):
  for b in settings.get(n,{}).get('bindings',[]):
   if b.get('type')=='service':routed.add(b.get('service'))
save('production-worker-closure.json',sorted(x for x in routed if x))
dbids={b.get('id') or b.get('database_id') for n in routed for b in settings.get(n,{}).get('bindings',[]) if b.get('type')=='d1'}
print('PRODUCTION_WORKERS',len(routed),'DATABASES',sorted(dbids),flush=True)
for zone in json.loads((P/'zones.json').read_text())['result']:
 for kind,suffix in [('dns','dns_records?per_page=5000'),('routes','workers/routes'),('rulesets','rulesets'),('page-rules','pagerules')]:
  try:save('zones/'+zone['name']+'/'+kind+'.json',api('zones/'+zone['id']+'/'+suffix))
  except Exception as e:errors.append({'component':zone['name']+'/'+kind,'error':str(e)})
for dbid in sorted(dbids):
 try:
  meta=save(f'databases/{dbid}/metadata.json',api(f'accounts/{A}/d1/database/{dbid}'))
  body={'output_format':'polling'};start=time.monotonic()
  while True:
   d=api(f'accounts/{A}/d1/database/{dbid}/export',body)['result']
   if d.get('status')=='error':raise RuntimeError(d.get('error','export error'))
   if d.get('status')=='complete':break
   if time.monotonic()-start>300:raise RuntimeError('export polling deadline exceeded')
   body['current_bookmark']=d.get('at_bookmark') or d.get('current_bookmark');time.sleep(0.5)
  url=d['result']['signed_url'];path=P/f'databases/{dbid}/export.sql'
  with urllib.request.urlopen(url,timeout=120) as src,path.open('wb') as out:
   while True:
    b=src.read(1024*1024)
    if not b:break
    out.write(b)
  d['result'].pop('signed_url',None);d['captured_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();save(f'databases/{dbid}/export-receipt.json',d)
  print('DATABASE_EXPORTED',meta['result'].get('name'),path.stat().st_size,'bytes',flush=True)
 except Exception as e:errors.append({'component':'database/'+dbid,'error':str(e)});print('DATABASE_ERROR',dbid,str(e),flush=True)
for project in json.loads((P/'pages.json').read_text())['result']:
 name=project['name'];dep=project.get('canonical_deployment',{});save('pages/'+name+'/production-deployment.json',dep)
 try:save('pages/'+name+'/project.json',api(f'accounts/{A}/pages/projects/{name}'))
 except Exception as e:errors.append({'component':'pages/'+name,'error':str(e)})
for n,st in settings.items():
 secrets=[b['name'] for b in st.get('bindings',[]) if b.get('type')=='secret_text']
 if secrets:save('secret-inventory/'+n+'.json',{'names':secrets,'values_exported':False})
save('capture-errors.json',errors)
save('capture-summary.json',{'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'workers':len(settings),'production_workers':sorted(x for x in routed if x),'database_ids':sorted(dbids),'errors':errors,'limitations':['Secret values are not exportable through Cloudflare settings API.','Durable Object storage and deployed static asset completeness require separate verification.','Data stores are captured sequentially; external side effects must be reconciled during recovery.']})
print('CAPTURE_FINISHED',len(errors),'errors',flush=True)
