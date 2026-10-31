import {hero,css,continuityStrip} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {byClass,byId,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass,byId};
export {release as version};
function required(s,c){const b=byClass(s,c);if(!b)throw Error('Selected page boundary missing: '+c);return b;}
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const old=mainHTML(html);if(!old)throw Error('Page main missing');
 let main=old;
 if(key==='contact'){
  const h=required(main,'ct-hero'),f=required(main,'ct-form-card'),d=required(main,'ct-details'),s=required(main,'ct-safety');
  const open=main.slice(0,main.indexOf('>')+1);
  main=open+'<div class="sp-contact-grid"><div class="sp-contact-intro">'+h.html+d.html+'</div><div id="contact-form">'+f.html+'</div></div>'+s.html+'</main>';
 }else{
  const h=required(main,'nhh-hero');if(!h.html.includes('<h1'))throw Error('Hero heading missing');main=main.replace(h.html,hero(key));
  if(key==='life-back'){
   const needs=required(main,'lbp-needs').html;main=main.replace(needs,'');const h=required(main,'sp-hero');main=main.slice(0,h.end)+needs+main.slice(h.end);
  }
  if(key==='continuity'){
   const oldNeeds=required(main,'qpp-needs');
   const needs=oldNeeds.html.replace(/<div\b/,'<div id="sp-help-routes"').replace(/<p><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/g,'<p><strong>$1</strong><span class="sp-route-detail">$2</span></p>');
   const strip=continuityStrip.replace('</section>','<a class="sp-link" href="#continuity-now-title">See what stays with you →</a></section>');
   main=main.replace(oldNeeds.html,needs+strip);
  }
 }
 main=main.replace(/<main\b/,'<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');
 if((main.match(/<h1\b/gi)||[]).length!==1)throw Error('Selected page must have exactly one h1');
 let output=html.replace(old,main);
 if(!['newsroom','continuity'].includes(key))output=withoutTicker(output);
 const scopedCSS=css.replaceAll('main#main-content','main#main-content#main-content#main-content#main-content#main-content');
 return output.replace('</head>','<style data-approved-page-style="'+release+'">'+scopedCSS+'</style></head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),asset=media&&assets.includes(u.pathname);
 if(read&&asset)return new Response(request.method==='HEAD'?null:media(u.pathname),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 const page=identify(u.pathname),owns=ownedPaths.includes(u.pathname+(u.search?'?':'')),target=read&&page&&owns;
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;
 try{output=transform(body,page.key);}catch(error){console.error('Selected design retained current page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);
 headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
