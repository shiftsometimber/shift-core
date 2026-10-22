from pathlib import Path
import re,json,urllib.request,subprocess,os
p=Path(__file__).resolve().parent
root=p.parent
d=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021')
token=re.search(r'oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6'
def api(path,body=None):
 r=urllib.request.urlopen(urllib.request.Request(base+path,data=json.dumps(body).encode() if body else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}));x=json.load(r);assert x['success'];return x['result']
receipt=d/'standalone-staging-resources-20261022.json'
if receipt.exists():resources=json.loads(receipt.read_text())
else:
 db=next((x for x in api('/d1/database?per_page=100') if x['name']=='shift-blog-publisher-stage-20261022'),None)
 if not db:db=api('/d1/database',{'name':'shift-blog-publisher-stage-20261022'})
 resources={'databaseId':db['uuid'],'databaseName':db['name'],'subdomain':api('/workers/subdomain')['subdomain'],'worker':'shift-blog-publisher-staging'}
 receipt.write_text(json.dumps(resources,indent=2)+'\n')
config=json.loads((p/'wrangler.staging.jsonc').read_text())
config['d1_databases']=[{'binding':'DB','database_name':resources['databaseName'],'database_id':resources['databaseId']}]
(p/'wrangler.staging.jsonc').write_text(json.dumps(config,indent=2)+'\n')
wr=['/usr/local/bin/node',str(root/'node_modules/wrangler/bin/wrangler.js')]
r=subprocess.run(wr+['deploy','--config',str(p/'wrangler.staging.jsonc')],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(d/'standalone-staging-deploy-20261022.log').write_text(r.stdout)
print('DEPLOY',r.returncode,r.stdout[-2400:],flush=True);assert r.returncode==0
secret=json.loads((p/'staging-access.private.json').read_text())['BLOG_STAGING_ACCESS']
r=subprocess.run(wr+['secret','put','BLOG_STAGING_ACCESS','--config',str(p/'wrangler.staging.jsonc')],input=secret+'\n',cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(d/'standalone-staging-secret-20261022.log').write_text(r.stdout)
print('PRIVATE GATE CONFIGURED',r.returncode,flush=True);assert r.returncode==0
print('STAGING BASE','https://'+resources['worker']+'.'+resources['subdomain']+'.workers.dev')
