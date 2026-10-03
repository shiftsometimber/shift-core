from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-medicine-audit-20261003');src=Path('/private/tmp/shift-full-editorial-20261003/pages');out=root/'pages'
root.mkdir(exist_ok=True)
fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='6fef273aa67dca8dad99c0e1f2ea8306ebc2710b74e98ab2cf8e14494c68a352'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changes={}
def edit(name,a,b):
 p=out/'guides'/f'{name}.html';s=p.read_text();assert a in s,(name,a);p.write_text(s.replace(a,b));changes.setdefault(str(p.relative_to(out)),[]).append(b)
for n in ['amycretin-uk-guide','maritide-uk-guide']:
 edit(n,'Shift Programme','programme')
n='cagrisema-uk-guide'
for a,b in [('Phase 3 Shift Programme','Phase 3 programme'),('cardiovascular-outcomes Shift Programme','cardiovascular-outcomes programme'),('REIMAGINE Shift Programme','REIMAGINE programme'),('High-dose Shift Programme','High-dose programme'),('<th>Shift Programme</th>','<th>Programme</th>')]:edit(n,a,b)
edit(n,'cagrilintide mg','cagrilintide 2.4 mg')
edit(n,'semaglutide mg','semaglutide 2.4 mg')
edit(n,'REDEFINE 4 has been designed to compare CagriSema directly with tirzepatide, which is far more useful than comparing separate headline trial numbers.','REDEFINE 4 directly compared CagriSema with tirzepatide. Novo Nordisk announced results on 23 February 2026.')
edit(n,'Until direct head-to-head results and regulatory decisions are available, declaring a winner is premature.','In the 809-participant, open-label REDEFINE 4 trial, Novo reported 23.0% mean weight loss with CagriSema versus 25.5% with tirzepatide at 84 weeks under the efficacy estimand; the treatment-regimen figures were 20.2% and 23.6%. CagriSema did not meet the primary non-inferiority endpoint. These manufacturer-reported results concern the studied doses and population, not every individual treatment decision. <a href="https://www.novonordisk.com/content/nncorp/global/en/news-and-media/news-and-ir-materials/news-details.html?id=916501">Read the REDEFINE 4 announcement</a>. Comparison evidence checked 3 October 2026.')
edit(n,'A direct head-to-head Phase 3 programme is intended to answer this more reliably than cross-trial comparisons.','REDEFINE 4 did not demonstrate non-inferiority to tirzepatide for weight loss. See the dated results and limitations in the comparison section.')
edit('endoscopic-sleeve-gastroplasty-esg-uk-guide','structured lifestyle and follow-up Shift Programme','structured lifestyle and follow-up programme')
edit('maritide-uk-guide','without an observed weight-loss plateau at that time point.','under the efficacy estimand, without an observed weight-loss plateau at that time point.')
n='retatrutide-uk-guide'
edit(n,'<p><strong>Next announced evidence checkpoint:</strong> Lilly’s 15 September announcement schedules a retatrutide symposium for 30 September at EASD 2026. On this guide’s source-check date, that presentation is still in the future. An announced presentation is not newly available full results. <a href="#r8">[8]</a></p>','<p><strong>EASD update checked 3 October 2026:</strong> Lilly published detailed TRIUMPH-2 results on 29 September. In adults with type 2 diabetes and obesity or overweight, the 12 mg research group had 20.8% mean weight loss at 80 weeks versus 4.0% with placebo under the efficacy estimand. Adverse-event discontinuations were 7.7% versus 4.9%. Lilly reports simultaneous publication in The Lancet; this update cites the manufacturer report. These are research findings, not UK authorisation or dosing advice. <a href="#r8">[8]</a></p>')
edit(n,'July 2026 topline announcement; do not pool with a trial excluding diabetes.','July topline result, followed by the September detailed report [8]; do not pool with a trial excluding diabetes.')
edit(n,'<li id="r8"><a href="https://investor.lilly.com/news-releases/news-release-details/lilly-present-new-data-foundayo-retatrutide-and-eloratzp-easd" rel="noopener noreferrer">Lilly: EASD presentation announcement, 15 September 2026</a>. Future presentation notice at the source-check date.</li>','<li id="r8"><a href="https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-delivered-substantial-weight" rel="noopener noreferrer">Lilly: detailed TRIUMPH-2 results, 29 September 2026</a>. Manufacturer report checked 3 October 2026.</li>')
edit(n,'clarifies research terminology, separates trial analyses, adds the newer evidence checkpoint and makes the informational purpose explicit.','updates the EASD evidence checkpoint with the 29 September TRIUMPH-2 report, checked on 3 October 2026. Other source-check dates remain as stated.')
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
