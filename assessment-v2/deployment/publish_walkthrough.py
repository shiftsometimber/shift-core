"""Finite update of the approved public assessment in the existing Pages project.
Uses the existing manifest/upload/preview/publish method and the production-phase
interlock. No Worker, route, binding, database or clinical/payment setting writes.
"""
import concurrent.futures, datetime, hashlib, json, os, re, sys, time, urllib.request, urllib.parse, urllib.error, uuid
from pathlib import Path
ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6'
PROJECT=f'/accounts/{ACCOUNT}/pages/projects/projectshift'
BASE='bf87f7b6-467c-4553-9784-ee1910ba44ae'
SOURCE='b511f05809923da1d9fd74d45f844594e5e8d76b'
HEADER_SOURCE='f7b551b35959519908fb80e3fdf34ae97bee28c4'
ASSET='/assessment-walkthrough.html'
ASSET_HASH='918a99c7d7a1ab64bbb04377390a1eb7'
BODY_SHA='6e2dbb9d649f4c1074baa75f51ca60c9576108e330f005ac16b9c077ed8e3a66'
CONTRACT=['content-type','cache-control','x-robots-tag','referrer-policy','content-security-policy','permissions-policy','x-content-type-options','strict-transport-security','access-control-allow-origin','access-control-allow-credentials','content-disposition']
OUT=Path(os.environ.get('ASSESSMENT_RELEASE_DIR','.'))
TOKEN=None

def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,x):
 p=OUT/n;p.parent.mkdir(parents=True,exist_ok=True)
 if isinstance(x,bytes):p.write_bytes(x)
 else:p.write_text(json.dumps(x,indent=2)+'\n')
def load(n):return json.loads((OUT/n).read_text())
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def guard():
 g=load('production-phase.json');assert 0<=time.time()-g['checkedAtEpoch']<120,'Refresh established production-phase interlock'
 assert g['source']==SOURCE and g['activePromotionBaselinesCaptured'] is False
 assert g['query']=='/actions/runs?status=in_progress&per_page=50'
 for j in g.get('promotionJobs',[]):assert not any(s['number']>=25 and s['status'] in ['in_progress','completed'] for s in j['steps'])
 return g

def request(url,method='GET',data=None,headers=None):
 req=urllib.request.Request(url,data=data,method=method,headers=headers or {})
 with urllib.request.urlopen(req,timeout=45) as r:return r.status,dict((k.lower(),v) for k,v in r.headers.items()),r.read()
def api(p,method='GET',data=None,headers=None,token=None):
 if method!='GET':guard()
 h={'Authorization':'Bearer '+(token or TOKEN),**(headers or {})}
 if isinstance(data,(dict,list)):data=json.dumps(data).encode();h['Content-Type']='application/json'
 _,_,b=request('https://api.cloudflare.com/client/v4'+p,method,data,h);j=json.loads(b);assert j.get('success'),j.get('errors');return j['result']
def fetch(url,method='GET'):
 return request(url,method,headers={'User-Agent':'SHIFT-approved-assessment-release','Cache-Control':'no-cache'})
def page():return api(PROJECT)
def same_base():
 p=page();assert p['canonical_deployment']['id']==BASE,'A newer public release must be reconciled';return p
def assert_scope(before,after):
 assert set(before)==set(after),'Only replacement of an existing assessment asset is authorised'
 assert [p for p in before if before[p]!=after[p]]==[ASSET],'One exact assessment asset must change'
 for p in before:
  if p!=ASSET:assert before[p]==after[p],p
 assert before['/index.html']==after['/index.html']
def asset_url(origin,p):return origin+urllib.parse.quote(p,safe='/')
def contract(origin,p):
 status,h,_=fetch(asset_url(origin,p),'HEAD');return {'status':status,'headers':{k:h.get(k) for k in CONTRACT}}
def headers_match(before,after,preview=True):
 a=json.loads(json.dumps(after))
 # Cloudflare adds a stricter default noindex on preview deployments.
 if preview and before['headers']['x-robots-tag'] is None and a['headers']['x-robots-tag']=='noindex':a['headers']['x-robots-tag']=None
 return a==before

def multipart(manifest,branch):
 boundary='----shift-'+uuid.uuid4().hex;parts=[]
 for k,v in {'manifest':json.dumps(manifest),'branch':branch,'commit_hash':SOURCE,'commit_dirty':'false','commit_message':'Approved compact assessment and guided design; orders closed'}.items():
  parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
 b=(OUT/'headers-source.txt').read_bytes()
 parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="_headers"; filename="_headers"\r\nContent-Type: text/plain\r\n\r\n'.encode()+b+b'\r\n')
 parts.append(f'--{boundary}--\r\n'.encode());return b''.join(parts),{'Content-Type':'multipart/form-data; boundary='+boundary}
def simple(d):return {k:d.get(k) for k in ['id','url','environment','created_on','latest_stage','deployment_trigger','uses_functions']}
def source_check():
 b=(OUT/'candidate.html').read_bytes();assert sha(b)==BODY_SHA and b'answer-choices' in b and b'shift-compact-v5-prepurchase-draft-2026-10-28' in b
 assert b'heightMeasuredAt' not in b and b'weightMeasuredAt' not in b
 return b

def prepare():
 assert not (OUT/'baseline.json').exists(),'Resume existing transaction';guard();p=same_base();d=p['canonical_deployment'];assert d['uses_functions'] is False
 b=fetch(f'https://raw.githubusercontent.com/shiftsometimber/shift-core/{SOURCE}/public-assessment-v2/assessment-walkthrough.html')[2];assert sha(b)==BODY_SHA;save('candidate.html',b)
 h=fetch(f'https://raw.githubusercontent.com/shiftsometimber/shift-core/{HEADER_SOURCE}/release/website-review-20261023/_headers')[2];assert b'/assessment-walkthrough*' in h and b'X-Robots-Tag: noindex, nofollow' in h;save('headers-source.txt',h)
 files=api(PROJECT+'/deployments/'+BASE+'/files')['files'];assert len(files)==860 and ASSET in files
 after={**files,ASSET:ASSET_HASH};assert_scope(files,after);save('manifest-before.json',files);save('manifest-candidate.json',after)
 save('baseline.json',{'deployment':simple(d),'productionBranch':p['production_branch'],'source':SOURCE,'headerSourceCommit':HEADER_SOURCE,'headerSourceSHA256':sha(h),'at':now()})
 roots=['/','/start-here','/shift-health/testing','/my-timber','/treatment-assessment']
 receipts={}
 for path in roots:
  status,headers,body=fetch('https://shiftsometimber.co.uk'+path);receipts[path]={'status':status,'sha256':sha(body),'bytes':len(body),'headers':{k:v for k,v in headers.items() if k.startswith('x-shift')}}
 save('protected-public-before.json',receipts);print(json.dumps({'phase':'prepared','baseline':BASE,'source':SOURCE,'changedPaths':[ASSET],'retainedAssets':859,'headerSourceSHA256':sha(h)}))
def preview():
 source_check();p=same_base();assert not (OUT/'preview-intent.json').exists(),'Reconcile prior preview intent'
 m=load('manifest-candidate.json');assert_scope(load('manifest-before.json'),m)
 jwt=api(PROJECT+'/upload-token')['jwt'];auth={'Content-Type':'application/json'}
 missing=api('/pages/assets/check-missing','POST',{'hashes':list(m.values())},auth,jwt);assert set(missing)<=set([ASSET_HASH]),'Existing manifest assets unexpectedly unavailable'
 if ASSET_HASH in missing:api('/pages/assets/upload','POST',[{'key':ASSET_HASH,'value':__import__('base64').b64encode(source_check()).decode(),'metadata':{'contentType':'text/html; charset=utf-8'},'base64':True}],auth,jwt)
 api('/pages/assets/upsert-hashes','POST',{'hashes':list(m.values())},auth,jwt);same_base();data,headers=multipart(m,'assessment-guided-review-20261028');save('preview-intent.json',{'baseline':BASE,'at':now(),'source':SOURCE});d=api(PROJECT+'/deployments','POST',data,headers);save('preview.json',simple(d));print(json.dumps(simple(d)))
def inspect():
 d=load('preview.json');print(json.dumps(simple(api(PROJECT+'/deployments/'+d['id']))))
def verify_preview():
 same_base();d=load('preview.json');actual=api(PROJECT+'/deployments/'+d['id']);assert actual['latest_stage']['status']=='success';assert actual.get('uses_functions') is False
 files=api(PROJECT+'/deployments/'+d['id']+'/files')['files'];assert files==load('manifest-candidate.json')
 status,h,b=fetch(d['url']+ASSET);assert status==200 and sha(b)==BODY_SHA;assert 'no-store' in h['cache-control'] and 'noindex' in h['x-robots-tag']
 base=load('baseline.json')['deployment']['url'];paths=list(load('manifest-before.json'))+['/','/assessment-walkthrough','/start-here','/member/dashboard','/unknown-assessment-release-check']
 def check(p):
  try:
   left=contract(base,p);right=contract(d['url'],p);return {'path':p,'match':headers_match(left,right),'before':left,'preview':right}
  except urllib.error.HTTPError as e:
   # Both deployments must retain the same 404 boundary for a nonexistent path.
   if e.code==404:
    def status(origin):
     try:return fetch(asset_url(origin,p),'HEAD')[0]
     except urllib.error.HTTPError as x:return x.code
    return {'path':p,'match':status(base)==status(d['url'])==404,'status':404}
   raise
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(check,paths))
 save('header-comparison.json',rows);failed=[r for r in rows if not r['match']];assert not failed,[(r['path'],r.get('before'),r.get('preview')) for r in failed[:8]]
 save('preview-verification.json',{'pass':True,'at':now(),'deployment':d['id'],'bodySHA256':BODY_SHA,'effectiveHeaderContractsChecked':len(rows),'sourceHeadersFromCurrentDeploymentCommit':HEADER_SOURCE,'manifestExact':True,'onlyChangedPath':ASSET});print(json.dumps(load('preview-verification.json')))
def publish():
 source_check();same_base();guard();q=load('preview-verification.json');v=load('preview-browser.json');d=load('preview.json');assert q['pass'] is True and q['deployment']==d['id'];assert v['preview']==d['id'] and v['accepted'] is True
 assert not (OUT/'production-intent.json').exists(),'Reconcile any uncertain production attempt before retry'
 m=load('manifest-candidate.json');assert_scope(load('manifest-before.json'),m);data,headers=multipart(m,load('baseline.json')['productionBranch']);same_base();save('production-intent.json',{'baseline':BASE,'source':SOURCE,'at':now(),'preview':d['id'],'manifestSHA256':sha(json.dumps(m,sort_keys=True).encode())});result=api(PROJECT+'/deployments','POST',data,headers);save('production.json',simple(result));print(json.dumps(simple(result)))
def verify():
 d=load('production.json');p=page();assert p['canonical_deployment']['id']==d['id'],'Newer deployment: do not overwrite';assert api(PROJECT+'/deployments/'+d['id'])['latest_stage']['status']=='success'
 actual=api(PROJECT+'/deployments/'+d['id']+'/files')['files'];assert actual==load('manifest-candidate.json');assert_scope(load('manifest-before.json'),actual)
 checks={}
 for path in ['/assessment-walkthrough','/assessment-walkthrough.html']:
  status,h,b=fetch('https://shiftsometimber.co.uk'+path);assert status==200;assert b'answer-choices' in b and b'shift-compact-v5-prepurchase-draft-2026-10-28' in b;assert b'heightMeasuredAt' not in b;assert 'no-store' in h['cache-control'] and 'noindex' in h['x-robots-tag'];checks[path]={'status':status,'sha256':sha(b),'bytes':len(b),'cacheControl':h['cache-control'],'robots':h['x-robots-tag']}
 before=load('protected-public-before.json')
 for path,old in before.items():
  status,h,b=fetch('https://shiftsometimber.co.uk'+path);assert status==old['status'];assert sha(b)==old['sha256'],f'Protected public response moved: {path}';checks[path]={'status':status,'sha256':sha(b),'unchanged':True}
 result={'source':SOURCE,'deployment':d['id'],'baseline':BASE,'at':now(),'changedPaths':[ASSET],'unchangedManifestAssets':859,'checks':checks,'workerWrites':0,'routeChanges':0,'dataWrites':0,'clinicalActivation':False,'paymentActivation':False};save('live-verification.json',result);print(json.dumps(result))
def rollback():
 d=load('production.json');assert page()['canonical_deployment']['id']==d['id'],'Only own the current deployment';guard();save('rollback-intent.json',{'owned':d['id'],'restore':BASE,'at':now()});r=api(PROJECT+'/deployments/'+BASE+'/rollback','POST');save('rollback.json',simple(r));assert page()['canonical_deployment']['id']==BASE;print(json.dumps({'restored':BASE,'owned':d['id']}))
if __name__=='__main__':
 OUT.mkdir(parents=True,exist_ok=True)
 cfg=(Path.home()/'Library/Preferences/.wrangler/config/default.toml').read_text();TOKEN=re.search(r'oauth_token\s*=\s*"([^"]+)"',cfg)[1]
 {'prepare':prepare,'preview':preview,'inspect':inspect,'verify-preview':verify_preview,'publish':publish,'verify':verify,'rollback':rollback}[sys.argv[1]]()
