import {recipes} from './recipes.mjs';
import {registry} from './registry.mjs';
import {styles} from './styles.mjs';
import {criticalStyles} from './critical.mjs';
import {images} from './images.mjs';
export const MEDICATION_RELEASE='medicine-evidence-20261103-v1';
const ORIGIN='https://shiftsometimber.co.uk';
export const UPDATED_PATHS=Object.freeze(Object.keys(recipes).filter(p=>recipes[p].kind!=='benchmark'));
const normalise=p=>p.replace(/\/+$/,'').replace(/\.html$/,'');
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const digest=async value=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const encode=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function schema(html,recipe,path){
 let found=false;
 function visit(node){
  if(!node||typeof node!=='object')return node;
  if(Array.isArray(node))return node.map(visit).filter(Boolean);
  const types=[node['@type']].flat();
  if(recipe.kind==='comparison-tool'&&types.includes('FAQPage'))return null;
  if(types.some(x=>['Article','MedicalWebPage'].includes(x))){
   found=true;node={...node,headline:recipe.headline,name:recipe.headline,description:recipe.description,dateModified:registry.date,citation:recipe.sourceUrls,inLanguage:'en-GB'};
   if(recipe.image)node.image={'@type':'ImageObject',url:ORIGIN+recipe.image,width:1200,height:630,caption:recipe.imageAlt};
   // Preserve genuine original authorship and publication history. Source
   // checking is not a new clinical review or an invented publication date.
  }
  if(node['@graph'])node={...node,'@graph':visit(node['@graph'])};return node;
 }
 let out=html.replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi,(tag,raw)=>{
  let data;try{data=JSON.parse(raw)}catch{return tag}const changed=visit(data);return changed?tag.slice(0,tag.indexOf('>')+1)+json(changed)+'</script>':'';
 });
 if(!found){const node={'@context':'https://schema.org','@type':'MedicalWebPage','@id':ORIGIN+path+'#medical-information',url:ORIGIN+path,name:recipe.headline,description:recipe.description,dateModified:registry.date,inLanguage:'en-GB',citation:recipe.sourceUrls};out=out.replace(/<\/head>/i,'<script type="application/ld+json">'+json(node)+'</script></head>');}
 return out;
}
function metadata(html,recipe,path){
 let out=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+encode(recipe.title)+'</title>');
 const values={'description':recipe.description,'og:title':recipe.title,'twitter:title':recipe.title,'og:description':recipe.description,'twitter:description':recipe.description,'og:url':ORIGIN+path};
 if(recipe.image){Object.assign(values,{'og:image':ORIGIN+recipe.image,'twitter:image':ORIGIN+recipe.image,'og:image:alt':recipe.imageAlt,'twitter:image:alt':recipe.imageAlt,'og:image:width':'1200','og:image:height':'630','og:image:type':'image/png','twitter:card':'summary_large_image'});}
 for(const [key,value] of Object.entries(values)){
  const pattern=new RegExp('<meta\\b(?=[^>]*\\b(?:name|property)=["\\\']'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\\\'])[^>]*>','gi');let present=false;
  out=out.replace(pattern,tag=>{present=true;return tag.replace(/\bcontent=(["'])([\s\S]*?)\1/i,()=> 'content="'+encode(value)+'"')});
  if(!present){const attribute=key.startsWith('og:')?'property':'name';out=out.replace(/<\/head>/i,'<meta '+attribute+'="'+key+'" content="'+encode(value)+'"></head>');}
 }
 let canonical=false;out=out.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,tag=>{canonical=true;return tag.replace(/href=(["'])([\s\S]*?)\1/i,()=> 'href="'+ORIGIN+path+'"')});
 if(!canonical)out=out.replace(/<\/head>/i,'<link rel="canonical" href="'+ORIGIN+path+'"></head>');
 return schema(out,recipe,path);
}
export function updateMedicationSitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>{
  const location=node.match(/<loc>([^<]+)<\/loc>/)?.[1];if(!UPDATED_PATHS.some(p=>location===ORIGIN+p))return node;
  return /<lastmod>[\s\S]*?<\/lastmod>/i.test(node)?node.replace(/<lastmod>[\s\S]*?<\/lastmod>/i,'<lastmod>'+registry.date+'</lastmod>'):node.replace(/<\/url>/i,'<lastmod>'+registry.date+'</lastmod></url>');
 });
}
export async function transformMedicationDocument(html,rawPath){
 const path=normalise(rawPath),recipe=recipes[path];if(!recipe||recipe.kind==='benchmark')return {html,state:'untouched'};
 const matches=[...html.matchAll(/<main\b[\s\S]*?<\/main>/gi)];if(matches.length!==1)return {html,state:'main-shape-changed'};
 const current=matches[0][0],hash=await digest(current);
 if(hash!==recipe.baselineMainSha256&&hash!==recipe.mainAfterSha256)return {html,state:'baseline-changed'};
 let out=html.replace(current,()=>recipe.main);
 if(recipe.kind==='comparison-tool'){
  out=out.replace(/<script\b(?=[^>]*\bsrc=["']\/medication-(?:data|battle)-2212a\.js[^"']*["'])[^>]*>[\s\S]*?<\/script>/gi,'');
 }
 out=metadata(out,recipe,path);
 const stylesIn=[...out.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
 for(const match of stylesIn){const key=await digest(match[1]);if(Object.hasOwn(criticalStyles,key))out=out.replace(match[0],()=>match[0].slice(0,match[0].indexOf('>')+1)+criticalStyles[key]+'</style>');}
 if(!out.includes('data-mm-style="'+MEDICATION_RELEASE+'"'))out=out.replace(/<\/head>/i,'<style data-mm-style="'+MEDICATION_RELEASE+'">'+styles+'</style></head>');
 return {html:out,state:'updated'};
}
export function medicationImage(request){
 const image=images[new URL(request.url).pathname];if(!image||!['GET','HEAD'].includes(request.method))return null;
 const headers={'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable','ETag':'"'+image.sha256+'"','X-Content-Type-Options':'nosniff'};
 if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0)),{headers});
}
export function withMedicationEvidence(original){
 return {...original,async fetch(request,...args){
  const url=new URL(request.url),path=normalise(url.pathname);
  if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname)||!['GET','HEAD'].includes(request.method))return original.fetch(request,...args);
  const image=medicationImage(request);if(image)return image;
  if(request.method!=='GET'||(!UPDATED_PATHS.includes(path)&&path!=='/sitemap.xml'))return original.fetch(request,...args);
  const response=await original.fetch(request,...args);if(response.status!==200)return response;
  const isSitemap=path==='/sitemap.xml',type=response.headers.get('Content-Type')||'';
  if(!(isSitemap?type.includes('xml'):type.includes('text/html')))return response;
  const before=await response.text(),result=isSitemap?{html:updateMedicationSitemap(before),state:'updated'}:await transformMedicationDocument(before,path);
  const headers=new Headers(response.headers);headers.set('X-Shift-Medicine-Evidence',result.state==='updated'?MEDICATION_RELEASE:result.state);
  if(result.html!==before)for(const name of ['Content-Length','Content-Encoding','ETag','Content-MD5','Digest','Last-Modified'])headers.delete(name);
  return new Response(result.html,{status:response.status,statusText:response.statusText,headers});
 }};
}
