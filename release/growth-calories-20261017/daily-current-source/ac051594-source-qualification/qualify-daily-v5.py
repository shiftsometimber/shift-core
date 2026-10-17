from pathlib import Path
import subprocess,os,time,signal,json,hashlib,re,datetime,collections
R=Path('/Users/shiftsometimberltd/SST/organic-deploy-20261017'); root=R/'daily-only-073-v5-private'
head='ac05159419ac4a4244215d968715d5160bf7bdf9'; tree='799cb1fee7e6e30f0a1a18273fc7188200d6fe6c'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def g(*a):return subprocess.check_output(['/usr/bin/git','-C',str(root),*a]).decode().strip()
def snap():return {'head':g('rev-parse','HEAD'),'tree':g('rev-parse','HEAD^{tree}'),'status':g('status','--porcelain=v1','--untracked-files=all'),'geometry':{s:hashlib.sha256((root/'.git'/s).read_bytes()).hexdigest() if (root/'.git'/s).is_file() else None for s in ['HEAD','index','config','packed-refs','FETCH_HEAD','objects/info/alternates','commondir']},'refs':g('show-ref')}
claim=R/'daily-v5-qualification-claim.json'
with claim.open('x') as f:json.dump({'at':now(),'controller':os.getpid(),'source':head,'reason':'Construction stays inside existing bounded immutable proof, with fresh actual native entry/exit checks; unchanged runtime payload and qualification commands/caps. Returned-reader expiry regression added. Shared source untouched.'},f)
before=snap();assert before['head']==head and before['tree']==tree and not before['status']
for label,cap,files in [('focused',180,['tests/coding-completion-scope-20261016.test.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs']),('native',1200,['tests/food-diary-london-date-stack-20261015.test.mjs','tests/seo-audit-scope-20261016.test.mjs'])]:
 command=['/usr/local/bin/node','--test','--test-reporter=tap',*files];log=R/('daily-v5-'+label+'.tap');start=time.monotonic();at=now();timeout=False;signals=[]
 with log.open('w') as out:
  proc=subprocess.Popen(command,cwd=root,stdout=out,stderr=subprocess.STDOUT,start_new_session=True,env={**os.environ,'PATH':'/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'})
  (R/'daily-v5-qualification-running.json').write_text(json.dumps({'at':at,'stage':label,'controller':os.getpid(),'pid':proc.pid,'pgid':proc.pid,'head':head,'capSeconds':cap,'command':command},indent=2))
  try:code=proc.wait(timeout=cap)
  except subprocess.TimeoutExpired:timeout=True;os.killpg(proc.pid,signal.SIGTERM);signals.append('TERM');code=proc.wait(timeout=5)
 try:os.killpg(proc.pid,0);group_empty=False
 except ProcessLookupError:group_empty=True
 if not group_empty:
  os.killpg(proc.pid,signal.SIGTERM);signals.append('TERM');time.sleep(.3)
  try:os.killpg(proc.pid,0);os.killpg(proc.pid,signal.SIGKILL);signals.append('KILL')
  except ProcessLookupError:pass
  time.sleep(.2)
  try:os.killpg(proc.pid,0);group_empty=False
  except ProcessLookupError:group_empty=True
 elapsed=time.monotonic()-start;text=log.read_text();counts={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)};after=snap();baseline_preserved=None
 if label=='native':
  b=Path('/Users/shiftsometimberltd/SST/gp-current-acceptance-20261016-4a7e693a/accepted-utility-main-20261017/selected073-original-qualification-native510.tap')
  assert b.exists(),str(b)
  names=lambda s:collections.Counter(re.findall(r'^# Subtest: (.+)$',s,re.M));required=names(b.read_text());actual=names(text);baseline_preserved=all(actual[k]>=v for k,v in required.items())
 passed=code==0 and not timeout and counts.get('tests',0)>0 and counts.get('tests')==counts.get('pass') and all(counts.get(x)==0 for x in ['fail','cancelled','skipped','todo']) and after==before and group_empty and baseline_preserved is not False
 result={'at':now(),'startedAt':at,'stage':label,'head':head,'tree':tree,'command':command,'capSeconds':cap,'seconds':elapsed,'exit':code,'timedOut':timeout,'counts':counts,'sourceUnchanged':after==before,'ownedGroupEmpty':group_empty,'signals':signals,'baseline510NamesPreserved':baseline_preserved,'logSHA256':hashlib.sha256(log.read_bytes()).hexdigest(),'passed':passed,'deployment':False,'modelCalls':0}
 (R/('daily-v5-'+label+'-result.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
 if not passed:raise SystemExit('STOP: original qualification failed; no automatic retry or deployment')
print('FULL CHANGED-SOURCE NATIVE QUALIFICATION PASS; hosted gates and guarded production remain required',flush=True)
