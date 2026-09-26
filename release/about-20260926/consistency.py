"""About copy only, applied to the reproduced current Pages master."""
import gzip, hashlib, json, pathlib, re
here=pathlib.Path(__file__).resolve().parent
source=here.parent/'public-pages-20260911'
p=json.loads(gzip.decompress((source/'source.json.gz').read_bytes()))

assert p['source_fingerprint']=='5821ddd27a33b2317d00c17c09e1585a9aea0f2702325a606c14a53043996e97'
baseline=p['source_fingerprint']
updates={}
def replace(name,old,new):
 s=updates.get(name,p['overrides'][name]);assert s.count(old)==1,(name,old)
 updates[name]=s.replace(old,new)
replace('index.html','Clinically checked where appropriate.','Sources checked; clinical review labelled separately.')
replace('programme.html','Shift does not promise guaranteed results, replace your GP or provide prescription medicine without proper clinical assessment.','SHIFT provides the platform and practical support. Our clinical partner handles assessment, prescribing and clinical monitoring; a registered pharmacy handles dispensing. Treatment requires an individual clinical assessment and results are not guaranteed.')
replace('authors/matt-obrien.html','Matt founded Shift Some Timber after losing four and a half stone and experiencing how weight, health, confidence and everyday life overlap. His experience shapes the questions and language; published evidence supports the factual claims.','Matt lost around 4½ stone over about eleven months through changes to eating, movement and prescribed weight-loss treatment after a clinical assessment. His experience of pain, grief and everyday health helped shape SHIFT. This is his personal account, not a promise of results. <a href="/about">Read Matt’s full story</a>. His experience shapes the questions and language; published evidence supports the factual claims.')
bio='Matt lost around 4½ stone over about eleven months through changes to eating, movement and prescribed weight-loss treatment after a clinical assessment. This is his personal experience, not a promise of results. He is not a clinician or prescriber. <a href="/about">Read Matt’s full story</a>.'
old_bios=['Matt has personal experience of medically supported weight management and has lost 4½ stone, but he is not presented as a clinician or prescriber.','Matt has first-hand experience of medically supported weight management and has lost 4½ stone, but he is not presented as a doctor or prescriber.']
bio_count=0
for name,s in p['overrides'].items():
 if not name.endswith('.html'):continue
 for old in old_bios:
  if old in s:replace(name,old,bio);bio_count+=1
assert bio_count==24,bio_count
old='Shift does not provide emergency or individual medical advice. For an urgent medical problem use NHS 111; call 999 in an emergency. For immediate mental-health support, use the routes on <a href="/mens-mental-health">Good to Talk</a>.'
new='SHIFT does not provide emergency or individual medical advice. Call <a href="tel:999">999</a> for a life-threatening emergency. Do not wait for a check-in or a company inbox.</p><ul><li><strong>England:</strong> call <a href="tel:111">NHS 111</a> for urgent medical advice. For urgent mental-health support, select the mental-health option. <a href="https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/">NHS guidance</a>.</li><li><strong>Scotland:</strong> contact your GP for urgent advice during normal hours. Call <a href="tel:111">NHS 24 on 111</a> when you need urgent care and your GP is closed, or for mental-health distress. <a href="https://www.nhs24.scot/111/">NHS 24 guidance</a>.</li><li><strong>Wales:</strong> call <a href="tel:111">NHS 111 Wales</a>; press 2 for urgent mental-health support. <a href="https://111.wales.nhs.uk/">NHS 111 Wales</a>.</li><li><strong>Northern Ireland:</strong> contact your GP or <a href="https://www.nidirect.gov.uk/articles/gp-out-hours-service">local GP out-of-hours service</a> for urgent medical advice. For distress or despair, call <a href="tel:08088088000">Lifeline on 0808 808 8000</a>. <a href="https://www.nidirect.gov.uk/articles/mental-health-emergency-if-youre-crisis-or-despair">NI support information</a>.</li></ul><p>Routes checked 26 September 2026. For further listening and mental-health support, see <a href="/mens-mental-health">Good to Talk</a>.'
replace('help.html',old,new)
def entry(name,text):
 b=text.encode();return dict(path=name,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b))
integrity=json.loads(p['overrides']['release-body-integrity.json'])
for name,text in updates.items():
 integrity[name]=hashlib.sha256(text.split('</head>',1)[1].encode()).hexdigest()
updates['release-body-integrity.json']=json.dumps({n:integrity[n] for n in sorted(integrity,key=pathlib.PurePosixPath)},indent=2)+'\n'
fp=json.loads(p['overrides']['DEPLOYMENT-FINGERPRINT.json']); entries={e['path']:e for e in fp['files']}
for name,text in updates.items(): entries[name]=entry(name,text)
fp['files']=[entries[n] for n in sorted(entries,key=pathlib.PurePosixPath)]
fp['aggregate_sha256']=hashlib.sha256(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode()).hexdigest()
updates['DEPLOYMENT-FINGERPRINT.json']=json.dumps(fp,indent=2)+'\n'
entries={e['path']:e for e in p['files']}
for name,text in updates.items():entries[name]=entry(name,text);p['overrides'][name]=text
p['files']=[entries[n] for n in sorted(entries)];p['baseline_fingerprint']=baseline;p['source_fingerprint']=fp['aggregate_sha256']
packed=gzip.compress(json.dumps(p,separators=(',',':'),ensure_ascii=False).encode(),mtime=0)
(source/'source.json.gz').write_bytes(packed)
(source/'control.json').write_text(json.dumps(dict(mode='preview',expected_live_fingerprint=baseline,source_fingerprint=p['source_fingerprint'],payload_sha256=hashlib.sha256(packed).hexdigest()),indent=2)+'\n')

(here/'proof.json').write_text(json.dumps(dict(baseline=baseline,candidate=p['source_fingerprint'],changed_files=list(updates),productionWrites=0),indent=2)+'\n')
print((here/'proof.json').read_text())
