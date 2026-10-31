import {css,symbol} from './presentation.mjs';
import {release,identify,pages} from './config.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const page=pages.find(p=>p.key===key);if(!page)throw Error('Unapproved utility page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 const h=byClass(old,page.hero);if(!h)throw Error('Original utility hero missing '+key);
 const breadcrumb=byClass(old,'breadcrumbs');let reading=inner(old).replace(h.html,'');if(breadcrumb)reading=reading.replace(breadcrumb.html,'');
 const sections=[];reading=reading.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g,(all,attrs,title)=>{const existing=attrs.match(/\bid=["']([^"']+)["']/)?.[1];const id=existing||'ut-'+key+'-'+(sections.length+1);sections.push({id,title});return existing?all:'<h2 id="'+id+'"'+attrs+'>'+title+'</h2>';});
 const index=sections.length>=5?'<div class="ut-index-frame"><details class="ut-index"><summary>On this page</summary><nav aria-label="Page sections"><ol>'+sections.map(s=>'<li><a href="#'+esc(s.id)+'">'+s.title+'</a></li>').join('')+'</ol></nav></details></div>':'';
 const open=old.slice(0,old.indexOf('>')+1).replace('<main','<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');
 const main=open+(breadcrumb?'<div class="ut-breadcrumbs">'+breadcrumb.html+'</div>':'')+'<section class="sp-support-hero"><div class="sp-support-copy">'+inner(h.html)+'</div><div class="sp-support-symbol">'+symbol(page.symbol)+'</div></section>'+index+'<div class="sp-support-body ut-reading">'+reading+'</div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages]';
 return withoutTicker(html.replace(old,main)).replace('</head>','<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style></head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained current utility page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
