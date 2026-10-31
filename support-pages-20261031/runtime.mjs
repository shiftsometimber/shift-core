import {css,symbol} from './presentation.mjs';
import {release,identify,assets,pages} from './config.mjs';
import {bounds,byClass,byId,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</'));
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const page=pages.find(p=>p.key===key);if(!page)throw Error('Unapproved page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 const open=old.slice(0,old.indexOf('>')+1).replace('<main','<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');let body;
 if(key==='stock'){
  const h=byClass(old,'ct-hero'),form=byClass(old,'ct-form-card'),details=byClass(old,'ct-details');if(!h||!form||!details||!byId(form.html,'stockUpdateForm'))throw Error('Stock form boundaries missing');
  body='<section class="su-layout"><div class="su-introduction">'+inner(h.html)+'<div class="su-envelope">'+symbol('envelope')+'</div></div>'+form.html+'</section><aside class="su-boundary">'+symbol('info')+'<p>Joining this list is not an order, reservation or guarantee.</p></aside><div class="su-details">'+details.html+'</div>';
 }else{
  let h=byClass(old,page.hero),reading=inner(old);
  if(!h&&key==='advertising'){const heading=bounds(old,(_t,n)=>n==='h1');if(!heading)throw Error('Advertising heading missing');reading='<div class="mass-reading">'+reading.replace(heading.html,'')+'</div>';h={html:'<div>'+heading.html+'</div>'};}else if(h)reading=reading.replace(h.html,'');
  if(!h)throw Error('Original supporting hero missing '+key);
  body='<section class="sp-support-hero">'+inner(h.html)+'<div class="sp-support-symbol">'+symbol(page.symbol)+'</div></section><div class="sp-support-body">'+reading+'</div>';
 }
 const main=open+body+'</main>',root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages]';
 return withoutTicker(html.replace(old,main)).replace('</head>','<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style></head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained current page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
