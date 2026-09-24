import urllib.request,xml.etree.ElementTree as ET,json,pathlib,sys
base=sys.argv[1].rstrip('/')
def get(url,method='GET'):
    with urllib.request.urlopen(urllib.request.Request(url,method=method),timeout=60) as r:
        return r.status,dict(r.headers),r.read()
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
(p/'verification.json').write_text(json.dumps({'base':base,'articleCount':len(entries),'mainCount':len(all_entries),'exactArticleSubset':True,'datesPreserved':True,'headPass':True,'sample':sample,'sampleStatus':200},indent=2))
print((p/'verification.json').read_text())
