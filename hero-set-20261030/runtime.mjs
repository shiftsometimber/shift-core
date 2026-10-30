import {pages,style} from './payload.mjs';
export const version='hero-set-20261030-v1';
export const assetPrefix='/shift-health/hero-set-20261030/';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const tags=/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined);
export function bounds(source,predicate){
 const re=new RegExp(tags.source,'gi');let m;
 while((m=re.exec(source))){
  if(m[0].startsWith('</'))continue;
  if(['script','style'].includes(m[1].toLowerCase())){const at=source.toLowerCase().indexOf('</'+m[1].toLowerCase(),re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
  if(!predicate(m[0],m[1].toLowerCase()))continue;
  const start=m.index,openEnd=re.lastIndex,tag=m[1].toLowerCase();
  if(voids.has(tag)||m[0].endsWith('/>'))return {start,end:openEnd,openEnd,closeStart:openEnd,tag,html:source.slice(start,openEnd)};
  let depth=1,n;
  while((n=re.exec(source))){
   const name=n[1].toLowerCase();
   if(['script','style'].includes(name)&&!n[0].startsWith('</')){const at=source.toLowerCase().indexOf('</'+name,re.lastIndex);if(at>=0)re.lastIndex=source.indexOf('>',at)+1;continue;}
   if(name===tag){depth+=n[0].startsWith('</')?-1:n[0].endsWith('/>')?0:1;if(!depth)return {start,end:re.lastIndex,openEnd,closeStart:n.index,tag,html:source.slice(start,re.lastIndex)};}
  }
  throw Error('Unclosed hero boundary '+tag);
 }
 return null;
}
export const byClass=(s,c)=>bounds(s,t=>(attr(t,'class')||'').split(/\s+/).includes(c));
export const byTag=(s,name)=>bounds(s,(_t,n)=>n===name);
export const classes={mot:'productHero',measure:'productHero',smoking:'productHero',confidence:'productHero',fertility:'kh-hero',research:'mw-hero','life-back':'lbp-hero',continuity:'qpp-hero','free-support':'spp-hero',switching:'psp-hero','knowledge-entry':'kp-hero','knowledge-library':'kh-hero','male-obesity':'mop-hero','weight-management':'authority-hero',about:'ab-letter-heading','partner-support':'hpp-hero',community:'opening',newsroom:'nr-masthead',retatrutide:'reta-hero','wegovy-costs':'sg-hero','testosterone-weight':'cluster-hero','mot-guide':'pillar-hero','work-with-us':'ww-hero','partner-with-us':'contact-hero-v3b2','corporate-wellbeing':'pagehero','provider-pilot':'mass-hero','nhs-private':'np-hero','surgery-options':'surg2-hero','treatment-comparison':'authority-hero'};
function fragments(source,predicate){const out=[];let rest=source;for(let i=0;i<100;i++){const n=bounds(rest,predicate);if(!n)break;out.push(n.html);rest=rest.slice(n.end);}return out.join('');}
function retainedContext(p,old){
 if(p.kind==='product')return ['availability','actions'].map(c=>{const n=byClass(old,c);if(!n)throw Error('Missing '+c);return n.html;}).join('');
 if(p.id==='about'||p.id==='community')return '';
 if(p.id==='knowledge-entry')return byTag(old,'form')?.html||'';
 if(p.id==='knowledge-library')return (byClass(old,'kh-note')?.html||'')+(byClass(old,'kh-nav')?.html||'');
 if(p.id==='newsroom')return fragments(old,(t,n)=>n==='a'&&(attr(t,'href')||'').includes('editorial-standards'));
 if(p.id==='research')return fragments(old,(t,n)=>n==='a'&&attr(t,'href')==='#how-we-check');
 // Retain substantive opening paragraphs, attribution, dates, clinical limits,
 // tables, functional actions and forms. Only presentation headings/art go.
 const root=byTag(old,old.match(/^<([\w-]+)/)?.[1]);let inner=old.slice(root.openEnd,root.closeStart);
 const keep=[];
 const re=new RegExp(tags.source,'gi');let m;
 while((m=re.exec(inner))){
  if(m[0].startsWith('</'))continue;const cls=(attr(m[0],'class')||'').split(/\s+/),name=m[1].toLowerCase();
  const retain=['p','aside','form','table','time'].includes(name)||cls.some(c=>['availability','actions','continuity-actions','mop-actions','decision-meta'].includes(c));
  if(!retain||cls.some(c=>/eyebrow|kicker/.test(c)))continue;
  const n=bounds(inner.slice(m.index),(_t,_n)=>true);if(n){keep.push(n.html);re.lastIndex=m.index+n.end;}
 }
 return keep.join('');
}
function hero(p){
 const title='nhh-title-'+p.id;
 const photo=p.asset?'<figure class="nhh-photo"><img src="'+assetPrefix+p.asset+'.webp" width="1672" height="941" alt="'+esc(p.alt)+'" fetchpriority="high" decoding="async"></figure>':'';
 const letter=p.quote?'<aside class="founder-letter"><p class="founder-label">A letter from the founder</p><blockquote>“'+esc(p.quote)+'”</blockquote><p><strong>Matt O’Brien</strong><br>Founder, Shift Some Timber</p></aside>':'';
 return '<section class="nhh-hero'+(p.compact?' nhh-compact':'')+(p.quote?' nhh-letter':'')+'" data-next-hero="'+p.id+'" aria-labelledby="'+title+'" style="--nhh-position:'+p.position+'">'+photo+'<div class="nhh-copy"><p class="nhh-brand">'+esc(p.brand)+'</p><p class="nhh-eyebrow">'+esc(p.eyebrow)+'</p><h1 id="'+title+'">'+p.headline.map(esc).join('<br>')+'</h1><p class="nhh-lede">'+esc(p.copy)+'</p><ul class="nhh-benefits">'+p.labels.map((x,i)=>'<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p.icons[i]+'</svg><span>'+esc(x)+'</span></li>').join('')+'</ul><a class="nhh-cta" href="'+esc(p.target)+'">'+esc(p.cta)+'</a><p class="nhh-note">'+esc(p.note)+'</p></div>'+letter+'</section>';
}
const hasId=(s,id)=>new RegExp('\\bid\\s*=\\s*["\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\']').test(s);
function finalStyle(html){
 // An inner serving layer may already add our stylesheet before an outer
 // page layer appends its own. Keep this release's exact styles last.
 const ownStyle=new RegExp('<style data-hero-set-style="'+version+'">[\\s\\S]*?<\\/style>','g');
 return html.replace(ownStyle,'').replace('</head>','<style data-hero-set-style="'+version+'">'+style+'</style></head>');
}
export function transform(html,p,{checkTarget=true}={}){
 if(html.includes('data-next-hero="'+p.id+'"')){const result=finalStyle(html);return {html:result,changed:result!==html};}
 const main=byTag(html,'main');if(!main)throw Error('No main '+p.path);
 const beforeMain=html.slice(0,main.start),afterMain=html.slice(main.end),body=main.html;
 const node=byClass(body,classes[p.id]);if(!node)throw Error('Hero structure changed '+p.path);
 if(!/<h1\b/i.test(node.html))throw Error('Selected hero lacks heading '+p.path);
 const context=retainedContext(p,node.html);
 const extra=context?'<section class="nhh-context" data-nhh-retained-context aria-label="Page context and existing actions">'+context+'</section>':'';
 let updated=body.slice(0,node.start)+(p.id==='about'?'':hero(p)+extra)+body.slice(node.end);
 if(p.id==='about')updated=updated.slice(0,main.openEnd-main.start)+hero(p)+updated.slice(main.openEnd-main.start);
 // Remove only the superseded opening stock photograph, keeping captions.
 if(p.removePhotoClass){const fig=byClass(updated,p.removePhotoClass);if(fig)updated=updated.slice(0,fig.start)+updated.slice(fig.end);}
 if(p.target.startsWith('#')&&!hasId(updated,p.target.slice(1))){
  const marker=p.target.slice(1);
  if(marker==='research-directory'){const form=byClass(updated,'mw-filter');if(!form)throw Error('Research filter missing');updated=updated.slice(0,form.start)+updated.slice(form.start,form.openEnd-1)+' id="'+marker+'">'+updated.slice(form.openEnd);}
  else if(marker==='fertility-guides'||marker==='nhh-content-start'){
   const h=byTag(updated,'h2');if(!h)throw Error('Reading anchor missing '+p.path);
   updated=updated.slice(0,h.start)+'<span id="'+marker+'" class="nhh-anchor" aria-hidden="true"></span>'+updated.slice(h.start);
  }else if(checkTarget)throw Error('CTA anchor missing '+p.path+' '+p.target);
 }
 const open=byTag(updated,'main');if(!attr(updated.slice(open.start,open.openEnd),'id'))updated=updated.slice(0,open.openEnd-1)+' id="main-content">'+updated.slice(open.openEnd);
 let result=beforeMain+updated+afterMain;
 result=finalStyle(result);
 if((updated.match(/<h1\b/gi)||[]).length!==1)throw Error('Expected one page heading '+p.path);
 return {html:result,changed:true,removedHero:node.html,retainedContext:context};
}
export function wrap(original,assetHandler=null,ownedPaths=null){
 return {...original,async fetch(request,env,ctx){
  const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
  if(read&&assetHandler&&url.pathname.startsWith(assetPrefix)){const r=assetHandler(url.pathname.slice(assetPrefix.length));if(r)return new Response(request.method==='HEAD'?null:r,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}
  const ownsPath=ownedPaths===null||ownedPaths.includes(url.pathname+(url.search?'?':''));
  const p=ownsPath?pages.find(p=>[p.path,p.path+'/',p.path+'.html'].includes(url.pathname)):null;
  const response=await original.fetch(request,env,ctx);
  if(!p||!read||response.status!==200||!(response.headers.get('content-type')||'').includes('text/html'))return response;
  const body=await response.text();let output;try{output=transform(body,p);}catch(error){console.error('Hero presentation retained original',p.id,error.message);return new Response(request.method==='HEAD'?null:body,response);}
  const headers=new Headers(response.headers);for(const key of ['content-length','content-encoding','etag','last-modified'])headers.delete(key);headers.set('X-Shift-Hero-Set',version);headers.set('Cache-Control','private, no-store');
  return new Response(request.method==='HEAD'?null:output.html,{status:response.status,headers});
 }};
}
