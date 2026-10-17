from pathlib import Path
import subprocess,os,time,signal,json,hashlib,re,datetime,collections
R=Path('/Users/shiftsometimberltd/SST/organic-deploy-20261017'); root=R/'daily-only-core7b4-v9-private'
head='4e34ef53e8ec0a1b4ec50371be94465e066f60dd'; tree='4d37537549f551d8798705993999c7ad97ecf35e'
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
finite=json.loads((core_base/'public-tool-7b4-native-complete-original-qualification-finite10-result.json').read_text())
assert finite['status']=='PASS' and all(finite['checks'].values()),'Existing shared Core finite job must genuinely finish first'
assert finite['cleanup']['ownedProcessGroupEmpty'],'Retain actual resource coordination'
assert json.loads((R/'daily-v9-focused-result.json').read_text())['passed']
assert snap()==json.loads((R/'daily-v9-source-before.json').read_text()),'Preserve exact focused qualification source and tooling frame'
claim=R/'daily-v9-native-qualification-claim.json'
with claim.open('x') as f:json.dump({'at':now(),'controller':os.getpid(),'source':head,'reason':'d18 Native failed1200seconds despite corrected pinned setup. Restore original strict per-proof native decoder batch in outer coding frame instead of v6 individual expected reads; preserve v7 actual raw-head/callback authentication, all40 tests, original kernel/decoder, all old-source inverses and caps, exact six runtime payloads. No full Native will overlap current shared Core finite10. This focused run checks only the changed frame; it is not full qualification.'},f)
before=snap();assert before['head']==head and before['tree']==tree and not before['status']
(R/'daily-v9-native-source-before.json').write_text(json.dumps(before,indent=2))
for label,cap,files in [('native',1200,['tests/food-diary-london-date-stack-20261015.test.mjs','tests/seo-audit-scope-20261016.test.mjs'])]:
 command=['/usr/local/bin/node','--test','--test-reporter=tap',*files];log=R/('daily-v9-'+label+'.tap');start=time.monotonic();at=now();timeout=False;signals=[]
 with log.open('w') as out:
  proc=subprocess.Popen(command,cwd=root,stdout=out,stderr=subprocess.STDOUT,start_new_session=True,env={**os.environ,'PATH':'/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'})
  (R/'daily-v9-qualification-running.json').write_text(json.dumps({'at':at,'stage':label,'controller':os.getpid(),'pid':proc.pid,'pgid':proc.pid,'head':head,'capSeconds':cap,'command':command},indent=2))
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
   (R/('daily-v9-'+label+'-cleanup-blocked.json')).write_text(json.dumps({'at':now(),'status':'FAILED_AMBIGUOUS_GROUP','pid':proc.pid,'members':members,'source':head},indent=2));raise SystemExit('STOP: retain ambiguous group; no foreign signal')
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
  focused_names=set(re.findall(r'^# Subtest: (.+)$',(R/'daily-v9-focused.tap').read_text(),re.M))
  csv_source=(root/'member-experience/tests/weight-import-mapping-ui.test.mjs').read_text()
  csv_names=set(re.findall(r"^test\('([^']+)'",csv_source,re.M))
  assert len(csv_names)==4 and len(focused_names)==40,'Exact existing focused command provenance required'
  owned_names=focused_names-csv_names
  assert len(owned_names)==36,'All36 actual coding-frame cases, including generated cases, required'
  baseline_preserved=baseline_preserved and all(actual[k]>=1 for k in owned_names)
 passed=code==0 and not timeout and counts.get('tests',0)>0 and counts.get('tests')==counts.get('pass') and all(counts.get(x)==0 for x in ['fail','cancelled','skipped','todo']) and after==before and group_empty and baseline_preserved is not False
 result={'at':now(),'startedAt':at,'stage':label,'head':head,'tree':tree,'command':command,'capSeconds':cap,'seconds':elapsed,'exit':code,'timedOut':timeout,'counts':counts,'sourceUnchanged':after==before,'ownedGroupEmpty':group_empty,'cleanupMethod':cleanup_method,'signals':signals,'baseline510NamesPreserved':baseline_preserved,'logSHA256':hashlib.sha256(log.read_bytes()).hexdigest(),'passed':passed,'deployment':False,'modelCalls':0}
 (R/('daily-v9-'+label+'-result.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
 if not passed:raise SystemExit('STOP: original qualification failed; no automatic retry or deployment')
print('FULL NATIVE SOURCE QUALIFICATION PASS; remaining exact-head hosted/production/live gates still required',flush=True)
