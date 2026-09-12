"""Apply REC-031 to the exact current Pages source. Other bytes must stay identical."""
import copy, gzip, hashlib, json, pathlib
HERE=pathlib.Path(__file__).resolve().parent
SOURCE=HERE/'source.json.gz'
raw=SOURCE.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='2bcbc0ea39fc3bc792bd0d2fa5db768666bdd8f653aba6afa77fb7a5f850dd3a', 'current Pages source changed'
base=json.loads(gzip.decompress(raw));p=copy.deepcopy(base)
assert base['source_fingerprint']=='0111ddc13262846355df76dd5f2b3067b02dca9d92716105bf4bf24f9394e665'
def entry(name,data):return dict(path=name,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data))
def original(name):
 data=p['overrides'][name].encode()
 assert entry(name,data)==next(x for x in base['files'] if x['path']==name),name
 return data.decode()
def replace_once(text,old,new):
 assert text.count(old)==1, 'patch anchor changed'
 return text.replace(old,new)
js=(HERE/'start-here-v72.js').read_text()
insertion='    location.href=`/treatment-order?medicine=${encodeURIComponent(recommended)}&view=spec&from=start-here`;\n    return;\n'
assert js.count(insertion)==1
assert hashlib.sha256(js.replace(insertion,'').encode()).hexdigest()=='f010967dc25d8ff5ad9bf199f17385dd57f1efb9226dfc93fe2a7580b60cf803', 'quiz change extends beyond REC-027 handoff'
changed={
 'start-here-v72.js':js.encode(),
 'start-here.html':replace_once(original('start-here.html'),'/start-here-v72.js?v=front-door-9','/start-here-v72.js?v=direct-detail-20260912').encode(),
 'treatment-order.html':replace_once(original('treatment-order.html'),'Here are the details for the option you selected.','Based on your answers, this could perhaps work for you…').encode(),
}
integrity=json.loads(original('release-body-integrity.json'))
for name in ['start-here.html','treatment-order.html']:
 integrity[name]=hashlib.sha256(changed[name].decode().split('</head>',1)[1].encode()).hexdigest()
changed['release-body-integrity.json']=(json.dumps(integrity,indent=2)+'\n').encode()
fp=json.loads(original('DEPLOYMENT-FINGERPRINT.json'))
fp['files']=[entry(x['path'],changed[x['path']]) if x['path'] in changed else x for x in fp['files']]
fp['aggregate_sha256']=hashlib.sha256(''.join(f"{x['sha256']}  {x['path']}\n" for x in fp['files']).encode()).hexdigest()
changed['DEPLOYMENT-FINGERPRINT.json']=(json.dumps(fp,indent=2)+'\n').encode()
for name,data in changed.items():p['overrides'][name]=data.decode()
p['files']=[entry(x['path'],changed[x['path']]) if x['path'] in changed else x for x in p['files']]
p['baseline_fingerprint']=base['source_fingerprint'];p['source_fingerprint']=fp['aggregate_sha256']
before={x['path']:x for x in base['files']}
assert {x['path'] for x in p['files'] if before[x['path']]!=x}==set(changed)
packed=gzip.compress(json.dumps(p,separators=(',',':'),ensure_ascii=False).encode(),mtime=0)
SOURCE.write_bytes(packed)
proof={'change':'REC-031','changed_files':list(changed),'preserved_files':len(base['files'])-len(changed),'source_fingerprint':p['source_fingerprint'],'payload_sha256':hashlib.sha256(packed).hexdigest(),'files':[{'path':n,'before':before[n]['sha256'],'after':entry(n,d)['sha256']} for n,d in changed.items()]}
(HERE/'start-here-source-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof,indent=2))
