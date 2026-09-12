"""REC-034: deterministic approved navigation-only transform of REC-032."""
import copy,difflib,gzip,hashlib,json,pathlib,re
HERE=pathlib.Path(__file__).resolve().parent
SOURCE=HERE.parent/'public-pages-20260911'
raw=(SOURCE/'source.json.gz').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='9dc3abc836998908a6c0e71ac74940f41a34fe8e4837020c73a11fd2c6ffebea'
base=json.loads(gzip.decompress(raw))
assert base['source_fingerprint']=='b442d929e95a45662af1f5b94e985811cf6726aa16b2f18818e5d8f1f172ebdb'
p=copy.deepcopy(base); original={x['path']:x for x in base['files']}; updates={}
def entry(name,data):return {'path':name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
primary=['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard']
nav_re=re.compile(r'(<nav\b[^>]*class="desktop-nav"[^>]*>)(.*?)(</nav>)',re.S)
aside_re=re.compile(r'<aside\b[^>]*id="site-drawer"[^>]*>.*?</aside>',re.S)
anchor_re=re.compile(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',re.S)
changes=[];patch=[]
for name,old in sorted(base['overrides'].items()):
 if not name.endswith('.html'):continue
 assert entry(name,old.encode())==original[name],name
 if not nav_re.search(old):continue
 # Retired pages stay untouched; none are added to navigation.
 if name in ['lounge.html','shift-sport-team.html','member/tap-room.html']:continue
 nav=nav_re.search(old)
 links={m.group(1):m.group(0) for m in anchor_re.finditer(nav.group(2))}
 assert all(x in links for x in primary),name
 new=old[:nav.start(2)]+''.join(links[x] for x in primary)+old[nav.end(2):]
 aside=aside_re.search(new);assert aside,name
 menu=aside.group(0); mn=re.search(r'(<nav\b[^>]*>)(.*?)(</nav>)',menu,re.S);assert mn,name
 anchors=list(anchor_re.finditer(mn.group(2))); amap={m.group(1):m.group(0) for m in anchors}
 assert len(amap)==len(anchors) and all(x in amap for x in primary),name
 rest=sorted([m for m in anchors if m.group(1) not in primary],key=lambda m:re.sub('<[^>]*>','',m.group(2)).casefold())
 ordered=''.join(amap[x] for x in primary)+''.join(m.group(0) for m in rest)
 replacement=menu[:mn.start(2)]+ordered+menu[mn.end(2):]
 replacement=replacement.replace('<aside ','<aside data-header-v2 ',1)
 new=new[:aside.start()]+replacement+new[aside.end():]
 new=re.sub(r'<header\b([^>]*class="site-header"[^>]*)>',r'<header data-header-v2 data-header-style="underline"\1>',new,count=1)
 css='<link rel="stylesheet" href="/assets/header-navigation-v2.css" data-header-v2-style/>'
 new=new.replace('</head>',css+'</head>',1)
 route='/' if name=='index.html' else '/'+name.removesuffix('.html')
 current='/shift-health' if route.startswith('/shift-health') else '/member/dashboard' if route.startswith(('/member/','/member-login','/member-signup')) else '/treatment-centre' if route in ['/treatment-order','/treatment-centre'] else route
 if current in amap:
  def set_current(block):
   return re.sub(r'(<a\b[^>]*href="'+re.escape(current)+r'")([^>]*>)',lambda m:m.group(1)+('' if 'aria-current=' in m.group(2) else ' aria-current="page"')+m.group(2),block.group(0))
  new=nav_re.sub(set_current,new)
  new=aside_re.sub(set_current,new)
 # Strip only changed navigation/style markup to prove the body and behaviour are preserved.
 def normalise(s):
  s=nav_re.sub('<PRIMARY-NAV/>',s)
  s=aside_re.sub('<SITE-DRAWER/>',s)
  s=s.replace(' data-header-v2 data-header-style="underline"','').replace(css,'')
  return s
 assert normalise(new)==normalise(old),name+': unrelated edit'
 assert set(amap)==set(m.group(1) for m in anchor_re.finditer(ordered)),name+': menu link lost'
 updates[name]=new.encode()
 changes.append({'path':name,'before':hashlib.sha256(old.encode()).hexdigest(),'after':hashlib.sha256(new.encode()).hexdigest(),'menu':[m.group(1) for m in anchor_re.finditer(ordered)]})
 patch.extend(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='before/'+name,tofile='after/'+name))

assert len(changes)==438
css=(HERE/'header-navigation-v2.css').read_bytes()
assert hashlib.sha256(css).hexdigest()=='fede0fcbc334af6c4183765006c2fde71909ed5e3bd0db365f77a8e21e2fefc4'
updates['assets/header-navigation-v2.css']=css
integrity=json.loads(base['overrides']['release-body-integrity.json'])
for name,data in updates.items():
 if name.endswith('.html'):
  integrity[name]=hashlib.sha256(data.decode().split('</head>',1)[1].encode()).hexdigest()
updates['release-body-integrity.json']=(json.dumps({n:integrity[n] for n in sorted(integrity,key=pathlib.PurePosixPath)},indent=2)+'\n').encode()
fp=json.loads(base['overrides']['DEPLOYMENT-FINGERPRINT.json'])
fpe={x['path']:x for x in fp['files']}
for name,data in updates.items():fpe[name]=entry(name,data)
fp['files']=[fpe[n] for n in sorted(fpe,key=pathlib.PurePosixPath)]
fp['file_count']=len(fp['files'])
fp['aggregate_sha256']=hashlib.sha256(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode()).hexdigest()
updates['DEPLOYMENT-FINGERPRINT.json']=(json.dumps(fp,indent=2)+'\n').encode()
entries=dict(original)
for name,data in updates.items():
 entries[name]=entry(name,data);p['overrides'][name]=data.decode()
p['files']=[entries[n] for n in sorted(entries)]
p['baseline_fingerprint']=base['source_fingerprint'];p['source_fingerprint']=fp['aggregate_sha256']
assert set(entries)-set(original)=={'assets/header-navigation-v2.css'}
assert all(name.endswith('.html') or name in {'assets/header-navigation-v2.css','release-body-integrity.json','DEPLOYMENT-FINGERPRINT.json'} for name in updates)
packed=gzip.compress(json.dumps(p,separators=(',',':'),ensure_ascii=False).encode(),mtime=0)
control=json.loads((HERE/'header-control.json').read_text())
assert control['expected_live_fingerprint']==base['source_fingerprint']
assert control['selected_style']=='underline' and control['user_release_approved'] is True
for k,v in {'source_fingerprint':p['source_fingerprint'],'payload_sha256':hashlib.sha256(packed).hexdigest()}.items():
 if k in control:assert control[k]==v,k+': candidate differs from approved source'
 control[k]=v
(SOURCE/'source.json.gz').write_bytes(packed)
(SOURCE/'control.json').write_text(json.dumps(control,indent=2)+'\n')
proof={'change':'REC-034','selected_style':'underline','baseline':base['source_fingerprint'],'fingerprint':p['source_fingerprint'],'payload_sha256':hashlib.sha256(packed).hexdigest(),'changed_templates':len(changes),'changes':changes,'unchanged_non_navigation_bytes':True,'unchanged_non_navigation_assets':True,'file_count':len(entries)}
(HERE/'header-source-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
(HERE/'REC-034.patch').write_text(''.join(patch))
print(json.dumps({k:v for k,v in proof.items() if k!='changes'}))
