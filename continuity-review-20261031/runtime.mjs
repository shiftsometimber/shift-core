import {body,style} from './html.mjs';
import {HANDOFF_PATHS,transformHandoff} from './handoff.mjs';
export const version='continuity-review-20261031-v1';
export const paths=['/clinic-gone-quiet','/clinic-gone-quiet/','/clinic-gone-quiet.html'];
const tagPattern=/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined);
export function bounds(source,predicate){
 const re=new RegExp(tagPattern.source,'gi');let m;
 while((m=re.exec(source))){
  if(m[0].startsWith('</'))continue;
  if(['script','style'].includes(m[1].toLowerCase())){const end=source.toLowerCase().indexOf('</'+m[1].toLowerCase(),re.lastIndex);if(end>=0)re.lastIndex=source.indexOf('>',end)+1;continue;}
  if(!predicate(m[0],m[1].toLowerCase()))continue;
  const start=m.index,openEnd=re.lastIndex,tag=m[1].toLowerCase();let depth=1,n;
  while((n=re.exec(source))){
   const name=n[1].toLowerCase();
   if(['script','style'].includes(name)&&!n[0].startsWith('</')){const end=source.toLowerCase().indexOf('</'+name,re.lastIndex);if(end>=0)re.lastIndex=source.indexOf('>',end)+1;continue;}
   if(name===tag){depth+=n[0].startsWith('</')?-1:n[0].endsWith('/>')?0:1;if(!depth)return{start,end:re.lastIndex,openEnd,closeStart:n.index,tag,html:source.slice(start,re.lastIndex)};}
  }
  throw Error('Unclosed Continuity boundary '+tag);
 }
 return null;
}
export const mainHTML=html=>bounds(html,(_tag,name)=>name==='main')?.html||null;
function metadata(html){
 return html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(whole,open,json,close)=>{
  let value;try{value=JSON.parse(json);}catch{return whole;}
  let changed=false;for(const node of value['@graph']||[value]){
   if(node['@type']==='WebPage'&&node.url==='https://shiftsometimber.co.uk/clinic-gone-quiet'){
    node.headline='Clinic gone quiet? Keep your story together.';node.dateModified='2026-10-31';changed=true;
   }
  }
  return changed?open+JSON.stringify(value).replaceAll('<','\\u003c')+close:whole;
 });
}
export function transform(html,pathname='/clinic-gone-quiet'){
 if(!paths.includes(pathname))return{html,changed:false};
 if(html.includes('data-continuity-review="'+version+'"'))return{html,changed:false};
 const main=bounds(html,(_tag,name)=>name==='main');if(!main)throw Error('Continuity main is missing');
 const hero=bounds(main.html,tag=>attr(tag,'data-next-hero')==='continuity');if(!hero||!/<h1\b/.test(hero.html))throw Error('Current approved Continuity hero is missing');
 const before=html.slice(0,main.start),after=html.slice(main.end);
 const open=html.slice(main.start,main.openEnd).replace(/>$/,' data-continuity-review="'+version+'">');
 let output=before+open+hero.html+body+html.slice(main.closeStart,main.end)+after;
 output=output.replace('</head>','<style data-continuity-review-style="'+version+'">'+style+'</style></head>');
 if(output===before+open+hero.html+body+html.slice(main.closeStart,main.end)+after)throw Error('Continuity head is missing');
 return{html:metadata(output),changed:true};
}
export function wrap(original,ownedPaths=null){
 return{...original,async fetch(request,env,ctx){
  const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
  const owns=ownedPaths===null||ownedPaths.includes(url.pathname+(url.search?'?':''));
  const handoff=HANDOFF_PATHS.includes(url.pathname);
  if(!read||!owns||(!paths.includes(url.pathname)&&!handoff))return original.fetch(request,env,ctx);
  // A HEAD response has no body to transform; obtain the same safe GET view.
  const upstream=request.method==='HEAD'?new Request(request,{method:'GET'}):request;
  const response=await original.fetch(upstream,env,ctx);
  const type=response.headers.get('content-type')||'';
  if(response.status!==200||(handoff?!/(?:javascript|ecmascript)/i.test(type):!type.includes('text/html')))return request.method==='HEAD'?new Response(null,response):response;
  const source=await response.clone().text();let result;
  try{result=handoff?transformHandoff(source,url.pathname):transform(source,url.pathname);}catch(error){console.error('Continuity review retained original',error.message);return request.method==='HEAD'?new Response(null,response):response;}
  const headers=new Headers(response.headers);for(const key of ['content-length','content-encoding','etag','last-modified'])headers.delete(key);
  headers.set('X-Shift-Continuity-Review',version);headers.set('Cache-Control','private, no-store');
  return new Response(request.method==='HEAD'?null:result.html,{status:response.status,headers});
 }};
}
