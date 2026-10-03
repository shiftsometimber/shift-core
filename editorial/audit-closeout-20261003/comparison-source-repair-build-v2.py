from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-comparison-audit-20261003');src=Path('/private/tmp/shift-lifestyle-audit-20261003/pages');out=root/'pages'
root.mkdir(exist_ok=True)
fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='c3d00fd2609af1fccadaaa342a60e4cca5f5dd29a9e6d55cf2660e95947aeb5a'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changes={}
def edit(name,a,b):
 p=out/f'{name}.html';s=p.read_text();assert a in s,(name,a);p.write_text(s.replace(a,b));changes.setdefault(str(p.relative_to(out)),[]).append(b)
# Only reviewed comparison pages and their display logic.
for p in sorted((out/'comparisons').rglob('*.html')):
 n=str(p.relative_to(out)).removesuffix('.html');s=p.read_text()
 if n in ['comparisons/medications/mounjaro-vs-orlistat','comparisons/medications/mounjaro-vs-saxenda','comparisons/medications/mounjaro-vs-wegovy']:continue
 for a,b in [('Structured lifestyle Shift Programme','Structured lifestyle programme'),('Structured Weight-Loss Shift Programme','Structured Weight-Loss Programme'),('https://www.nice.org.uk/guidance/cg189','https://www.nice.org.uk/guidance/ng246'),('For some people a weekly injection is easier than a daily tablet; for others avoiding a needle is decisive.','Consider the actual formulation and frequency above, its administration instructions and how it fits your routine.'),('Largest and most durable average losses for many severe-obesity populations','Substantial long-term weight loss in studied severe-obesity populations')]:
  if a in p.read_text():edit(n,a,b)
 if '/universal/' in n:
  s=p.read_text();m=re.search(r'<h2[^>]*>Shared dimensions</h2>.*?(?=<h2)',s,re.S);assert m,n
  edit(n,m.group(),'<h2>How to use this comparison</h2><p>Compare the factual differences below. We do not assign numerical treatment rankings: outcomes depend on the specific treatment, population, follow-up and your clinical circumstances.</p>')
  edit(n,'Do not add the scores together.</strong><p>The bars are there to expose trade-offs. They are not a validated overall suitability index.</p>','Read both columns carefully.</strong><p>A detail omitted from one column is not evidence that it is irrelevant to that treatment. Use the full guides and discuss clinical suitability with your treating team.</p>')
  if 'Not applicable' in p.read_text():edit(n,'Not applicable','Not covered in this row')
 if '/surgery/' in n or '/medications/' in n:
  s=p.read_text();m=re.search(r'<h2[^>]*>Which (?:generally produces more weight loss|is stronger for weight loss)\?</h2><p>.*?</p>',s,re.S)
  if m and 'rated' in m.group():
   edit(n,m.group(),'<h2>How should I compare weight-loss evidence?</h2><p>Read the named evidence above with its population, duration and outcome measure. Separate-trial results cannot establish a direct treatment ranking or predict your result. Ask which evidence is relevant to your own circumstances.</p>')
n='comparisons/lifestyle/walking-vs-structured-exercise'
edit(n,'Walking vs Structured Exercise Plan','Walking vs a Broader Lifestyle Plan')
n='comparisons/nhs-private/gp-vs-specialist-weight-management'
edit(n,'Route A / NHS context','GP / primary care');edit(n,'Route B / private or alternative context','Specialist weight-management service')
n='comparisons/nhs-private/online-pharmacy-vs-clinic'
edit(n,'Route A / NHS context','Online pharmacy');edit(n,'Route B / private or alternative context','Specialist weight clinic')
n='comparisons/surgery/balloon-vs-esg'
edit(n,'Both are endoscopic, but they are not equivalent.','ESG is endoscopic; balloon placement depends on the device, including swallowable systems. They are not equivalent.')
for n in ['comparisons/surgery/balloon-vs-esg','comparisons/surgery/esg-vs-gastric-sleeve']:
 edit(n,'https://www.ifso.com/pdf/endoscopic-sleeve-gastroplasty-vs-laparoscopic-gastric-plication-new.pdf','https://www.nice.org.uk/guidance/htg711')
# Remove unvalidated rankings and recommendations derived from them.
def asset(name,transform):
 p=out/name;s=p.read_text();t=transform(s);assert t!=s,name;p.write_text(t);changes[name]=[]
def universal(s):
 a=s.index('function personalised(');b=s.index('function detailTable(',a)
 s=s[:a]+"function personalised(){return '<div class=\"uni-info\"><p>Use your priorities to prepare questions about cost, follow-up, treatment burden and reversibility. This tool does not calculate a preferred treatment.</p></div>';}\n"+s[b:]
 a=s.index(" $('uniStats').innerHTML=");b=s.index(" $('uniDetails')",a)
 s=s[:a]+" $('uniStats').innerHTML='';\n"+s[b:]
 a=s.index(' const diff=[];');b=s.index(' history.replaceState',a)
 s=s[:a]+" $('uniTakeaway').innerHTML='<p>Read the evidence, practical differences and follow-up requirements below. Compare named procedures and formulations; an access route or country is not a treatment.</p>';\n"+s[b:]
 return s.replace("'Not applicable'","'Not covered in this row'")
asset('universal-comparison-engine-2212f.js',universal)
def surgery(s):
 a=s.index('function personal(');b=s.index('function render()',a);s=s[:a]+"function personal(){return '';}\n"+s[b:]
 a=s.index(" $('surgStats').innerHTML=");b=s.index(" $('surgAdvantages')",a)
 return s[:a]+" $('surgStats').innerHTML='';\n"+s[b:]
asset('surgery-battle-2212b.js',surgery)
def medication(s):
 a=s.index('function fitText(');b=s.index('function render()',a);s=s[:a]+"function fitText(){return '';}\n"+s[b:]
 a=s.index(" $('battleStats').innerHTML=");b=s.index(" $('battleAdvantages')",a)
 return s[:a]+" $('battleStats').innerHTML='';\n"+s[b:]
# Retired medication centre redirects; preserve its unused asset.
# Keep methodology consistent with the corrected displays.
edit('medication-comparison-methodology','Our 0–10 ratings summarise comparison dimensions such as evidence depth, convenience, needle-free administration and relative weight-loss efficacy. They are editorial aids, not validated clinical scores.','We present study findings and practical differences without numerical treatment ratings. Separate trials are not a head-to-head ranking, and a study average is not a personal forecast.')
edit('surgery-comparison-methodology','The 0–10 weight-loss rating is therefore a relative editorial scale rather than a pooled percentage forecast.','We present the evidence without numerical treatment ratings or a pooled personal forecast.')
edit('surgery-comparison-methodology','Bypass procedures score highly because of extensive metabolic-surgery evidence. A score does not mean every person with diabetes should have a bypass.','Bypass procedures have extensive metabolic-surgery evidence. That does not mean every person with diabetes should have a bypass.')
n='universal-comparison-methodology'
edit(n,'We deliberately do not sum the bars into one result.','We do not assign numerical treatment scores or calculate an overall winner.')
edit(n,'Existing category ratings from –E are mapped onto the shared 0–10 framework. Where a category is not itself a treatment — for example NHS vs private access route or treatment location — weight-loss potential is treated as neutral because the route/location does not itself cause weight loss.','We do not map treatments, access routes and countries onto a shared numerical scale. A location or funding route does not itself cause weight loss; compare the actual treatment and care pathway.')
edit(n,'If <code>sstTreatmentFinder</code> exists, the engine can highlight alignment with stated preferences such as speed, cost sensitivity, lower medical intensity, reversibility and maintenance. It also respects a strong stated preference to avoid surgery. This remains preference alignment, not a clinical recommendation.','Use your priorities to prepare questions about costs, treatment burden, reversibility and follow-up. The comparison does not select a preferred treatment from a saved profile.')
edit(n,"If <code>sstDecisionReadiness</code> exists, the engine can surface how complete the user's information is. A highly relevant route with low readiness should trigger more research/assessment, not more confidence.",'Use the Decision Readiness tool separately to identify questions you still need answered. Readiness is not clinical suitability.')
n='comparison-centre'
edit(n,'so the top bars only use dimensions that can sensibly cross categories.','so the comparison presents factual differences without numerical treatment rankings.')
edit(n,'Lifestyle Shift Programme vs Mounjaro','Lifestyle programme vs Mounjaro')
edit(n,'If you completed the Treatment Finder, the engine can explain which option better aligns with your stated speed, cost, medical-intensity, reversibility and maintenance priorities.','Use your priorities about cost, treatment burden, reversibility and follow-up to prepare questions. This comparison does not calculate a preferred treatment.')
edit(n,'If Mounjaro “wins” weight-loss potential and reversibility while sleeve “wins” durability and treatment permanence, that is useful. A fake overall score saying 84–79 is not.','Different procedures and medicines have different evidence and practical trade-offs. Neither a numerical rating nor an overall score can establish your clinical suitability.')
for n,js in [('comparison-centre','universal-comparison-engine-2212f.js'),('surgery-comparison-centre','surgery-battle-2212b.js')]:
 p=out/(n+'.html');s=p.read_text();a=re.search(re.escape(js)+r'\?v=[^"]+',s).group();edit(n,a,js+'?v=source-audit-20261003')
i=json.loads((out/'release-body-integrity.json').read_text())
for rel in changes:
 if rel.endswith('.html'):i[rel]=h((out/rel).read_text().split('</head>',1)[1].encode())
(out/'release-body-integrity.json').write_text(json.dumps(dict(sorted(i.items())),indent=2)+'\n')
changed=list(changes)+['release-body-integrity.json']
for e in fp['files']:
 b=(out/e['path']).read_bytes()
 if e['path'] in changed:e.update(sha256=h(b),bytes=len(b))
 else:assert h(b)==e['sha256']
fp['aggregate_sha256']=h(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode());(out/'DEPLOYMENT-FINGERPRINT.json').write_text(json.dumps(fp,indent=2)+'\n')
r={'baseline':base,'candidate':fp['aggregate_sha256'],'changed':changed,'preservedFiles':len(fp['files'])-len(changed),'expected':{k:v for k,v in changes.items() if k.endswith('.html')}}
(root/'build.json').write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items() if k!='expected'}))
