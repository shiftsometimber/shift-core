"""Convert the three explicitly owner-approved packs into escaped publishing data.
The supplied Word documents are input evidence; they are never altered.
"""
from pathlib import Path
import json,re,html,hashlib
ROOT=Path(__file__).resolve().parent
evidence=Path('/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/refresh-20261022')
packs=json.loads((evidence/'packs.json').read_text())
esc=lambda s:html.escape(s,quote=True)
links={
'day1':{'check your BMI':'/tools/bmi','Measure your waist':'/tools/waist-height','Start Here':'/start-here'},
'day2':{'health MOT hub':'/shift-health/health-mot','Measure your waist':'/tools/waist-height','check your BMI':'/tools/bmi','understanding results':'/articles/understanding-blood-test-results','private blood test':'/shift-health/blood-tests','Start Here':'/start-here'},
'day3':{'sleep':'/articles/sleep-and-weight-men','testosterone and energy':'/shift-health/testosterone-energy','male obesity':'/male-obesity','regular strength':'/guides/exercise-walking-strength-mobility','Track energy/sleep in My Timber':'/member/dashboard'}
}
def inline(s,day):
 s=s.replace('thoughts of harming yourself. Call 999 or go to A&E.','immediate danger of serious self-harm. Call 999 or go to A&E.')
 s=s.replace('especially round the middle','especially around the middle')
 if day=='day2':s=s.replace('40 or over: many pharmacies offer free blood pressure checks, even between invitations.','40 or over: you may be eligible for a free NHS pharmacy blood pressure check, even between invitations. Ask the pharmacy about eligibility.')
 # Convert explicit link annotations in the supplied Day 3 pack.
 for label,url in links[day].items():
  s=s.replace(label+' [link: '+url+']',label)
 s=re.sub(r'\s*\[link: /[^\]]+\]','',s)
 value=esc(s)
 for label,url in links[day].items():
  value=re.sub(r'(?<![A-Za-z])'+re.escape(esc(label))+r'(?![A-Za-z])','<a href="'+url+'">'+esc(label)+'</a>',value,count=1)
 if day=='day1' and s.startswith('Private blood tests:'):value+=' See our information about <a href="/shift-health/health-mot">private health checks</a>.'
 if day=='day1' and s.startswith('Blood pressure at a pharmacy:'):value+=' Read our <a href="/guides/blood-pressure-guide">blood pressure guide</a>.'
 return value
def body(day):
 rows=packs[day]['paragraphs'];start=False;parts=[];faq=[];faqs=False;question=None;intro=None;title=None;bullets=[]
 def flush():
  if bullets:parts.append('<ul>'+''.join('<li>'+x+'</li>' for x in bullets)+'</ul>');bullets.clear()
 for row in rows:
  s=row['text'];style=row['style']
  if (day=='day3' and s=='Body') or (day!='day3' and s.startswith('Part 1:')):start=True;continue
  if not start:continue
  if s.startswith('Sources (excluded') or s=='Internal links' or s.startswith('Part 2:'):break
  if day!='day3' and style=='Heading 1':title=s;continue
  if style.startswith('Heading'):
   flush()
   if s in ['FAQ','Frequently asked questions']:faqs=True;parts.append('<h'+('3' if day=='day1' else '2')+'>Frequently asked questions</h'+('3' if day=='day1' else '2')+'>');continue
   level=3 if day=='day1' else 2
   parts.append('<h'+str(level)+'>'+esc(s)+'</h'+str(level)+'>');continue
  if faqs and style=='Normal' and not s.startswith('Ready for'):
   if question is None:question=s
   else:
    faq.append({'q':question,'a':s});parts.append('<details><summary>'+esc(question)+'</summary><p>'+inline(s,day)+'</p></details>');question=None
   continue
  if s.startswith('Ready for'):faqs=False
  if style=='List Bullet':bullets.append(inline(s,day));continue
  flush()
  if intro is None:intro=s
  parts.append(('<blockquote><p>' if style=='Intense Quote' else '<p>')+inline(s,day)+('</p></blockquote>' if style=='Intense Quote' else '</p>'))
 flush()
 if day=='day3':
  parts.append('<p>If you need urgent mental health help and are not in immediate danger, call NHS 111 and select the mental health option, or ask your GP for an urgent appointment.</p>')
 return title,intro,''.join(parts),faq
data=[]
config=[
('day1','/male-obesity','2026-10-10','Male Obesity: BMI, Waist and Your First Health Check','Obese or not sure? What BMI and waist mean for men, who gets a free NHS Health Check, and checks for under-40s and over-74s.'),
('day2','/guides/mens-health-mot-guide','2026-05-04',"Men's Health MOT: What's Checked and Is It Worth It?","What a men's health MOT checks, who gets a free NHS Health Check, routes for under-40s and over-74s, and when a private MOT is worth it."),
('day3','/articles/testosterone-weight-men','2026-08-26','Does Weight Gain Lower Testosterone in Men? | Shift Some Timber','Weight gain and low testosterone can feed each other. Learn why symptoms are not a diagnosis, what weight loss may do, and when to see your GP.')
]
sources={
'day1':[('NHS Health Check','https://www.nhs.uk/tests-and-treatments/nhs-health-check/'),('NHS: high blood pressure','https://www.nhs.uk/conditions/high-blood-pressure/'),('NHS: when to call 999','https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/'),('NHS: when to use 111','https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/'),('NICE: overweight and obesity management','https://www.nice.org.uk/guidance/ng246')],
'day2':[('NHS Health Check','https://www.nhs.uk/tests-and-treatments/nhs-health-check/'),('NHS: high blood pressure','https://www.nhs.uk/conditions/high-blood-pressure/'),('UK National Screening Committee: NHS and commercial screening','https://www.gov.uk/government/publications/uk-nsc-commercial-screening-test-considerations/nhs-and-commercial-health-screening-tests-important-considerations'),('NHS: when to call 999','https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/')],
'day3':[('European Academy of Andrology: functional hypogonadism guideline (Corona et al., 2020)','https://pubmed.ncbi.nlm.nih.gov/32026626/'),('NICE: overweight and obesity management','https://www.nice.org.uk/guidance/ng246'),('NHS: obesity','https://www.nhs.uk/conditions/obesity/'),('NHS: adult physical activity guidance','https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/'),('NHS: urgent mental health help','https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/')]
}
for day,path,date,seo,description in config:
 title,intro,content,faq=body(day)
 if day=='day3':title='Testosterone and weight: which comes first?'
 elif day=='day1':title='Male obesity: what it means for your health. What to do next.'
 hero=None
 if day in ['day2','day3']:
  asset='mens-health-mot-check-web.jpg' if day=='day2' else 'day03-hero-web.jpg';sha=hashlib.sha256((ROOT/'assets'/asset).read_bytes()).hexdigest()[:12]
  hero={'asset':asset,'url':'https://shiftsometimber.co.uk/uploads/blog/refresh-'+sha+'.jpg','alt':'Man in his 40s having his blood pressure checked during a health check' if day=='day2' else 'Three men of different ages and backgrounds walking and chatting on a leafy park path on an autumn morning.','caption':'A health check turns guesswork into a few numbers you can act on.' if day=='day2' else 'AI-generated illustration with fictional people.'}
 sourceHtml='<section class="refresh-sources"><h'+('3' if day=='day1' else '2')+'>Sources</h'+('3' if day=='day1' else '2')+'><ul>'+''.join('<li><a href="'+esc(u)+'" rel="noopener noreferrer">'+esc(t)+'</a></li>'for t,u in sources[day])+'</ul></section>'
 content+=sourceHtml
 if day=='day1':
  content='<section id="first-health-check" class="approved-health-refresh"><h2>Male obesity: which health check should a man get first?</h2>'+content+'<p>Want to know what a health check actually measures? See our <a href="/guides/mens-health-mot-guide">men’s health MOT guide</a>.</p><p>Read about <a href="/articles/testosterone-weight-men">testosterone and weight</a>.</p></section>'
 data.append({'day':day,'path':path,'published':date,'modified':'2026-10-22','title':title,'seoTitle':seo,'description':description,'intro':intro,'html':content,'faq':faq,'sources':[u for t,u in sources[day]],'hero':hero,'packSHA256':hashlib.sha256(json.dumps(packs[day],sort_keys=True).encode()).hexdigest()})
(ROOT/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Prepared',[(x['path'],len(x['html']),len(x['faq']))for x in data])
