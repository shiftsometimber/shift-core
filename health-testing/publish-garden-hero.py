#!/usr/bin/env python3
"""Replace the testing collection hero while retaining the exact current live graph."""
import concurrent.futures
import datetime
import email
from email import policy
import hashlib
import json
import re
import runpy
import sys
import time
import urllib.request
import urllib.error
import uuid

COMMIT=sys.argv[1]
assert re.fullmatch('[a-f0-9]{40}',COMMIT)
BASE='accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-health-nutrition-20261027'
TOKEN=runpy.run_path('scripts/cloudflare-route-capacity.py')['token']()
def emit(stage,**values):print(json.dumps({'stage':stage,**values}),flush=True)
def sha(data):return hashlib.sha256(data).hexdigest()
def cf(method,path,data=None,kind='application/json',raw=False):
 if data is not None and not isinstance(data,bytes):data=json.dumps(data).encode()
 with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,method=method,data=data,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':kind}),timeout=60) as response:body=response.read();content_type=response.headers.get('Content-Type','')
 if raw:return body,content_type
 value=json.loads(body);assert value.get('success'),value.get('errors');return value['result']
def source(path):
 with urllib.request.urlopen('https://raw.githubusercontent.com/shiftsometimber/shift-core/'+COMMIT+'/'+path,timeout=40) as response:return response.read()
def public(path):
 request=urllib.request.Request('https://shiftsometimber.co.uk'+path,headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-CSV-Byte-Check/1.0'})
 with urllib.request.urlopen(request,timeout=40) as response:
  body=response.read()
  if path=='/shift-health/testing':
   body=re.sub(br'<section class="nft-hero nft-range-hero[^"]*"[\s\S]*?<section class="nft-route-section"',b'<section class="nft-route-section"',body)
  main=re.search(br'<main\b[\s\S]*?</main>',body,re.I)
  return {'status':response.status,'mainSha256':sha(main[0] if main else body)}
def bindings(items):return sorted(json.dumps(item,sort_keys=True) for item in items)

release=json.loads(source('health-testing/hero-garden-release.json'))
before=cf('GET',BASE+'/deployments')['deployments'][0]
assert before['versions']==[{'version_id':release['expectedLiveVersion'],'percentage':100}],before
settings=cf('GET',BASE+'/settings');schedules=cf('GET',BASE+'/schedules')['schedules']
assert [s['cron'] for s in schedules]==['* * * * *']
assert any(b['name']=='EMAIL' and b.get('allowed_sender_addresses')==['orders@shiftsometimber.co.uk'] for b in settings['bindings'])
raw,kind=cf('GET',BASE,raw=True)
message=email.message_from_bytes(('Content-Type: '+kind+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw,policy=policy.default)
modules={part.get_filename() or part.get_param('name',header='content-disposition'):part.get_payload(decode=True) for part in message.iter_parts()}
assert sha(modules['retained-health-nutrition.mjs'])==release['retainedLegacySha256']
original={key:sha(value) for key,value in modules.items()}
for name,spec in release['modules'].items():
 assert original.get(name)==spec['previousSha256'],name
 updated=source(name);assert sha(updated)==spec['sha256'] and len(updated)==spec['size'],name
 modules[name]=updated
changed=[key for key,value in modules.items() if original.get(key)!=sha(value)]
assert set(changed)==set(release['modules']),changed
paths=['/','/shift-health','/shift-health/testing','/shift-health/testing/prostate-health','/shift-health/testing/sitemap.xml','/shift-health/supplements-nutrition','/my-timber']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:pages_before=list(pool.map(public,paths))
emit('preflight',sourceCommit=COMMIT,liveVersion=release['expectedLiveVersion'],changedModules=changed,otherModules=len(modules)-len(changed))
metadata={'main_module':'testing-production-entry.mjs','bindings':settings['bindings'],'compatibility_date':settings['compatibility_date'],'compatibility_flags':settings.get('compatibility_flags',[]),'annotations':{'workers/message':'Publish the approved testing garden hero with accessible HTML and a real CTA.','workers/tag':'testing-garden-hero-20261029'}}
for key in ['usage_model','tags','tail_consumers','logpush','observability','limits']:
 if key in settings:metadata[key]=settings[key]
if settings.get('placement',{}).get('mode'):metadata['placement']=settings['placement']
boundary='shift-csv-bytes-'+uuid.uuid4().hex;upload=[]
for key,value,kind in [('metadata',json.dumps(metadata).encode(),'application/json')]+[(key,value,'application/javascript+module') for key,value in modules.items()]:
 upload.extend([('--'+boundary+'\r\nContent-Disposition: form-data; name="'+key+'"'+('; filename="'+key+'"' if key!='metadata' else '')+'\r\nContent-Type: '+kind+'\r\n\r\n').encode(),value,b'\r\n'])
upload.append(('--'+boundary+'--\r\n').encode())
candidate=cf('POST',BASE+'/versions',b''.join(upload),'multipart/form-data; boundary='+boundary)
assert cf('GET',BASE+'/deployments')['deployments'][0]['id']==before['id']
assert bindings(cf('GET',BASE+'/settings')['bindings'])==bindings(settings['bindings'])
deployment=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':[{'version_id':candidate['id'],'percentage':100}],'annotations':{'workers/message':'Publish the approved garden hero; preserve every other current module, products and operations.'}})
emit('deployed',deploymentId=deployment['id'],versionId=candidate['id'])
try:
 deadline=time.monotonic()+45
 while True:
  assert cf('GET',BASE+'/deployments')['deployments'][0]['id']==deployment['id']
  time.sleep(2)
  raw,kind=cf('GET',BASE,raw=True)
  current=email.message_from_bytes(('Content-Type: '+kind+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw,policy=policy.default)
  actual={part.get_filename() or part.get_param('name',header='content-disposition'):sha(part.get_payload(decode=True)) for part in current.iter_parts()}
  if actual=={key:sha(value) for key,value in modules.items()}:break
  assert time.monotonic()<deadline
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:pages_after=list(pool.map(public,paths))
 assert pages_before==pages_after
 request=urllib.request.Request('https://shiftsometimber.co.uk'+release['asset']['path'],headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-Hero-Release-Check/1.0'})
 deadline=time.monotonic()+45
 while True:
  try:
   with urllib.request.urlopen(request,timeout=40) as response:
    image=response.read();assert response.status==200 and sha(image)==release['asset']['sha256']
   break
  except urllib.error.HTTPError as error:
   if error.code!=404 or time.monotonic()>=deadline:raise
   time.sleep(2)
 request=urllib.request.Request('https://shiftsometimber.co.uk/shift-health/testing',headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-Hero-Release-Check/1.0'})
 with urllib.request.urlopen(request,timeout=40) as response:html=response.read().decode()
 assert html.count('class="nft-hero nft-range-hero nft-garden-hero"')==1 and 'class="nft-shop-showcase"' not in html
 assert release['asset']['path'] in html and 'fetchpriority="high"' in html

 assert bindings(cf('GET',BASE+'/settings')['bindings'])==bindings(settings['bindings'])
 assert cf('GET',BASE+'/schedules')['schedules']==schedules
 emit('verified',sourceCommit=COMMIT,deploymentId=deployment['id'],versionId=candidate['id'],changedModules=changed,heroSha256=release['asset']['sha256'],publicContentPreservedOutsideHero=paths,unchangedOtherModules=len(modules)-len(changed),bindingsUnchanged=True,schedulesUnchanged=True,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
except Exception:
 if cf('GET',BASE+'/deployments')['deployments'][0]['id']==deployment['id']:
  rollback=cf('POST',BASE+'/deployments',{'strategy':'percentage','versions':before['versions'],'annotations':{'workers/message':'Restore prior testing hero after release verification failed'}});emit('rolled_back',deploymentId=rollback['id'])
 raise

