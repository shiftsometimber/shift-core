from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-lifestyle-audit-20261003');src=Path('/private/tmp/shift-medicine-audit-20261003/pages');out=root/'pages'
root.mkdir(exist_ok=True)
fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='fcef924904a0c000f7088f1d75e62fa645394ca10bed22fde1d04008b662d326'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changes={}
def edit(name,a,b):
 p=out/f'{name}.html';s=p.read_text();assert a in s,(name,a);p.write_text(s.replace(a,b));changes.setdefault(str(p.relative_to(out)),[]).append(b)
n='guides/exercise-walking-strength-mobility'
edit(n,'<strong>of moderate-intensity activity per week</strong>','<strong>150 minutes of moderate-intensity activity per week</strong>')
edit(n,'<strong>of vigorous-intensity activity</strong>','<strong>75 minutes of vigorous-intensity activity per week</strong>')
edit(n,'<strong>Weeks 1–2</strong>brisk walking','<strong>Weeks 1–2</strong>10 minutes of brisk walking')
for w,m in [('3–4','15'),('5–6','20'),('7–8','25')]:edit(n,f'<strong>Weeks {w}</strong>, 5 days/week.',f'<strong>Weeks {w}</strong>{m} minutes of brisk walking, 5 days/week.')
edit(n,'That progression alone takes you from 50 to 125 brisk minutes per week','This suggested progression is flexible: start lower or repeat a week if needed. It takes you from 50 to 125 brisk minutes per week')
edit(n,'an ambitious Shift Programme','an ambitious exercise programme')
edit(n,'Three 10-minute brisk walks still produce of activity.','Three 10-minute brisk walks add up to 30 minutes of activity.')
edit(n,'Strength sessions can be 20–.','A short strength session can fit into a busy day.')
edit(n,'<strong>of moderate movement and two strength sessions a week</strong>','<strong>150 minutes of moderate movement and two strength sessions a week</strong>')
edit(n,'5–walks on 5 days','5–10-minute walks on 5 days')
edit(n,'20–brisk walking on 4–5 days','20–30 minutes of brisk walking on 4–5 days')
edit(n,'Add 5–of easy mobility/balance','Add 5–10 minutes of easy mobility/balance')
n='guides/sleep-stress-mindset-emotional-eating-maintenance'
edit(n,'weight-management Shift Programme','weight-management programme')
edit(n,'Pause for before acting.','Pause briefly before acting.')
n='guides/nutrition-protein-calories-meal-planning'
edit(n,'It may be too low for many adults. Very low intakes should not be chosen blindly and may need professional support.','NICE advises that diets of 800–1,200 kcal/day should only be considered within a supported, multicomponent plan in a specialist weight-management service or an appropriate long-term-condition service. Diets below 800 kcal/day require specialist assessment and a specific clinical reason. These plans need nutritional completeness, supervision and a duration of no more than 12 weeks; they are not a long-term DIY target.')
edit(n,'Before paying anybody, try this properly if it is safe for you.','This is an optional self-directed plan if it is safe for you, not a requirement to delay a GP or dietitian appointment. Seek individual advice first if you have an eating disorder, significant health concerns or medicines that may need adjustment as your intake changes.')
n='medication-comparison-methodology'
edit(n,'SURMOUNT Shift Programme','SURMOUNT programme')
edit(n,'STEP Shift Programme','STEP programme')
edit(n,'SCALE Shift Programme','SCALE programme')
edit(n,'equivalent to mg or 7.2 mg injected semaglutide','equivalent to 2.4 mg or 7.2 mg injected semaglutide')
n='future-medicines-comparison'
edit(n,'development Shift Programme','development programme')
edit(n,'comparison Shift Programme','comparison programme')
edit(n,'CagriSema has direct-comparison work against tirzepatide. Those trials will tell us much more than lining up unrelated headline percentages from separate studies.</p>\n<p>Until then, our comparison checker shows the evidence honestly rather than declaring a fake winner.','CagriSema already has direct-comparison results from REDEFINE 4. Read the <a href="/guides/cagrisema-uk-guide">CagriSema guide for the dated results and limitations</a>. Direct trials answer more specific questions than comparisons of unrelated study averages; neither establishes the best treatment for every individual.')
i=json.loads((out/'release-body-integrity.json').read_text())
for rel in changes:i[rel]=h((out/rel).read_text().split('</head>',1)[1].encode())
(out/'release-body-integrity.json').write_text(json.dumps(dict(sorted(i.items())),indent=2)+'\n')
changed=list(changes)+['release-body-integrity.json']
for e in fp['files']:
 b=(out/e['path']).read_bytes()
 if e['path'] in changed:e.update(sha256=h(b),bytes=len(b))
 else:assert h(b)==e['sha256']
fp['aggregate_sha256']=h(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode());(out/'DEPLOYMENT-FINGERPRINT.json').write_text(json.dumps(fp,indent=2)+'\n')
r={'baseline':base,'candidate':fp['aggregate_sha256'],'changed':changed,'preservedFiles':len(fp['files'])-len(changed),'expected':changes}
(root/'build.json').write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items() if k!='expected'}))
