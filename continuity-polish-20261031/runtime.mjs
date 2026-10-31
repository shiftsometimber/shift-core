export const version='continuity-polish-20261031-v1';
export const paths=['/clinic-gone-quiet','/clinic-gone-quiet/','/clinic-gone-quiet.html'];
const tags=/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined);
export function bounds(source,predicate){
 const re=new RegExp(tags.source,'gi');let m;
 while((m=re.exec(source))){
  if(m[0].startsWith('</'))continue;
  if(['script','style'].includes(m[1].toLowerCase())){const end=source.toLowerCase().indexOf('</'+m[1].toLowerCase(),re.lastIndex);if(end>=0)re.lastIndex=source.indexOf('>',end)+1;continue;}
  if(!predicate(m[0],m[1].toLowerCase()))continue;
  const start=m.index,openEnd=re.lastIndex,tag=m[1].toLowerCase();let depth=1,n;
  while((n=re.exec(source))){
   const name=n[1].toLowerCase();
   if(['script','style'].includes(name)&&!n[0].startsWith('</')){const end=source.toLowerCase().indexOf('</'+name,re.lastIndex);if(end>=0)re.lastIndex=source.indexOf('>',end)+1;continue;}
   if(name===tag){depth+=n[0].startsWith('</')?-1:n[0].endsWith('/>')?0:1;if(!depth)return{start,end:re.lastIndex,openEnd,closeStart:n.index,html:source.slice(start,re.lastIndex)};}
  }throw Error('Unclosed design boundary '+tag);
 }return null;
}
const byClass=(source,name)=>bounds(source,tag=>(attr(tag,'class')||'').split(/\s+/).includes(name));
export const mainHTML=html=>bounds(html,(_t,n)=>n==='main')?.html||'';
export const heroHTML=html=>byClass(mainHTML(html),'sp-hero')?.html||'';
const icons=[
 '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-6 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/>',
 '<path d="M4 7h15l-4-4M20 17H5l4 4M19 7l-4 4M5 17l4-4"/>',
 '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16m-12 5 3 3 5-5"/>',
 '<path d="M5 7h14a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3"/><path d="M21 11h-6v5h6"/><circle cx="17" cy="13.5" r=".5"/>',
 '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/><path d="m6 11 3 1 2-4 2 7 2-3h3"/>',
 '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/><path d="M12 7v5l3 2"/>'
];
const icon=(n)=>'<span class="cp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[n]+'</svg></span>';
export function transform(html,pathname='/clinic-gone-quiet'){
 if(!paths.includes(pathname)||html.includes('data-continuity-polish="'+version+'"'))return{html,changed:false};
 const main=bounds(html,(_t,n)=>n==='main');if(!main||!heroHTML(html)||!main.html.includes('data-continuity-review-body'))throw Error('Current approved Continuity design/body not found');
 const choices=byClass(main.html,'cr-choices');if(!choices)throw Error('Support choices missing');
 const entries=[];let rest=choices.html;
 for(let i=0;i<7;i++){const item=bounds(rest,(_t,n)=>n==='details');if(!item)break;entries.push(item.html);rest=rest.slice(item.end);}
 if(entries.length!==6)throw Error('Expected six support choices');
 const cards=entries.map((entry,i)=>entry.replace(/(<summary\b[^>]*>)([\s\S]*?)(<\/summary>)/i,(_all,open,text,close)=>open+icon(i)+'<span class="cp-label">'+text+'</span><span class="cp-toggle" aria-hidden="true"></span>'+close));
 const grouped='<div class="cr-choices"><div class="cp-column">'+cards.slice(0,3).join('')+'</div><div class="cp-column">'+cards.slice(3).join('')+'</div></div>';
 let updated=main.html.slice(0,choices.start)+grouped+main.html.slice(choices.end);
 updated=updated.replace(/^<main\b([^>]*)>/,(_all,attrs)=>'<main'+attrs+' data-continuity-polish="'+version+'">');
 const output=html.slice(0,main.start)+updated+html.slice(main.end);
 if(!output.includes('</head>'))throw Error('Document head missing');
 return{html:output.replace('</head>','<style data-continuity-polish-style="'+version+'">'+style+'</style></head>'),changed:true};
}
const r='html body main#main-content#main-content#main-content#main-content#main-content#main-content[data-continuity-polish]';
export const style=`
${r} .cr-body{width:calc(100% - 64px)!important;max-width:1216px!important;background:#050505!important;color:#E7E3DA!important}
${r} .cr-body>section{padding:30px 0!important;margin:0!important;border-bottom:1px solid #343b2d!important}
${r} .cr-body h2{font-size:clamp(27px,3vw,36px)!important;line-height:1.12!important;letter-spacing:-.035em!important;margin-bottom:18px!important}
${r} .cr-body .cr-intro{display:grid!important;grid-template-columns:1.1fr 1fr!important;column-gap:38px!important;align-items:start!important;padding:24px 0 28px!important;border:0!important;max-width:none!important}
${r} .cr-body .cr-intro>.cr-kicker,${r} .cr-body .cr-intro>.cr-free{grid-column:1/-1!important}
${r} .cr-body .cr-kicker{font-size:10px!important;letter-spacing:1.7px!important;font-weight:700!important;margin:0 0 13px!important}
${r} .cr-body .cr-lead{font-size:24px!important;line-height:1.4!important;letter-spacing:-.02em!important;margin-bottom:16px!important}
${r} .cr-body .cr-free{justify-self:start!important;background:#14190f!important;border:1px solid #414b35!important;border-radius:6px!important;padding:10px 14px!important;font-size:13px!important;margin:4px 0 0!important}
${r} .cr-body .cr-urgent{background:#10140d!important;border:1px solid #707762!important;border-left:3px solid #707762!important;border-radius:10px!important;padding:19px 23px!important;margin:0 0 4px!important}
${r} .cr-body .cr-urgent h2{font-size:18px!important;margin-bottom:7px!important}
${r} .cr-body .cr-urgent p{font-size:14px!important;line-height:1.6!important}
${r} .cr-body #sp-help-routes{background:#050505!important;color:#E7E3DA!important;border:0!important;padding:29px 0 27px!important;margin:0!important}
${r} .cr-body #sp-help-routes *{color:inherit!important}
${r} .cr-body #sp-help-routes .cr-choices{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;background:transparent!important;border:0!important;border-left:0!important;border-radius:0!important;padding:0!important;margin:22px 0 0!important}
${r} .cr-body .cr-choices::before,${r} .cr-body .cr-choices::after{display:none!important;content:none!important}
${r} .cr-body .cp-column{display:flex!important;flex-direction:column!important;gap:12px!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;min-width:0!important}
${r} .cr-body #sp-help-routes details{display:block!important;background:#0e120c!important;border:1px solid #414b35!important;border-radius:10px!important;padding:0!important;margin:0!important;overflow:hidden!important;min-width:0!important;box-shadow:none!important}
${r} .cr-body #sp-help-routes details[open]{border-color:#aab497!important;background:#171e12!important}
${r} .cr-body #sp-help-routes summary{display:flex!important;align-items:center!important;gap:14px!important;padding:20px!important;min-height:86px!important;font-size:19px!important;line-height:1.3!important;list-style:none!important;cursor:pointer!important;transition:background .15s ease!important}
${r} .cr-body #sp-help-routes summary:hover{background:#1c2417!important}
${r} .cr-body summary::-webkit-details-marker{display:none!important}
${r} .cr-body summary::marker{content:""!important}
${r} .cr-body .cp-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 38px!important;width:38px!important;height:38px!important;border:1px solid #707762!important;border-radius:9px!important;background:#252d1d!important;color:#E7E3DA!important;padding:7px!important}
${r} .cr-body .cp-icon svg{display:block!important;width:23px!important;height:23px!important;min-width:23px!important;border:0!important;background:none!important}
${r} .cr-body .cp-label{flex:1!important;min-width:0!important}
${r} .cr-body .cp-toggle{position:relative!important;display:block!important;flex:0 0 22px!important;width:22px!important;height:22px!important;background:none!important;border:0!important}
${r} .cr-body .cp-toggle::before,${r} .cr-body .cp-toggle::after{content:""!important;position:absolute!important;top:10px!important;left:4px!important;width:14px!important;height:1px!important;background:#E7E3DA!important}
${r} .cr-body .cp-toggle::after{transform:rotate(90deg)!important}
${r} .cr-body details[open] .cp-toggle::after{transform:none!important}
${r} .cr-body #sp-help-routes .cr-answer{padding:0 23px 22px 72px!important;background:none!important;border:0!important}
${r} .cr-body #sp-help-routes .cr-answer p{font-size:15px!important;line-height:1.65!important}
${r} .cr-body #sp-help-routes .cr-answer .cr-link{font-size:14px!important;font-weight:700!important;padding:9px 0!important;min-height:44px!important}
${r} .cr-body .sp-continuity-strip{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:15px!important;background:#11170d!important;border:1px solid #414b35!important;border-radius:10px!important;padding:23px!important;margin:0 0 23px!important}
${r} .cr-body .sp-continuity-strip a{grid-column:auto!important;font-size:14px!important;min-height:44px!important}
${r} .cr-body .sp-continuity-strip a.sp-button{background:#E7E3DA!important;color:#050505!important;border-color:#E7E3DA!important}
${r} .cr-body .sp-continuity-strip a.sp-button span{color:#050505!important}
${r} .cr-body .sp-continuity-strip strong{font-size:17px!important;margin-bottom:5px!important}
${r} .cr-body .sp-continuity-strip span{font-size:13px!important}
${r} .cr-body .cr-example{background:#E7E3DA!important;color:#050505!important;border:0!important;border-radius:12px!important;padding:28px!important;margin:0 0 6px!important}
${r} .cr-body .cr-example :is(p,h2,h3,span,div){color:#050505!important}
${r} .cr-body .cr-example .cr-loop{gap:0!important;margin:23px 0 18px!important;background:none!important;border:0!important}
${r} .cr-body .cr-example .cr-loop>div{background:transparent!important;border:0!important;border-right:1px solid #b4b5a7!important;border-radius:0!important;padding:0 24px!important}
${r} .cr-body .cr-example .cr-loop>div:first-child{padding-left:0!important}
${r} .cr-body .cr-example .cr-loop>div:last-child{border-right:0!important;padding-right:0!important}
${r} .cr-body .cr-example .cr-number{font-size:28px!important;letter-spacing:-1px!important;line-height:1!important;margin:0 0 17px!important;font-weight:500!important}
${r} .cr-body .cr-example h3{font-size:20px!important;line-height:1.25!important}
${r} .cr-body .cr-example p{font-size:15px!important}
${r} .cr-body .cr-example .cr-caption{font-size:12px!important;margin:0!important}
${r} .cr-body .cr-stays{gap:14px!important}
${r} .cr-body .cr-stays>article{padding:25px!important;border:1px solid #414b35!important;background:#0e120c!important;border-radius:10px!important}
${r} .cr-body .cr-stays>article h3{font-size:22px!important;margin-bottom:12px!important}
${r} .cr-body .cr-stays>article a{font-size:14px!important;font-weight:700!important;display:inline-block!important;min-height:44px!important;padding-top:9px!important}
${r} .cr-body .cr-two{gap:16px!important;align-items:stretch!important}
${r} .cr-body .cr-two>div{padding:25px!important;background:#0e120c!important;border:1px solid #414b35!important;border-radius:10px!important}
${r} .cr-body .cr-two h2{font-size:27px!important}
${r} .cr-body .cr-button{background:#E7E3DA!important;color:#050505!important;border-color:#E7E3DA!important;border-radius:6px!important;padding:13px 19px!important}
${r} .cr-body blockquote{padding:24px!important;background:#12180e!important;border:1px solid #414b35!important;border-left:3px solid #707762!important;border-radius:8px!important}
${r} .cr-body blockquote p{font-size:18px!important;line-height:1.7!important}
${r} .cr-body .cr-faq{gap:0!important;background:none!important;border:0!important}
${r} .cr-body .cr-faq details{background:transparent!important;border:0!important;border-bottom:1px solid #414b35!important;border-radius:0!important}
${r} .cr-body .cr-faq summary{display:list-item!important;font-size:17px!important;padding:19px 0!important;min-height:60px!important;line-height:1.4!important}
${r} .cr-body .cr-faq .cr-answer{padding:0 0 19px!important;max-width:900px!important}
${r} .cr-body .cr-end{display:grid!important;grid-template-columns:1fr auto!important;column-gap:30px!important;background:#161d10!important;border:1px solid #707762!important;border-radius:12px!important;padding:28px!important;margin:24px 0 0!important}
${r} .cr-body .cr-end h2,${r} .cr-body .cr-end>p:not(.cr-caption){grid-column:1!important}
${r} .cr-body .cr-end .cr-button{grid-column:2!important;grid-row:1/3!important;align-self:center!important;white-space:nowrap!important}
${r} .cr-body .cr-end .cr-caption{grid-column:1/-1!important}
${r} .cr-body .cr-evidence{border:0!important;padding-bottom:10px!important}
${r} .cr-body .cr-evidence h2{font-size:19px!important}
${r} .cr-body :is(a,summary):focus-visible{outline:3px solid #E7E3DA!important;outline-offset:4px!important}
@media(max-width:760px){
 ${r} .cr-body{width:calc(100% - 40px)!important}
 ${r} .cr-body .cr-intro{grid-template-columns:1fr!important;gap:0!important;padding:22px 0!important}
 ${r} .cr-body .cr-lead{font-size:21px!important}
 ${r} .cr-body #sp-help-routes .cr-choices{grid-template-columns:1fr!important;gap:12px!important}
 ${r} .cr-body #sp-help-routes summary{font-size:17px!important;padding:16px!important;min-height:76px!important;gap:12px!important}
 ${r} .cr-body #sp-help-routes .cr-answer{padding:0 18px 20px!important}
 ${r} .cr-body .sp-continuity-strip{grid-template-columns:1fr!important;padding:21px!important;gap:16px!important}
 ${r} .cr-body .cr-example{padding:23px!important}
 ${r} .cr-body .cr-example .cr-loop{grid-template-columns:1fr!important;gap:19px!important}
 ${r} .cr-body .cr-example .cr-loop>div{padding:0 0 19px!important;border:0!important;border-bottom:1px solid #b4b5a7!important}
 ${r} .cr-body .cr-example .cr-loop>div:last-child{padding-bottom:0!important;border:0!important}
 ${r} .cr-body .cr-example .cr-number{font-size:25px!important;margin-bottom:10px!important}
 ${r} .cr-body .cr-two,${r} .cr-body .cr-stays{grid-template-columns:1fr!important}
 ${r} .cr-body .cr-end{grid-template-columns:1fr!important;padding:23px!important}
 ${r} .cr-body .cr-end .cr-button{grid-column:1!important;grid-row:auto!important;margin:5px 0!important;justify-self:stretch!important}
}
@media(prefers-reduced-motion:reduce){${r} .cr-body summary{transition:none!important}}
`;
export function wrap(original,ownedPaths=null){return{...original,async fetch(request,env,ctx){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method),owns=ownedPaths===null||ownedPaths.includes(url.pathname+(url.search?'?':''));
 if(!read||!owns||!paths.includes(url.pathname))return original.fetch(request,env,ctx);
 const response=await original.fetch(request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(response.status!==200||!(response.headers.get('content-type')||'').includes('text/html'))return request.method==='HEAD'?new Response(null,response):response;
 let result;try{result=transform(await response.clone().text(),url.pathname);}catch(error){console.error('Continuity polish kept current page',error.message);return request.method==='HEAD'?new Response(null,response):response;}
 const headers=new Headers(response.headers);for(const key of ['content-length','content-encoding','etag','last-modified'])headers.delete(key);headers.set('X-Shift-Continuity-Polish',version);headers.set('Cache-Control','private, no-store');return new Response(request.method==='HEAD'?null:result.html,{status:200,headers});
}};}
