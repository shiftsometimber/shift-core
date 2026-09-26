"""About copy only, applied to the reproduced current Pages master."""
import gzip, hashlib, json, pathlib, re
here=pathlib.Path(__file__).resolve().parent
source=here.parent/'public-pages-20260911'
p=json.loads(gzip.decompress((source/'source.json.gz').read_bytes()))
assert p['source_fingerprint']=='1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0'
baseline=p['source_fingerprint']; old=p['overrides']['about.html']
story=(here/'story.html').read_text()
new,n=re.subn(r'(<article class="sst-reading-article-v31">).*?(</article>)',lambda m:m[1]+story+m[2],old,flags=re.S)
assert n==1
title='Matt’s Story: Why I Built SHIFT | Shift Some Timber'
description='The health problems, grief and fright behind Matt’s decision to get help — and why he built SHIFT for support through the ordinary, difficult middle.'
new=re.sub(r'<title>.*?</title>','<title>'+title+'</title>',new)
new=re.sub(r'<meta\b[^>]*(?:name="(?:description|twitter:title|twitter:description)"|property="(?:og:title|og:description)")[^>]*>',lambda m: re.sub(r'content="[^"]*"','content="'+(title if ':title' in m[0] else description)+'"',m[0]),new)
assert new[:new.index('<body')].count(title)>=2
def entry(name,text):
 b=text.encode();return dict(path=name,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b))
updates={'about.html':new}
integrity=json.loads(p['overrides']['release-body-integrity.json'])
integrity['about.html']=hashlib.sha256(new.split('</head>',1)[1].encode()).hexdigest()
updates['release-body-integrity.json']=json.dumps({n:integrity[n] for n in sorted(integrity,key=pathlib.PurePosixPath)},indent=2)+'\n'
fp=json.loads(p['overrides']['DEPLOYMENT-FINGERPRINT.json']); entries={e['path']:e for e in fp['files']}
for name,text in updates.items(): entries[name]=entry(name,text)
fp['files']=[entries[n] for n in sorted(entries,key=pathlib.PurePosixPath)]
fp['aggregate_sha256']=hashlib.sha256(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode()).hexdigest()
updates['DEPLOYMENT-FINGERPRINT.json']=json.dumps(fp,indent=2)+'\n'
entries={e['path']:e for e in p['files']}
for name,text in updates.items():entries[name]=entry(name,text);p['overrides'][name]=text
p['files']=[entries[n] for n in sorted(entries)];p['baseline_fingerprint']=baseline;p['source_fingerprint']=fp['aggregate_sha256']
packed=gzip.compress(json.dumps(p,separators=(',',':'),ensure_ascii=False).encode(),mtime=0)
(source/'source.json.gz').write_bytes(packed)
(source/'control.json').write_text(json.dumps(dict(mode='preview',expected_live_fingerprint=baseline,source_fingerprint=p['source_fingerprint'],payload_sha256=hashlib.sha256(packed).hexdigest()),indent=2)+'\n')
(here/'about.html').write_text(new)
(here/'proof.json').write_text(json.dumps(dict(baseline=baseline,candidate=p['source_fingerprint'],changed_files=list(updates),about_sha256=entry('about.html',new)['sha256'],productionWrites=0),indent=2)+'\n')
print((here/'proof.json').read_text())
