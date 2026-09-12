"""Read-only REC-032 verification, including the existing dynamic sitemap contract."""
import hashlib, json, pathlib, re, time, urllib.error, urllib.parse, urllib.request, xml.etree.ElementTree as ET
PAGES='https://a823a5e6.projectshift.pages.dev'
PUBLIC='https://shiftsometimber.co.uk'
FINGERPRINT='b442d929e95a45662af1f5b94e985811cf6726aa16b2f18818e5d8f1f172ebdb'

def get(url, expected=200):
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'Cache-Control':'no-cache','User-Agent':'SHIFT-REC032-read-only-verification'})
            with urllib.request.urlopen(req,timeout=30) as r: status,data,headers=r.status,r.read(),dict(r.headers)
        except urllib.error.HTTPError as e: status,data,headers=e.code,e.read(),dict(e.headers)
        except OSError:
            if attempt==2: raise
            time.sleep(attempt+1);continue
        assert status==expected,(url,status)
        return data,headers

fp=json.loads(get(PAGES+'/DEPLOYMENT-FINGERPRINT.json')[0])
assert fp['aggregate_sha256']==FINGERPRINT
assert hashlib.sha256(''.join(f"{e['sha256']}  {e['path']}\n" for e in fp['files']).encode()).hexdigest()==FINGERPRINT
assert json.loads(get(PUBLIC+'/DEPLOYMENT-FINGERPRINT.json')[0])['aggregate_sha256']==FINGERPRINT
entries={e['path']:e for e in fp['files']}
proof={'fingerprint':FINGERPRINT,'pages':PAGES,'public':PUBLIC,'method':'GET only; no deployment or database writes','checks':[]}
names=['shift-for-work.html','assets/shift-for-work-v1.css','assets/shift-for-work-v1.js','downloads/SHIFT-for-Work-Proposition.pdf','start-here-v72.js','start-here.html','treatment-order.html','index.html','work-with-us.html','corporate-wellbeing.html','sitemap.xml']
for name in names:
    original,_=get(PAGES+'/'+name)
    assert hashlib.sha256(original).hexdigest()==entries[name]['sha256'],name+': Pages content differs'
    live,headers=get(PUBLIC+'/'+name)
    if name.endswith('.html'):
        assert b'href="/shift-for-work"' in live
        if name=='shift-for-work.html':
            for marker in ['Men’s health support your workforce might actually use.','data-work-enquiry','employee enrolment is not open yet','Packages quoted individually.']:
                assert marker.encode() in live
        if name=='start-here.html': assert b'/start-here-v72.js?v=direct-detail-20260912' in live
        if name=='treatment-order.html': assert 'Based on your answers, this could perhaps work for you…'.encode() in live
        if name=='index.html': assert b'data-shift-ai-full-wire' not in live
    elif name=='sitemap.xml':
        # Current Worker adds required reviewed health and published Newsroom URLs
        # immediately before </urlset>; it preserves the entire upstream document.
        prefix,suffix=original.decode().rsplit('</urlset>',1)
        actual=live.decode()
        assert actual.startswith(prefix) and actual.endswith('</urlset>'+suffix), 'static sitemap content removed or changed'
        additions=actual[len(prefix):len(actual)-len('</urlset>'+suffix)]
        extra=ET.fromstring('<root>'+additions+'</root>')
        paths=[]
        for item in extra:
            assert item.tag=='url'
            loc=item.findtext('loc');u=urllib.parse.urlparse(loc)
            assert u.scheme=='https' and u.netloc=='shiftsometimber.co.uk'
            assert u.path in ['/medicine-news','/shift-health'] or u.path.startswith(('/medicine-news/','/mental-health/','/shift-health/'))
            assert item.findtext('lastmod')=='2026-09-03'
            paths.append(u.path)
        locs=[x.text for x in ET.fromstring(live).iter() if x.tag.endswith('}loc') or x.tag=='loc']
        assert locs.count(PUBLIC+'/shift-for-work')==1
        proof['sitemap']={'original_bytes_preserved':True,'worker_additions':len(paths),'url_count':len(locs),'new_employer_url_count':1}
    else:
        assert live==original,name+': public asset differs'
        if name.endswith('.pdf'):
            assert live.startswith(b'%PDF-')
            assert 'application/pdf' in next(v for k,v in headers.items() if k.lower()=='content-type')
    proof['checks'].append({'path':name,'pages_sha256':hashlib.sha256(original).hexdigest(),'public_sha256':hashlib.sha256(live).hexdigest(),'status':200})
for path in ['/_review-work-public','/v1/work']:
    get(PUBLIC+path,404)
proof['preview_harness_absent']=True
proof['workplace_api_closed']=True
pathlib.Path('verification/REC-032-live-evidence.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof,indent=2))
