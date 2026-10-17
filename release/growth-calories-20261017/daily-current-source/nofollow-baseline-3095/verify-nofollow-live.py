from pathlib import Path
from html.parser import HTMLParser
import html,json,re,hashlib,datetime,subprocess
ROOT=Path(__file__).parent
BASE=ROOT/'pre-core3095-baselines'
CASES=[
('glp-1-constipation','https://nutrilike.es/probioticos-para-colon-irritable-cuales-funcionan-y-como-elegir-el-adecuado','Fibre is the other pillar'),
('glp-1-and-alcohol','https://getrecover365.com/blogs/blog/what-alcohol-really-does-to-your-liver-and-how-to-help-it-recover',"Recover 365's guide to alcohol and liver recovery"),
('glp-1-weight-loss-plateau','https://vivoclinic.org/blog/tirzepatide-vs-semaglutide','clinical review of tirzepatide versus semaglutide')]
class Anchors(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.current=None;self.canonical=None
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='a':self.current={'attrs':d,'label':'','raw':self.get_starttag_text()}
  if tag=='link' and d.get('rel')=='canonical':self.canonical=d.get('href')
 def handle_data(self,d):
  if self.current:self.current['label']+=d
 def handle_endtag(self,tag):
  if tag=='a' and self.current:self.links.append(self.current);self.current=None
def parse(s,url,label):
 p=Anchors();p.feed(s);found=[a for a in p.links if a['attrs'].get('href')==url and a['label'].strip()==label];assert len(found)==1,(url,'exact anchor match',len(found));return p,found[0]
def article(s):
 parts=re.findall(r'<main\b[^>]*>[\s\S]*?</main>',s,re.I)
 assert len(parts)==1,'Exactly one actual published main container required'
 opening=parts[0].split('>',1)[0]+'>'
 assert re.search(r'\bid=["\']main-content["\']',opening),'Exact published article main identity required'
 assert 'sst-dynamic-article' in opening,'Exact published article main class required'
 return parts[0]
def dates(s):
 out=[]
 for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',s,re.I):
  v=json.loads(html.unescape(m[1]))
  for obj in v if isinstance(v,list) else [v]:
   if obj.get('@type') in ['Article','BlogPosting']:out.append({k:obj.get(k) for k in ['datePublished','dateModified']})
 return out
receipt={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'live_verified','bodyContainer':'main#main-content.sst-dynamic-article','syntheticVerification':True,'javascriptExecuted':False,'customerOutcome':False,'cases':[]}
for slug,url,label in CASES:
 before=(BASE/(slug+'.html')).read_text();after=(ROOT/(slug+'-after.html')).read_text()
 pb,b=parse(before,url,label);pa,a=parse(after,url,label)
 old=b['attrs'];new=a['attrs'];rel=new['rel'].split()
 assert 'nofollow' in rel and set(rel)==set(old.get('rel','').split())|{'nofollow'},(slug,'only exact rel addition',old,new)
 assert {k:v for k,v in old.items() if k!='rel'}=={k:v for k,v in new.items() if k!='rel'},(slug,'unrelated anchor attributes changed')
 assert article(after).replace(a['raw'],b['raw'],1)==article(before),(slug,'article body differs beyond exact approved opening tag')
 assert pb.canonical==pa.canonical=='https://shiftsometimber.co.uk/articles/'+slug
 assert dates(before) and dates(after),'Actual nonempty article dates are required'
 assert dates(before)==dates(after),(slug,'article publication/modification dates changed')
 receipt['cases'].append({'url':pa.canonical,'destination':url,'anchor':label,'relBefore':old.get('rel'),'relAfter':new['rel'],'articleBodyOnlyRelChanged':True,'datesPreserved':dates(after),'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()})
receipt['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(ROOT/'nofollow-live-proof-3095.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
