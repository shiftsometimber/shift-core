import json,re,pathlib,sys
root=pathlib.Path(__file__).parent
capture=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'all-seo-capture')
rows=json.loads((capture/'capture.json').read_text())['results']
eligible=[r for r in rows if r.get('file') and r.get('canonical')==r['url'] and 'noindex' not in r.get('meta',{}).get('robots','').lower() and r['url']!='https://shiftsometimber.co.uk/programme/sample']
by={r['url']:r for r in eligible}
redirects={r['url'].removeprefix('https://shiftsometimber.co.uk'):r['redirect'].removeprefix('https://shiftsometimber.co.uk') for r in rows if r.get('redirect') and (r['redirect'] if r['redirect'].startswith('https://') else 'https://shiftsometimber.co.uk'+r['redirect']) in by}
titles={
 '/medicine-news/dual-transporter-targeted-oral-semaglutide-nanomicelles':'Oral Semaglutide Delivery: Laboratory and Mouse Research',
 '/medicine-news/geographical-disparities-pediatric-obesity':'Childhood Obesity Counselling: Rural–Urban US Study',
 '/medicine-news/glp-1-receptor-agonists-dual-glp-1-gip-receptor-agonists-strengthened-warnings':'GLP-1 and GIP/GLP-1 Medicines: Strengthened Warnings',
 '/medicine-news/glp-1-receptor-agonists-rotator-cuff-repair':'GLP-1 Use and Rotator Cuff Repair: Observational Study',
 '/medicine-news/glucagon-like-peptide-1-agonists-preoperative-weight-loss-total-joint-arthroplasty':'Weight Loss Before Joint Replacement: Study Findings',
 '/medicine-news/glucagon-like-peptide-1-receptor-agonists-for-obstructive-sleep-apnea':'GLP-1 Medicines and Sleep Apnoea: Research Review',
 '/medicine-news/glucagon-like-peptide-1-receptor-agonists-vagal-activity':'GLP-1 Medicines and Vagal Events: Danish Cohort Study',
 '/medicine-news/glucagon-like-peptide-1-receptor-agonists-weight-loss':'GLP-1 and Co-agonist Medicines: Weight-Loss Research Review',
 '/medicine-news/ibi3042-clinical-trial-update':'IBI3042 Weight-Management Trial: Registry Update',
 '/medicine-news/mhra-warns-of-potential-risk-of-pulmonary-aspiration-with-glp-1-and-dual-gip-glp-1-receptor-agon':'GLP-1 Medicines and Aspiration Risk: MHRA Warning',
 '/medicine-news/orforglipron-clinical-trial':'Orforglipron Complication-Prevention Trial: Registry Update',
 '/medicine-news/pediatric-obesity-trial-ly900040':'LY900040 Paediatric Weight-Management Trial: Registry Update',
 '/medicine-news/ro7204239-tirzepatide-obesity-trial':'Emugrobart Obesity Development Stopped: Registry Lag',
 '/medicine-news/rybelsus-semaglutide-tablets-formulation-change':'Rybelsus Formulation Change: Medication Error Risk',
 '/medicine-news/semaglutide-alcohol-use-disorder-metabolic-bariatric-surgery':'Semaglutide Alcohol-Use Trial After Bariatric Surgery',
 '/medicine-news/semaglutide-dosage-and-neuropsychiatric-events':'Semaglutide Dose and Mental Health: Observational Study',
 '/medicine-news/semaglutide-naion-risk':'Semaglutide and NAION: UK Eyesight Safety Update',
 '/medicine-news/semaglutide-prurigo-nodularis':'Semaglutide and Prurigo Nodularis: Single-Patient Report',
 '/medicine-news/semaglutide-suicidality':'Semaglutide and Suicidality: Inconclusive Preprint Findings',
 '/medicine-news/tirzepatide-and-levonorgestrel-iud-therapy-for-ein-and-early-stage-endometrial-cancer':'Trial Record: Tirzepatide and IUD Therapy in Endometrial Disease',
 '/medicine-news/tirzepatide-atrial-fibrillation':'Tirzepatide and Atrial Fibrillation: Uncertain Rare-Event Evidence',
 '/medicine-news/uk-archive-northern-ireland-obesity-service-first-phase':'New Northern Ireland Obesity Service: First-Phase Coverage',
 '/medicine-news/uk-archive-scotland-prevention-weight-health-framework':'Scotland’s Weight-Management Prevention Framework',
 '/articles/mens-weight-loss-diet':'Weight-Loss Diet for Men: A Practical UK Food Guide',
 '/articles/mens-fat-loss-workouts':'Weight-Loss Workouts for Men: Strength and Walking Plan',
 '/authors/shift-some-timber-editorial-team':'SHIFT Editorial Team: Sources, Standards and Clinical Review',
 '/guides/food-guide':'Healthy Eating Guide for Men: Meals and Food Choices | SHIFT'
}
descriptions={
 '/articles/mens-weight-loss-diet':'A practical weight-loss diet guide for men: food choices, portions and an example menu, with calorie needs tailored to your circumstances.',
 '/articles/mens-fat-loss-workouts':'A repeatable weight-loss workout plan for men, combining strength sessions and walking, with beginner options and ways to build up gradually.',
 '/authors/shift-some-timber-editorial-team':'Understand the SHIFT editorial byline, how sources are checked and how clinical review is distinguished from general information.',
 '/guides/food-guide':'Build meals that fit everyday life with familiar food choices, variety, fibre and practical planning ideas for men.'
}
pages={}
for r in eligible:
 path=r['url'].removeprefix('https://shiftsometimber.co.uk')
 if path in ['/','/start-here']:continue
 spec={}
 if path in titles:
  spec.update(beforeTitle=r['title'],beforeH1=r['h1'][0],title=titles[path])
  if path in descriptions:spec['description']=descriptions[path]
  if path.startswith('/articles/mens-'):spec['h1']=titles[path]
 if path=='/guides/food-guide':spec['addWebPage']=True
 if path=='/articles/mens-weight-loss-diet':
  html=(capture/'html'/r['file']).read_text()
  paragraphs=re.findall(r'<p\b[^>]*>[\s\S]*?</p>',html)
  before=[next(p for p in paragraphs if p.startswith('<p>Most men aiming')),next(p for p in paragraphs if 'For most men, a daily intake' in p),next(p for p in paragraphs if 'gives a simple shape' in p)]
  after=[
   '<p>A weight-loss diet for men needs to work around the food you enjoy, your routine and your individual energy needs. The 1,800 kcal menu below is an example, rather than a target for every man. Start with familiar meals and use the <a href="https://www.dbth.nhs.uk/wp-content/uploads/2021/09/Eat-Better-Feel-Better-Portion-Chart.pdf" rel="noopener noreferrer">portion guide</a> to think about manageable changes.</p>',
   '<p>There is no single calorie target that suits every man. Energy needs vary with body size, activity, age, health and personal circumstances. Use the example menu as a planning aid, and get individual advice from an appropriately qualified healthcare professional if you have medical needs, take medicines that affect your eating, or are considering a restrictive diet.</p>',
   '<p>The <a href="https://www.gov.uk/government/publications/the-eatwell-guide" rel="noopener noreferrer">Eatwell Guide</a> describes the balance of food across a day or week. Fruit and vegetables, and starchy carbohydrates, each account for just over a third of what we eat overall. Include protein foods, dairy or alternatives, and small amounts of unsaturated oils. You do not need to reproduce those proportions in every meal. See the <a href="https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/" rel="noopener noreferrer">NHS explanation of the Eatwell Guide</a>.</p>'
  ]
  spec['body']=[{'before':a,'after':b} for a,b in zip(before,after)]
  spec['modifiedAt']='2026-11-01'
 html=(capture/'html'/r['file']).read_text()
 bylines=[p for p in re.findall(r'<p\b[^>]*>[\s\S]*?</p>',html) if 'sst-article-meta' in p and p.endswith('SHIFT Team</p>') and '<a ' not in p]
 if len(bylines)==1:
  old=bylines[0];spec['byline']={'before':old,'after':old.replace('SHIFT Team</p>','<a href="/authors/shift-some-timber-editorial-team" rel="author">SHIFT Team</a></p>')}
 pages[path]=spec
assert all(p in pages for p in titles)
def nodes(v):
 if isinstance(v,list):
  for x in v:yield from nodes(x)
 elif isinstance(v,dict):
  yield v
  for x in v.values():yield from nodes(x)
sitemap=[]
for r in eligible:
 dates=[v['dateModified'] for v in nodes(r.get('schema',[])) if isinstance(v.get('dateModified'),str) and re.fullmatch(r'\d{4}-\d\d-\d\d(?:T[^<]*)?',v['dateModified'])]
 date=max(dates) if dates else None
 if r['url'].endswith('/articles/mens-weight-loss-diet'):date='2026-11-01'
 sitemap.append({'url':r['url'],**({'lastmod':date} if date else {})})
data='export const version="sitewide-seo-20261101-v1";\nexport const pages='+json.dumps(pages,ensure_ascii=False,separators=(',',':'))+';\nexport const redirects='+json.dumps(redirects,ensure_ascii=False,separators=(',',':'))+';\nexport const sitemapPages='+json.dumps(sitemap,ensure_ascii=False,separators=(',',':'))+';\n'
(root/'data.mjs').write_text(data)
(root/'scope.json').write_text(json.dumps({'capturedPublicHtml':705,'initialAuditedUrls':696,'eligibleIndexablePages':len(eligible),'htmlScope':len(pages),'homepageAndStartHereHeld':True,'freshNoindexExcluded':['/programme/sample'],'titleRepairs':list(titles),'redirectRepairs':redirects,'sitemapPages':sitemap},indent=2,ensure_ascii=False)+'\n')
print({'eligible':len(eligible),'htmlScope':len(pages),'titleRepairs':len(titles),'redirects':len(redirects),'sitemapPages':len(sitemap)})
