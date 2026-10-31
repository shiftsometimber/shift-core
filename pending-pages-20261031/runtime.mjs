import {hero,css} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};
export {release as version};
const root='html body main#main-content#main-content#main-content#main-content#main-content[data-approved-pages]';
const styleTag=()=>'<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style>';
export function normalise(html,key){
 const main=mainHTML(html);if(!main||byClass(main,'nhh-hero'))return html;
 const heading=bounds(main,(_t,n)=>n==='h1');if(!heading)throw Error('Legacy heading missing');
 let updated=main;
 if(key==='support'){
  const first=bounds(main.slice(heading.end),(_t,n)=>n==='section');if(!first)throw Error('Support content missing');
  const at=heading.end+first.start,context=main.slice(heading.end,at),body=main.slice(at,main.lastIndexOf('</main>'));
  let rest=body,offset=0,features;
  while(rest){const b=bounds(rest,(_t,n)=>n==='section');if(!b)break;if(b.html.includes('<h2>What you actually get</h2>')){features={...b,start:offset+b.start,end:offset+b.end};break;}offset+=b.end;rest=rest.slice(b.end);}
  if(!features)throw Error('Support features missing');
  updated=main.slice(0,main.indexOf('>')+1)+'<section class="nhh-hero">'+heading.html+'</section><section class="nhh-context">'+context+'</section><div class="spp-features"><div class="spp-wrap">'+features.html+'</div></div><div class="spp-reading">'+body.slice(0,features.start)+body.slice(features.end)+'</div></main>';
 }else if(['partner','comparison'].includes(key)){
  const legacy=byClass(main,key==='partner'?'contact-hero-v3b2':'authority-hero');if(!legacy)throw Error('Legacy hero missing');
  const h=bounds(legacy.html,(_t,n)=>n==='h1');const paragraphs=[...legacy.html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(x=>x[0]).filter(x=>!/(?:eyebrow)/.test(x));
  updated=main.replace(legacy.html,'<section class="nhh-hero">'+h.html+'</section><section class="nhh-context">'+paragraphs.join('')+'</section>');
 }else throw Error('Unknown legacy page '+key);
 return html.replace(main,updated);
}
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html.replace(new RegExp('<style data-approved-page-style="'+release+'">[\\s\\S]*?<\\/style>'),styleTag());
 html=normalise(html,key);
 const old=mainHTML(html);if(!old)throw Error('Page main missing');
 const h=byClass(old,'nhh-hero');if(!h?.html.includes('<h1'))throw Error('Current hero missing '+key);
 let main=old.replace(h.html,hero(key));
 if(key==='partner'){
  const grid=byClass(main,'partner-grid-v3b2');if(!grid)throw Error('Partner categories missing');
  let rest=grid.html.slice(grid.html.indexOf('>')+1,grid.html.lastIndexOf('</div>')),cards=[];
  while(rest.trim()){const b=byClass(rest,'partner-card-v3b2');if(!b)throw Error('Unexpected partner category');const heading=bounds(b.html,(_t,n)=>n==='h3');if(!heading)throw Error('Category heading missing');cards.push({title:heading.html.replace(/<[^>]+>/g,'').replaceAll('&amp;','&'),html:b.html});rest=rest.slice(b.end);}
  if(cards.length!==8)throw Error('Partner category count changed');cards.sort((a,b)=>a.title.localeCompare(b.title,'en-GB'));
  main=main.replace(grid.html,grid.html.slice(0,grid.html.indexOf('>')+1)+cards.map((c,i)=>c.html.replace('<div ','<div id="sp-partner-'+i+'" ')).join('')+'</div>');
 }
 main=main.replace(/<main\b/,'<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');
 if((main.match(/<h1\b/gi)||[]).length!==1)throw Error('Exactly one h1 required');
 return withoutTicker(html.replace(old,main)).replace('</head>',styleTag()+'</head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),asset=media&&assets.includes(u.pathname);
 if(read&&asset)return new Response(request.method==='HEAD'?null:media(u.pathname),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 const page=identify(u.pathname),owns=ownedPaths.includes(u.pathname+(u.search?'?':'')),target=read&&page&&owns;
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;
 try{output=transform(body,page.key);}catch(error){console.error('Approved page retained current response',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);
 headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
