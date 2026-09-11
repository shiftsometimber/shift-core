import email, email.policy, hashlib, json, os, pathlib, urllib.error, urllib.request
BASE='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6'
EXPECTED='8d1478f7-075d-4527-a675-cab5a6baa8d1'
HEADERS={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'}
def raw(path):
 try:
  with urllib.request.urlopen(urllib.request.Request(BASE+path,headers=HEADERS),timeout=40) as r:return r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:raise SystemExit('Cloudflare HTTP '+str(e.code)+'; '+path) from None
def api(path):
 data,_=raw(path);j=json.loads(data);assert j.get('success');return j['result']
def sha(value):return hashlib.sha256(value if isinstance(value,bytes) else json.dumps(value,sort_keys=True).encode()).hexdigest()
active=api('/workers/scripts/shift-core/deployments')['deployments'][0]
assert active['versions']==[{'percentage':100,'version_id':EXPECTED}],'Active core moved'
version=api('/workers/scripts/shift-core/versions/'+EXPECTED)
latest_id=api('/workers/scripts/shift-core/versions')['items'][0]['id']
latest=api('/workers/scripts/shift-core/versions/'+latest_id)
assert latest['resources']==version['resources'],'Latest upload differs from active resources'
body,headers=raw('/workers/scripts/shift-core/content/v2')
ctype=next((v for k,v in headers.items() if k.lower()=='content-type'),'')
message=email.message_from_bytes(('Content-Type: '+ctype+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+body,policy=email.policy.default)
parts={p.get_filename() or p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in message.iter_parts()} if message.is_multipart() else {'worker-entry-v6.js':body}
compiled=pathlib.Path('../baseline-build/worker-entry-v6.js').read_bytes()
runtime=version['resources']['script_runtime']
report={'mode':'inspect','active':EXPECTED,'latest':latest_id,'active_etag':version['resources']['script'].get('etag'),'runtime':runtime,'bindings_sha256':sha(version['resources']['bindings']),'mfa_binding_present':any(b.get('name')=='HQ_MFA_ENCRYPTION_KEY' for b in version['resources']['bindings']),'content_type':ctype,'parts':{k:{'bytes':len(v),'sha256':sha(v),'matches_baseline_build':v==compiled} for k,v in parts.items()},'baseline_bundle_sha256':sha(compiled),'mutation_performed':False}
pathlib.Path('release-evidence/baseline-inspection.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,sort_keys=True))
assert any(v==compiled for v in parts.values()),'Active code does not match the baseline build; inspect before any upload'
print('PASS: active code reproduced from current repository; no upload or deployment performed.')
