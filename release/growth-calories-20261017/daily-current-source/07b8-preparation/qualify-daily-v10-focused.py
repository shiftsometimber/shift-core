from pathlib import Path
import subprocess,os,time,signal,json,hashlib,re,datetime,collections
R=Path('/Users/shiftsometimberltd/SST/organic-deploy-20261017'); root=R/'daily-only-core526-v10-private'
head='07b8d194d21e5727610828a9c28220edb2cc72b1'; tree='100ea846b4f626ea267664d634a78eb8673b6596'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def g(*a):
 result=subprocess.run(['/usr/bin/git','-C',str(root),*a],capture_output=True)
 if result.returncode==1 and a==('show-ref',):return ''
 result.check_returncode();return result.stdout.decode().strip()
def snap():
 untracked=g('ls-files','--others','--exclude-standard').splitlines()
 unexpected=[p for p in untracked if not p.startswith('node_modules/')]
 assert not unexpected,('Unexpected untracked source',unexpected[:20])
 tools=['package-lock.json','node_modules/esbuild/package.json','node_modules/esbuild/lib/main.js','node_modules/wrangler/package.json','node_modules/@esbuild/darwin-arm64/bin/esbuild']
 fingerprints={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in tools if (root/p).is_file()}
 assert len(fingerprints)>=4,'Pinned compiler dependencies required'
 return {'head':g('rev-parse','HEAD'),'tree':g('rev-parse','HEAD^{tree}'),'status':g('status','--porcelain=v1','--untracked-files=no'),'installedToolingSHA256':fingerprints,'untrackedSourceOutsideInstalledTooling':unexpected,'geometry':{s:hashlib.sha256((root/'.git'/s).read_bytes()).hexdigest() if (root/'.git'/s).is_file() else None for s in ['HEAD','index','config','packed-refs','FETCH_HEAD','objects/info/alternates','commondir']},'refs':g('show-ref')}
core_base=Path('/Users/shiftsometimberltd/SST/gp-current-acceptance-20261016-4a7e693a/accepted-utility-main-20261017')
core_native=json.loads((core_base/'growth-adoption-526-original-qualification-native510-result.json').read_text())
assert core_native['status']=='PASS' and core_native['source']=='526b0b2e47bb768d910ba329a3f10bd110199412' and all(core_native['checks'].values()),'Finish the actual shared Core Native before focused engine execution'
assert core_native['cleanup']['ownedProcessGroupEmpty'],'Actual shared Native process cleanup required'
claim=R/'daily-v10-qualification-claim.json'
with claim.open('x') as f:json.dump({'at':now(),'controller':os.getpid(),'source':head,'reason':'Existing07b8 private candidate preserves shared526 adoption repair and all six runtime payload blobs. Its private inner current-head guard already delegates to the exact outer frame; collapse only the two additional consecutive outer calls around it, retaining that original inner guard, every read entry/exit check, callbacks, native freshness, strict decoder, whole-source inverses and caps. No cache or weakened caller path. Prior4e Native remains failed; fresh focused and full Native must actually pass. Do not overlap Core Native; this script asserts its genuine terminalPASS before spawning.'},f)
before=snap();assert before['head']==head and before['tree']==tree and not before['status']
(R/'daily-v10-source-before.json').write_text(json.dumps(before,indent=2))
for label,cap,files in [('focused',180,['tests/coding-completion-scope-20261016.test.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs'])]:
 command=['/usr/local/bin/node','--test','--test-reporter=tap',*files];log=R/('daily-v10-'+label+'.tap');start=time.monotonic();at=now();timeout=False;signals=[]
 with log.open('w') as out:
  proc=subprocess.Popen(command,cwd=root,stdout=out,stderr=subprocess.STDOUT,start_new_session=True,env={**os.environ,'PATH':'/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'})
  (R/'daily-v10-qualification-running.json').write_text(json.dumps({'at':at,'stage':label,'controller':os.getpid(),'pid':proc.pid,'pgid':proc.pid,'head':head,'capSeconds':cap,'command':command},indent=2))
  try:code=proc.wait(timeout=cap)
  except subprocess.TimeoutExpired:timeout=True;os.killpg(proc.pid,signal.SIGTERM);signals.append('TERM');code=proc.wait(timeout=5)
 cleanup_method='signal-probe'
 try:os.killpg(proc.pid,0);group_empty=False
 except ProcessLookupError:group_empty=True
 except PermissionError:
  rows=subprocess.check_output(['/bin/ps','-axo','pid,pgid,uid,ppid,command']).decode().splitlines()
  members=[row for row in rows if len(row.split())>2 and row.split()[1]==str(proc.pid)]
  group_empty=not members;cleanup_method='read-only-process-inventory-after-EPERM'
 if not group_empty:
  # Never signal an ambiguous/foreign group after the owned leader exited.
  if cleanup_method!='signal-probe':
   (R/('daily-v10-'+label+'-cleanup-blocked.json')).write_text(json.dumps({'at':now(),'status':'FAILED_AMBIGUOUS_GROUP','pid':proc.pid,'members':members,'source':head},indent=2));raise SystemExit('STOP: retain ambiguous group; no foreign signal')
  os.killpg(proc.pid,signal.SIGTERM);signals.append('TERM');time.sleep(.3)
  try:os.killpg(proc.pid,0);os.killpg(proc.pid,signal.SIGKILL);signals.append('KILL')
  except ProcessLookupError:pass
  time.sleep(.2)
  rows=subprocess.check_output(['/bin/ps','-axo','pid,pgid,uid,ppid,command']).decode().splitlines()
  group_empty=not [row for row in rows if len(row.split())>2 and row.split()[1]==str(proc.pid)]
 elapsed=time.monotonic()-start;text=log.read_text();counts={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)};after=snap();baseline_preserved=None
 if label=='native':
  b=Path('/Users/shiftsometimberltd/SST/gp-current-acceptance-20261016-4a7e693a/accepted-utility-main-20261017/selected073-original-qualification-native510.tap')
  assert b.exists(),str(b)
  names=lambda s:collections.Counter(re.findall(r'^# Subtest: (.+)$',s,re.M));required=names(b.read_text());actual=names(text);baseline_preserved=all(actual[k]>=v for k,v in required.items())
 passed=code==0 and not timeout and counts.get('tests',0)>0 and counts.get('tests')==counts.get('pass') and all(counts.get(x)==0 for x in ['fail','cancelled','skipped','todo']) and after==before and group_empty and baseline_preserved is not False
 result={'at':now(),'startedAt':at,'stage':label,'head':head,'tree':tree,'command':command,'capSeconds':cap,'seconds':elapsed,'exit':code,'timedOut':timeout,'counts':counts,'sourceUnchanged':after==before,'ownedGroupEmpty':group_empty,'cleanupMethod':cleanup_method,'signals':signals,'baseline510NamesPreserved':baseline_preserved,'logSHA256':hashlib.sha256(log.read_bytes()).hexdigest(),'passed':passed,'deployment':False,'modelCalls':0}
 (R/('daily-v10-'+label+'-result.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
 if not passed:raise SystemExit('STOP: original qualification failed; no automatic retry or deployment')
print('FOCUSED SOURCE FRAME PASS ONLY; full Native and hosted gates remain required',flush=True)
