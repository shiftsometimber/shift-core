"""GET-only post-upload checks; dynamic public routes checked in production."""
import concurrent.futures,hashlib,json,os,pathlib,re,time,urllib.request,urllib.error
HERE=pathlib.Path(__file__).resolve().parent
control=json.loads((HERE.parent/'public-pages-20260911/control.json').read_text())
log=(pathlib.Path(os.environ['RUNNER_TEMP'])/'header-deploy.log').read_text()
urls=re.findall(r'https://[a-z0-9]+\.projectshift\.pages\.dev',log)
assert urls,'upload URL absent'
PAGES=urls[-1];PUBLIC='https://shiftsometimber.co.uk'; fp=control['source_fingerprint']
primary=['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']
menu=primary+['/about','/ask-timber','/contact','/help','/how-are-you-feeling','/explore-knowledge','/shift-for-work','/shop','/work-with-us']
def get(url):
 req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-REC034-read-only-verification'})
 with urllib.request.urlopen(req,timeout=35) as r:
  assert r.status==200,url
  return r.read()
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
sourceproof=json.loads((HERE/'header-source-proof.json').read_text())
def verify_template(item):
 name=item['path'];data=get(PAGES+'/'+name)
 assert hashlib.sha256(data).hexdigest()==entries[name]['sha256'],name+': bytes differ'
 return header(data.decode(),name)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 proof['template_checks']=list(pool.map(verify_template,sourceproof['changes']))
for name in ['assets/header-navigation-v2.css','start-here-v72.js','assets/v42.js','app.js','sitemap.xml']:
 data=get(PAGES+'/'+name)
 assert hashlib.sha256(data).hexdigest()==entries[name]['sha256'],name
proof['checks'].append('438 exact uploaded template hashes and unchanged journey/menu assets')
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
(HERE/'header-live-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({k:v for k,v in proof.items() if k!='template_checks'},indent=2))
print('PASS: all '+str(len(proof['template_checks']))+' shared-header template bytes and navigation orders verified')
