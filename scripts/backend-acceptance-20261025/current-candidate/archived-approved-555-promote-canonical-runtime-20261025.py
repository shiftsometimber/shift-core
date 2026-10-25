from pathlib import Path
import os,json,re,hashlib,subprocess,urllib.request,datetime,fcntl,sys
C=Path('/Users/shiftsometimberltd/SST/release-four-assertion-repair-20261025');D=C.parent/'release-recovery-evidence-20261024';L=D/'core-local-promotion-20261025'
S='55585365538e22a5893e930bbaf70b8c99069d76';OP='core-local-20261025-approved012-deferral';LOCAL='2026102519371201'
NODE=str(D/'toolchains/node-v22.16.0-darwin-arm64/bin/node');ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6'
stamp=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(name,value):(L/name).write_text(json.dumps(value,indent=2)+'\n')
def cmd(label,args,cap=120,environment=None):
 print('START',label,stamp(),flush=True);r=subprocess.run(args,cwd=C,env=environment or env,capture_output=True,text=True,timeout=cap);(L/(label+'.log')).write_text(r.stdout+r.stderr)
 if r.returncode:raise RuntimeError(label+' failed exit '+str(r.returncode)+'; see '+str(L/(label+'.log')))
 print('PASS',label,stamp(),flush=True);return r.stdout
def checkpoint(state,nextAction,**fields):
 p=D/'recovery-state.json'
 with (D/'recovery-state.update.lock').open('a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX);raw=p.read_bytes();s=json.loads(raw);m=s['releaseCoordination']['singleReleaseManager'];assert m['source']==S
  m['state']=state;m['activeOperation'].update(state=state,updatedAt=stamp(),**fields);m['nextAction']=nextAction;m['nextPermittedAction']=nextAction;s['nextAction']=nextAction;s['updatedAt']=stamp()
  assert p.read_bytes()==raw;t=p.with_suffix('.canonical-promotion.tmp');t.write_text(json.dumps(s,indent=2)+'\n');t.replace(p)
def git(*args):return subprocess.check_output(['git','--no-optional-locks',*args],cwd=C,text=True).strip()
def token():
 cfg=Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text();return re.search(r'^oauth_token\s*=\s*"([^"]+)"',cfg,re.M).group(1)
def cf(path,body=None):
 request=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+path,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Bearer '+token(),'Content-Type':'application/json'})
 d=json.load(urllib.request.urlopen(request,timeout=45));assert d['success'];return d['result']
def active(name='shift-core'):
 d=max(cf('/workers/scripts/'+name+'/deployments')['deployments'],key=lambda r:r['created_on']);assert len(d['versions'])==1 and d['versions'][0]['percentage']==100;return d
def public(path):return subprocess.check_output(['curl','-fsS','--max-time','45','https://shiftsometimber.co.uk'+path])
def stock(phase):
 tables={}
 for table in ['medicine_products','medicine_variants','medicine_inventory']:
  result=cf('/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{'sql':'SELECT * FROM '+table+' ORDER BY '+('variant_id' if table=='medicine_inventory' else 'id')})
  assert result and all(r['success'] for r in result);rows=[x for r in result for x in r.get('results',[])];tables[table]={'rows':len(rows),'sha256':sha(json.dumps(rows,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())}
 value={'phase':phase,'source':S,'tables':tables,'configurationSha256':sha((C/'wrangler.jsonc').read_bytes()),'customerRecordsRead':False,'productionWrites':0,'at':stamp()};save('final-protected-stock-'+phase+'.json',value);return value
env=dict(os.environ);env.update(GITHUB_REF='refs/heads/main',GITHUB_SHA=S,GITHUB_RUN_ID=LOCAL,CLOUDFLARE_ACCOUNT_ID=ACCOUNT,WRANGLER_SEND_METRICS='false',CI='true',PATH=str(Path(NODE).parent)+':'+env.get('PATH',''))
try:
 proof=json.loads((L/'canonical-client-build-repair-proof.json').read_text());assert proof['ok'] and proof['source']==S and len(proof['tests'])==7 and all(x['passed'] for x in proof['tests'])
 build=L/'canonical-client-runtime/worker.js';assert sha(build.read_bytes())==proof['repairedBundleSHA256']
 assert git('rev-parse','HEAD')==S and git('rev-parse','HEAD^{tree}')=='04554f2d18bda99982fb1ed6c7cc29d63b633d51' and not git('diff','--name-only','HEAD','--') and not git('diff','--cached','--name-only','--')
 observedMain=git('ls-remote','origin','refs/heads/main').split()[0];assert observedMain=='a7b63f7eec6319538a5ab237ca6a4ca062c58441'
 save('frozen-release-authority.json',{'source':S,'approval':'Matt explicitly approved this exact frozen local release and012 deferral; subsequent Yes retained authority for the evidenced canonical serialization repair.','currentMain':observedMain,'sourceCurrentAtOriginalDeploymentAdmission':'2026-10-25T19:47:25Z','laterGuardOnlyMerge':'PR1433 at19:47:32Z, after admission. Preserved; not claimed qualified or deployed by this operation.','maintenanceRetry':'Same frozen approved release; native source, current provider ownership and rollback guards retained. No absorption of unrelated later source.','at':stamp()})
 # Read the cancellation results, with the same existing Git credential.
 cred=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,check=True);gh=dict(x.split('=',1) for x in cred.stdout.splitlines() if '=' in x)['password']
 for run in [40208490258,40227701542]:
  req=urllib.request.Request('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs/'+str(run),headers={'Authorization':'Bearer '+gh,'Accept':'application/vnd.github+json'});r=json.load(urllib.request.urlopen(req,timeout=30));assert r['status']=='completed' and r['conclusion']=='cancelled'
 before=active();assert before['versions']==[{'version_id':'ac4e60d9-6f40-4bd5-a96f-83d6108dd716','percentage':100}];save('final-deployment-before.json',before)
 names=['shift-programme-member-20261023','shift-hq-member-comms-20261023'];external={n:active(n) for n in names};layout=sha(public('/assets/my-timber-layout.mjs'));print('CAPTURED_LATEST_EXTERNALLY_DEPLOYED_LAYOUT',layout,flush=True)
 save('independent-deployments-before.json',external);save('independent-public-layout-before.json',{'sha256':layout});stockBefore=stock('before')
 cmd('final-native-source-authority',[NODE,'--input-type=module','-e',"import assert from 'node:assert/strict';import{sourceAuthority}from'./release/verified-source-evidence-20261016.mjs';import{qualifyJoinedSuccessor}from'./release/my-timber-joined-look-scope-20261024.mjs';const a=sourceAuthority(),p=qualifyJoinedSuccessor();assert.equal(p.actualHead,process.env.GITHUB_SHA);assert.deepEqual(sourceAuthority(),a);console.log(JSON.stringify({source:a.head,tree:a.tree,paths:p.paths.length}));"],cap=60)
 checkpoint('CANONICAL_RUNTIME_UPLOAD_IN_PROGRESS','Stage and authenticate the source-equivalent repaired version, then promote it once and finish live acceptance.',frozenSource=S,compatibilityOwnershipId=LOCAL,buildSHA256=proof['repairedBundleSHA256'])
 # Version upload creates no traffic or trigger/route changes. Never repeat after unknown outcome.
 out=cmd('canonical-version-upload',[NODE,'node_modules/wrangler/bin/wrangler.js','versions','upload',str(build),'--no-bundle','--config','wrangler.jsonc','--tag','core-5558-canonical-20261025','--message','Approved frozen555 Core build repair; preserve exact native client bytes and independent presentations'],cap=180)
 ids=re.findall(r'(?:Worker )?Version ID:\s*([a-f0-9-]{36})',out);assert len(set(ids))==1,'Upload receipt ambiguous; reconcile before retry';version=ids[0];save('staged-provider-version.json',{'id':version,'source':S,'operation':OP,'sha256':proof['repairedBundleSHA256'],'uploadedAt':stamp(),'serving':False})
 data=cf('/workers/workers/shift-core/versions/'+version+'?include=modules');assert data['id']==version
 import base64
 module=b''.join(base64.b64decode(m['content_base64']) for m in data['modules'] if m['name'].endswith(('.mjs','.js')));assert sha(module)==proof['repairedBundleSHA256']
 assert active()['id']==before['id'] and {n:active(n) for n in names}==external
 runtime=C/'b1-runtime-release'
 old=runtime/'owned-runtime-deployment.json'
 if old.exists():save('first-failed-upload-owned-receipt.json',json.loads(old.read_text()))
 rollback=runtime/'rollback.json'
 if rollback.exists():save('first-failed-upload-rollback.json',json.loads(rollback.read_text()));rollback.unlink()
 (C/'deployment-before.json').write_text(json.dumps([before],indent=2)+'\n')
 checkpoint('CANONICAL_RUNTIME_PROMOTION_IN_PROGRESS','Follow this exact staged version through its owned provider receipt and original live acceptance.',stagedVersion=version,previousDeployment=before['id'])
 cmd('canonical-version-promote',[NODE,'node_modules/wrangler/bin/wrangler.js','versions','deploy',version+'@100%','--yes','--config','wrangler.jsonc','--message','Matt-approved555 Core release with canonical client serialization repair;012 explicitly deferred'],cap=120)
 a=active();assert a['versions']==[{'version_id':version,'percentage':100}]
 owned={'kind':'owned_runtime_deployment','at':stamp(),'source':S,'run':LOCAL,'deploymentId':a['id'],'versionId':version,'previousDeploymentId':before['id'],'previousVersionId':before['versions'][0]['version_id'],'dataRestored':False,'operationKind':'guarded_local_promotion','operation':OP,'githubRun':None,'historicalSourceRun':40208490258,'source012Status':'Deferred with explicit Matt approval; incomplete, not passed','buildSHA256':proof['repairedBundleSHA256'],'baseQualifiedBundleSHA256':proof['baseBundleSHA256'],'canonicalClientSHA256':proof['nativeClientSHA256'],'buildRepairProof':str(L/'canonical-client-build-repair-proof.json'),'ownershipEvidence':'Exact ID returned by versions upload, downloaded module SHA verified before traffic; versions deploy of that exact ID, then authenticated one100% provider receipt. Existing triggers/routes preserved.'}
 save('owned-runtime-deployment.json',owned);(runtime/'owned-runtime-deployment.json').write_text(json.dumps(owned,indent=2)+'\n')
 env['CLOUDFLARE_API_TOKEN']=token();cmd('final-query-log-redaction',[NODE,'release/query-log-redaction.mjs'],cap=60);save('query-log-redaction.json',json.loads((runtime/'query-log-redaction.json').read_text()))
 assert {n:active(n) for n in names}==external
 assert sha(public('/assets/my-timber-layout.mjs'))==layout,'Independent presentation bytes changed'
 stockAfter=stock('after');assert stockAfter['tables']==stockBefore['tables'] and stockAfter['configurationSha256']==stockBefore['configurationSha256']
 save('protected-stock-preservation.json',{'ok':True,'before':stockBefore,'after':stockAfter});save('independent-deployment-preservation.json',{'ok':True,'deployments':external,'layoutSha256':layout,'writesByThisOperation':0})
 checkpoint('DEPLOYED_LIVE_ACCEPTANCE_IN_PROGRESS','Finish the original affected Core live checks against the exact owned canonical build.',deployed=True,providerReceipt=owned,source012Status='Deferred')
 cmd('public-tool-owned-deployment',[NODE,'release/tool-schema-gate.mjs','deploy'],cap=120)
 worker=C.parent/'builds/apple-completion-20261024/immediate-deletion-proof/verify-live-worker.mjs';ve=dict(env);ve['VERIFIED_MY_TIMBER_DEPLOYMENT_SOURCE']=S
 cmd('owned-compiled-runtime',[NODE,str(worker),str(L/'owned-runtime-deployment.json')],environment=ve,cap=120)
 assert active()['id']==owned['deploymentId']
 save('deployment-and-core-guards.json',{'ok':True,'source':S,'owned':owned,'stockPreserved':True,'queryRedactionEnabled':True,'independentDeploymentsPreserved':True,'group012':'Deferred','at':stamp()})
 print('DEPLOYED_GUARDS_PASSED',json.dumps({'source':S,'versionId':version,'deploymentId':a['id'],'buildSHA256':proof['repairedBundleSHA256']}),flush=True)
except Exception as e:
 save('canonical-promotion-failure.json',{'at':stamp(),'error':str(e),'source':S,'operation':OP});checkpoint('CANONICAL_PROMOTION_SPECIFIC_REPAIR_REQUIRED','Inspect actual provider outcome and this specific failure before any retry.',error=str(e));print('FAILED',str(e),flush=True);raise
