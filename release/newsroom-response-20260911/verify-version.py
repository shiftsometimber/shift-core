import email, email.policy, hashlib, json, os, pathlib, urllib.error, urllib.request, uuid
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
def upload(metadata, name, content):
 boundary='shift-newsroom-'+uuid.uuid4().hex
 data=(('--'+boundary+'\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n').encode()+json.dumps(metadata).encode()+
       ('\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"; filename="'+name+'"\r\nContent-Type: application/javascript+module\r\n\r\n').encode()+content+('\r\n--'+boundary+'--\r\n').encode())
 req=urllib.request.Request(BASE+'/workers/scripts/shift-core/versions',data=data,headers={'Authorization':HEADERS['Authorization'],'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
 try:
  with urllib.request.urlopen(req,timeout=45) as r:j=json.load(r)
 except urllib.error.HTTPError as e:
  try:errors=[{'code':v.get('code'),'message':v.get('message')} for v in json.load(e).get('errors',[])]
  except Exception:errors=[]
  raise SystemExit('Version upload HTTP '+str(e.code)+'; '+json.dumps(errors)) from None
 assert j.get('success'),'Version upload failed'
 return j['result']
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
assert list(parts)==['worker-entry-v6.js'],'Unexpected Worker module set'
candidate_code=pathlib.Path('../candidate-build/worker-entry-v6.js').read_bytes()
assert sha(candidate_code)=='f54480cf1da07b23bd6a28e7875dd4ce7c4fde8fee3ffeb993f4e7405f810550','Candidate bundle moved'
types=sorted(set(b['type'] for b in version['resources']['bindings']))
metadata={'main_module':'worker-entry-v6.js','bindings':[],'keep_bindings':types,'keep_assets':True,
          'compatibility_date':runtime['compatibility_date'],'usage_model':runtime['usage_model'],
          'assets':{'config':{'html_handling':runtime['assets']['html_handling'],'not_found_handling':runtime['assets']['not_found_handling'],'run_worker_first':runtime['assets']['raw_run_worker_first']}},
          'annotations':{'workers/message':'Response-only Newsroom deduplication; source 0a667f2953e943665d2d9313d80ff0d4801e14fd','workers/tag':'sst-news-response-20260911'}}
assert api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions']==active['versions'],'Production changed'
candidate=upload(metadata,'worker-entry-v6.js',candidate_code)
candidate_id=candidate['id']
candidate=api('/workers/scripts/shift-core/versions/'+candidate_id)
binding_equal=sorted(candidate['resources']['bindings'],key=lambda b:b['name'])==sorted(version['resources']['bindings'],key=lambda b:b['name'])
runtime_equal=candidate['resources']['script_runtime']==runtime
prepared={'mode':'prepare','candidate':candidate_id,'source_commit':'0a667f2953e943665d2d9313d80ff0d4801e14fd','code_sha256':sha(candidate_code),'active_version_unchanged':EXPECTED,
          'bindings_preserved':binding_equal,'runtime_preserved':runtime_equal,'assets_retained':True,'candidate_runtime':candidate['resources']['script_runtime'],'candidate_etag':candidate['resources']['script']['etag'],'deployed':False}
pathlib.Path('release-evidence/prepared-version.json').write_text(json.dumps(prepared,indent=2)+'\n');print(json.dumps(prepared,sort_keys=True))
assert binding_equal and runtime_equal,'Candidate settings differ; leave production untouched'
assert api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions']==active['versions'],'Production changed'
print('PASS: prepared candidate retains all bindings and runtime settings; production untouched.')
