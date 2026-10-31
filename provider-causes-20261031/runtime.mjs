import {providerHero,providerStrip,css} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {transform as transformQueryHero,classes as queryClasses} from './query-hero.mjs';
import {pages as queryPages} from './query-payload.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};
export {release as version};
export function normalise(html,key){
 if(key.startsWith('query-')){
  const id=key.slice(6),m=mainHTML(html),cl=queryClasses[id];if(byClass(m,cl))return html;
  const heading=bounds(m,(_t,n)=>n==='h1');if(!heading)throw Error('Query heading missing '+id);
  const open=m.slice(0,m.indexOf('>')+1),body=m.slice(heading.end,m.lastIndexOf('</main>'));
  return html.replace(m,open+'<section class="'+cl+'">'+heading.html+'</section>'+body+'</main>');
 }
 if(key!=='provider')return html;
 const m=mainHTML(html);if(!m||byClass(m,'nhh-hero'))return html;
 const heading=bounds(m,(_t,n)=>n==='h1');if(!heading)throw Error('Legacy provider heading missing');
 const body=m.slice(heading.end,m.lastIndexOf('</main>')),first=bounds(body,(_t,n)=>n==='section');if(!first)throw Error('Provider content missing');
 const context=body.slice(0,first.start),sections=body.slice(first.start);let rest=sections,offset=0,needs;
 while(rest){const b=bounds(rest,(_t,n)=>n==='section');if(!b)break;if(b.html.includes('<h2>Three different situations</h2>')){needs={...b,start:offset+b.start,end:offset+b.end};break;}offset+=b.end;rest=rest.slice(b.end);}
 if(!needs)throw Error('Provider situations missing');
 const updated=m.slice(0,m.indexOf('>')+1)+'<section class="nhh-hero">'+heading.html+'</section><section class="nhh-context">'+context+'</section><div class="psp-needs"><div class="psp-wrap">'+needs.html+'</div></div><div class="psp-reading">'+sections.slice(0,needs.start)+sections.slice(needs.end)+'</div></main>';
 return html.replace(m,updated);
}
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 html=normalise(html,key);const old=mainHTML(html);if(!old)throw Error('Page main missing');
 if(key.startsWith('query-')){const p=queryPages.find(p=>p.id===key.slice(6));if(!p)throw Error('Unapproved query hero');const result=transformQueryHero(html,p).html,m=mainHTML(result);return result.replace(m,m.replace(/<main\b/,'<main data-approved-pages="'+key+'" data-approved-release="'+release+'"'));}
 let main=old;
 if(key==='provider'){
  const h=byClass(main,'nhh-hero'),needs=byClass(main,'psp-needs');if(!h||!needs)throw Error('Provider layout boundaries missing');
  main=main.replace(needs.html,'').replace(h.html,providerHero+providerStrip+needs.html);
 }
 main=main.replace(/<main\b/,'<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');
 if((main.match(/<h1\b/g)||[]).length!==1)throw Error('Exactly one h1 required');
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages]';
 return withoutTicker(html.replace(old,main)).replace('</head>','<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style></head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(read&&media&&assets.includes(u.pathname))return new Response(request.method==='HEAD'?null:media(u.pathname),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 const page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained current page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
