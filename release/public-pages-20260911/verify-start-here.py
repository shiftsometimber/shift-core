import gzip, hashlib, json, os, pathlib, re, urllib.request
HERE=pathlib.Path(__file__).resolve().parent
control=json.loads((HERE/'control.json').read_text())
source=json.loads(gzip.decompress((HERE/'source.json.gz').read_bytes()))
log=(pathlib.Path(os.environ['RUNNER_TEMP'])/'start-here-deploy.log').read_text()
urls=re.findall(r'https://[a-f0-9]+\.projectshift\.pages\.dev',log)
assert urls,'No uploaded Pages URL returned'
uploaded=urls[-1]
def get(url):
 request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'SST-Start-Here-acceptance/1'})
 with urllib.request.urlopen(request,timeout=30) as response:
  assert response.status==200
  return response.read()
proof={'mode':control['mode'],'uploaded_url':uploaded,'fingerprint':control['source_fingerprint'],'checks':[]}
for origin in [uploaded]+(['https://shiftsometimber.co.uk'] if control['mode']=='production' else []):
 fp=json.loads(get(origin+'/DEPLOYMENT-FINGERPRINT.json'))
 assert fp['aggregate_sha256']==control['source_fingerprint'], 'published fingerprint differs'
 for name in ['start-here-v72.js','start-here.html','treatment-order.html']:
  body=get(origin+'/'+name)
  if name=='start-here-v72.js':
   expected=next(x['sha256'] for x in source['files'] if x['path']==name)
   assert hashlib.sha256(body).hexdigest()==expected, 'published quiz differs'
  elif name=='start-here.html':assert b'/start-here-v72.js?v=direct-detail-20260912' in body
  else:assert 'Based on your answers, this could perhaps work for you…'.encode() in body
  proof['checks'].append({'origin':origin,'path':name,'status':200,'sha256':hashlib.sha256(body).hexdigest()})
(HERE/'start-here-live-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof,indent=2))
