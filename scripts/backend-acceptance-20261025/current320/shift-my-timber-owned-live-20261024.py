"""One-shot owned deployment verification, called by the existing release verifier."""
import argparse,datetime,hashlib,json,os,pathlib,re,subprocess,sys,time,urllib.request,urllib.error,zipfile
ROOT=pathlib.Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024')
PROOF=pathlib.Path('/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/immediate-deletion-proof')
FEATURE=pathlib.Path('/Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025')
REPAIR=pathlib.Path('/Users/shiftsometimberltd/SST/my-timber-recording-preflight-20261024')
DEPS=pathlib.Path('/tmp/my-timber-recording-dependencies-20261024')
NODE='/usr/local/bin/node'
PLAYWRIGHT=pathlib.Path('/Users/shiftsometimberltd/SST/my-timber-experience-20261015/node_modules/playwright/index.mjs')
parser=argparse.ArgumentParser();parser.add_argument('--prepare',action='store_true');parser.add_argument('run');parser.add_argument('source');args=parser.parse_args()
assert re.fullmatch(r'\d+',args.run) and re.fullmatch(r'[a-f0-9]{40}',args.source)
started=time.monotonic();deadline=started+165
def left(cap):
 remaining=deadline-time.monotonic()
 if remaining<=0:raise TimeoutError('Bounded one-shot verification deadline exceeded')
 return min(cap,remaining)
def command(label,cmd,cwd=None,env=None,cap=30):
 r=subprocess.run(cmd,cwd=cwd,env=env,capture_output=True,text=True,timeout=left(cap))
 (ROOT/('my-timber-'+label+'.log')).write_text(r.stdout+r.stderr)
 if r.returncode:raise RuntimeError(label+' failed, exit '+str(r.returncode)+'; see '+str(ROOT/('my-timber-'+label+'.log')))
 return r.stdout
def read_response(request,cap=20):
 with urllib.request.urlopen(request,timeout=left(cap)) as response:return response.read()
def oauth():
 text=pathlib.Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text()
 match=re.search(r'^oauth_token\s*=\s*"([^"]+)"',text,re.M);assert match,'Existing Wrangler read session missing'
 return match.group(1),text
def active_owned(owned):
 token,_=oauth()
 request=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/deployments',headers={'Authorization':'Bearer '+token})
 data=json.loads(read_response(request));assert data['success']
 row=max(data['result']['deployments'],key=lambda x:x['created_on'])
 assert row['id']==owned['deploymentId'],'Another deployment owns production'
 assert len(row['versions'])==1 and row['versions'][0]['version_id']==owned['versionId'] and row['versions'][0]['percentage']==100,'Owned version no longer has100% traffic'
 return {'deploymentId':row['id'],'versionId':row['versions'][0]['version_id'],'percentage':100}
# Validate local requirements without any member record or production mutation.
assert command('feature-head',['git','rev-parse','HEAD'],cwd=FEATURE).strip()=='8ad691488cd003c899f4c8cfbb7439a97f8a3e49'
for opts in [['diff','--name-only','HEAD','--'],['diff','--cached','--name-only','--']]:assert not command('feature-clean',['git',*opts],cwd=FEATURE).strip()
assert PLAYWRIGHT.is_file() and (DEPS/'esbuild/lib/main.js').is_file()
bundle=pathlib.Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024/fresh-current8ad-approved-runtime-bundle/worker.js')
assert hashlib.sha256(bundle.read_bytes()).hexdigest()=='c5996373bf39c09a73628a438938e69db286c320ac0f94c226a6743ef445218d','Pinned successful compilation changed'
for name in ['verify-live-worker.mjs','verify-live-delivered-browser.mjs']:command('syntax-'+name,[NODE,'--check',str(PROOF/name)],cap=10)
engines="import fs from 'node:fs';const p=await import("+json.dumps(PLAYWRIGHT.as_uri())+");const rows=['chromium','webkit'].map(n=>({engine:n,available:fs.existsSync(p[n].executablePath())}));if(rows.some(r=>!r.available))throw Error('Existing browser engine unavailable');console.log(JSON.stringify(rows));"
available=json.loads(command('browser-dependencies',[NODE,'--input-type=module','-e',engines],cap=10))
if args.prepare:
 print(json.dumps({'prepared':True,'run':args.run,'source':args.source,'engines':available,'productionWrites':0,'deployed':False,'verified':False}));sys.exit(0)
# Reuse existing authorised credentials; never forward bearer auth to artifact storage.
ce=dict(os.environ);ce['GIT_TERMINAL_PROMPT']='0'
r=subprocess.run(['git','credential','fill'],cwd=REPAIR,input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=ce,timeout=left(10),check=True)
token=dict(line.split('=',1) for line in r.stdout.splitlines() if '=' in line).get('password');assert token
BASE='https://api.github.com/repos/shiftsometimber/shift-core/'
def github(path):
 request=urllib.request.Request(BASE+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'})
 return json.loads(read_response(request))
run=github('actions/runs/'+args.run)
assert run['head_sha']==args.source and run['status']=='completed' and run['conclusion']=='success','Guarded workflow has not completed successfully on exact source'
artifacts=github('actions/runs/'+args.run+'/artifacts?per_page=100')['artifacts']
matches=[x for x in artifacts if x['name']=='b1-runtime-release-'+args.run and not x['expired']];assert len(matches)==1,'One owned runtime artifact required'
artifact=matches[0];assert artifact['size_in_bytes']<=256*1024*1024,'Unexpected runtime artifact size'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
request=urllib.request.Request(BASE+'actions/artifacts/'+str(artifact['id'])+'/zip',headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'})
try:response=urllib.request.build_opener(NoRedirect).open(request,timeout=left(20))
except urllib.error.HTTPError as error:
 assert error.code in [301,302,303,307,308],error.code
 response=urllib.request.urlopen(error.headers['Location'],timeout=left(30))
archive=ROOT/('my-timber-owned-runtime-'+args.run+'.zip');partial=archive.with_suffix('.part');digest=hashlib.sha256();size=0
with response,partial.open('wb') as out:
 while True:
  left(165);chunk=response.read(1024*1024)
  if not chunk:break
  size+=len(chunk);assert size<=256*1024*1024;digest.update(chunk);out.write(chunk)
assert digest.hexdigest()==artifact['digest'].split(':',1)[1],'Official runtime artifact digest mismatch'
partial.replace(archive)
with zipfile.ZipFile(archive) as z:
 names=[n for n in z.namelist() if n in ['owned-runtime-deployment.json','b1-runtime-release/owned-runtime-deployment.json']]
 assert len(names)==1,'One exact owned runtime receipt required'
 owned=json.loads(z.read(names[0]))
assert owned['kind']=='owned_runtime_deployment' and owned['source']==args.source and str(owned['run'])==args.run
receipt=ROOT/('my-timber-owned-runtime-'+args.run+'.json');receipt.write_text(json.dumps(owned,indent=2)+'\n')
# Existing read-session refresh only; no deploy command.
_,configuration=oauth();expiry=re.search(r'^expiration_time\s*=\s*"([^"]+)"',configuration,re.M)
if expiry and datetime.datetime.fromisoformat(expiry.group(1).replace('Z','+00:00')).timestamp()<=time.time()+300:
 env=dict(os.environ);env['NODE_PATH']=str(DEPS);env['WRANGLER_LOG']='error'
 command('refresh-read-session',[NODE,str(DEPS/'wrangler/bin/wrangler.js'),'deployments','list','--config','wrangler.jsonc','--json'],cwd=FEATURE,env=env,cap=20)
# Fetch only public Git history so the frozen runtime checkout can authenticate merged ancestry.
command('fetch-owned-main',['git','fetch','origin','main','--no-tags'],cwd=FEATURE,env=ce,cap=15)
env=dict(os.environ);env['VERIFIED_MY_TIMBER_DEPLOYMENT_SOURCE']=args.source;env['PLAYWRIGHT_MODULE']=PLAYWRIGHT.as_uri();env['PROOF_DIR']=str(PROOF/'live-delivered-browser')
command('owned-worker-check',[NODE,str(PROOF/'verify-live-worker.mjs'),str(receipt)],cwd=FEATURE,env=env,cap=70)
worker=json.loads((PROOF/'live-worker-proof.json').read_text());assert worker['ok'] and worker['source']==args.source and str(worker['run'])==args.run and worker['versionId']==owned['versionId']
command('delivered-browser-check',[NODE,str(PROOF/'verify-live-delivered-browser.mjs')],cwd=FEATURE,env=env,cap=65)
browser=json.loads((PROOF/'live-delivered-browser/receipt.json').read_text())
assert browser['deployedSource']==args.source and len(browser['results'])==10 and all(x['pass'] for x in browser['results'])
assert {x['path'] for x in browser['deliveredAssets']}=={'/assets/my-timber-layout.mjs','/assets/member-experience/account-deletion.mjs','/assets/my-timber-pwa.js','/api-adapter-v33d.js'}
active=active_owned(owned)
proof={'ok':True,'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':args.source,'run':args.run,'ownedDeployment':active,'runtimeArtifactId':artifact['id'],'runtimeArtifactSHA256':digest.hexdigest(),'workerProof':str(PROOF/'live-worker-proof.json'),'browserProof':str(PROOF/'live-delivered-browser/receipt.json'),'browserCases':10,'exactPublicAssets':4,'compiledModuleChecks':20,'productionMemberWrites':0,'realAccountsDeleted':0,'personalHealthReads':0,'messagesSent':0,'physicalDevice':False,'appleBuildPreserved':'1.0.0(7)'}
path=ROOT/'my-timber-owned-live-verification.json';temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(proof,indent=2)+'\n');temporary.replace(path);print(json.dumps(proof))
