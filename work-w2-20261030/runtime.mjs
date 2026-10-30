import {style,hero,benefits} from './presentation.mjs';
export const version='work-w2-20261030-v1';
export const assetPath='/shift-for-work/assets/workplace-w2-20261030.webp';
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const tags=/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined);
export function bounds(source,predicate){
 const re=new RegExp(tags.source,'gi');let m;
 while((m=re.exec(source))){
  if(m[0].startsWith('</'))continue;
  if(['script','style'].includes(m[1].toLowerCase())){const at=source.toLowerCase().indexOf('</'+m[1].toLowerCase(),re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
  if(!predicate(m[0],m[1].toLowerCase()))continue;
  const start=m.index,openEnd=re.lastIndex,tag=m[1].toLowerCase();
  if(voids.has(tag)||m[0].endsWith('/>'))return {start,end:openEnd,openEnd,closeStart:openEnd,html:source.slice(start,openEnd)};
  let depth=1,n;
  while((n=re.exec(source))){
   const name=n[1].toLowerCase();
   if(['script','style'].includes(name)&&!n[0].startsWith('</')){const at=source.toLowerCase().indexOf('</'+name,re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
   if(name===tag){depth+=n[0].startsWith('</')?-1:n[0].endsWith('/>')?0:1;if(!depth)return {start,end:re.lastIndex,openEnd,closeStart:n.index,html:source.slice(start,re.lastIndex)};}
  }
  throw Error('Unclosed presentation boundary '+tag);
 }
 return null;
}
export const byClass=(s,c)=>bounds(s,t=>(attr(t,'class')||'').split(/\s+/).includes(c));
export const byId=(s,id)=>bounds(s,t=>attr(t,'id')===id);
export const mainHTML=s=>bounds(s,(_t,n)=>n==='main')?.html;
export const withoutTicker=s=>{const ticker=byId(s,'shift-public-news');return ticker?s.slice(0,ticker.start)+s.slice(ticker.end):s;};
const finalStyle=html=>html.replace(/<style data-work-w2-style="[^"]+">[\s\S]*?<\/style>/g,'').replace('</head>','<style data-work-w2-style="'+version+'">'+style+'</style></head>');
export function transform(html){
 if(html.includes('data-work-w2="'+version+'"'))return finalStyle(withoutTicker(html));
 const main=mainHTML(html);if(!main)throw Error('Work main missing');
 const oldHero=byClass(main,'fw-hero'),oldBenefits=byClass(main,'fw-benefits');
 if(!oldHero||!oldBenefits||!byId(main,'work-enquiry')||!byId(main,'shift-work-enquiry'))throw Error('Work structure changed');
 if(!/<h1\b/i.test(oldHero.html))throw Error('Original Work heading missing');
 let updated=main.replace(oldHero.html,hero).replace(oldBenefits.html,benefits).replace(/<main\b/,'<main data-work-w2="'+version+'"');
 if((updated.match(/<h1\b/gi)||[]).length!==1)throw Error('Work requires one heading');
 return finalStyle(withoutTicker(html.replace(main,updated)));
}
export function wrap(original,media){
 return {...original,async fetch(request,env,ctx){
  const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
  if(read&&url.pathname===assetPath){return new Response(request.method==='HEAD'?null:media(),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}
  const target=read&&['/shift-for-work','/shift-for-work/','/shift-for-work.html'].includes(url.pathname);
  const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
  if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
  const body=await response.text();let output;
  try{output=transform(body);}catch(error){console.error('Work W2 retained previous page',error.message);return new Response(request.method==='HEAD'?null:body,response);}
  const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);
  headers.set('X-Shift-Work-W2',version);headers.set('Cache-Control','private, no-store');
  return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
 }};
}
