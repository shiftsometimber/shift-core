import {version,guides} from './content.mjs';
import {client} from './client.mjs';
import {ASSET,normalPath,renderKnowledgeHub,renderGuide,renderFertility,improveExisting,serviceTopic,knowledgeSitemap} from './render.mjs';

const publicHost=host=>['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(host);
const cleanRequest=request=>{const headers=new Headers(request.headers);headers.delete('if-none-match');headers.delete('if-modified-since');return new Request(request,{headers});};
function output(response,body,head=false){
 const headers=new Headers(response.headers);for(const k of ['etag','last-modified','content-length','content-encoding','content-md5','digest'])headers.delete(k);
 const prior=headers.get('cache-control')||'';headers.set('cache-control',/\b(?:private|no-store)\b/i.test(prior)?prior:'public, max-age=0, must-revalidate');headers.set('x-shift-health-knowledge',version);
 return new Response(head?null:body,{status:response.status,statusText:response.statusText,headers});
}
export function withHealthKnowledgeWorker(worker){return {...worker,async fetch(request,env,ctx){
 const url=new URL(request.url),path=normalPath(url.pathname),read=['GET','HEAD'].includes(request.method);
 if(!publicHost(url.hostname)||!read)return worker.fetch(request,env,ctx);
 if(path===ASSET)return new Response(request.method==='HEAD'?null:client,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=86400','x-content-type-options':'nosniff'}});
 const guide=guides.find(g=>g.path===path),fertility=path==='/shift-health/fertility';
 const target=guide||fertility||['/knowledge','/explore-knowledge','/faq','/ask-timber','/sitemap.xml'].includes(path)||serviceTopic(path);
 if(!target)return worker.fetch(request,env,ctx);
 const cleaned=cleanRequest(request);
 if(guide||fertility){
  const shellUrl=new URL(url);shellUrl.pathname='/knowledge';shellUrl.search='';
  const shellRequest=new Request(shellUrl,{method:'GET',headers:cleaned.headers});
  const shell=env?.SHIFT_KNOWLEDGE_SHELL?await env.SHIFT_KNOWLEDGE_SHELL.fetch(shellRequest):await worker.fetch(shellRequest,env,ctx);
  if(shell.status!==200||!String(shell.headers.get('content-type')||'').includes('text/html'))return new Response('The guide is temporarily unavailable. Please try again.',{status:503,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  const original=await shell.text(),html=guide?renderGuide(original,path):renderFertility(original);
  if(!html)return new Response('The guide is temporarily unavailable. Please try again.',{status:503,headers:{'cache-control':'no-store'}});
  return output(shell,html,request.method==='HEAD');
 }
 // Fetch the actual public document for HEAD too, so GET/HEAD headers agree.
 const response=await worker.fetch(request.method==='HEAD'?new Request(cleaned,{method:'GET'}):cleaned,env,ctx);
 if(response.status!==200)return request.method==='HEAD'?new Response(null,response):response;
 if(path==='/sitemap.xml'){
  if(!/(?:xml|text\/plain)/i.test(response.headers.get('content-type')||''))return request.method==='HEAD'?new Response(null,response):response;
  const before=await response.text(),after=knowledgeSitemap(before);return output(response,after,request.method==='HEAD');
 }
 if(!String(response.headers.get('content-type')||'').includes('text/html'))return request.method==='HEAD'?new Response(null,response):response;
 const original=await response.text(),html=['/knowledge','/explore-knowledge'].includes(path)?renderKnowledgeHub(original):improveExisting(original,path);
 return html?output(response,html,request.method==='HEAD'):new Response(request.method==='HEAD'?null:original,response);
}};}
