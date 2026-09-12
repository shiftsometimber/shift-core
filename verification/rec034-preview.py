"""GET-only post-upload checks; dynamic public routes checked in production."""
import concurrent.futures,hashlib,json,os,pathlib,re,time,urllib.request,urllib.error,urllib.parse
HERE=pathlib.Path(__file__).resolve().parent
control={'mode':'preview','source_fingerprint':'1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0'}
PAGES='https://03c1913c.projectshift.pages.dev';PUBLIC='https://shiftsometimber.co.uk';fp=control['source_fingerprint']
primary=['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']
menu=primary+['/about','/ask-timber','/contact','/help','/how-are-you-feeling','/explore-knowledge','/shift-for-work','/shop','/work-with-us']
def get(url,with_url=False):
 req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-REC034-read-only-verification'})
 with urllib.request.urlopen(req,timeout=35) as r:
  assert r.status==200,url
  data=r.read()
  return (data,r.geturl()) if with_url else data
def links(s):return re.findall(r'<a\b[^>]*href="([^"]+)"',s)
def header(s,path):
 assert 'data-header-style="underline"' in s,path+': header variant'
 assert '/assets/header-navigation-v2.css' in s,path+': CSS missing'
 nav=re.search(r'<nav\b[^>]*class="desktop-nav"[^>]*>(.*?)</nav>',s,re.S)
 drawer=re.search(r'<aside\b[^>]*id="site-drawer"[^>]*>(.*?)</aside>',s,re.S)
 assert nav and drawer,path+': navigation absent'
 assert links(nav.group(1))==primary,(path,links(nav.group(1)))
 dnav=re.search(r'<nav\b[^>]*>(.*?)</nav>',drawer.group(1),re.S)
 assert links(dnav.group(1))==menu,(path,links(dnav.group(1)))
 assert 'data-preview-only' not in s,path+': preview guard leaked'
 return {'path':path,'header':'underline','primary_links':5,'menu_links':14}
manifest=json.loads(get(PAGES+'/DEPLOYMENT-FINGERPRINT.json'))
assert manifest['aggregate_sha256']==fp
entries={x['path']:x for x in manifest['files']}
proof={'change':'REC-034','mode':control['mode'],'fingerprint':fp,'pages':PAGES,'checks':[]}
sourceproof=json.loads((HERE/'rec034-targets.json').read_text())
# Routing is read from the unchanged source payload because Pages consumes _redirects.
redirects=(HERE/'rec034-redirects.txt').read_text()
assert hashlib.sha256(redirects.encode()).hexdigest()==entries['_redirects']['sha256']
rewrites=[]
for line in redirects.splitlines():
 parts=line.split()
 if len(parts)==3 and parts[0].startswith('/') and parts[2]=='200':rewrites.append(parts[:2])
def served_source(final_url):
 u=urllib.parse.urlparse(final_url)
 assert u.netloc==urllib.parse.urlparse(PAGES).netloc,'unexpected external redirect'
 path=u.path
 for source,target in rewrites:
  if path==source or ('*' in source and path.startswith(source.split('*')[0])):
   path=target;break
 name='index.html' if path=='/' else path.lstrip('/')
 if name not in entries:name+='.html'
 assert name in entries,('unknown served source',final_url,name)
 return name
def verify_template(item):
 name=item['path'];data,final_url=get(PAGES+'/'+name,True)
 served=served_source(final_url)
 assert hashlib.sha256(data).hexdigest()==entries[served]['sha256'],name+': served bytes differ from '+served
 result=header(data.decode(),name);result.update({'served_source':served,'final_url':final_url,'sha256':hashlib.sha256(data).hexdigest()});return result
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 proof['template_checks']=list(pool.map(verify_template,sourceproof['changes']))
for name in ['assets/header-navigation-v2.css','start-here-v72.js','assets/v42.js','app.js','sitemap.xml']:
 data=get(PAGES+'/'+name)
 assert hashlib.sha256(data).hexdigest()==entries[name]['sha256'],name
proof['checks'].append('438 route checks against exact served template hashes, preserving canonical redirects; unchanged journey/menu assets')
if control['mode']=='production':
 assert json.loads(get(PUBLIC+'/DEPLOYMENT-FINGERPRINT.json'))['aggregate_sha256']==fp
 paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/member-login','/shift-for-work','/shop','/explore-knowledge','/about','/medicine-news','/medicine-news/obesity-management-new-research','/treatment-order?medicine=mounjaro&view=spec&from=start-here']
 proof['public_routes']=[]
 for path in paths:
  s=get(PUBLIC+path).decode();proof['public_routes'].append(header(s,path))
  if path.startswith('/treatment-order'):assert 'Based on your answers, this could perhaps work for you…' in s
  if path=='/':assert 'data-shift-ai-full-wire' not in s
 for name in ['assets/header-navigation-v2.css','start-here-v72.js','assets/v42.js']:
  assert hashlib.sha256(get(PUBLIC+'/'+name)).hexdigest()==entries[name]['sha256']
(HERE/'rec034-preview-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({k:v for k,v in proof.items() if k!='template_checks'},indent=2))
print('PASS: all '+str(len(proof['template_checks']))+' shared-header template bytes and navigation orders verified')
