import {hero,css,continuityStrip} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {bounds,byClass,byId,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass,byId};
export {release as version};
function required(s,c){const b=byClass(s,c);if(!b)throw Error('Selected page boundary missing: '+c);return b;}
export function normalise(html,key){
 if(!['continuity','life-back'].includes(key))return html;
 const main=mainHTML(html);if(!main||byClass(main,'nhh-hero'))return html;
 const kicker=required(main,'continuity-kicker'),title=bounds(main,(_t,n)=>n==='h1');if(!title)throw Error('Legacy heading missing');
 const open=main.slice(0,main.indexOf('>')+1),body=main.slice(title.end,main.lastIndexOf('</main>'));
 const firstSection=bounds(body,(_t,n)=>n==='section');if(!firstSection)throw Error('Legacy content section missing');
 const context=body.slice(0,firstSection.start),sections=body.slice(firstSection.start);
 const target=key==='continuity'?'First decide what you need help with':'How Life Back works';
 let remaining=sections,offset=0,needs;
 while(remaining){const block=bounds(remaining,(_t,n)=>n==='section');if(!block)break;const heading=bounds(block.html,(_t,n)=>n==='h2');if(heading?.html.includes(target)){needs={...block,start:offset+block.start,end:offset+block.end};break;}offset+=block.end;remaining=remaining.slice(block.end);}
 if(!needs)throw Error('Legacy help section missing '+key);
 const prefix=key==='continuity'?'qpp':'lbp',reading=sections.slice(0,needs.start)+sections.slice(needs.end);
 const structured=open+'<section class="nhh-hero">'+kicker.html+title.html+'</section><section class="nhh-context">'+context+'</section><div class="'+prefix+'-needs"><div class="'+prefix+'-wrap">'+needs.html+'</div></div><div class="'+prefix+'-reading">'+reading+'</div></main>';
 return html.replace(main,structured);
}
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 html=normalise(html,key);const old=mainHTML(html);if(!old)throw Error('Page main missing');
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
   const strip=continuityStrip.replace('</section>','<a class="sp-link" href="#continuity-now-title">See what stays with you →</a></section>');
   if(byClass(main,'cr-choices')){
    let remaining=main,offset=0,section;
    while(remaining){const b=bounds(remaining,(_t,n)=>n==='section');if(!b)break;if(byClass(b.html,'cr-choices')){section={...b,start:offset+b.start,end:offset+b.end};break;}offset+=b.end;remaining=remaining.slice(b.end);}
    if(!section)throw Error('Current Continuity choice section missing');
    const needs=section.html.replace(/<section\b/,'<section id="sp-help-routes"');main=main.replace(section.html,needs+strip);
   }else{
    const oldNeeds=required(main,'qpp-needs');
    const needs=oldNeeds.html.replace(/<div\b/,'<div id="sp-help-routes"').replace(/<p><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/g,'<p><strong>$1</strong><span class="sp-route-detail">$2</span></p>');
    main=main.replace(oldNeeds.html,needs+strip);
   }
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
