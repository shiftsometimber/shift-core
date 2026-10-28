"""Prepare the supplier's real product and instruction photos without relabelling them."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.request import urlopen
from urllib.parse import urlsplit, urlunsplit
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import base64, hashlib, io, json

ROOT=Path(__file__).resolve().parent
products=json.loads((ROOT/'photo-products.json').read_text())
previous={}
if (ROOT/'media-data.mjs').exists():
    previous=json.loads((ROOT/'media-data.mjs').read_text().split('export const productImageData=',1)[1].rstrip(';\n'))
class Images(HTMLParser):
    def __init__(self):super().__init__();self.images=[]
    def handle_starttag(self,tag,attrs):
        if tag=='img':
            d=dict(attrs)
            if d.get('src','').startswith(('https://cdn.sanity.io/','https://cdn.shopify.com/')):self.images.append(d)
def clean(url):
    u=urlsplit(url)
    return urlunsplit((u.scheme,u.netloc,u.path,'',''))
def discover(p):
    parser=Images();parser.feed(urlopen(p['sourceUrl'],timeout=25).read().decode())
    gallery=[];steps={}
    for d in parser.images:
        alt=d.get('alt','');url=clean(d['src'])
        if alt in ['Order & Receive','Collect Your Sample','Run the Test','Read Your Result','Package & Post','Get Results']:steps[alt]=url
        elif not steps and url not in gallery:gallery.append(url)
    return p['id'],{'gallery':gallery[:1],'steps':steps}
with ThreadPoolExecutor(max_workers=4) as pool:
    discovered=dict(pool.map(discover,products))
urls=sorted({url for p in discovered.values() for url in p['gallery']+list(p['steps'].values())})
assets=ROOT/'assets';assets.mkdir(exist_ok=True)
def download(url):
    key='photo-'+hashlib.sha256(url.encode()).hexdigest()[:12]
    separator='&' if '?' in url else '?'
    data=urlopen(url+separator+'w=800&fm=webp&q=80',timeout=25).read()
    image=Image.open(io.BytesIO(data));image.thumbnail((680,680))
    image.save(assets/(key+'.webp'),'WEBP',quality=73,method=6)
    return url,key
with ThreadPoolExecutor(max_workers=4) as pool:keys=dict(pool.map(download,urls))
mapping={pid:{'gallery':[keys[u] for u in p['gallery']],'steps':{name:keys[u] for name,u in p['steps'].items()}} for pid,p in discovered.items()}
embedded={key:'data:image/webp;base64,'+base64.b64encode((assets/(key+'.webp')).read_bytes()).decode() for key in keys.values()}
for pid in mapping:
    key=next((k for k in ['cutout-'+pid,'product-'+pid] if k in previous),None)
    if key:
        mapping[pid]['gallery']=[key]
        embedded[key]=previous[key]
        (assets/(key+'.webp')).write_bytes(base64.b64decode(previous[key].split(',',1)[1]))
mapping['general-health-bundle']={'gallery':[mapping[pid]['gallery'][0] for pid in ['thyroid','vitamin-d','iron','cholesterol','kidney-health']],'steps':{},'layout':'collection'}
used={key for p in mapping.values() for key in p['gallery']+list(p['steps'].values())}
embedded={key:data for key,data in embedded.items() if key in used}
(ROOT/'media.mjs').write_text('export const productMedia='+json.dumps(mapping)+';\nexport const imagePath=key=>"/shift-health/assets/testing-"+key+".webp";\n')
(ROOT/'media-data.mjs').write_text('// Actual product and instruction photographs; display without relabelling.\nexport const productImageData='+json.dumps(embedded)+';\n')
(ROOT/'media-sources.json').write_text(json.dumps({'products':discovered,'assets':keys},indent=2)+'\n')
print(json.dumps({'products':len(mapping),'images':len(keys),'bytes':sum((assets/(key+'.webp')).stat().st_size for key in keys.values())}))
