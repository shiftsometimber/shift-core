#!/usr/bin/env python3
"""Publish only the private testing fulfilment additions; no email transport."""
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
assert re.fullmatch('[a-f0-9]{40}',COMMIT)
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

release=json.loads(source('health-testing/fulfilment-release.json'))
assert release['emailSendingEnabled'] is False and release['purchasingEnabled'] is False
before_deployment=cf('GET',BASE+'/deployments')['deployments'][0]
assert before_deployment['versions']==[{'version_id':release['expectedLiveVersion'],'percentage':100}]
settings=cf('GET',BASE+'/settings')
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
allowed={'health-testing/hq-api.mjs','health-testing/hq-client.mjs','health-testing/production.mjs','health-nutrition/worker.mjs','health-testing/fulfilment-api.mjs','health-testing/fulfilment-model.mjs','health-testing/hq-fulfilment.mjs'}
changed=[name for name,data in incoming.items() if old_hashes.get(name)!=sha(data)]
assert set(changed)<=allowed,changed
modules.update(incoming)
assert sha(modules['retained-health-nutrition.mjs'])==release['retainedLegacySha256']

schema=source(release['migration']).decode();statements=[];buffer=''
for line in schema.splitlines(True):
 buffer+=line
 if sqlite3.complete_statement(buffer):statements.append(buffer.strip());buffer=''
assert not buffer.strip()
for statement in statements:
 assert re.match(r'^(CREATE (?:UNIQUE )?(?:TABLE|INDEX) IF NOT EXISTS testing_fulfilment_|INSERT OR IGNORE INTO testing_fulfilment_config)',statement),statement[:100]
 cf('POST',DB,{'sql':statement})
config=cf('POST',DB,{'sql':"SELECT id,revision,template_confirmed,delivery_confirmed,delivery_method,destination FROM testing_fulfilment_config"})[0]['results'][0]
batch_count=cf('POST',DB,{'sql':"SELECT COUNT(*) n FROM testing_fulfilment_batches"})[0]['results'][0]['n']
assert config['template_confirmed']==0 and config['delivery_confirmed']==0
emit('schema_applied',statements=len(statements),config=config,batchCount=batch_count)

metadata={'main_module':'testing-production-entry.mjs','bindings':settings['bindings'],'compatibility_date':settings['compatibility_date'],'compatibility_flags':settings.get('compatibility_flags',[]),'annotations':{'workers/message':'HQ testing fulfilment: CSV queue, immutable batches, reviewable drafts. No email sending.','workers/tag':'testing-csv-20261028'}}
for key in ['usage_model','tags','tail_consumers','logpush','observability','limits']:
 if key in settings:metadata[key]=settings[key]
if settings.get('placement',{}).get('mode'):metadata['placement']=settings['placement']
boundary='shift-csv-'+uuid.uuid4().hex;upload=[]
for name,value,kind in [('metadata',json.dumps(metadata).encode(),'application/json')]+[(name,value,'application/javascript+module') for name,value in modules.items()]:
 upload.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"'+('; filename="'+name+'"' if name!='metadata' else '')+'\r\nContent-Type: '+kind+'\r\n\r\n').encode(),value,b'\r\n'])
upload.append(('--'+boundary+'--\r\n').encode())
candidate=cf('POST',BASE+'/versions',b''.join(upload),'multipart/form-data; boundary='+boundary)
emit('version_uploaded',versionId=candidate['id'],changedModules=changed)
assert cf('GET',BASE+'/deployments')['deployments'][0]['id']==before_deployment['id']
assert cf('GET',BASE+'/settings')['bindings']==settings['bindings']
deployment=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':[{'version_id':candidate['id'],'percentage':100}],'annotations':{'workers/message':'Deploy private HQ CSV fulfilment preparation. Sending and purchasing stay disabled.'}})
emit('deployed',deploymentId=deployment['id'],versionId=candidate['id'])
try:
 checks=[]
 for suffix in ['', '/queue','/batches']:
  response=public('https://api.shiftsometimber.co.uk/v1/hq/testing/fulfilment'+suffix,origin='https://hq.shiftsometimber.co.uk')
  assert response['status']==401,(suffix,response['status'])
  assert 'csv-draft-20261028' in json.dumps(response['headers'])
  checks.append({'endpoint':suffix or '/','unauthenticatedStatus':response['status']})
 forbidden=public('https://api.shiftsometimber.co.uk/v1/hq/testing/fulfilment/batches/test','POST','https://other.example')
 assert forbidden['status']==403
 asset=public('/shift-health/assets/hq-testing-fulfilment.js')
 assert asset['status']==200 and asset['body']==source('health-testing/hq-fulfilment.js')
 hq=public('https://hq.shiftsometimber.co.uk/')
 assert hq['status']==200
 for name in ['hq-nutrition.js','hq-testing.js','hq-testing-fulfilment.js']:assert hq['body'].count(('/shift-health/assets/'+name).encode())==1
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:after=dict(zip(paths,pool.map(public,paths)))
 preserved=[{'path':path,'status':after[path]['status'],'mainUnchanged':fingerprint(before[path])==fingerprint(after[path])} for path in paths]
 assert all(row['status']==200 and row['mainUnchanged'] for row in preserved),preserved
 assert cf('GET',BASE+'/settings')['bindings']==settings['bindings']
 routes_after=cf('GET','zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes')
 assert all(any(old==now for now in routes_after) for old in routes_before)
 counts=cf('POST',DB,{'sql':"SELECT (SELECT COUNT(*) FROM testing_fulfilment_batches) batches,(SELECT COUNT(*) FROM testing_products WHERE sale_enabled=0 AND status='draft') tests,(SELECT COUNT(*) FROM testing_range_extras WHERE sale_enabled=0 AND status='draft') extras"})[0]['results'][0]
 assert counts['tests']==13 and counts['extras']==7
 emit('verified',sourceCommit=COMMIT,deploymentId=deployment['id'],versionId=candidate['id'],hqUrl='https://hq.shiftsometimber.co.uk/',hqHash='testing-orders',authChecks=checks,crossOriginWriteStatus=forbidden['status'],clientSha256=sha(asset['body']),customerPages=preserved,bindingsUnchanged=True,oldRoutesUnchanged=True,routeCount=len(routes_after),databaseCounts=counts,emailSendingEnabled=False,purchasingEnabled=False,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
except Exception:
 if cf('GET',BASE+'/deployments')['deployments'][0]['id']==deployment['id']:
  rollback=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':before_deployment['versions'],'annotations':{'workers/message':'Restore prior testing range after private fulfilment release verification failed'}})
  emit('rolled_back',deploymentId=rollback['id'])
 raise
