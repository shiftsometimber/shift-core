// Standalone contributor publisher; no Core release or general CMS authority.
import {API,ADMIN,blogRoutes,blogPublication,blogDiscovery,runBlogQueue} from '../babylove/contributor-service.mjs';
import {dynamicBabyLovePublicRoute} from '../babylove/dynamic-public.mjs';
import {parseCatalogue} from './knowledge-v20261022/live-catalogue.mjs';
import {mainFor} from './knowledge-v20261022/page.mjs';
import {approvedRefreshRoute,refreshCatalogue,refreshSitemap} from './approved-refreshes/refreshes.mjs';
import {approvedImage} from './approved-refreshes/assets.mjs';
const ROOT='https://shiftsometimber.co.uk';
const PUBLIC=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const exact=(p,base)=>p===base||p.startsWith(base+'/');
const json=(error,status)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function resolveOwner(request,env){
 const cookie=request.headers.get('Cookie');if(!cookie||!env.CORE?.fetch)return null;
 const r=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:{Cookie:cookie,Accept:'application/json'},redirect:'manual'}));
 if(!r.ok)return null;let data;try{data=await r.json()}catch{return null}
 return data.user?.id&&data.user?.role==='owner'?data.user:null;
}
export function mergeCatalogue(catalogue,rows){
 const own=new Map(rows.map(r=>['/articles/'+r.slug,{title:r.title,href:'/articles/'+r.slug,description:r.summary||'',type:'Article',topic:r.category||'weight',date:'Published '+new Date(r.publish_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}]));
 return [...own.values(),...catalogue.filter(r=>!own.has(r.href))];
}
export function mergeSitemap(text,rows){
 for(const row of rows){
  const loc=ROOT+'/articles/'+row.slug;
  const entry='<url><loc>'+loc+'</loc><lastmod>'+String(row.updated_at||row.publish_at).slice(0,10)+'</lastmod></url>';
  // Slugs are constrained to [a-z0-9-]; escape the remaining URL punctuation.
  const escaped=loc.replaceAll('.','\\.').replaceAll('/','\\/');
  const match=new RegExp('<url>\\s*<loc>'+escaped+'<\\/loc>[\\s\\S]*?<\\/url>');
  text=match.test(text)?text.replace(match,entry):text.replace('</urlset>',entry+'</urlset>');
 }
 return text;
}
function rewritten(response,body){
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','no-store, must-revalidate');headers.set('X-Shift-Blog-Publisher','standalone-v1');
 return new Response(body,{status:response.status,headers});
}
export async function handleRequest(request,env,ctx,options={}){
 const u=new URL(request.url),p=u.pathname;
 if(exact(p,API)||exact(p,ADMIN)){
  if(u.hostname!=='api.shiftsometimber.co.uk'&&!options.staging)return json('blog_api_host_required',404);
  return await blogRoutes(request,env,ctx,{...options,ownerResolver:options.ownerResolver||((r)=>resolveOwner(r,env))})||json('not_found',404);
 }
 if(!PUBLIC.has(u.hostname))return json('outside_blog_service',404);
 const approvedAsset=env.APPROVED_REFRESHES_ENABLED==='true'?approvedImage(p,request.method):null;if(approvedAsset)return approvedAsset;
 const approvedPage=env.APPROVED_REFRESHES_ENABLED==='true'?await approvedRefreshRoute(request,env):null;if(approvedPage)return approvedPage;
 if(p.startsWith('/uploads/blog/'))return await blogRoutes(request,env,ctx,options)||json('not_found',404);
 if(!['GET','HEAD'].includes(request.method))return json('read_only_public_blog',405);
 const article=p.match(/^\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/image)?\/?$/);
 if(article){
  if(await blogPublication(env,article[1]))return await dynamicBabyLovePublicRoute(request,env)||json('not_found',404);
  return env.CORE.fetch(request);
 }
 if(['/explore-knowledge','/explore-knowledge/','/explore-knowledge.html'].includes(p)){
  const response=await env.KNOWLEDGE.fetch(request);
  if(!response.ok||request.method==='HEAD')return response;
  const rows=await blogDiscovery(env);if(!env.APPROVED_REFRESHES_ENABLED&&!rows.length)return response;
  // Preserve the current live shell, styling and ticker; hold if its version changes.
  if(response.headers.get('X-Shift-Knowledge-Version')!=='20261022-knowledge-live-v1')return response;
  const source=await env.CORE.fetch(new Request(ROOT+'/explore-knowledge',{headers:{Accept:'text/html'}}));
  if(!source.ok)return response;
  let order={items:{}};try{const r=await env.CORE.fetch(new Request(ROOT+'/assets/knowledge-order-data-v1.json'));if(r.ok)order=await r.json()}catch{}
  let catalogue;try{catalogue=mergeCatalogue(parseCatalogue(await source.text(),order),rows);if(env.APPROVED_REFRESHES_ENABLED==='true')catalogue=refreshCatalogue(catalogue)}catch{return response}
  return new HTMLRewriter().on('main#main-content.kp',{element(e){e.setInnerContent(mainFor(catalogue,u),{html:true})}}).transform(rewritten(response,response.body));
 }
 if(p==='/sitemap.xml'){
  const response=await env.CORE.fetch(request);if(!response.ok||request.method==='HEAD')return response;
  const rows=await blogDiscovery(env);if(!rows.length&&env.APPROVED_REFRESHES_ENABLED!=='true')return response;let text=mergeSitemap(await response.text(),rows);if(env.APPROVED_REFRESHES_ENABLED==='true')text=refreshSitemap(text);return rewritten(response,text);
 }
 return json('outside_blog_service',404);
}
export default{
 async fetch(request,env,ctx){try{return await handleRequest(request,env,ctx)}catch{return json('blog_service_unavailable',503)}},
 async scheduled(event,env,ctx){ctx.waitUntil(runBlogQueue(env))}
};
