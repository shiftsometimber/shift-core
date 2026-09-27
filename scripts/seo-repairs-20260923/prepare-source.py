"""Prepare the bounded repair candidate, never deploy or write a database."""
import pathlib, json, hashlib, base64, io, os, urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[2]
HERE=pathlib.Path(__file__).resolve().parent
expected={
 'public-shell-contract.mjs':'2904f16b7869ff50385eb9bb18cb658b74032a99b12d686878b4677e1df1e298',
 'public-navigation-policy.mjs':'3ed776d719991ce7a29e0a37b7fd8b550b62ffeb9f9f3608ca3c245c47daf94d',
 'shift-health-public.mjs':'7f9b4af40ddfcf3ecca44d38148eacd40a30f6980ef3b083c12e03c511d41e29',
 'radar-editorial-trust-v1.js':'21a221cea717d9f2c237157d2b1c97ee81ab6f1b306fc8c4a47713534ebc87cb',
 'radar-auto-news-v1.js':'0f8fb63bf67b75e07e2976fc295726fb3707b63e7b25ac54d08e85d99e283ce3'
}
manifest_path=HERE/'source-manifest.json'
previous=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest={'baseline_commit':'323f2409c0bd7f719abb05969fe9aeb2a827261b','files':{},'images':[]}
def replace_once(text,before,after):
 assert text.count(before)==1, 'Expected exactly one source match: '+before[:100]
 return text.replace(before,after,1)
for name,sha in expected.items():
 p=ROOT/name;raw=p.read_bytes();actual=hashlib.sha256(raw).hexdigest()
 if actual!=sha:
  assert actual==previous.get('files',{}).get(name,{}).get('after_sha256'),name+': source moved; refusing blind edit'
  manifest['files'][name]=previous['files'][name];continue
 s=raw.decode()
 if name=='public-shell-contract.mjs':
  s="import {repairSeoPresentation} from './public-seo-presentation.mjs';\n"+s
  s=replace_once(s,"export const legacyAuthorityRedirects=Object.freeze({","export const legacyAuthorityRedirects=Object.freeze({\n  '/good-to-talk':'/mens-mental-health',\n  '/good-to-talk.html':'/mens-mental-health',")
  s=replace_once(s,'return repairPublicSeoLinks(completePublicSharingImage(html,path));','return repairSeoPresentation(repairPublicSeoLinks(completePublicSharingImage(html,path)),path);')
 elif name=='public-navigation-policy.mjs':
  s="import {seoAssetResponse} from './public-seo-presentation.mjs';\n"+s
  s=replace_once(s,'export function publicTickerAsset(request) {','export function publicTickerAsset(request) {\n  const seo=seoAssetResponse(request);if(seo)return seo;')
  a=s.index('export const tickerStyles =');b=s.index('export const contrastSafetyVersion',a);style=s[a:b]
  style=replace_once(style,'background:#707762;color:#050505;border-block:1px solid #050505','background:#050505;color:#E7E3DA;border-block:1px solid #707762')
  style=replace_once(style,'#shift-public-news a{color:#050505;','#shift-public-news a{color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;')
  style=style.replace('outline:2px solid #050505','outline:2px solid #E7E3DA')
  s=s[:a]+style+s[b:]
 elif name=='shift-health-public.mjs':
  s=replace_once(s,"'SHIFT Health | Wider Men’s Health'","'Men’s Health: Energy, Sleep & Wellbeing | SHIFT Health'")
  s=replace_once(s,'promoteTestosteroneCard(hubMain)','promoteTestosteroneCard(hubMain).replace(\'<h1>What would you like to sort?</h1>\',\'<h1>SHIFT Health: what would you like to sort?</h1>\')')
 elif name=='radar-editorial-trust-v1.js':
  start=s.index('export function sourceDateLabel(');end=s.index('\nexport function newsSitemapDates',start)
  s=s[:start]+'''export function sourceDateLabel(source){
 const type=String(source.evidence_type||'').trim(),online=evidenceDate(source.online_publication_date),issue=evidenceDate(source.issue_date);
 const parts=[];
 if(type)parts.push(esc(type));
 if(online)parts.push('First published online: '+esc(online));
 if(issue)parts.push('Journal issue: '+esc(issue));
 if(!online&&!issue){const date=evidenceDate(source.source_date||source.source_published_at||source.published_at);parts.push(date?'Source date: '+esc(date):'Source date not recorded');}
 return ' <span class="radar-news-meta">— '+parts.join(' · ')+'</span>';
}'''+s[end:]
 elif name=='radar-auto-news-v1.js':
  s=replace_once(s,"if(rendered.trim().split(/\\s+/).length>180)","if(/\\[(?:journal name|insert[^\\]]*|placeholder[^\\]]*|add source[^\\]]*)\\]|\\{\\{[^}]+\\}\\}/i.test(rendered))reasons.push('unfinished_placeholder');\n const preprint=evidence.some(x=>/preprint|^ppr$/i.test(String(x.evidence_type||x.publication_type||x.source_kind||''))||/^https:\\/\\/(?:www\\.)?(?:medrxiv|biorxiv)\\.org\\//i.test(x.url||''));\n if(preprint&&!/\\bpreprint\\b/i.test([pkg.headline,pkg.standfirst,pkg.article_markdown].join(' ')))reasons.push('preprint_disclosure_missing');\n if(rendered.trim().split(/\\s+/).length>180)")
  s=replace_once(s,'Require accurate attribution, faithful figures and uncertainty,','Require accurate attribution, faithful figures and uncertainty, explicit preprint/review/clinical-trial status, no unfinished placeholders, actual findings rather than generic claims that research exists, separate online-publication and journal-issue dates,')
 p.write_text(s)
 manifest['files'][name]={'before_sha256':sha,'after_sha256':hashlib.sha256(s.encode()).hexdigest()}

origin='https://036d3a83.projectshift.pages.dev'
sources={
 'logo':('assets/7B503EDB-D4E0-4F92-B45D-1D5A50AE2597.png','6dcb70ae70d67d9b8bd41b5788d0c06b45808b8f99682364c084bab552adb2e9'),
 'hero':('assets/home-hero-men-v32o.jpg','137245a0725c0f3241a9b5e19f47e694a6998d2d3ce59b49ec1b8a333f974fc4')
}
images={};assets={}
for name,(path,sha) in sources.items():
 if os.environ.get('SEO_PAGES_ROOT'):raw=(pathlib.Path(os.environ['SEO_PAGES_ROOT'])/path).read_bytes()
 else:
  with urllib.request.urlopen(origin+'/'+path,timeout=30) as r:raw=r.read()
 assert hashlib.sha256(raw).hexdigest()==sha,path+': original artwork differs'
 image=Image.open(io.BytesIO(raw))
 variants=[('logo',(719,243),True)] if name=='logo' else [('heroSmall',(768,512),False),('heroLarge',(1536,1024),False)]
 for key,size,lossless in variants:
  out=io.BytesIO();image.resize(size,Image.Resampling.LANCZOS).save(out,format='WEBP',lossless=lossless,quality=84,method=6)
  data=out.getvalue();h=hashlib.sha256(data).hexdigest();url='/assets/seo-20260923/'+key+'-'+h[:16]+'.webp'
  images[key]={'path':url,'width':size[0],'height':size[1],'bytes':len(data),'sha256':h}
  assets[url]={'sha256':h,'base64':base64.b64encode(data).decode()}
  manifest['images'].append({'key':key,'source':origin+'/'+path,'original_sha256':sha,'original_bytes':len(raw),**images[key]})
(ROOT/'public-seo-assets-data.mjs').write_text('// Generated from SHA-verified existing artwork; no new design or font files.\nexport const SEO_IMAGES='+json.dumps(images,separators=(',',':'))+';\nexport const SEO_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'changed_source_files':len(manifest['files']),'images':manifest['images'],'production_writes':0},indent=2))
