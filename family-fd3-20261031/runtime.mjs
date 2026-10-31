import {css,hero,icon} from './presentation.mjs';
import {release,identify,assets} from './config.mjs';
import {byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 if(key!=='family')throw Error('Unapproved page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 const article=byClass(old,'sst-reading-article-v31'),note=byClass(old,'editorial-note-v2222'),sources=byClass(old,'sourcebox'),byline=byClass(old,'byline-v12');
 if(!article||!note||!sources||!byline)throw Error('Family guide boundaries missing');
 const a=article.html,headings=[...a.matchAll(/<h2\b[^>]*data-section="0[1-4]"[^>]*>[\s\S]*?<\/h2>/g)];if(headings.length!==4)throw Error('Expected all four original guide sections');
 const planner=a.match(/<p>\s*<a\b[^>]*href="\/my-weight-loss-roadmap#tab-family"[^>]*>[\s\S]*?<\/a>\s*<\/p>/)?.[0];if(!planner)throw Error('Original family planner missing');
 const blocks=headings.map((h,i)=>{const end=headings[i+1]?.index??a.lastIndexOf('</div>');return a.slice(h.index,end).replace(planner,'').trim()});
 const rows=blocks.map((b,i)=>'<section class="fd-row '+(i===3?'fd-surgery':'')+'"><div class="fd-symbol">'+icon(i)+'</div><div class="fd-content">'+b+'</div></section>').join('');
 const open=old.slice(0,old.indexOf('>')+1).replace('<main','<main data-approved-pages="family" data-approved-release="'+release+'"');
 const main=open+hero(byline.html,planner)+'<div class="fd-reading">'+rows+'<div class="fd-planner">'+planner+'</div>'+note.html+sources.html+'</div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-pages="family"]';
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
