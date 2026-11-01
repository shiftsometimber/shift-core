import {css} from './presentation.mjs';
import {graphic} from './graphics.mjs';
import {release,identify,pages} from './config.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</'));
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const page=pages.find(p=>p.key===key);if(!page)throw Error('Unscoped decision page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 const hero=bounds(old,(tag,name)=>name==='section'&&(tag.match(/class="([^"]*)/)?.[1]||'').split(/\s+/).some(c=>c.includes('hero')));if(!hero)throw Error('Missing original hero');
 const wrap=byClass(hero.html,'wrap');if(!wrap)throw Error('Missing hero content');let copy=inner(wrap.html),tail='';
 if(key==='future'){const aside=copy.indexOf('<aside');if(aside>=0){tail=copy.slice(aside);copy=copy.slice(0,aside);}}
 const visual=graphic(key),layout='<div class="dp-hero-layout"><div class="dp-hero-copy">'+copy+'</div>'+visual+'</div>'+(tail?'<div class="dp-hero-tail">'+tail+'</div>':'');
 const revisedWrap=wrap.html.slice(0,wrap.html.indexOf('>')+1)+layout+'</div>';
 const revisedHero=hero.html.replace(wrap.html,revisedWrap).replace('<section','<section data-dp-hero');
 let main=old.replace(hero.html,revisedHero).replace('<main','<main data-approved-pages="'+key+'" data-approved-release="'+release+'"');
 main=main.replace(/(?:<section\b[^>]*class="[^"]*programme-cta-mini[^"]*"[^>]*>[\s\S]*?<\/section>\s*){2,}/g,block=>'<div class="dp-next-grid">'+block+'</div>');
 const guidance=bounds(main,t=>t.includes('data-tool-guidance='));if(guidance)main=main.replace(guidance.html,'<details class="dp-guidance"><summary><span data-dp-label>About this tool and saved profiles</span></summary>'+guidance.html+'</details>');
 main=main.slice(0,main.indexOf('>')+1)+'<div class="dp-service-container sg-copy">'+main.slice(main.indexOf('>')+1,main.lastIndexOf('</main>'))+'</div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-release="'+release+'"]';
 const placement='<script data-dp-bridge>(()=>{const place=()=>{const m=document.querySelector(\'main[data-approved-release="'+release+'"]\'),c=m?.querySelector(\'.dp-service-container\'),b=m?.querySelector(\'.sst-service-bridge\');if(c&&b&&(b.parentElement!==c||b!==c.lastElementChild))c.append(b);};new MutationObserver(place).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener(\'DOMContentLoaded\',place,{once:true});})();</script>';
 return withoutTicker(html.replace(old,main)).replace('</head>','<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style>'+placement+'</head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained original decision page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
