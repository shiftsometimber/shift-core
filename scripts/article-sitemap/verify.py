import urllib.request,urllib.error,xml.etree.ElementTree as ET,json,pathlib,sys,time
base=sys.argv[1].rstrip('/')
attempts=[]
def get(url,method='GET'):
    # New route deployment can reach different edges at different times.
    # Keep every observation and still fail unless the final response is correct.
    for attempt in range(7):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,method=method,headers={'User-Agent':'SHIFT-Article-Sitemap-Verification/1.0','Accept':'application/xml,text/xml,*/*'}),timeout=60) as r:
                attempts.append({'url':url,'method':method,'status':r.status,'attempt':attempt+1})
                return r.status,dict(r.headers),r.read()
        except urllib.error.HTTPError as e:
            detail={'url':url,'finalUrl':e.url,'method':method,'status':e.code,'attempt':attempt+1,'headers':dict(e.headers)}
            attempts.append(detail);print(json.dumps(detail),flush=True)
            if '/sitemap-articles.xml' not in url or e.code!=404 or attempt==6: raise
            time.sleep(10)
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
def parse(body):
    root=ET.fromstring(body)
    assert root.tag=='{'+ns['s']+'}urlset'
    return {u.find('s:loc',ns).text:u.findtext('s:lastmod',default='',namespaces=ns) for u in root.findall('s:url',ns)}
_,_,full=get('https://shiftsometimber.co.uk/sitemap.xml')
status,headers,body=get(base+'/sitemap-articles.xml')
entries=parse(body); all_entries=parse(full)
expected={u:d for u,d in all_entries.items() if u.startswith('https://shiftsometimber.co.uk/articles/')}
assert status==200 and entries and entries==expected,(len(entries),len(expected))
assert len(entries)==len(ET.fromstring(body).findall('s:url',ns)), 'Duplicate URLs'
assert 'application/xml' in headers.get('Content-Type','')
head,hh,hbody=get(base+'/sitemap-articles.xml','HEAD'); assert head==200 and not hbody
assert hh.get('X-Shift-Article-Count')==str(len(entries))
sample=next(iter(entries)); assert get(sample)[0]==200
p=pathlib.Path('article-sitemap-proof');p.mkdir(exist_ok=True)
(p/'articles.xml').write_bytes(body);(p/'main.xml').write_bytes(full)
(p/'verification.json').write_text(json.dumps({'base':base,'articleCount':len(entries),'mainCount':len(all_entries),'exactArticleSubset':True,'datesPreserved':True,'headPass':True,'sample':sample,'sampleStatus':200,'requests':attempts},indent=2))
print((p/'verification.json').read_text())
