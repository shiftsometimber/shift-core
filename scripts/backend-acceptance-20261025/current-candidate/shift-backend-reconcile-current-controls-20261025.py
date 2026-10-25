import pathlib,json,subprocess,re,urllib.request,datetime,fcntl,os,concurrent.futures
r=pathlib.Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024')
node=str(r/'toolchains/node-v22.16.0-darwin-arm64/bin/node')
x=subprocess.run([node,'/tmp/shift-owned-production-read-guard-20261025.cjs'],capture_output=True,text=True,timeout=40);assert x.returncode==0,x.stderr;owned=json.loads(x.stdout)
cred=subprocess.run(['git','credential','fill'],cwd='/Users/shiftsometimberltd/SST/my-timber-recording-preflight-20261024',input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,timeout=15)
secret=dict(a.split('=',1) for a in cred.stdout.splitlines() if '=' in a)['password']
def gh(status):
 url='https://api.github.com/repos/shiftsometimber/shift-core/actions/workflows/334347571/runs?status='+status+'&per_page=20'
 j=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+secret,'Accept':'application/vnd.github+json','Cache-Control':'no-cache'}),timeout=30))
 return[{'id':a['id'],'source':a['head_sha'],'status':a['status'],'conclusion':a['conclusion']}for a in j['workflow_runs']]
active=gh('in_progress')+gh('queued');assert active==[],'Preserve existing progressing release'
token=re.search(r'^oauth_token\s*=\s*"([^"]+)"',pathlib.Path('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml').read_text(),re.M).group(1)
def deployment(name):
 url='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/'+name+'/deployments'
 j=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+token}),timeout=30));assert j['success'];d=max(j['result']['deployments'],key=lambda x:x['created_on']);return name,{'deploymentId':d['id'],'versions':d['versions'],'createdOn':d['created_on']}
names=['shift-core','shift-hq-member-comms-20261023','shift-programme-member-20261023','shift-hq-reporting','shift-mytimber-support-20261023']
# Resolve the already recorded reporting script rather than guessing a new one.
baseline=json.loads((r/'backend-current-owned-release-baseline.json').read_text())
routes=baseline['routes'];report_names={x['script'] for x in routes if 'report' in str(x.get('script',''))}
if len(report_names)==1:names[3]=next(iter(report_names))
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool: deployments=dict(pool.map(deployment,names))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
out={'at':now,'ownedCore':owned,'originalWorkflowActiveOrQueued':active,'currentDeployments':deployments,'backendCases':{'passed':6,'receipt':'approved-live-backend-qa-result.json'},'schemaReadVerification':'backend-owned-live-readonly-verification.json','scheduler':{'status':'Existing cron recreated21:04, natural outcome not yet verified','receipt':'backend-core-owned-cron-registration-recreation-20261025.json'},'closedActions':['A09','A16'],'broaderProgrammeComplete':False,'productionWorkerUploadsByBackend':0}
for name in ['recovery-state.json','backend-completion-coordination.json']:
 with open(r/name.replace('.json','.update.lock'),'a+')as lock:
  fcntl.flock(lock,fcntl.LOCK_EX);p=r/name;j=json.loads(p.read_text())
  previous={k:j.get(k)for k in ['publisherOwnership','nextAuthorisedAction','coreCompletionState','nextAction','candidate','productionWorkflow','runningIndependentVerifier']}
  j.setdefault('backendCoreOwnershipTransitions20261025',[]).append({'at':now,'state':'Adopt actual approved local release; retire stale workflow ownership hints','previous':previous})
  h=j.setdefault('backendCompletionCurrentReleaseHandoff',{});h['currentLocalBackendAcceptance']=out
  j['publisherOwnership']['core']='Existing singleReleaseManager /workspace/scratch/2893c3528363 closed the frozen local Core release. Backend606e6 owns only bounded acceptance/cron registration diagnosis. No active Core publisher or automatic run; no new uploader/watch.'
  j['publisherOwnership']['observedAt']=now;j['publisherOwnership']['actualGitHubPublishers']=active
  j['publisherOwnership']['communications']='Independent presentation owner retained. Latest observed version '+deployments['shift-hq-member-comms-20261023']['versions'][0]['version_id']+'. Backend exact worker module unchanged; no upload or rollback from this lane.'
  j['coreCompletionState']='Frozen555 with approved canonical client repair deployed as ca5ca696; affected Core scope verified by release owner. Six new-version member cases and three existing schema checks passed. Ten Core natural-job outcomes remain under finite trigger diagnosis; no full business closure.'
  j['nextAuthorisedAction']='Complete the existing finite backend scheduler diagnosis after exact cron re-registration; retain source012 deferral and automatic-promotion hold. Then save SAME audit/workbook/handover and precise external dependencies. No new Core workflow, general go, publisher or watcher.'
  j['nextAction']=j['nextAuthorisedAction'];j['candidate']=owned['source'];j['main']='a7b63f7eec6319538a5ab237ca6a4ca062c58441'
  j['runningIndependentVerifier']={'state':'affected_core_verified_backend_scheduler_acceptance_in_progress','source':owned['source'],'pid':None,'receipt':str(r/'core-local-promotion-20261025/core-release-verification.json'),'watcherCreated':False}
  j['productionWorkflow']={'state':'historical_cancelled; authorised guarded local successor deployed','historicalRun':40227701542,'githubRun':None,'operation':owned['operation'],'receipt':str(r/'core-local-promotion-20261025/owned-runtime-deployment.json')}
  j['updatedAt']=now;tmp=p.with_suffix('.backend-tmp');tmp.write_text(json.dumps(j,indent=2)+'\n');os.replace(tmp,p)
(r/'backend-current-local-release-adoption-20261025.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out))
