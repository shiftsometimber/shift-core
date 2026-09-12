import gzip, hashlib, json, os, pathlib, re, time, urllib.request
HERE = pathlib.Path(__file__).resolve().parent
control = json.loads((HERE/'control.json').read_text())
payload = json.loads(gzip.decompress((HERE/'source.json.gz').read_bytes()))
entries = {e['path']:e for e in payload['files']}
log = (pathlib.Path(os.environ['RUNNER_TEMP'])/'work-public-deploy.log').read_text()
uploaded = re.findall(r'https://[a-f0-9]+\.projectshift\.pages\.dev', log)[-1]
def get(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-REC032-acceptance'})
            with urllib.request.urlopen(req,timeout=30) as r:
                assert r.status == 200
                return r.read()
        except OSError:
            if attempt == 2: raise
            time.sleep(attempt + 1)
proof = {'mode':control['mode'],'uploaded_url':uploaded,'fingerprint':control['source_fingerprint'],'checks':[]}
for origin in [uploaded] + (['https://shiftsometimber.co.uk'] if control['mode']=='production' else []):
    assert json.loads(get(origin+'/DEPLOYMENT-FINGERPRINT.json'))['aggregate_sha256'] == control['source_fingerprint']
    for name in ['shift-for-work.html','assets/shift-for-work-v1.css','assets/shift-for-work-v1.js','downloads/SHIFT-for-Work-Proposition.pdf','start-here-v72.js','start-here.html','treatment-order.html','index.html','work-with-us.html','corporate-wellbeing.html','sitemap.xml']:
        data = get(origin+'/'+name)
        sha = hashlib.sha256(data).hexdigest()
        if origin == uploaded or not name.endswith('.html'): assert sha == entries[name]['sha256'], name + ': uploaded bytes differ'
        if name.endswith('.html'):
            assert b'href="/shift-for-work"' in data, name + ': employer link absent'
        if name == 'shift-for-work.html':
            for marker in ['Men’s health support your workforce might actually use.','data-work-enquiry','employee enrolment is not open yet','Packages quoted individually.']:
                assert marker.encode() in data, marker
        if name == 'start-here.html': assert b'/start-here-v72.js?v=direct-detail-20260912' in data
        if name == 'treatment-order.html': assert 'Based on your answers, this could perhaps work for you…'.encode() in data
        if name == 'index.html': assert b'data-shift-ai-full-wire' not in data
        if name.endswith('.pdf'): assert data.startswith(b'%PDF-')
        proof['checks'].append({'origin':origin,'path':name,'status':200,'sha256':sha})
(HERE/'work-public-live-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof,indent=2))
