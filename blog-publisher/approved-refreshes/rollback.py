"""Scoped rollback. Default prints the concrete plan; --apply restores it.
No deletion of content, databases, media or keys. Preserve unrelated routes.
"""
from pathlib import Path
import json,re,urllib.request,sys
d=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/refresh-20261022')
baseline=json.loads((d/'production-before.json').read_text())
changes=json.loads((d/'route-changes.json').read_text())
plan={'restoreBlogPublisherVersion':baseline['workers']['shift-blog-publisher']['versions'],'routeChanges':len(changes),'preserveAllContentAndKeys':True}
if '--apply' not in sys.argv:print(json.dumps(plan,indent=2));raise SystemExit()
token=re.search(r'oauth_token\s*=\s*"([^"]+)"',Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()).group(1)
def api(path,body=None,method=None):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(req) as r:x=json.load(r)
 assert x['success'];return x.get('result')
account='/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-blog-publisher'
live=api(account+'/deployments')['deployments'][0]
release=json.loads((d/'release.json').read_text())
assert live['versions']==release['worker']['versions'],'A later publisher release exists; reconcile first'
routeBase='/zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes'
for change in reversed(changes):
 current=next((r for r in api(routeBase) if r['pattern']==change['pattern']),None)
 if not current or current.get('script')!='shift-blog-publisher':continue
 old=change['previous']
 if old:api(routeBase+'/'+current['id'],{'pattern':old['pattern'],'script':old.get('script')},'PUT')
 else:api(routeBase+'/'+current['id'],method='DELETE')
api(account+'/deployments',{'strategy':'percentage','versions':baseline['workers']['shift-blog-publisher']['versions']},'POST')
print('Restored the previous publisher and exact pre-refresh route ownership.')
