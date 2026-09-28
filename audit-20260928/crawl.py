import concurrent.futures,hashlib,json,pathlib,re,time,urllib.request,urllib.parse,xml.etree.ElementTree as ET,collections
from bs4 import BeautifulSoup
ROOT='https://shiftsometimber.co.uk'; OUT=pathlib.Path('seo-proof');OUT.mkdir(exist_ok=True);(OUT/'html').mkdir(exist_ok=True)
def fetch(u):
 t=time.time()
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'SHIFT-authorised-SEO-audit/1.0'}),timeout=35) as r:
   return {'url':u,'final':r.url,'status':r.status,'headers':dict(r.headers),'seconds':time.time()-t,'body':r.read().decode('utf-8','replace')}
 except Exception as e:return {'url':u,'error':str(e)}
sm=fetch(ROOT+'/sitemap.xml');(OUT/'sitemap.xml').write_text(sm.pop('body'));urls=[e.text for e in ET.fromstring((OUT/'sitemap.xml').read_text()).iter() if e.tag.endswith('}loc')];(OUT/'sitemap-urls.json').write_text(json.dumps(urls,indent=2))
def audit(u):
 r=fetch(u)
 if 'body' not in r:return r
 h=r.pop('body');r['sha256']=hashlib.sha256(h.encode()).hexdigest();(OUT/'html'/ (r['sha256']+'.html')).write_text(h)
 s=BeautifulSoup(h,'html.parser');r['title']=[x.get_text(' ',strip=True) for x in s.find_all('title')];r['description']=[x.get('content','') for x in s.select('meta[name="description"]')];r['canonical']=[urllib.parse.urljoin(u,x.get('href','')) for x in s.select('link[rel="canonical"]')];r['robots']=[x.get('content','') for x in s.select('meta[name="robots"],meta[name="googlebot"]')];r['h1']=[x.get_text(' ',strip=True) for x in s.find_all('h1')];r['missingAlt']=[x.get('src') for x in s.find_all('img') if not x.has_attr('alt')];r['emptyAlt']=sum(x.get('alt')=='' for x in s.find_all('img'))
 r['social']={x.get('property',x.get('name')):x.get('content') for x in s.select('meta[property^="og:"],meta[name^="twitter:"]')};r['scripts']=[x.get('src') for x in s.select('script[src]')];r['jsonld']=[];r['jsonErrors']=[]
 for x in s.select('script[type="application/ld+json"]'):
  try:r['jsonld'].append(json.loads(x.string or x.get_text()))
  except Exception as e:r['jsonErrors'].append(str(e))
 r['links']=sorted(set(urllib.parse.urljoin(u,x.get('href','')).split('#')[0] for x in s.select('a[href]')))
 main=s.find('main') or s.body or s
 for x in main.select('script,style,nav,header,footer'):x.decompose()
 txt=main.get_text(' ',strip=True);r['words']=len(txt.split());r['mainHash']=hashlib.sha256(txt.encode()).hexdigest();r['markdownLinks']=re.findall(r'\[[^\]]{1,100}\]\(https?://[^)]+\)',txt)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as p: rows=list(p.map(audit,urls))
extra=sorted(set(l for r in rows for l in r.get('links',[]) if l.startswith(ROOT+'/') and l not in urls and not re.search(r'/(?:api|member|hq|checkout)(?:/|$)|\?|\.(?:pdf|png|jpg|webp|svg|zip)$',l)))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as p: extras=list(p.map(audit,extra))
for r in rows:
 r['flags']=[]
 if r.get('status')!=200:r['flags'].append('http')
 if r.get('final')!=r['url']:r['flags'].append('redirect')
 for k in ['title','description','h1']:
  if len(r.get(k,[]))!=1 or not r.get(k,[''])[0]:r['flags'].append(k)
 if r.get('canonical')!=[r['url']]:r['flags'].append('canonical')
 if 'noindex' in str(r.get('robots',[])).lower()+str(r.get('headers',{}).get('X-Robots-Tag','')).lower():r['flags'].append('noindex')
 if r.get('jsonErrors'):r['flags'].append('jsonSyntax')
 if r.get('missingAlt'):r['flags'].append('missingAlt')
duplicates={k:[v for v in (list(g) for _,g in __import__('itertools').groupby(sorted(rows,key=lambda x:str(x.get(k))),key=lambda x:str(x.get(k)))) if len(v)>1 and v[0].get(k)] for k in ['title','description','mainHash']}
out={'capturedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sitemap':sm,'urlCount':len(urls),'uniqueCount':len(set(urls)),'pages':rows,'extraPages':extras,'duplicates':{k:[[r['url'] for r in g] for g in groups] for k,groups in duplicates.items()}}
(OUT/'crawl.json').write_text(json.dumps(out,indent=2));(OUT/'robots.json').write_text(json.dumps(fetch(ROOT+'/robots.txt'),indent=2));(OUT/'https.json').write_text(json.dumps(fetch('http://shiftsometimber.co.uk/'),indent=2))
print(json.dumps({'count':len(rows),'extras':len(extras),'flags':[{k:r.get(k) for k in ['url','flags','error']} for r in rows if r['flags']],'brokenExtra':[r['url'] for r in extras if r.get('status',0)>=400 or 'error' in r],'duplicates':out['duplicates']}))
