"""About copy only, applied to the reproduced current Pages master."""
import gzip, hashlib, json, pathlib, re
here=pathlib.Path(__file__).resolve().parent
source=here.parent/'public-pages-20260911'
p=json.loads(gzip.decompress((source/'source.json.gz').read_bytes()))
assert p['source_fingerprint']=='3e60945d1a3884555da9fb1c0a62b767f9e64f71d27b0d10730cf47b8a83cd95'
baseline=p['source_fingerprint'];old=p['overrides']['about.html']
style='<style id="about-type-20260926">body.about-story-page .pagehero h1{font-size:clamp(28px,3vw,34px)!important;line-height:1.2!important}body.about-story-page .sst-reading-article-v31 h2{font-size:24px!important;line-height:1.3!important;margin-top:28px!important;margin-bottom:14px!important}body.about-story-page .sst-reading-article-v31 p{font-size:17px!important;line-height:1.65!important}body.about-story-page .sst-reading-article-v31 .standfirst{font-size:19px!important;line-height:1.6!important;color:#E7E3DA!important}</style>'
assert 'about-type-20260926' not in old
new=old.replace('</head>',style+'</head>',1)
assert new.replace(style,'')==old
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
