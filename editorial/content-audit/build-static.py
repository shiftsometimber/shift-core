"""Replace only the reviewed reading copy in the exact current Pages master."""
import argparse, copy, gzip, hashlib, html, json, pathlib, re
BASE='af8e6d6669898ee32d060b4435dbb03c282ce6e3c41fb0e2e4ab3c52ecf2f4dd'
def digest(b):return hashlib.sha256(b).hexdigest()
def entry(n,s):
 b=s.encode();return dict(path=n,sha256=digest(b),bytes=len(b))
def once(s,p,r):
 s,n=re.subn(p,lambda _:r,s,flags=re.S);assert n==1,(p,n);return s
def section_id(i):return 'practical-step-'+str(i)
def build(source,out):
 p=json.loads(gzip.decompress(source.read_bytes()));assert p['source_fingerprint']==BASE,'Stale Pages source'
 base=copy.deepcopy(p);entries={e['path']:e for e in p['files']};updates={};reports=[]
 data=json.loads(pathlib.Path(__file__).with_name('static-articles.json').read_text());assert len(data['articles'])==21
 for a in data['articles']:
  name='articles/'+a['slug']+'.html';old=p['overrides'][name];assert entry(name,old)==entries[name]
  assert 'That sounds straightforward' in old and 'wet Wednesday' in old,'Generic-copy anchor changed: '+name
  escape=lambda s:html.escape(s,quote=True)
  body='<div class="sst-reading-lead-v31"><p class="standfirst">'+escape(a['intro'])+'</p></div>'
  for i,(heading,text) in enumerate(a['sections'],1):
   body+='<h2 id="'+section_id(i)+'">'+escape(heading)+'</h2>'
   body+=('<ul>'+''.join('<li>'+escape(t)+'</li>' for t in text)+'</ul>') if isinstance(text,list) else '<p>'+escape(text)+'</p>'
  body+='<h2 id="sources">Sources and further reading</h2><div class="sourcebox"><ul class="source-list">'+''.join('<li><a href="'+escape(url)+'"'+(' rel="noopener noreferrer"' if url.startswith('https:') else '')+'>'+escape(label)+'</a></li>' for label,url in a['sources'])+'</ul></div>'
  body+='<h2 id="next-step">Your next step</h2><p><a href="'+escape(a['next'][1])+'">'+escape(a['next'][0])+' →</a></p>'
  body+='<div class="author-box"><strong>SHIFT editorial information</strong><p>General information and practical examples. Individual diagnosis, treatment and exercise suitability belong with the appropriate qualified professional.</p></div>'
  start=re.search(r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>',old);assert start
  new=once(old,r'<article\b[^>]*class="sst-reading-article-v31"[^>]*>.*?</article>',start.group()+body+'</article>')
  toc='<div class="toc"><h3>On this page</h3><ol>'+''.join('<li><a href="#'+section_id(i)+'">'+escape(s[0])+'</a></li>' for i,s in enumerate(a['sections'],1))+'<li><a href="#sources">Sources</a></li><li><a href="#next-step">Next step</a></li></ol></div>'
  new=once(new,r'<div class="toc">.*?</ol></div>',toc)
  new=once(new,r'<div class="review-block">.*?</div>','<div class="review-block"><strong>Editorial review</strong><p>Reading copy and listed sources checked 2 October 2026. Independent clinical review is not claimed. General information does not replace individual advice.</p></div>')
  description=a['intro']
  # Hero summary, metadata and structured answers must describe the new text.
  hero=re.search(r'<section class="pagehero[^>]*>.*?</section>',new).group()
  paragraphs=list(re.finditer(r'<p(?:\s[^>]*)?>.*?</p>',hero,re.S));assert paragraphs
  last=paragraphs[-1];updated_hero=hero[:last.start()]+'<p>'+escape(description)+'</p>'+hero[last.end():]
  new=new.replace(hero,updated_hero,1)
  new=re.sub(r'(<meta\b[^>]*(?:name="(?:description|twitter:description)"|property="og:description")[^>]*content=")[^"]*(")',lambda m:m[1]+escape(description)+m[2],new)
  def schema(m):
   obj=json.loads(m[1]);typ=obj.get('@type')
   if typ=='FAQPage':return ''
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
  for forbidden in ['That sounds straightforward','wet Wednesday','Written and researched by Matt','Last reviewed: 10 April 2026']:
   assert forbidden not in new,(name,forbidden)
  updates[name]=new;target=out/'after'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(new)
  original=out/'before'/name;original.parent.mkdir(parents=True,exist_ok=True);original.write_text(old)
  reports.append(dict(path=name,before=entries[name]['sha256'],after=entry(name,new)['sha256'],sectionCount=len(a['sections']),clinicalReviewClaimed=False,headerFooterAndBehaviourScriptsPreserved=True))
 integrity=json.loads(p['overrides']['release-body-integrity.json'])
 for n,s in updates.items():integrity[n]=digest(s.split('</head>',1)[1].encode())
 updates['release-body-integrity.json']=json.dumps({n:integrity[n] for n in sorted(integrity,key=pathlib.PurePosixPath)},indent=2)+'\n'
 fp=json.loads(p['overrides']['DEPLOYMENT-FINGERPRINT.json']);fpe={e['path']:e for e in fp['files']}
 for n,s in updates.items():fpe[n]=entry(n,s)
 fp['files']=[fpe[n] for n in sorted(fpe,key=pathlib.PurePosixPath)];fp['file_count']=len(fp['files']);fp['aggregate_sha256']=digest(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode())
 updates['DEPLOYMENT-FINGERPRINT.json']=json.dumps(fp,indent=2)+'\n'
 for n,s in updates.items():p['overrides'][n]=s;entries[n]=entry(n,s)
 assert set(updates)=={'articles/'+a['slug']+'.html' for a in data['articles']}|{'DEPLOYMENT-FINGERPRINT.json','release-body-integrity.json'}
 assert set(entries)=={e['path'] for e in base['files']}
 assert all(entries[e['path']]==e for e in base['files'] if e['path'] not in updates)
 p['files']=[entries[n] for n in sorted(entries)];p['baseline_fingerprint']=BASE;p['source_fingerprint']=fp['aggregate_sha256']
 packed=gzip.compress(json.dumps(p,ensure_ascii=False,separators=(',',':')).encode(),mtime=0);out.mkdir(parents=True,exist_ok=True)
 (out/'source.json.gz').write_bytes(packed)
 control=dict(mode='preview',expected_live_fingerprint=BASE,source_fingerprint=p['source_fingerprint'],payload_sha256=digest(packed),preview_browser_checks_passed=False)
 (out/'control.json').write_text(json.dumps(control,indent=2)+'\n')
 proof=dict(baseline=BASE,candidate=p['source_fingerprint'],changedFiles=list(updates),preservedFiles=len(entries)-len(updates),reports=reports,productionWrites=0)
 (out/'proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps({k:v for k,v in proof.items() if k!='reports'}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=pathlib.Path,required=True);parser.add_argument('--out',type=pathlib.Path,required=True);a=parser.parse_args();build(a.source,a.out)
