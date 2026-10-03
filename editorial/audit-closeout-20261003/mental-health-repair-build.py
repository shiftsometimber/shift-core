from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-mental-closeout-20261003');src=Path('/private/tmp/shift-tools-audit-20261003/pages');out=root/'pages'
root.mkdir(exist_ok=True);fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='30d7b89113782b1df6a770d62f1874133385d0a16c93e9f29ca8a0ecac6d1240'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changes={}
def edit(name,a,b):
 p=out/'mental-health'/f'{name}.html';s=p.read_text();assert s.count(a)==1,(name,a,s.count(a));p.write_text(s.replace(a,b));changes.setdefault(str(p.relative_to(out)),[]).append(b)
edit('help-yourself-without-doing-it-alone','Our next Good to Talk release will explain exactly what getting professional help can look like.','Read our <a href="/mental-health/getting-professional-help">guide to getting professional help</a> to see what the next step can look like.')
edit('bad-week-reset','no alcohol tonight','prepare tomorrow’s lunch')
edit('starting-antidepressants','If you develop thoughts of harming yourself or ending your life, seek emergency help immediately.','Contact your doctor straight away if thoughts of suicide or self-harm develop. Call 999 or go to A&amp;E if you are in danger or cannot keep yourself safe.')
edit('helping-someone','<span>“You alright?” “Yeah.</span>','<span>Ask again when the first answer does not match what you have noticed.</span>')
old='If you need urgent mental-health help but it is not an emergency, use NHS 111 online or call 111 and select the mental-health option.'
new='In England, if you need urgent mental-health help but it is not an emergency, use NHS 111 online or call 111 and select the mental-health option.'
for p in sorted((out/'mental-health').glob('*.html')):
 if p.stem=='mental-health-and-weight':continue
 if old in p.read_text():edit(p.stem,old,new)
specific={
'anger-irritability':('https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anger/','NHS — anger'),
'anxiety-overthinking':('https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anxiety-fear-panic/','NHS — anxiety, fear and panic'),
'stress-overwhelm':('https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/','NHS — stress'),
'feeling-low':('https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/low-mood-sadness-depression/','NHS — low mood and depression'),
'confidence-self-worth':('https://www.nhs.uk/mental-health/self-help/tips-and-support/raise-low-self-esteem/','NHS — improving low self-esteem'),
'sleep-mental-health':('https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/','NHS — sleep and mental health'),
'cbt-explained':('https://www.nhs.uk/tests-and-treatments/cognitive-behavioural-therapy-cbt/','NHS — cognitive behavioural therapy'),
'counselling-explained':('https://www.nhs.uk/tests-and-treatments/counselling/','NHS — counselling'),
'breathing-for-stress':('https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/','NHS — breathing exercises for stress')}
for name,(url,label) in specific.items():
 p=out/'mental-health'/f'{name}.html';s=p.read_text();start=s.index('class="gtt-sources"');pos=s.index('<ul>',start)
 edit(name,s[pos:pos+4],'<ul><li><a href="'+url+'">'+label+'</a></li>')
for name in ['nhs-talking-therapies','self-refer-talking-therapy']:
 p=out/'mental-health'/f'{name}.html';s=p.read_text();start=s.index('class="gtt-sources"');pos=s.index('<ul>',start)
 edit(name,s[pos:pos+4],'<ul><li><a href="https://www.nhs.uk/nhs-services/mental-health-services/find-nhs-talking-therapies-for-anxiety-and-depression/">Find NHS Talking Therapies and self-refer in England</a></li>')
edit('urgent-mental-health-help','<h2 data-section="03">Not sure?</h2>', '<h2>Support elsewhere in the UK</h2><ul><li><strong>Wales:</strong> call NHS 111 and choose option 2. <a href="https://www.gov.wales/nhs-111-press-2">NHS 111 Wales mental-health support</a>.</li><li><strong>Scotland:</strong> <a href="https://www.nhs24.scot/support-for-your-mental-health/">NHS 24 mental-health support and urgent routes</a>.</li><li><strong>Northern Ireland:</strong> contact your GP, GP out-of-hours service or existing mental-health team for urgent support. <a href="https://www.nidirect.gov.uk/articles/mental-health-emergency-if-youre-crisis-or-despair">Northern Ireland crisis guidance</a>.</li></ul><h2 data-section="03">Not sure?</h2>')
for p in sorted((out/'mental-health').glob('*.html')):
 if p.stem in ['mental-health-and-weight','urgent-mental-health-help']:continue
 s=p.read_text()
 if 'class="gtt-urgent"' not in s:continue
 start=s.index('class="gtt-urgent"');end=s.index('</div>',start)
 fragment=s[start:end]
 edit(p.stem,fragment,fragment+'<p><a href="/mental-health/urgent-mental-health-help">Urgent support across the UK</a></p>')
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
