"""Restore only routes still owned by this standalone publisher.
Does not delete any article, key, upload, database or Worker.
"""
from pathlib import Path
import re,json,urllib.request
snapshot=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/standalone-production-before-20261022.json')
before=json.loads(snapshot.read_text())
token=re.search(r'oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
base='https://api.cloudflare.com/client/v4/zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes'
def call(url,body=None,method=None):
 req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(req) as r:x=json.load(r)
 assert x['success'];return x.get('result')
current=call(base)
for route in current:
 if route.get('script')!='shift-blog-publisher':continue
 old=next((x for x in before['routes'] if x['pattern']==route['pattern']),None)
 if old:call(base+'/'+route['id'],{'pattern':old['pattern'],'script':old.get('script')},'PUT')
 else:call(base+'/'+route['id'],method='DELETE')
 print('Restored previous route owner:',route['pattern'])
