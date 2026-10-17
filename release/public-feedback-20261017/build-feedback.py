from pathlib import Path
import re,json,hashlib,datetime
ROOT=Path(__file__).resolve().parent
BEFORE=ROOT/'before';AFTER=ROOT/'after';AFTER.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def once(s,a,b):
 assert s.count(a)==1,('Expected one source anchor',a,s.count(a))
 return s.replace(a,b,1)
def section_end(s,start):
 depth=0
 for m in re.finditer(r'<(/?)section\b[^>]*>',s[start:],re.I):
  depth+=-1 if m.group(1) else 1
  if depth==0:return start+m.end()
 raise AssertionError('Unclosed section')
source=(BEFORE/'start-here-v72.js').read_text()
start=source.index('function render(){');end=source.index('const knowledgeParams=',start)
render='''function render(){
  document.querySelector('.sh-official-v72').hidden=true;
  const result=$('#quickResult');result.hidden=false;
  document.title='Your Start Here result | Shift Some Timber';
  const goal=answers.why.slice(0,2).join(', ')||'Your goals';
  const preference=answers.med[0]||'No preference';
  const access=answers.access[0]||'Both';
  const choice=$('[data-one="budget"] .selected');
  const band=choice?.dataset.budgetBand||'nhs';
  const budgets={nhs:{max:0,label:'£0 / NHS'},under100:{max:99.99,label:'Under £100'},band150:{max:150,label:'£100–£150'},band200:{max:200,label:'£150–£200'},over200:{max:null,label:'£200+'}};
  const budget=budgets[band];
  if(!budget)throw Error('Unknown budget band');
  result.dataset.budgetBand=band;
  $('[data-summary-goal]').textContent=goal;
  $('[data-summary-med]').textContent=preference;
  $('[data-summary-access]').textContent=access;
  $('[data-result-budget]').textContent=budget.label+' per calendar month';
  $('[data-result-human]').textContent='Your answers are a starting point for understanding support. They do not select a medicine or establish clinical suitability.';
  $('[data-result-title]').textContent='Useful routes to explore.';
  $('[data-result-copy]').textContent='These routes stay in the same order for everyone. You can use free practical support, read about NHS access and understand what a clinical assessment involves.';
  $('[data-result-money]').textContent=band==='nhs'?'Free My Timber tools are available. NHS treatment depends on eligibility and local availability.':'Your stated budget is '+budget.label+' per calendar month. No treatment has been selected or described as affordable from this answer. Check the exact supply period, ongoing price and any additional fees before requesting treatment.';
  $('[data-next-step-title]').textContent='Understand your options. Know what support stays with you.';
  $('[data-next-step-copy]').textContent='Practical food, movement, check-ins and progress tools remain available in My Timber whether you use medicine, change treatment or choose another route.';
  $('[data-medication-next-steps]').hidden=false;
  $('[data-medication-next-steps]').style.display='flex';
  $('[data-lifestyle-next-steps]').hidden=true;
  $('[data-lifestyle-next-steps]').style.display='none';
  try{sessionStorage.removeItem('sstMedicineMatch')}catch(_){}
  result.scrollIntoView({behavior:'smooth',block:'start'});
  result.querySelector('h2')?.setAttribute('tabindex','-1');
  result.querySelector('h2')?.focus({preventScroll:true});
}
'''
client=source[:start]+render+source[end:]
client=re.sub(r'function catalogueName\(key\)\{[^\n]*\}\n','',client)
client=client.replace('Choose a realistic monthly budget to see your result.','Choose a budget range to see your next steps.')
client=client.replace('Show me my plan','Show my next steps')
client=client.replace("function label(btn){","try{sessionStorage.removeItem('sstMedicineMatch')}catch(_){}\nfunction label(btn){",1)
assert not re.search(r'Mounjaro|Wegovy|Orlistat|Foundayo|recommended|sh-match-badge|location.href',client,re.I)
new={}
for p in BEFORE.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(BEFORE).as_posix()
 if p.suffix not in ['.html','.js','.webmanifest']:continue
 t=p.read_text();updated=re.sub(r'Ask Shift',lambda m:'ASK TIMBER' if m.group(0).isupper() else 'Ask Timber',t,flags=re.I)
 if updated!=t:new[rel]=updated
home=(BEFORE/'index.html').read_text()
home=once(home,'>Blokes</span>','>blokes</span>');home=once(home,'>Themselves</span>','>themselves</span>')
home=once(home,'<p>Practical tools. Real talk. Individual support.<br/>No judgement. Just a clear path to better health, more energy and getting your life back.</p>','<p>Practical weight and health support for men, with free tools for food, movement and tracking your progress.<br/>Real talk, no judgement.</p>')
new['index.html']=home
html=(BEFORE/'start-here.html').read_text()
html=once(html,'A year ago I was fat, knackered and fed up with feeling like crap.','Before I started losing weight, I was fat, knackered and fed up with feeling like crap.')
html=once(html,'<small>OPTIONS MATCHING YOUR PREFERENCES</small>','<small>SUPPORT AND ASSESSMENT ROUTES</small>')
html=once(html,'<h2>I’d <span>start.</span></h2>','<h2>Your next <span>steps.</span></h2>')
html=once(html,'What’s realistic each month?','What budget feels manageable?')
html=once(html,'There’s no point recommending something that makes the rest of your life harder.','Think about your calendar-month budget. Treatment charges may cover a different supply period; check ongoing costs before requesting treatment.')
for label,band in [('£0 / NHS','nhs'),('Under £100','under100'),('£100–£150','band150'),('£150–£200','band200'),('£200+','over200')]:
 html=once(html,'<button type="button"><strong>'+label+'</strong>','<button type="button" data-budget-band="'+band+'"><strong>'+label+'</strong>')
html=html.replace('Some private options','Your preferred range').replace('Wider choice','Your preferred range').replace('If it’s genuinely worth it','Your upper range')
start=re.search(r'<section\b[^>]*data-result-meds[^>]*>',html).start();end=section_end(html,start)
removed=html[start:end];assert all(x in removed for x in ['Mounjaro','Wegovy','Orlistat','Foundayo'])
routes='''<nav class="public-route-options" aria-label="Support and assessment routes" data-support-routes>
<a class="public-route-option" href="/treatment-centre"><strong>Understand clinical assessment</strong><span>Read about assessment, possible treatment routes and the role of a qualified prescriber.</span></a>
<a class="public-route-option" href="/programme"><strong>Explore the Programme</strong><span>Understand the approach to food, movement and ongoing practical support.</span></a>
<a class="public-route-option" href="/guides/nhs-weight-management-uk-guide"><strong>Understand NHS routes</strong><span>Read about NHS support, eligibility and local availability.</span></a>
<a class="public-route-option" href="/member/dashboard"><strong>Open My Timber</strong><span>Free tools for meals, movement, check-ins and progress. Sign in or create an account.</span></a>
</nav>
<p class="public-period-note">Check the supply period as well as the price. A four-week charge repeats 13 times over 52 weeks; it is not the same as a calendar-month charge. Medicine suitability and any prescription require clinical assessment.</p>'''
html=html[:start]+routes+html[end:]
html=once(html,'/start-here-v72.js?v=direct-detail-20260912','/assets/start-here-support-v1.js?v=__PUBLIC_BUILD__')
assert not re.search(r'<section\b[^>]*data-result-meds',html)
new['start-here.html']=html
new['assets/start-here-support-v1.js']=client
for name in ['service-worker.js','service-worker-v3a.js']:
 t=new.get(name,(BEFORE/name).read_text())
 t,n=re.subn(r"(const CACHE\s*=\s*['\"])[^'\"]+",r'\1sst-public-__PUBLIC_BUILD__',t,count=1)
 if n:new[name]=t
controls=(ROOT/'feedback-controls.js').read_text().replace("if(button.dataset.compactUtility!=='1'){","if(button.dataset.compactUtility!=='1'||!button.querySelector('svg')){")
new['assets/public-feedback-v1.js']=controls
new['assets/public-feedback-v1.css']=(ROOT/'feedback-controls.css').read_text()
loader='''\n(()=>{if(!document.getElementById('publicFeedbackStyles')){const l=document.createElement('link');l.id='publicFeedbackStyles';l.rel='stylesheet';l.href='/assets/public-feedback-v1.css?v=__PUBLIC_BUILD__';document.head.append(l)}if(!document.getElementById('publicFeedbackClient')){const s=document.createElement('script');s.id='publicFeedbackClient';s.src='/assets/public-feedback-v1.js?v=__PUBLIC_BUILD__';s.defer=true;document.head.append(s)}})();\n'''
new['assets/v42.js']=new.get('assets/v42.js',(BEFORE/'assets/v42.js').read_text())+loader
build='public-feedback-20261017-'+sha(''.join(k+'\n'+new[k] for k in sorted(new)).encode())[:12]
for p in BEFORE.rglob('*.html'):
 rel=p.relative_to(BEFORE).as_posix();t=new.get(rel,p.read_text());assert t.lower().count('</head>')==1,rel
 tags='<meta name="public-shell-build" content="'+build+'"><link id="publicFeedbackStyles" rel="stylesheet" href="/assets/public-feedback-v1.css?v='+build+'"><script id="publicFeedbackClient" defer src="/assets/public-feedback-v1.js?v='+build+'"></script>'
 t=t.replace('</head>',tags+'</head>',1)
 t=t.replace('/assets/v42.js?v=cos-live-recovery-20260909-r2','/assets/v42.js?v='+build)
 new[rel]=t
changes=[]
for rel,t in sorted(new.items()):
 t=t.replace('__PUBLIC_BUILD__',build);b=t.encode();out=AFTER/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(b)
 old=BEFORE/rel;changes.append({'path':'/'+rel,'beforeSHA256':sha(old.read_bytes()) if old.exists() else None,'afterSHA256':sha(b),'bytes':len(b)})
assert all(not re.search('Ask Shift',(AFTER/p.relative_to(BEFORE)).read_text(),re.I) for p in BEFORE.rglob('*.html'))
report={'build':build,'preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseDeployment':json.loads((ROOT/'origin-provenance.json').read_text())['canonical']['id'],'changes':changes,'htmlFiles':sum(c['path'].endswith('.html') for c in changes),'namedMedicineQuizResults':False,'prescriptionMedicineRanking':False,'legacyQuizAssetRetainedForItsExistingStrictPrivacyAdapter':True,'homepageApproval':'Matt: Proceed, 17 October 2026, following exact proposed homepage wording','qualifiedAdvertisingReviewClaimed':False,'reviewGate':'Named medicine matching must not be re-enabled before qualified medicines-advertising review; assess before first clinical partner goes live.','unrelatedOriginAssetsPreserved':True,'coreChanges':0,'customerDataWrites':0}
(ROOT/'prepared-changes.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='changes'}));print(json.dumps({'changedFiles':len(changes),'newAssets':[c['path'] for c in changes if c['beforeSHA256'] is None]}))
