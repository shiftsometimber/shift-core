import json,hashlib,pathlib,shutil,sys
source,out=map(pathlib.Path,sys.argv[1:3])
spec=json.loads(pathlib.Path(__file__).with_name('corrections.json').read_text())
fp=json.loads((source/'DEPLOYMENT-FINGERPRINT.json').read_text())
assert fp['aggregate_sha256']==spec['baseline'],'Baseline changed'
digest=lambda b:hashlib.sha256(b).hexdigest()
for entry in fp['files']:
 assert digest((source/entry['path']).read_bytes())==entry['sha256'],entry['path']
shutil.copytree(source,out)
changed=[]
for fix in spec['corrections']:
 if fix.get('storage'):continue
 p=out/fix['path'];before=p.read_text();assert before.count(fix['before'])==1,fix['path']
 after=before.replace(fix['before'],fix['after'])
 assert before!=after
 p.write_text(after);changed.append(fix['path'])
integrity=json.loads((out/'release-body-integrity.json').read_text())
for name in changed:integrity[name]=digest((out/name).read_text().split('</head>',1)[1].encode())
(out/'release-body-integrity.json').write_text(json.dumps(dict(sorted(integrity.items())),indent=2)+'\n')
changed.append('release-body-integrity.json')
for entry in fp['files']:
 b=(out/entry['path']).read_bytes()
 if entry['path'] in changed:entry.update(sha256=digest(b),bytes=len(b))
 else:assert digest(b)==entry['sha256']
fp['aggregate_sha256']=digest(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode())
(out/'DEPLOYMENT-FINGERPRINT.json').write_text(json.dumps(fp,indent=2)+'\n')
(out.parent/'correction-build-receipt.json').write_text(json.dumps({'baseline':spec['baseline'],'candidate':fp['aggregate_sha256'],'changedFiles':changed+['DEPLOYMENT-FINGERPRINT.json'],'preservedFiles':len(fp['files'])-len(changed)},indent=2))
print('Built four exact copy/source repairs; other public bytes preserved.')
