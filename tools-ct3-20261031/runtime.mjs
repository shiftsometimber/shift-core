import {hero,checkin,grid,style,moreLinks,photoPath} from './presentation.mjs';
import {bounds,byClass,byId,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass,byId,withoutTicker};
export {photoPath};
export const version='tools-ct3-20261031-v1';
export function calculatorSection(source){let rest=source,offset=0;while(rest){const section=bounds(rest,(_t,n)=>n==='section');if(!section)break;if(byClass(section.html,'toolgrid'))return {...section,start:offset+section.start,end:offset+section.end};offset+=section.end;rest=rest.slice(section.end);}return null;}
function finalStyle(html){return html.replace(/<style data-tools-ct3-style="[^"]+">[\s\S]*?<\/style>/g,'').replace('</head>','<style data-tools-ct3-style="'+version+'">'+style+'</style></head>');}
export function transform(html){
 if(html.includes('data-tools-ct3="'+version+'"'))return finalStyle(withoutTicker(html));
 const main=mainHTML(html);if(!main)throw Error('Tools main missing');
 const oldHero=byClass(main,'pagehero'),oldCheckin=byId(main,'feel-featured-tool'),oldGrid=calculatorSection(main),authority=byClass(main,'tools-authority-strip');
 if(!oldHero||!oldCheckin||!oldGrid||!authority)throw Error('Tools structure changed');
 if(!/<h1\b/i.test(oldHero.html))throw Error('Tools heading missing');
 let updated=main.replace(oldHero.html,hero+checkin+grid).replace(oldCheckin.html,'').replace(oldGrid.html,'');
 const guide=byClass(updated,'tools-authority-strip');
 updated=updated.slice(0,guide.start)+'<span class="ct3-anchor" id="ct3-more-guides" aria-hidden="true"></span>'+guide.html.replace(/<\/div>$/,moreLinks+'</div>')+updated.slice(guide.end);
 updated=updated.replace(/<main\b/,'<main data-tools-ct3="'+version+'"');
 const opening=updated.slice(0,updated.indexOf('>')+1);
 if(!/\bclass="[^"]*\btpp\b/.test(opening))updated=updated.replace(opening,opening.replace(/class="([^"]*)"/,'class="$1 tpp"'));
 if((updated.match(/<h1\b/gi)||[]).length!==1)throw Error('Tools requires one heading');
 return finalStyle(withoutTicker(html.replace(main,updated)));
}
export function wrap(original,media,ownedPaths=null){return {...original,async fetch(request,env,ctx){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(read&&media&&url.pathname===photoPath)return new Response(request.method==='HEAD'?null:media(),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 const owns=ownedPaths===null||ownedPaths.includes(url.pathname+(url.search?'?':''));
 const target=read&&owns&&['/tools','/tools/','/tools.html'].includes(url.pathname);
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body);}catch(error){console.error('CT3 kept the previous Tools page',error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Tools-CT3',version);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
