import {byPath,imageURL,assetKey,replaceHero,version} from './heroes.mjs';
import {heroStyle} from './styles.mjs';
export function composeHeroPages(retained,assets){
 const decoded=new Map();
 return {...retained,async fetch(request,env,ctx){
  const url=new URL(request.url),p=byPath(url.pathname),asset=p&&assets[p.id];
  if(asset&&['GET','HEAD'].includes(request.method)&&url.searchParams.get('shift_hero')===assetKey(p,asset)){
   if(!decoded.has(p.id))decoded.set(p.id,Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0)));
   return new Response(request.method==='HEAD'?null:decoded.get(p.id),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  }
  const response=await retained.fetch(request,env,ctx);
  if(!asset||!['GET','HEAD'].includes(request.method)||url.searchParams.has('product')||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
  const html=await response.clone().text();let result;
  try{result=replaceHero(html,p,asset);}catch{return response;}
  if(!result.changed)return response;
  if(!html.includes('</head>'))return response;
  const updated=result.html.replace('</head>','<style data-shift-page-heroes="'+version+'">'+heroStyle+'</style></head>');
  const headers=new Headers(response.headers);
  for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
  headers.set('X-Shift-Approved-Hero',p.id+'; '+version);
  return new Response(request.method==='HEAD'?null:updated,{status:response.status,statusText:response.statusText,headers});
 }};
}
