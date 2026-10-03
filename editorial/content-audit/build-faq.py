"""Replace only the reviewed reading copy in the exact current Pages master."""
import argparse, copy, gzip, hashlib, html, json, pathlib, re
BASE='2a6e5fd16f57a82967545ca7bfed76e75879de77bff054c1aee00f2ee622f4b2'
def digest(b):return hashlib.sha256(b).hexdigest()
def entry(n,s):
 b=s.encode();return dict(path=n,sha256=digest(b),bytes=len(b))
def once(s,p,r):
 s,n=re.subn(p,lambda _:r,s,flags=re.S);assert n==1,(p,n);return s
def section_id(i):return 'practical-step-'+str(i)
def amend_mot(p,entries,updates,out,reports):
 n='health-mot.html';old=p['overrides'][n];assert entry(n,old)==entries[n]
 new=old.replace('<span>Your Shift MOT score</span>','<span>Priority signals</span>').replace('<strong id="motScore">','<strong id="motScore" style="font-size:clamp(20px,2.5vw,28px);overflow-wrap:anywhere">')
 edits={
  'Your saved Health MOT profile becomes the baseline for the Progress Centre.':'This public report stays in this browser. My Timber Progress Centre is separate: record the measurements you choose there; this tool does not upload them.',
  'Use your saved Health MOT in the Decision Centre to explore relevant pathways.':'Use the report to prepare questions, then explore general options in the Decision Centre. Opening it does not transfer this report or establish treatment suitability.',
  'Use your saved Health MOT in the Treatment Finder.':'The Treatment Finder is a separate information tool. Opening it does not transfer this report or create a clinical assessment.'}
 for before,after in edits.items():assert new.count(before)==1;new=new.replace(before,after)
 assert 'id="motReport"' not in new
 marker='<section><div class="sst-reading-grid-v31 wrap"><div class="sst-reading-article-v31">\n<div class="sst-reading-lead-v31"></div><p class="eyebrow">Your Shift Health Report</p>'
 assert new.count(marker)==1,'Report wrapper changed'
 new=new.replace(marker,marker.replace('<section>','<section id="motReport" aria-live="polite">'),1)
 new=new.replace('</head>','<style id="mot-report-visibility-repair">#motReport{display:none}#motReport.visible{display:block}</style></head>',1)
 updates[n]=new
 n='health-mot.js';oldjs=p['overrides'][n];assert entry(n,oldjs)==entries[n]
 newjs=once(oldjs,r" const score=Math.max\(25,Math.min\(95,88-high\*11-review\*6\)\);.*?\$\('motScoreText'\).textContent=.*?;", " $('motScore').textContent=`${high} higher priority · ${review} worth reviewing`;\n $('motScoreText').textContent='These counts summarise the report categories. They are not a validated health score, diagnosis or estimate of disease risk.';")
 assert '${score}/100' not in newjs and 'const score=' not in newjs
 updates[n]=newjs
 n='health-mot-methodology.html';oldmethod=p['overrides'][n];assert entry(n,oldmethod)==entries[n]
 before='The static MOT stores a structured profile in the browser using <code>localStorage</code> so later Progress Centre releases can reuse it on the same device. It does not itself send those answers to Shift Some Timber or a server.'
 if before not in oldmethod:
  match=re.search(r'<p>The static MOT stores a structured profile.*?</p>',oldmethod);assert match;before=match[0]
  after='<p>The legacy browser Health MOT questionnaire stores its answers and report data in local storage on the device where it runs. It does not upload them to SHIFT or into My Timber. A shared browser can retain sensitive answers after the page closes. Clear this site’s browser data to remove the local copy; that does not erase separate account-backed information. The main Health MOT link now leads to the separate SHIFT Health home blood-test information page. This methodology describes the older questionnaire, not a laboratory service or enabled results integration.</p>'
 else:after='The legacy browser Health MOT questionnaire stores its answers and report data in local storage on the device where it runs. It does not upload them to SHIFT or into My Timber. A shared browser can retain sensitive answers after the page closes. Clear this site’s browser data to remove the local copy; that does not erase separate account-backed information. The main Health MOT link now leads to the separate SHIFT Health home blood-test information page. This methodology describes the older questionnaire, not a laboratory service or enabled results integration.'
 updates[n]=oldmethod.replace(before,after,1)
 for n in ['health-mot.html','health-mot.js','health-mot-methodology.html']:
  before=p['overrides'][n];after=updates[n]
  for folder,content in [('before',before),('after',after)]:target=out/folder/n;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
  if n.endswith('.html'):
   for tag in ['header','footer','h1']:assert re.findall(r'<'+tag+r'\b.*?</'+tag+'>',after,re.S)==re.findall(r'<'+tag+r'\b.*?</'+tag+'>',before,re.S)
  reports.append(dict(path=n,before=entries[n]['sha256'],after=entry(n,after)['sha256'],reason='Correct local-storage and unvalidated-score claims; retain form and thresholds'))
def amend_guides(p,entries,updates,out,reports):
 data=json.loads(pathlib.Path(__file__).with_name('core-guides.json').read_text());assert len(data['articles'])==4
 for a in data['articles']:
  n='guides/'+a['slug']+'.html';old=p['overrides'][n];assert entry(n,old)==entries[n]
  assert 'Use recognised health guidance as the framework' in old
  escape=lambda s:html.escape(s,quote=True)
  body='<div class="sst-reading-lead-v31"><p class="standfirst">'+escape(a['intro'])+'</p></div>'
  for i,(heading,text) in enumerate(a['sections'],1):
   body+='<h2 id="'+section_id(i)+'">'+escape(heading)+'</h2>'
   body+=('<ul>'+''.join('<li>'+escape(t)+'</li>' for t in text)+'</ul>') if isinstance(text,list) else '<p>'+escape(text)+'</p>'
  body+='<h2 id="sources">Sources and further reading</h2><ul>'+''.join('<li><a href="'+escape(url)+'">'+escape(label)+'</a></li>' for label,url in a['sources'])+'</ul>'
  body+='<h2 id="next-step">Your next step</h2><p><a href="'+escape(a['next'][1])+'">'+escape(a['next'][0])+' →</a></p>'
  start=re.search(r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>',old);assert start
  new=once(old,r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>.*?</article>',start.group()+body+'</article>')
  new=once(new,r'<div class="review-block">.*?</div>','<div class="review-block"><strong>Editorial review</strong><p>Reading copy and listed sources checked 3 October 2026. General information does not replace individual advice. Independent clinical review is separate.</p></div>')
  hero=re.search(r'<section\b[^>]*>(?:(?!</section>).)*?<h1\b.*?</section>',new,re.S);assert hero
  paragraphs=list(re.finditer(r'<p(?:\s[^>]*)?>.*?</p>',hero[0],re.S));assert paragraphs
  last=paragraphs[-1];newhero=hero[0][:last.start()]+'<p>'+escape(a['intro'])+'</p>'+hero[0][last.end():]
  new=new.replace(hero[0],newhero,1)
  def meta(m):
   s=m[0]
   if re.search(r'(?:name|property)="(?:description|twitter:description|og:description)"',s):s=re.sub(r'content="[^"]*"','content="'+escape(a['intro'])+'"',s)
   return s
  new=re.sub(r'<meta\b[^>]*>',meta,new)
  def schema(m):
   obj=json.loads(m[1])
   if obj.get('@type') in ['Article','MedicalWebPage']:
    obj['description']=a['intro'];obj['dateModified']='2026-10-03';obj.pop('reviewedBy',None)
    if obj.get('@type')=='Article':obj['author']={'@type':'Organization','@id':'https://shiftsometimber.co.uk/#organization','name':'Shift Some Timber','url':'https://shiftsometimber.co.uk/','logo':obj['publisher']['logo']}
    return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'
   return m[0]
  new=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',schema,new,flags=re.S)
  new=new.replace('Evidence reviewed August 2026','Sources checked 3 October 2026; clinical review separate')
  for tag in ['header','footer','h1']:assert re.findall(r'<'+tag+r'\b.*?</'+tag+'>',new,re.S)==re.findall(r'<'+tag+r'\b.*?</'+tag+'>',old,re.S)
  assert 'Use recognised health guidance as the framework' not in new and 'Written and researched by Matt' not in new
  updates[n]=new
  for folder,s in [('before',old),('after',new)]:target=out/folder/n;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s)
  reports.append(dict(path=n,before=entries[n]['sha256'],after=entry(n,new)['sha256'],reason='Replace repeated generic guide with topic-specific sourced guidance',clinicalReviewClaimed=False))
def build(source,out):
 p=json.loads(gzip.decompress(source.read_bytes()));assert p['source_fingerprint']==BASE,'Stale Pages source'
 base=copy.deepcopy(p);entries={e['path']:e for e in p['files']};updates={};reports=[]
 data=json.loads(pathlib.Path(__file__).with_name('faq-copy.json').read_text());assert len(data['articles'])==32
 for a in data['articles']:
  name='faq/'+a['slug']+'.html';old=p['overrides'][name];assert entry(name,old)==entries[name]
  assert 'The fuller answer' in old and 'What should you take from this?' in old,'FAQ template changed: '+name
  escape=lambda s:html.escape(s,quote=True)
  body='<div class="sst-reading-lead-v31"><p class="standfirst">'+escape(a['intro'])+'</p></div>'
  for i,(heading,text) in enumerate(a['sections'],1):
   body+='<h2 id="'+section_id(i)+'">'+escape(heading)+'</h2>'
   body+=('<ul>'+''.join('<li>'+escape(t)+'</li>' for t in text)+'</ul>') if isinstance(text,list) else '<p>'+escape(text)+'</p>'
  body+='<h2 id="sources">Sources and further reading</h2><div class="sourcebox"><ul class="source-list">'+''.join('<li><a href="'+escape(url)+'"'+(' rel="noopener noreferrer"' if url.startswith('https:') else '')+'>'+escape(label)+'</a></li>' for label,url in a['sources'])+'</ul></div>'
  body+='<h2 id="next-step">Your next step</h2><p><a href="'+escape(a['next'][1])+'">'+escape(a['next'][0])+' →</a></p>'
  body+='<p class="editorial-review-date">Answer and listed sources checked 2 October 2026.</p>'
  body+='<div class="author-box"><strong>SHIFT editorial information</strong><p>General information and practical examples. Individual diagnosis, treatment and exercise suitability belong with the appropriate qualified professional.</p></div>'
  start=re.search(r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>',old);assert start
  new=once(old,r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>.*?</article>',start.group()+body+'</article>')
  toc='<div class="toc"><h3>On this page</h3><ol>'+''.join('<li><a href="#'+section_id(i)+'">'+escape(s[0])+'</a></li>' for i,s in enumerate(a['sections'],1))+'<li><a href="#sources">Sources</a></li><li><a href="#next-step">Next step</a></li></ol></div>'
  new=once(new,r'<div class="toc">.*?</ol></div>',toc)
  description=a['intro']
  # Hero summary, metadata and structured answers must describe the new text.
  hero=re.search(r'<section class="pagehero[^>]*>.*?</section>',new).group()
  paragraphs=list(re.finditer(r'<p(?:\s[^>]*)?>.*?</p>',hero,re.S));assert paragraphs
  last=paragraphs[-1];updated_hero=hero[:last.start()]+'<p>'+escape(description)+'</p>'+hero[last.end():]
  new=new.replace(hero,updated_hero,1)
  new=re.sub(r'(<meta\b[^>]*(?:name="(?:description|twitter:description)"|property="og:description")[^>]*content=")[^"]*(")',lambda m:m[1]+escape(description)+m[2],new)
  def schema(m):
   obj=json.loads(m[1]);typ=obj.get('@type')
   if typ=='FAQPage':
    assert len(obj['mainEntity'])==1;obj['mainEntity'][0]['acceptedAnswer']['text']=description
    return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'
   if typ in ['Article','MedicalWebPage']:
    obj['description']=description;obj['dateModified']='2026-10-02';obj.pop('reviewedBy',None)
    if typ=='Article':obj['author']={'@type':'Organization','@id':'https://shiftsometimber.co.uk/#organization','name':'Shift Some Timber','url':'https://shiftsometimber.co.uk/','logo':obj['publisher']['logo']}
    return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'
   return m[0]
  new=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',schema,new,flags=re.S)
  for tag in ['header','footer']:
   assert re.findall(r'<'+tag+r'\b.*?</'+tag+'>',new,re.S)==re.findall(r'<'+tag+r'\b.*?</'+tag+'>',old,re.S),tag+' changed'
  assert re.findall(r'<h1\b.*?</h1>',new,re.S)==re.findall(r'<h1\b.*?</h1>',old,re.S)
  assert re.findall(r'<script\b[^>]*src="[^"]*"[^>]*>.*?</script>',new,re.S)==re.findall(r'<script\b[^>]*src="[^"]*"[^>]*>.*?</script>',old,re.S)
  for forbidden in ['The fuller answer','What should you take from this?','Written and researched by Matt','Last reviewed: 10 April 2026']:
   assert forbidden not in new,(name,forbidden)
  updates[name]=new;target=out/'after'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(new)
  original=out/'before'/name;original.parent.mkdir(parents=True,exist_ok=True);original.write_text(old)
  reports.append(dict(path=name,before=entries[name]['sha256'],after=entry(name,new)['sha256'],sectionCount=len(a['sections']),clinicalReviewClaimed=False,headerFooterAndBehaviourScriptsPreserved=True))
 amend_mot(p,entries,updates,out,reports)
 amend_guides(p,entries,updates,out,reports)
 # Restore the exact existing approved legacy sprite; no catalogue/review mutation.
 sprite='assets/fit/shift-fit-batch2.svg'
 assert sprite not in entries,'Legacy sprite now exists in the reviewed baseline'
 original=pathlib.Path(sprite).read_text()
 assert digest(original.encode())=='0ae9686743e2b98e6837fbfeab6d1ad06e44e86ebd3d243c341a590c9c3a68bc'
 for fragment in ['bird-dog','goblet-squat','floor-press']:assert 'id="'+fragment+'"' in original
 updates[sprite]=original;target=out/'after'/sprite;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(original)
 reports.append(dict(path=sprite,before=None,after=digest(original.encode()),reason='Restore original repository asset referenced by three published legacy exercises; no new review attestation'))
 integrity=json.loads(p['overrides']['release-body-integrity.json'])
 for n,s in updates.items():
  if n.endswith('.html'):integrity[n]=digest(s.split('</head>',1)[1].encode())
 updates['release-body-integrity.json']=json.dumps({n:integrity[n] for n in sorted(integrity,key=pathlib.PurePosixPath)},indent=2)+'\n'
 fp=json.loads(p['overrides']['DEPLOYMENT-FINGERPRINT.json']);fpe={e['path']:e for e in fp['files']}
 for n,s in updates.items():fpe[n]=entry(n,s)
 fp['files']=[fpe[n] for n in sorted(fpe,key=pathlib.PurePosixPath)];fp['file_count']=len(fp['files']);fp['aggregate_sha256']=digest(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode())
 updates['DEPLOYMENT-FINGERPRINT.json']=json.dumps(fp,indent=2)+'\n'
 for n,s in updates.items():p['overrides'][n]=s;entries[n]=entry(n,s)
 assert set(updates)=={'faq/'+a['slug']+'.html' for a in data['articles']}|{'guides/'+a['slug']+'.html' for a in json.loads(pathlib.Path(__file__).with_name('core-guides.json').read_text())['articles']}|{'health-mot.html','health-mot.js','health-mot-methodology.html',sprite,'DEPLOYMENT-FINGERPRINT.json','release-body-integrity.json'}
 assert set(entries)=={e['path'] for e in base['files']}|{sprite}
 assert all(entries[e['path']]==e for e in base['files'] if e['path'] not in updates)
 p['files']=[entries[n] for n in sorted(entries)];p['baseline_fingerprint']=BASE;p['source_fingerprint']=fp['aggregate_sha256']
 packed=gzip.compress(json.dumps(p,ensure_ascii=False,separators=(',',':')).encode(),mtime=0);out.mkdir(parents=True,exist_ok=True)
 (out/'source.json.gz').write_bytes(packed)
 control=dict(mode='preview',expected_live_fingerprint='f8d98d450a23297b688a9acca5f887670bb556d2102bdaa2fad61a4d33101e5c',source_fingerprint=p['source_fingerprint'],payload_sha256=digest(packed),preview_browser_checks_passed=False)
 (out/'control.json').write_text(json.dumps(control,indent=2)+'\n')
 proof=dict(baseline=BASE,candidate=p['source_fingerprint'],changedFiles=list(updates),preservedFiles=len(entries)-len(updates),reports=reports,productionWrites=0)
 (out/'proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps({k:v for k,v in proof.items() if k!='reports'}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,required=True);parser.add_argument('--out',type=pathlib.Path,required=True);a=parser.parse_args();build(a.source,a.out)
