from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-tools-audit-20261003');src=Path('/private/tmp/shift-faq-final-closeout-20261003/pages');out=root/'pages'
fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='e54133661ab9ffb8961adbd0a1e8e8a3687b3fb17a014856c2daf5b74485791a'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changed=[]
def edit(rel,edits):
 p=out/rel;s=p.read_text()
 for a,b in edits:
  assert s.count(a)==1,(rel,a,s.count(a));s=s.replace(a,b)
 p.write_text(s);changed.append(rel)
app=(out/'app.js').read_text()
start=app.index('total>14?');end=app.index(",[['NHS alcohol guidance'",start)
alcohol=app[start:end]
edit('app.js',[(alcohol,"`This is the total for the drinks you entered, not an assessment of your drinking over a week. The UK guideline is no more than 14 units a week regularly, spread across at least three days if drinking that much; it is not an allowance for one occasion. If you get withdrawal symptoms, seek medical help before reducing or stopping.`"),("let fmt=x=>`${Math.floor(x/14)} st ${Math.round(x%14)} lb`","let fmt=x=>{const pounds=Math.round(x);return `${Math.floor(pounds/14)} st ${pounds%14} lb`}")])
edit('tools/walking.html',[
 ('NHS guidance says brisk walking counts toward the recommended of moderate activity per week.','NHS guidance recommends at least 150 minutes of moderate-intensity activity a week for adults aged 19 to 64; brisk walking can contribute to that total.'),
 *[(m.group(0),m.group(1)+m.group(2)+' minutes</option>') for m in re.finditer(r'(<option[^>]*value="(\d+)"[^>]*>)</option>',(out/'tools/walking.html').read_text())],
 ('Last reviewed: 8 August 2026.','Calculator labels and activity guidance checked: 3 October 2026. Original editorial review: 8 August 2026.')
])
edit('tools/sleep.html',[
 ('If you normally need 20–to fall asleep, build that into your bedtime.','Allow for the time you usually take to fall asleep when deciding when to go to bed.'),
 ('Last reviewed: 8 August 2026.','Sleep-planning explanation checked: 3 October 2026. Original editorial review: 8 August 2026.')
])
edit('tools/alcohol.html',[
 ('name="ml" required="" type="number"','name="ml" required="" min="0" step="any" type="number"'),
 ('name="abv" required="" step=".1" type="number"','name="abv" required="" min="0" max="100" step="any" type="number"'),
 ('name="n" required="" type="number"','name="n" required="" min="0" step="1" type="number"'),
 ('Last reviewed: 8 August 2026.','Units, result wording and input validation checked: 3 October 2026. Original editorial review: 8 August 2026.'),
 ('Seek clinical advice rather than using this calculator as a detox plan.','Seek clinical advice rather than using this calculator as a detox plan. <a href="https://www.nhs.uk/conditions/alcohol-use-disorder/" rel="noopener noreferrer">NHS: alcohol dependence and withdrawal</a>.')
])
edit('tools/steps.html',[('name="n" required="" type="number"','name="n" required="" min="0" step="1" type="number"')])
i=json.loads((out/'release-body-integrity.json').read_text())
for rel in changed:
 if rel.endswith('.html'):i[rel]=h((out/rel).read_text().split('</head>',1)[1].encode())
(out/'release-body-integrity.json').write_text(json.dumps(dict(sorted(i.items())),indent=2)+'\n');changed.append('release-body-integrity.json')
for e in fp['files']:
 b=(out/e['path']).read_bytes()
 if e['path'] in changed:e.update(sha256=h(b),bytes=len(b))
 else:assert h(b)==e['sha256']
fp['aggregate_sha256']=h(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode());(out/'DEPLOYMENT-FINGERPRINT.json').write_text(json.dumps(fp,indent=2)+'\n')
r={'baseline':base,'candidate':fp['aggregate_sha256'],'changed':changed,'preservedFiles':len(fp['files'])-len(changed)};(root/'build.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
