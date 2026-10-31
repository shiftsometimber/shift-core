import {css,hero,icon} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 if(key!=='community')throw Error('Unapproved page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 const article=byClass(old,'sst-reading-article-v31'),heading=byClass(old,'article-brand-hero-v5'),grid=byClass(old,'social-community-grid-v2223'),stock=byClass(old,'newsletter-v2223'),join=byClass(old,'join-conversation-v2223');
 if(!article||!heading||!grid||!stock||!join)throw Error('Community boundaries missing');
 const introduction=old.slice(heading.end).match(/<p\b[^>]*>[\s\S]*?<\/p>/)?.[0];
 const principles=old.match(/<h2\b[^>]*data-section="01"[^>]*>[\s\S]*?<\/h2>\s*<ul\b[^>]*>[\s\S]*?<\/ul>/)?.[0];
 if(!introduction||!principles)throw Error('Original introduction/principles missing');
 const cards=[];let rest=grid.html.slice(grid.html.indexOf('>')+1,grid.html.lastIndexOf('</div>'));
 while(rest.trim()){const card=byClass(rest,'social-community-card-v2223');if(!card)throw Error('Unrecognised social content');const name=card.html.match(/<h3\b[^>]*>([^<]+)<\/h3>/)?.[1];if(!['Instagram','Facebook','X'].includes(name))throw Error('Unknown social destination');cards.push({name,html:card.html});rest=rest.slice(card.end);}
 if(cards.length!==3)throw Error('Exactly three existing social channels required');cards.sort((a,b)=>a.name.localeCompare(b.name,'en-GB'));
 const rows=cards.map(c=>c.html.replace('<div class="social-community-card-v2223">','<div class="social-community-card-v2223 cm-channel">'+icon(c.name))).join('');
 const open=old.slice(0,old.indexOf('>')+1).replace('<main','<main data-approved-pages="community" data-approved-release="'+release+'"');
 const main=open+hero(introduction)+'<div class="cm-reading"><section class="cm-channels" aria-label="Find SHIFT on social media"><h2 class="cm-sr">Find SHIFT on social media</h2>'+rows+'</section><div class="cm-panels"><section class="cm-principles">'+principles+'</section>'+stock.html+'</div>'+join.html+'</div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages="community"]';
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
