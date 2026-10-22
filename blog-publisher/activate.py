"""Deploy the tested publisher, then move only the explicit blog routes.
Retain an exact pre-change route receipt; no changes to the Core deployment.
Live key issuance remains disabled pending real HQ-owner acceptance.
"""
from pathlib import Path
import re,json,urllib.request,subprocess,datetime
p=Path(__file__).resolve().parent;root=p.parent
d=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021')
token=re.search(r'oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6';ZONE='66ec3268950adcfc837b7b8b2f8356ed'
base='https://api.cloudflare.com/client/v4'
def api(path,body=None,method=None):
 req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method=method)
 with urllib.request.urlopen(req,timeout=60) as r:x=json.load(r)
 assert x['success'],x.get('errors');return x['result']
routesPath='/zones/'+ZONE+'/workers/routes'
patterns=['api.shiftsometimber.co.uk/v1/integrations/blog-articles*','api.shiftsometimber.co.uk/v1/hq/blog-contributors*']
for host in ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']:
 patterns += [host+'/uploads/blog/*',host+'/articles/*',host+'/explore-knowledge*',host+'/sitemap.xml*']
beforeFile=d/'standalone-production-before-20261022.json'
if not beforeFile.exists():
 before={'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'routes':api(routesPath),'coreDeployments':api('/accounts/'+ACCOUNT+'/workers/scripts/shift-core/deployments'),'coreSettings':api('/accounts/'+ACCOUNT+'/workers/scripts/shift-core/settings')}
 beforeFile.write_text(json.dumps(before,indent=2)+'\n')
else:before=json.loads(beforeFile.read_text())
proof=json.loads((p/'acceptance.private.json').read_text())['proof']
assert proof.get('pass') and proof.get('actualD1') and proof.get('actualR2')
tests=(d/'standalone-all-tests-20261022.log').read_text();assert 'tests 90' in tests and 'fail 0' in tests
# Core may be independently owned; never move routes if its deployment changed meanwhile.
assert api('/accounts/'+ACCOUNT+'/workers/scripts/shift-core/deployments')['deployments'][0]['id']==before['coreDeployments']['deployments'][0]['id'],'Core changed; reconcile first'
wr=['/usr/local/bin/node',str(root/'node_modules/wrangler/bin/wrangler.js')]
r=subprocess.run(wr+['deploy','--config',str(p/'wrangler.jsonc')],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(d/'standalone-production-deploy-20261022.log').write_text(r.stdout)
print('PRODUCTION SERVICE DEPLOY',r.returncode,r.stdout[-2000:],flush=True);assert r.returncode==0
log=[]
for pattern in patterns:
 current=api(routesPath);entry=next((x for x in current if x['pattern']==pattern),None)
 original=next((x for x in before['routes'] if x['pattern']==pattern),None)
 expected=original.get('script') if original else None
 assert (entry.get('script') if entry else None) in [expected,'shift-blog-publisher'],'Route ownership changed: '+pattern
 if entry and entry.get('script')=='shift-blog-publisher':log.append({'pattern':pattern,'alreadyApplied':True});continue
 if entry:result=api(routesPath+'/'+entry['id'],{'pattern':pattern,'script':'shift-blog-publisher'},'PUT')
 else:result=api(routesPath,{'pattern':pattern,'script':'shift-blog-publisher'},'POST')
 log.append({'pattern':pattern,'result':result})
 (d/'standalone-route-activation-20261022.json').write_text(json.dumps(log,indent=2)+'\n')
 print('CONNECTED',pattern,flush=True)
after=api(routesPath)
for pattern in patterns:assert next(x for x in after if x['pattern']==pattern)['script']=='shift-blog-publisher'
# Preserve every unrelated route, including both individually owned answer pages.
for old in before['routes']:
 if old['pattern'] not in patterns:assert next(x for x in after if x['id']==old['id'])==old
core=api('/accounts/'+ACCOUNT+'/workers/scripts/shift-core/deployments')
assert core['deployments'][0]['id']==before['coreDeployments']['deployments'][0]['id']
(d/'standalone-production-activation-20261022.json').write_text(json.dumps({'activatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'routes':after,'coreUnchanged':True,'keyIssuanceEnabled':False,'hostedAcceptance':proof},indent=2)+'\n')
print('ACTIVATION COMPLETE; Core unchanged; live key issuance still held.')
