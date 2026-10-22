"""Publish only Matt's three approved refreshes and the pack's additive backlinks.
No Core release, CMS mutation, key changes, email, indexing claim or new schedule.
"""
from pathlib import Path
import json,re,urllib.request,subprocess,datetime
root=Path(__file__).resolve().parents[2];module=Path(__file__).resolve().parent
d=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/refresh-20261022')
token=re.search(r'oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
apiRoot='https://api.cloudflare.com/client/v4';account='9e5386dcf455be34c582d93f8bfc79e6';zone='66ec3268950adcfc837b7b8b2f8356ed'
def api(path,body=None,method=None):
 req=urllib.request.Request(apiRoot+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=60) as response:value=json.load(response)
 assert value['success'],value.get('errors');return value['result']
workerPath='/accounts/'+account+'/workers/scripts/'
routesPath='/zones/'+zone+'/workers/routes'
assert json.loads((d/'hosted-stage.json').read_text())['pass']
tests=(d/'tests.log').read_text();assert 'tests 99' in tests and 'fail 0' in tests
beforeFile=d/'production-before.json'
if not beforeFile.exists():
 baseline={'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'routes':api(routesPath),'workers':{name:api(workerPath+name+'/deployments')['deployments'][0] for name in ['shift-blog-publisher','shift-core','shift-obesity-presentation-20261022','shift-health-presentation-20261021','shift-knowledge-presentation-20261022']}}
 assert baseline['workers']['shift-blog-publisher']['versions'][0]['version_id']=='ca921ec8-75cc-4c51-8a6c-23044ca3be0d','Blog publisher changed outside this refresh'
 beforeFile.write_text(json.dumps(baseline,indent=2)+'\n')
else:baseline=json.loads(beforeFile.read_text())
r=subprocess.run(['/usr/local/bin/node',str(root/'node_modules/wrangler/bin/wrangler.js'),'deploy','--config',str(root/'blog-publisher/wrangler.jsonc')],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(d/'production-deploy.log').write_text(r.stdout);print('DEPLOY',r.returncode,r.stdout[-600:],flush=True);assert r.returncode==0
paths=['/male-obesity','/guides/mens-health-mot-guide','/articles/testosterone-weight-men','/guides/blood-pressure-guide','/articles/men-belly-fat','/shift-health','/articles/weight-loss-blood-tests','/shift-health/testosterone-energy']
log=[]
for host in ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']:
 for path in paths:
  for suffix in ['', '/', '.html']:
   pattern=host+path+suffix
   current=api(routesPath);route=next((x for x in current if x['pattern']==pattern),None)
   previous=next((x for x in baseline['routes'] if x['pattern']==pattern),None)
   expected=previous.get('script') if previous else None
   assert (route.get('script') if route else None) in [expected,'shift-blog-publisher'],'Route ownership changed: '+pattern
   if route and route.get('script')=='shift-blog-publisher':continue
   if route:result=api(routesPath+'/'+route['id'],{'pattern':pattern,'script':'shift-blog-publisher'},'PUT')
   else:result=api(routesPath,{'pattern':pattern,'script':'shift-blog-publisher'},'POST')
   log.append({'pattern':pattern,'previous':previous,'applied':result})
   (d/'route-changes.json').write_text(json.dumps(log,indent=2)+'\n')
   print('LIVE ROUTE',pattern,flush=True)
# All original Worker deployments remain independently owned and unchanged.
for name,old in baseline['workers'].items():
 if name!='shift-blog-publisher':assert api(workerPath+name+'/deployments')['deployments'][0]['id']==old['id'],'Upstream release changed during activation; reverify'
release=api(workerPath+'shift-blog-publisher/deployments')['deployments'][0]
receipt={'publishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ownerInstruction':'Apply the three supplied refresh packs; preserve original publish dates and set 22 October 2026 as modified date.','worker':release,'routesChanged':len(log),'originalWorkersUnchanged':True,'CMSWrites':False,'keyScopeChanged':False,'emailsSent':False,'newSchedules':False,'versionedPacks':[{k:x[k] for k in ['path','published','modified','packSHA256']} for x in json.loads((module/'content.json').read_text())]}
(d/'release.json').write_text(json.dumps(receipt,indent=2)+'\n');print('RELEASE COMPLETE',release['versions'],flush=True)
