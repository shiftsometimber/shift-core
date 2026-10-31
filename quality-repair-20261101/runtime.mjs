import {css} from './presentation.mjs';
import {graphic,timeline} from './graphics.mjs';
import {release,identify,pages} from './config.mjs';
import {bounds,byClass,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
export const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const atoms=new Set(['p','h2','h3','h4','ul','ol','dl','table','pre','blockquote','figure','form','a','aside','script','style']);
const components=['principle-grid-v65','authority-grid-v65','press-grid-v3b2','promise-grid-v3b1','find-tree','find-banner','road-banner','mot-banner','med2-banner','sourcebox','source-box','editorial-note-v2222','partner-placeholder','trust-statement','join-conversation-v2223','grid2','mot-method','commercial-cta-v3b1'];
export function blocks(source){
 const result=[];let rest=source,limit=0;
 while(rest.trim()&&limit++<500){
  const b=bounds(rest,()=>true);if(!b){if(rest.trim())result.push(rest);break;}
  const leading=rest.slice(0,b.start);if(leading.replace(/<!--[\s\S]*?-->/g,'').trim())result.push(leading);
  const opening=b.html.slice(0,b.html.indexOf('>')+1),tag=opening.match(/^<([\w-]+)/)?.[1],classes=opening.match(/\bclass=["']([^"']*)["']/)?.[1]?.split(/\s+/)||[];
  if(atoms.has(tag)||components.some(c=>classes.includes(c))||opening.includes('partner-boundary-v42l'))result.push(b.html);
  else result.push(...blocks(inner(b.html)));
  rest=rest.slice(b.end);
 }
 return result.filter(s=>s.trim());
}
function decorateGrid(html){
 return html.replace(/<(article|div)(\s[^>]*class=["'][^"']*(?:promise-card-v3b1|press-card-v3b2)[^"']*["'][^>]*)>/g,'<$1$2>').replace(/<h3\b([^>]*)>([\s\S]*?)<\/h3>/g,(all,a,t)=>all);
}
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const page=pages.find(p=>p.key===key);if(!page)throw Error('Unscoped page');const old=mainHTML(html);if(!old)throw Error('Missing main');
 let copy=byClass(old,'sp-support-copy'),body=byClass(old,'sp-support-body');
 const breadcrumb=byClass(old,'ut-breadcrumbs')||byClass(old,'breadcrumbs');
 if(!copy||!body){
  const heroClass={mot:'mot-hero',finder:'find-hero',roadmap:'road-hero',medication:'med2-hero',trees:'find-hero',commercial:'pagehero',reviews:'pagehero',disclosure:'pagehero',contributors:'pagehero',media:'article-brand-hero-v5',press:'contact-hero-v3b2',partners:'pagehero',promise:'commercial-hero-v3b1'}[key];
  const hero=heroClass&&byClass(old,heroClass)||bounds(old,(_t,n)=>n==='h1');if(!hero)throw Error('Source hero missing '+key);
  copy={html:hero.html};body={html:'<div>'+inner(old).replace(hero.html,'').replace(breadcrumb?.html||'','')+'</div>'};
  if(/^<h1\b/.test(hero.html))copy={html:'<div>'+hero.html+'</div>'};
 }
 let nodes=blocks(inner(body.html));
 const groups=[];let active=null;
 for(const node of nodes){
  if(/^<h2\b/.test(node)){
   active={heading:node,items:[]};groups.push(active);
  }else if(active)active.items.push(node);else groups.push({items:[node]});
 }
 let sectionNo=0;
 const reading=groups.map((g,i)=>{
  if(!g.heading)return '<div class="qr-block">'+g.items.join('')+'</div>';
  const title=g.heading.replace(/<[^>]*>/g,'').trim(),isSources=/^(Sources|Core evidence anchors)$/i.test(title),isFirst=sectionNo++===0;
  const id=g.heading.match(/\bid=["']([^"']+)["']/)?.[1]||'qr-'+key+'-'+sectionNo;
  let heading=g.heading.includes('id=')?g.heading:g.heading.replace('<h2','<h2 id="'+id+'"');
  const bodyHTML=decorateGrid(g.items.join(''));
  const wide=isSources||/Local (storage|data)|What data|How authority|What we consider|Platform facts|The rules/i.test(title)||/principle-grid-v65|authority-grid-v65|press-grid-v3b2|promise-grid-v3b1|find-tree|grid2|mot-banner|find-banner|road-banner|med2-banner|commercial-cta-v3b1/.test(bodyHTML);
  const feature=isFirst&&['mot','finder','medication','reviews','disclosure'].includes(key);
  return '<section class="qr-section'+(wide?' qr-wide':'')+(feature?' qr-feature':'')+(isSources?' qr-sources':'')+'"><div class="qr-section-title"><span class="qr-section-no" data-qr-decoration aria-hidden="true">'+String(sectionNo).padStart(2,'0')+'</span>'+heading+'</div><div class="qr-section-detail">'+bodyHTML+'</div></section>';
 }).join('');
 const headings=[...reading.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)];
 const index=headings.length>=5?'<details class="qr-index" data-qr-decoration><summary>On this page <span aria-hidden="true">+</span></summary><nav aria-label="Page sections">'+headings.map(m=>'<a href="#'+esc(m[1])+'">'+m[2]+'</a>').join('')+'</nav></details>':'';
 let open=old.slice(0,old.indexOf('>')+1).replace(/\sdata-approved-(?:release|pages)="[^"]*"/g,'').replace('<main','<main data-approved-pages="'+key+'" data-approved-release="'+release+'" data-qr-layout="'+page.layout+'"');
 const visual=page.photo?'<figure class="qr-photo"><img src="/assets/quality-repair-20261101/'+page.photo+'.webp" alt="'+({mot:'A man measuring his waist at home',roadmap:'A man walking along an urban canal towpath',research:'Checking research and notes using a tablet',contributors:'Two people discussing research together',media:'Recording equipment on an independent media desk',partners:'Volunteers preparing a community hall',promise:'Two friends talking beside a local football pitch'}[page.photo])+'. Illustrative image." width="1536" height="1024" fetchpriority="high" decoding="async"></figure>':graphic(page.graphic);
 const main=open+(breadcrumb?'<div class="qr-breadcrumbs">'+inner(breadcrumb.html)+'</div>':'')+'<section class="qr-hero'+(page.photo?' qr-photo-hero':' qr-type-hero')+'"><div class="qr-hero-copy">'+inner(copy.html)+'</div>'+visual+'</section><div class="qr-body">'+(key==='roadmap'?timeline:'')+index+'<div class="qr-sections">'+reading+'</div></div></main>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-release="'+release+'"]';
 return withoutTicker(html.replace(old,main)).replace(/<style data-approved-page-style="(?:utility-pages-20261031-v1|support-pages-20261031-v2)">[\s\S]*?<\/style>/g,'').replace('</head>','<style data-approved-page-style="'+release+'">'+css.replaceAll('MAIN',root)+'</style></head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const asset=read&&media?.(u.pathname);if(asset)return new Response(request.method==='HEAD'?null:asset,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable'}});
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained current page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
