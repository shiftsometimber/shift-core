from pathlib import Path
from html.parser import HTMLParser
import re,json,hashlib
r=Path(__file__).parent;prep=json.loads((r/'prepared-changes.json').read_text());base=json.loads((r/'base-deployment.json').read_text());removed=set(prep['remove'])
class P(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.parts=[];self.description='';self.title=[];self.inTitle=False
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ('script','style'):self.skip+=1
  if t=='title':self.inTitle=True
  if t=='meta' and a.get('name','').lower()=='description':self.description=a.get('content','')
  if t in ('p','li','h1','h2','h3','div','td','summary'):self.parts.append(' ')
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip=max(0,self.skip-1)
  if t=='title':self.inTitle=False
 def handle_data(self,d):
  if not self.skip:self.parts.append(d)
  if self.inTitle:self.title.append(d)
def source(url):
 path=url.split('?',1)[0].split('#',1)[0]
 if path.startswith('https://shiftsometimber.co.uk'):path=path[len('https://shiftsometimber.co.uk'):]
 if path=='/':path='/index'
 key=path if path.endswith('.html') else path+'.html'
 if key in removed:return False
 for folder in ['after','before']:
  f=r/folder/key.lstrip('/')
  if f.exists():
   raw=f.read_text();m=re.search(r'<main\b[\s\S]*?</main>',raw,re.I);p=P();p.feed(raw);body=P();body.feed(m[0] if m else raw);return {'title':''.join(p.title).split(' | ')[0].strip(),'desc':p.description,'keywords':re.sub(r'\s+',' ',''.join(body.parts)).strip()}
for name in ['/search-index-v3a.json','/assets/knowledge-index.json']:
 old=(r/'before'/name.lstrip('/')).read_text();rows=json.loads(old);result=[];updated=0;dropped=0
 for row in rows:
  x=source(row.get('url',''))
  if x is False:dropped+=1;continue
  new=dict(row)
  if x:
   new['title']=x['title'] or new['title']
   if 'description' in new:new['description']=x['desc'] or new['description']
   if 'desc' in new:new['desc']=x['desc'] or new['desc']
   if 'keywords' in new:new['keywords']=x['keywords'] if isinstance(new['keywords'],str) else x['keywords'].split()[:100]
  updated+=new!=row;result.append(new)
 data=json.dumps(result,ensure_ascii=False,separators=(',',':'));out=r/'after'/name.lstrip('/');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(data)
 prep['changes'].append({'path':name,'beforeSHA256':hashlib.sha256(old.encode()).hexdigest(),'afterSHA256':hashlib.sha256(data.encode()).hexdigest(),'edits':updated,'removedEntries':dropped})
 print(name,'updated',updated,'removed',dropped)
(r/'prepared-changes.json').write_text(json.dumps(prep,indent=2))
