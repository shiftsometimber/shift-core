import subprocess,pathlib,json,urllib.request,datetime,email.utils,re,time
root=pathlib.Path('/Users/shiftsometimberltd/SST/release-recovery-evidence-20261024')
r=subprocess.run(['git','credential','fill'],cwd='/Users/shiftsometimberltd/SST/my-timber-recording-preflight-20261024',input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,check=True,timeout=15)
token=dict(x.split('=',1) for x in r.stdout.splitlines() if '=' in x)['password']
req=urllib.request.Request('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/121214546905',headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Cache-Control':'no-cache','Pragma':'no-cache'})
with urllib.request.urlopen(req,timeout=25) as f:d=json.load(f)
row={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'run':40208490258,'source':d.get('head_sha'),'job':d['id'],'status':d['status'],'conclusion':d['conclusion'],'active':[s for s in d['steps'] if s['status']=='in_progress'],'failed':[s for s in d['steps'] if s.get('conclusion')=='failure'],'successfulSteps':len([s for s in d['steps'] if s.get('conclusion')=='success'])}
js=pathlib.Path('/tmp/shift-current-release-child-read.js').read_text()
a='tell application "Safari"\nset outputText to "["\nset isFirst to true\nrepeat with w in windows\nrepeat with i from 1 to count of tabs of w\nset t to tab i of w\nif URL of t contains "40208490258/job/121214546905" then\nset x to do JavaScript '+json.dumps(js)+' in t\nif isFirst is false then set outputText to outputText & ","\nset outputText to outputText & "{\\"windowId\\":" & (id of w as text) & ",\\"tabIndex\\":" & (i as text) & ",\\"value\\":" & x & "}"\nset isFirst to false\nend if\nend repeat\nend repeat\nreturn outputText & "]"\nend tell'
def surfaces_read():
 r=subprocess.run(['osascript','-e',a],text=True,capture_output=True,timeout=25)
 if r.returncode:raise RuntimeError('Existing source view read failed: '+r.stderr[:200])
 return json.loads(r.stdout)
def latest(s):return max((email.utils.parsedate_to_datetime(x['at']).timestamp() for x in s['value'].get('progress',[]) if x.get('at')),default=0)
try:
 surfaces=surfaces_read();best=max(surfaces,key=latest);row['sourceViewActivated']=False
 if latest(best)>0 and time.time()-latest(best)>90 and any(x['number']==7 for x in row['active']):
  w=int(best['windowId']);i=int(best['tabIndex'])
  focus=f'''tell application "Safari"
set t to tab {i} of window id {w}
if URL of t does not contain "40208490258/job/121214546905" then error "Existing source tab changed"
set index of window id {w} to 1
activate
set current tab of window id {w} to t
do JavaScript "document.querySelector('#check-step-7').open=true; [...document.querySelectorAll('.js-check-step-line')].at(-1)?.scrollIntoView();" in t
end tell'''
  q=subprocess.run(['osascript','-e',focus],text=True,capture_output=True,timeout=20)
  row['sourceViewActivated']=q.returncode==0
  if q.returncode==0:time.sleep(2);surfaces=surfaces_read();best=max(surfaces,key=latest)
 commands={}
 # Preserve already observed child receipts only for this exact run/source/job.
 for historyPath in [root/'current320-child-progress-latest.json',root/'backend-current-555853-source-child-evidence-20261025.json']:
  try:
   history=json.loads(historyPath.read_text())
   if history.get('run')==row['run'] and history.get('source')==row['source'] and history.get('job')==row['job']:
    prior=history.get('childEvidence',{}).get('retainedCommandRows',history.get('childEvidence',{}).get('commands',history.get('lastCommands',[])))
    for x in prior:commands[(x['at'],x['text'])]=x
  except (FileNotFoundError,ValueError,KeyError,TypeError):pass
 for s in surfaces:
  for x in s['value'].get('commands',[]):commands[(x['at'],x['text'])]=x
 merged=sorted(commands.values(),key=lambda x:email.utils.parsedate_to_datetime(x['at']).timestamp())
 outcomes=[re.search(r'command-finished (production-step-\d+).*?status=(\w+) exitCode=([^ ]+)',x['text']) for x in merged];outcomes=[x.groups() for x in outcomes if x]
 row['childEvidence']={'observedPassedIds':sorted(set(x[0] for x in outcomes if x[1]=='passed' and x[2]=='0')),'observedFailed':[list(x) for x in outcomes if x[1]!='passed' or x[2]!='0'],'commands':merged[-16:],'retainedCommandRows':merged,'progress':best['value'].get('progress',[]),'freshestSurface':{k:best[k] for k in ['windowId','tabIndex']},'surfaces':[{'windowId':s['windowId'],'tabIndex':s['tabIndex'],'latestChildEvidenceEpoch':latest(s)} for s in surfaces],'snapshotLagSeconds':round(time.time()-latest(best),1) if latest(best) else None}
except Exception as e:row['childEvidenceError']=str(e)[:700]
(root/'current320-child-progress-latest.json').write_text(json.dumps(row,indent=2)+'\n')
child=row.get('childEvidence',{});sourceStep=next((s for s in d['steps'] if s['number']==7),{})
print(json.dumps({'at':row['at'],'run':row['run'],'source':row['source'],'status':row['status'],'conclusion':row['conclusion'],'activeSteps':[{'number':s['number'],'name':s['name']} for s in row['active']],'failedSteps':row['failed'],'sourceStepStatus':sourceStep.get('status'),'sourceStepConclusion':sourceStep.get('conclusion'),'observedSourcePassCount':len(child.get('observedPassedIds',[])),'observedSourceFailures':child.get('observedFailed'),'latestChildSnapshot':child.get('progress',[None])[0] if child.get('progress') else None,'childSnapshotLagSeconds':child.get('snapshotLagSeconds'),'existingSourceViewActivated':row.get('sourceViewActivated'),'diagnosticError':row.get('childEvidenceError')}))
