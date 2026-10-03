from pathlib import Path
import json,hashlib,shutil,re
root=Path('/private/tmp/shift-full-editorial-20261003');src=Path('/private/tmp/shift-mental-closeout-20261003/pages');out=root/'pages'
fp=json.loads((src/'DEPLOYMENT-FINGERPRINT.json').read_text());base=fp['aggregate_sha256'];h=lambda b:hashlib.sha256(b).hexdigest()
assert base=='27c1329b4f8fc9df98004901e67baa64afaf6b96ca99e35f11c1f1e05e335e24'
for e in fp['files']:assert h((src/e['path']).read_bytes())==e['sha256']
shutil.copytree(src,out,dirs_exist_ok=True);changes={}
def edit(name,a,b):
 p=out/'guides'/f'{name}.html';s=p.read_text();assert a in s,(name,a);p.write_text(s.replace(a,b));changes.setdefault(str(p.relative_to(out)),[]).append(b)
edit('nhs-weight-management-uk-guide','identify a digital Shift Programme','refer to an NHS digital weight-management programme')
edit('nhs-weight-management-uk-guide','The medication-specific detail belongs in the next NHS release; the important overview point is that','Our <a href="/guides/nhs-weight-loss-medication-pathways">NHS weight-loss medication pathways guide</a> explains the medicine-specific criteria. The important overview point is that')
n='nhs-bariatric-surgery-pathways'
edit(n,'No. It guarantees a case for specialist assessment, not automatic surgery.','No. The criteria support referral for assessment; suitability for surgery is decided by the specialist team.')
edit(n,'Those are five completely different problems.','Those are different problems.')
edit(n,'href="https://www.england.nhs.uk/"','href="https://www.myplannedcare.nhs.uk/"')
edit(n,'However, complex pathways can include periods where additional assessment, clinical optimisation or patient choice affects the RTT clock. That is one reason the lived bariatric journey can feel much longer than “18 weeks”.','Tests and assessments usually form part of the waiting period. The right is to start treatment, which can include advice or medicines and does not necessarily mean an operation within 18 weeks. Exceptions include choosing to wait longer or a delay that is clinically in your best interests. Ask the service for your recorded referral-to-treatment start date, what counts as treatment in your pathway and whether any exception applies.')
for n in ['gastric-sleeve-uk-guide','weight-loss-surgery-uk-guide','weight-loss-surgery-uk-costs-guide']:edit(n,'£9,975','£10,495')
n='gastric-sleeve-uk-guide'
edit(n,'We will build a full provider/country cost centre in .','See our <a href="/guides/bariatric-surgery-costs-uk-europe">UK and Europe surgery cost guide</a>.')
edit(n,'The dedicated UK-vs-Europe surgery guide comes in .','Read our <a href="/guides/bariatric-surgery-europe-costs-guide">guide to surgery in Europe, costs and aftercare</a>.')
edit(n,'We will cover bypass and mini-bypass in full in the next Surgery Centre release.','Read the full guides to <a href="/guides/gastric-bypass-roux-en-y-uk-guide">Roux-en-Y bypass</a> and <a href="/guides/mini-gastric-bypass-oagb-uk-guide">one-anastomosis gastric bypass (OAGB)</a>.')
edit('weight-loss-surgery-uk-guide','Detailed UK and Europe cost comparison comes in the dedicated Surgery Cost Centre later in this phase.','Compare packages in our <a href="/guides/bariatric-surgery-costs-uk-europe">UK and Europe surgery cost guide</a>.')
n='gastric-balloon-uk-guide'
edit(n,'Allurion Shift Programme','Allurion programme')
edit(n,'use the Shift Programme to learn','use the provider’s support programme to learn')
edit(n,'If the Shift Programme ends the day','If follow-up ends the day')
edit('gastric-band-uk-guide','Modern incretin medicines avoid surgery and can produce weight loss that rivals or exceeds older band outcomes for many people.','Modern incretin medicines avoid surgery. Studies of medicines and bands involve different participants and follow-up periods, so headline weight-loss figures alone cannot establish which is better for you.')
n='mini-gastric-bypass-oagb-uk-guide'
edit(n,'Annual blood monitoring and lifelong nutritional supplementation are essential.','Lifelong nutritional supplements and blood monitoring are essential. The team should set the monitoring frequency for your operation and health. BOMSS advises that people with an OAGB biliopancreatic limb longer than 150 cm remain under specialist care; routine annual GP checks alone should not be assumed sufficient.')
edit(n,'Yes. Lifelong supplementation and annual nutritional monitoring are required.','Yes. Lifelong supplementation and nutritional monitoring are required, with frequency and specialist follow-up tailored to the operation and individual.')
n='weight-loss-surgery-uk-costs-guide'
p=out/'guides'/f'{n}.html';s=p.read_text();a=re.search(r'<p>Current UK market guidance.*?</p>',s).group()
edit(n,a,'<p>Provider examples checked on 3 October 2026: Ramsay’s price table lists gastric band from £7,400, sleeve from £10,495, bypass from £10,900 and balloon from £5,900. These are advertised starting prices, not a UK market average or an individual quotation. Ramsay’s page is internally inconsistent: its body text gives balloon from £5,200 and bypass from £10,995, with differing balloon aftercare descriptions. Obtain a written quote specifying the procedure, device and aftercare before comparing packages.</p>')
edit(n,'Is the hospital CQC-registered?','Is the hospital registered with the relevant national healthcare regulator (CQC in England)?')
n='bariatric-surgery-costs-uk-europe'
edit(n,'Typical UK private range','UK provider example')
edit(n,'~£7,000–£11,000 market guidance; named providers can be ~£10k–£14k','Ramsay from £10,495; Spire Bushey from £13,900 including consultation')
edit(n,'~£9,500–£15,000','Ramsay price table from £10,900; body text says £10,995')
edit(n,'~£5,000–£8,000','Ramsay price table from £7,400')
edit(n,'~£2,000–£5,000','Ramsay price table from £5,900; body text says £5,200')
edit(n,'Prices are time-stamped examples/ranges from provider sources reviewed 8 August 2026. They are not quotations.','Provider prices checked 3 October 2026. These are advertised examples, not quotations or market averages. Ramsay’s table and body text disagree on balloon and bypass prices and balloon aftercare; ask for a written package quote. Lithuania GBP amounts are the provider’s advertised figures, not our currency conversion.')
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
