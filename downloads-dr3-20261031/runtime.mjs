import {css,hero,groupHeader,icon} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};
export {release as version};
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 if(key!=='downloads')throw Error('Unapproved page');
 const old=mainHTML(html);if(!old)throw Error('Missing main');
 const grid=byClass(old,'resource-grid-v3b2'),note=byClass(old,'download-note-v3b2');if(!grid||!note)throw Error('Resource layout missing');
 const cards=[];let remaining=grid.html.slice(grid.html.indexOf('>')+1,grid.html.lastIndexOf('</div>'));
 while(remaining.trim()){const card=byClass(remaining,'resource-card-v3b2');if(!card)throw Error('Unknown resource markup');cards.push(card.html);remaining=remaining.slice(card.end);}
 if(cards.length!==6)throw Error('Expected all six existing resources');
 const groups=[{title:'Appointments',copy:'Get ready for your next conversation.',ids:[0,1]},{title:'Treatment decisions',copy:'Prepare your questions and check your provider.',ids:[2,3,4]},{title:'Keeping going',copy:'Plan for long-term maintenance.',ids:[5]}];
 const body=groups.map((g,i)=>'<section class="dr-group" aria-labelledby="dr-group-'+i+'">'+groupHeader(g,i)+'<div class="dr-cards">'+g.ids.map(j=>cards[j].replace('<div class="resource-card-v3b2">','<div class="resource-card-v3b2">'+icon(j))).join('')+'</div></section>').join('');
 const open=old.slice(0,old.indexOf('>')+1).replace('<main','<main data-approved-pages="downloads" data-approved-release="'+release+'"');
 const main=open+hero+'<div class="dr-resources">'+body+note.html+'</div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages="downloads"]';
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
