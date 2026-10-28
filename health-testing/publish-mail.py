#!/usr/bin/env python3
"""Publish the private testing outbox and its authorised email scheduler; preserve all other runtime modules."""
import concurrent.futures
import datetime
import email
from email import policy
import hashlib
import json
import re
import runpy
import sqlite3
import sys
import urllib.error
import urllib.request
import uuid

COMMIT=sys.argv[1]
RESUME=sys.argv[2] if len(sys.argv)>2 else None
assert re.fullmatch('[a-f0-9]{40}',COMMIT)
assert RESUME is None or re.fullmatch('[a-f0-9-]{36}',RESUME)
ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6'
DB='accounts/'+ACCOUNT+'/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query'
BASE='accounts/'+ACCOUNT+'/workers/scripts/shift-health-nutrition-20261027'
TOKEN=runpy.run_path('scripts/cloudflare-route-capacity.py')['token']()
def emit(stage,**values): print(json.dumps({'stage':stage,**values}),flush=True)
def cf(method,path,payload=None,kind='application/json',raw=False):
 if payload is not None and not isinstance(payload,bytes):payload=json.dumps(payload).encode()
 request=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,data=payload,method=method,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':kind})
 try:
  with urllib.request.urlopen(request,timeout=60) as response:body=response.read();content_type=response.headers.get('Content-Type','')
 except urllib.error.HTTPError as error:
  emit('provider_error',status=error.code,detail=error.read().decode()[:3000]);raise
 if raw:return body,content_type
 data=json.loads(body);assert data.get('success'),data.get('errors');return data['result']
def source(path):
 with urllib.request.urlopen('https://raw.githubusercontent.com/shiftsometimber/shift-core/'+COMMIT+'/'+path,timeout=40) as response:return response.read()
def sha(data):return hashlib.sha256(data).hexdigest()
def public(url,method='GET',origin=None):
 if not url.startswith('https://'):url='https://shiftsometimber.co.uk'+url
 headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-Fulfilment-Release-Check/1.0'}
 if origin:headers['Origin']=origin
 request=urllib.request.Request(url,method=method,headers=headers)
 try:response=urllib.request.urlopen(request,timeout=40)
 except urllib.error.HTTPError as error:response=error
 with response:return {'status':response.status,'headers':dict(response.headers),'body':response.read(),'url':response.geturl()}
def fingerprint(response):
 match=re.search(br'<main\b[\s\S]*?</main>',response['body'],re.I);return sha(match[0] if match else response['body'])

release=json.loads(source('health-testing/mail-release.json'))
assert release['emailSendingEnabled'] is True and release['purchasingEnabled'] is False
before_deployment=cf('GET',BASE+'/deployments')['deployments'][0]
assert before_deployment['versions']==[{'version_id':release['expectedLiveVersion'],'percentage':100}]
settings=cf('GET',BASE+'/settings')
schedules_before=cf('GET',BASE+'/schedules')['schedules']
assert not schedules_before,schedules_before
owned_bindings=[{'type':'send_email','name':'EMAIL','allowed_sender_addresses':['orders@shiftsometimber.co.uk']},{'type':'plain_text','name':'TESTING_FULFILMENT_MAIL_ENABLED','text':'true'},{'type':'plain_text','name':'TESTING_FULFILMENT_SCHEDULER_ENABLED','text':'true'}]
def binding_set(bindings):return sorted(json.dumps(b,sort_keys=True) for b in bindings)
if RESUME:
 latest=cf('GET',BASE+'/versions')['items'][0]
 assert latest['id']==RESUME,latest['id']
 saved=cf('GET',BASE+'/versions/'+RESUME)
 assert saved['annotations']['workers/tag']=='testing-mail-20261028'
 assert binding_set([b for b in settings['bindings'] if b['name'] in {x['name'] for x in owned_bindings}])==binding_set(owned_bindings)
 settings['bindings']=[b for b in settings['bindings'] if b['name'] not in {x['name'] for x in owned_bindings}]
else:assert not any(b['name'] in {x['name'] for x in owned_bindings} for b in settings['bindings'])
new_bindings=settings['bindings']+owned_bindings
raw,kind=cf('GET',BASE,raw=True)
message=email.message_from_bytes(('Content-Type: '+kind+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw,policy=policy.default)
modules={part.get_filename() or part.get_param('name',header='content-disposition'):part.get_payload(decode=True) for part in message.iter_parts()}
assert sha(modules['retained-health-nutrition.mjs'])==release['retainedLegacySha256']
assert 'testing-production-entry.mjs' in modules
old_hashes={name:sha(data) for name,data in modules.items()}
routes_before=cf('GET','zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes')
emit('preflight',sourceCommit=COMMIT,retainedVersion=release['expectedLiveVersion'],modules=len(modules),routeCount=len(routes_before))
paths=['/','/shift-health','/shift-health/supplements-nutrition','/shift-health/blood-tests','/my-timber','/shift-health/testing','/shift-health/testing/prostate-health']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:before=dict(zip(paths,pool.map(public,paths)))
assert all(response['status']==200 for response in before.values())
def get_module(spec):
 data=source(spec['path']);assert len(data)==spec['size'] and sha(data)==spec['sha256'],spec['path'];return spec['path'],data
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:incoming=dict(pool.map(get_module,release['modules']))
allowed={'health-testing/hq-api.mjs','health-testing/hq-client.mjs','health-testing/production.mjs','health-nutrition/worker.mjs','health-testing/fulfilment-api.mjs','health-testing/fulfilment-model.mjs','health-testing/hq-fulfilment.mjs','health-testing/fulfilment-source.mjs','health-testing/fulfilment-mail-model.mjs','health-testing/fulfilment-delivery.mjs','health-nutrition/public.mjs','health-testing/public.mjs','health-testing/styles.mjs','health-testing/media.mjs','health-testing/media-data.mjs','health-testing/product-context.mjs','health-testing/seo.mjs'}
changed=[name for name,data in incoming.items() if old_hashes.get(name)!=sha(data)]
assert set(changed)<=allowed,changed
if RESUME:assert not changed,changed
modules.update(incoming)
assert sha(modules['retained-health-nutrition.mjs'])==release['retainedLegacySha256']

schema=source(release['migration']).decode();statements=[];buffer=''
for line in schema.splitlines(True):
 buffer+=line
 if sqlite3.complete_statement(buffer):statements.append(buffer.strip());buffer=''
assert not buffer.strip()
for statement in statements:
 assert re.match(r'^(CREATE (?:UNIQUE )?(?:TABLE|INDEX) IF NOT EXISTS testing_fulfilment_|INSERT OR IGNORE INTO testing_fulfilment_config)',statement),statement[:100]
 if not RESUME:cf('POST',DB,{'sql':statement})
config=cf('POST',DB,{'sql':"SELECT id,revision,template_confirmed,delivery_confirmed,delivery_method,destination FROM testing_fulfilment_config"})[0]['results'][0]
batch_count=cf('POST',DB,{'sql':"SELECT COUNT(*) n FROM testing_fulfilment_batches"})[0]['results'][0]['n']
assert config['template_confirmed']==0 and config['delivery_confirmed']==0
emit('schema_applied',statements=len(statements),config=config,batchCount=batch_count)

metadata={'main_module':'testing-production-entry.mjs','bindings':new_bindings,'compatibility_date':settings['compatibility_date'],'compatibility_flags':settings.get('compatibility_flags',[]),'annotations':{'workers/message':'HQ testing: integrated send now, durable scheduled sending and order context.','workers/tag':'testing-mail-20261028'}}
for key in ['usage_model','tags','tail_consumers','logpush','observability','limits']:
 if key in settings:metadata[key]=settings[key]
if settings.get('placement',{}).get('mode'):metadata['placement']=settings['placement']
boundary='shift-csv-'+uuid.uuid4().hex;upload=[]
for name,value,kind in [('metadata',json.dumps(metadata).encode(),'application/json')]+[(name,value,'application/javascript+module') for name,value in modules.items()]:
 upload.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('; filename="'+name+'"' if name!='metadata' else '')+'\r\nContent-Type: '+kind+'\r\n\r\n').encode(),value,b'\r\n'])
upload.append(('--'+boundary+'--\r\n').encode())
candidate=cf('GET',BASE+'/versions/'+RESUME) if RESUME else cf('POST',BASE+'/versions',b''.join(upload),'multipart/form-data; boundary='+boundary)
emit('version_uploaded',versionId=candidate['id'],changedModules=changed)
assert cf('GET',BASE+'/deployments')['deployments'][0]['id']==before_deployment['id']
# Cloudflare publishes the uploaded version's binding metadata immediately,
# before changing production traffic. Compare the complete expected set.
assert binding_set(cf('GET',BASE+'/settings')['bindings'])==binding_set(new_bindings)
deployment=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':[{'version_id':candidate['id'],'percentage':100}],'annotations':{'workers/message':'Deploy HQ testing Send now / Send later. Public purchasing stays disabled; partner setup remains unconfirmed.'}})
emit('deployed',deploymentId=deployment['id'],versionId=candidate['id'])
try:
 checks=[]
 for suffix in ['', '/queue','/batches']:
  response=public('https://api.shiftsometimber.co.uk/v1/hq/testing/fulfilment'+suffix,origin='https://hq.shiftsometimber.co.uk')
  assert response['status']==401,(suffix,response['status'])
  assert 'csv-mail-20261028' in json.dumps(response['headers'])
  checks.append({'endpoint':suffix or '/','unauthenticatedStatus':response['status']})
 forbidden=public('https://api.shiftsometimber.co.uk/v1/hq/testing/fulfilment/batches/test','POST','https://other.example')
 assert forbidden['status']==403
 asset=public('/shift-health/assets/hq-testing-fulfilment.js')
 assert asset['status']==200 and asset['body']==source('health-testing/hq-fulfilment.js')
 hq=public('https://hq.shiftsometimber.co.uk/')
 assert hq['status']==200
 for name in ['hq-nutrition.js','hq-testing.js','hq-testing-fulfilment.js']:assert hq['body'].count(('/shift-health/assets/'+name).encode())==1
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:after=dict(zip(paths,pool.map(public,paths)))
 unchanged_paths=[path for path in paths if not path.startswith('/shift-health/testing')]
 def without_new_card(response):
  return {**response,'body':re.sub(br'<a class="sst-health-route sst-testing-route"[\s\S]*?</a>',b'',response['body'])}
 preserved=[{'path':path,'status':after[path]['status'],'mainUnchanged':fingerprint(before[path])==fingerprint(without_new_card(after[path]) if path=='/shift-health' else after[path])} for path in unchanged_paths]
 assert all(row['status']==200 and row['mainUnchanged'] for row in preserved),preserved
 assert after['/shift-health']['body'].count(b'class="sst-health-route sst-testing-route"')==1
 product_ids=release['productIds']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:products=list(pool.map(public,['/shift-health/testing/'+id for id in product_ids]))
 product_checks=[]
 for id,response in zip(product_ids,products):
  assert response['status']==200,id
  body=response['body'].decode()
  for section in ['about','why','evidence','suitability','included','why-shift']:assert 'id="'+section+'"' in body,(id,section)
  blocks=re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>',body);assert len(blocks)==1,id
  graph=json.loads(blocks[0])['@graph'];product=next(row for row in graph if row['@type']=='Product')
  assert 'offers' not in product and 'aggregateRating' not in product,id
  assert any(row['@type']=='FAQPage' and row['mainEntity'] for row in graph),id
  assert '0 in stock' in body and 'TBC' in body,id
  product_checks.append({'id':id,'status':response['status'],'sixSections':True,'schemaMatchesPage':True})
 sitemap=public('/shift-health/testing/sitemap.xml');assert sitemap['status']==200 and sitemap['body'].count(b'<url>')==21
 image_paths=release['brandlessImages']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:photos=list(pool.map(public,image_paths))
 assert all(photo['status']==200 and len(photo['body'])>5000 for photo in photos)
 actual_bindings=cf('GET',BASE+'/settings')['bindings']
 assert all(any(b==v for v in actual_bindings) for b in settings['bindings'])
 assert any(b.get('name')=='EMAIL' and b.get('type')=='send_email' for b in actual_bindings)
 assert all(any(b.get('name')==x['name'] and b.get('text')=='true' for b in actual_bindings) for x in owned_bindings if x['type']=='plain_text')
 routes_after=cf('GET','zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes')
 assert all(any(old==now for now in routes_after) for old in routes_before)
 counts=cf('POST',DB,{'sql':"SELECT (SELECT COUNT(*) FROM testing_fulfilment_batches) batches,(SELECT COUNT(*) FROM testing_products WHERE sale_enabled=0 AND status='draft') tests,(SELECT COUNT(*) FROM testing_range_extras WHERE sale_enabled=0 AND status='draft') extras"})[0]['results'][0]
 assert counts['tests']==13 and counts['extras']==7
 schedules=cf('PUT',BASE+'/schedules',[{'cron':release['schedulerCron']}])
 actual_schedules=cf('GET',BASE+'/schedules')['schedules']
 assert [s['cron'] for s in actual_schedules]==[release['schedulerCron']]
 emit('verified',sourceCommit=COMMIT,deploymentId=deployment['id'],versionId=candidate['id'],hqUrl='https://hq.shiftsometimber.co.uk/',hqHash='testing-orders',authChecks=checks,crossOriginWriteStatus=forbidden['status'],clientSha256=sha(asset['body']),customerPages=preserved,productPages=product_checks,brandlessImages=len(photos),sitemapUrls=21,existingBindingsUnchanged=True,mailBindingAdded=True,schedulerCron=release['schedulerCron'],oldRoutesUnchanged=True,routeCount=len(routes_after),databaseCounts=counts,emailSendingEnabled=True,purchasingEnabled=False,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
except Exception:
 if cf('GET',BASE+'/deployments')['deployments'][0]['id']==deployment['id']:
  cf('PUT',BASE+'/schedules',[{'cron':x['cron']} for x in schedules_before])
  rollback=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':before_deployment['versions'],'annotations':{'workers/message':'Restore prior testing range after private fulfilment release verification failed'}})
  emit('rolled_back',deploymentId=rollback['id'])
 raise
