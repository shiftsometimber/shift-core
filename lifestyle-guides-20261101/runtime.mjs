import {css} from './presentation.mjs';
import {graphic} from './graphics.mjs';
import {release,identify,pages} from './config.mjs';
import {bounds,byClass,byId,mainHTML,withoutTicker} from './html.mjs';
export {mainHTML,byClass};export {release as version};
export const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</'));
export const plain=s=>s.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&nbsp;',' ').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const atoms=new Set(['p','h1','h2','h3','h4','ul','ol','dl','table','pre','blockquote','figure','form','a','aside','button','details','script','style']);
const components=['life2-battle','life2-adv','qa-scroll-table-v2224','ready-grid','governance-register-v65','authority-grid-v65','review-score','continue-grid','privacy-actions-v65','sourcebox','source-box','editorial-note-v2222','trust-statement','actions','commercial-form'];
export function blocks(source){
 const result=[];let rest=source,limit=0;
 while(rest.trim()&&limit++<600){
  const b=bounds(rest,()=>true);if(!b){if(rest.trim())result.push(rest);break;}
  const leading=rest.slice(0,b.start);if(leading.replace(/<!--[\s\S]*?-->/g,'').trim())result.push(leading);
  const opening=b.html.slice(0,b.html.indexOf('>')+1),tag=opening.match(/^<([\w-]+)/)?.[1],classes=opening.match(/\bclass=["']([^"']*)["']/)?.[1]?.split(/\s+/)||[];
  if(atoms.has(tag)||components.some(c=>classes.includes(c))||classes.some(c=>c.endsWith('-banner')))result.push(b.html);
  else {const id=opening.match(/\bid=[\"']([^\"']+)[\"']/)?.[1];if(id)result.push('<span class=\"rp-source-anchor\" id=\"'+esc(id)+'\" aria-hidden=\"true\"></span>');result.push(...blocks(inner(b.html)));}
  rest=rest.slice(b.end);
 }
 return result.filter(s=>s.trim());
}
const heroBoundary=source=>bounds(source,(tag,name)=>['section','header','div'].includes(name)&&(tag.match(/\bclass=["']([^"']*)/)?.[1]||'').split(/\s+/).some(c=>c.includes('hero')));
export function transform(html,key){
 if(html.includes('data-approved-release="'+release+'"'))return html;
 const page=pages.find(p=>p.key===key);if(!page)throw Error('Unscoped remaining page');const old=mainHTML(html);if(!old)throw Error('Missing main '+key);
 let original=inner(old),preface='';
 if(key==='disclaimer'){const urgent=byId(original,'v30h-emergency-boundary');if(!urgent)throw Error('Preserve emergency boundary');preface=urgent.html;original=original.replace(urgent.html,'');}
 let copy,reading;const hero=heroBoundary(original);const breadcrumb=byClass(original,'breadcrumbs'),outsideBreadcrumb=breadcrumb&&(!hero||!hero.html.includes(breadcrumb.html));if(outsideBreadcrumb)original=original.replace(breadcrumb.html,'');
 if(hero){copy=inner(hero.html);reading=original.replace(hero.html,'');}
 else if(page.kind==='printable'){
  const nodes=blocks(original),h=nodes.findIndex(n=>/^<h1\b/.test(n));if(h<0)throw Error('Printable heading missing');let end=h+1;if(/^<p\b/.test(nodes[end]||'')&&!nodes[end].includes('no-print'))end++;
  copy=nodes.slice(0,end).join('');reading=nodes.slice(end).join('');
 }else throw Error('Source hero missing '+key);
 let nodes=blocks(reading); nodes=nodes.map(n=>n.includes('life2-table')?'<p class="lg-table-hint" data-rp-decoration>Swipe sideways to compare every column.</p>'+n:n);
 const copyParagraphs=[...copy.matchAll(/<p\b([^>]*)>[\s\S]*?<\/p>/g)].filter(m=>!/(?:eyebrow|byline)/.test(m[1]));
 if(!copyParagraphs.length&&/^<p\b/.test(nodes[0]||'')&&!/no-print/.test(nodes[0]))copy+=nodes.shift();
 const groups=[];let active=null;
 for(const node of nodes){if(/^<h2\b/.test(node)){active={heading:node,items:[]};groups.push(active);}else if(active)active.items.push(node);else groups.push({items:[node]});}
 let sectionNo=0,unpaired=null;
 for(let i=0;i<groups.length;i++){
  const g=groups[i],title=plain(g.heading||''),joined=g.items.join('');
  g.feature=!!g.heading&&sectionNo===0&&!['governance','editorial','disclaimer','accessibility','author'].includes(key)&&page.kind!=='printable';
  g.wide=!g.heading||g.feature||/Sources|Local (storage|data)|Data keys|What this release|Country verification|Four different|Four readiness|Different claims|What we might|How we judge|Related decision|High-scrutiny|^Verification$/i.test(title)||/ready-grid|authority-grid-v65|governance-register-v65|review-score|continue-grid|sourcebox/.test(joined);
  if(g.heading)sectionNo++;
  if(g.wide){if(unpaired!==null){groups[unpaired].wide=true;unpaired=null;}}else unpaired=unpaired===null?i:null;
 }
 if(unpaired!==null)groups[unpaired].wide=true;
 sectionNo=0;
 const readingHTML=groups.map(g=>{
  if(!g.heading)return '<div class="qr-block">'+g.items.join('')+'</div>';
  sectionNo++;const title=plain(g.heading),isSources=/^(Sources|Core evidence anchors)/i.test(title),id=g.heading.match(/\bid=["']([^"']+)["']/)?.[1]||'rp-'+key+'-'+sectionNo;
  const heading=/\bid=/.test(g.heading)?g.heading:g.heading.replace('<h2','<h2 id="'+id+'"');
  return '<section class="qr-section'+(g.wide?' qr-wide':'')+(g.feature?' qr-feature':'')+(isSources?' qr-sources':'')+'"><div class="qr-section-title"><span class="qr-section-no" data-rp-decoration aria-hidden="true">'+String(sectionNo).padStart(2,'0')+'</span>'+heading+'</div><div class="qr-section-detail">'+g.items.join('')+'</div></section>';
 }).join('');
 const headings=[...readingHTML.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)],index=headings.length>=5?'<details class="qr-index" data-rp-decoration><summary>On this page <span aria-hidden="true">+</span></summary><nav aria-label="Page sections">'+headings.map(m=>'<a href="#'+esc(m[1])+'">'+m[2]+'</a>').join('')+'</nav></details>':'';
 const title=plain(copy.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||''),items=[...reading.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(m=>plain(m[1]));
 const photoDescriptions={editorial:'Illustrative scene of checking published sources on a tablet',reviews:'Illustrative scene of checking everyday walking shoes',lifestyle:'An ordinary man tending a community allotment. Illustrative image'};
 const visual=page.photo?'<figure class="qr-photo"><img src="/assets/lifestyle-guides-20261101/'+page.photo+'.webp" alt="'+esc(photoDescriptions[page.photo])+'" width="1536" height="1024" fetchpriority="high" decoding="async"><figcaption data-rp-decoration>Illustrative image</figcaption></figure>':graphic(page,{title,items});
 const policyMetadata=[...old.matchAll(/\s(data-policy-wording|data-support-recovery)=(\"[^\"]*\"|'[^']*')/g)].map(m=>m[1]+'='+m[2]);
 let open=old.slice(0,old.indexOf('>')+1).replace(/\sdata-approved-(?:release|pages)="[^"]*"/g,'').replace('<main','<main data-approved-pages="'+key+'" data-approved-release="'+release+'" data-rp-kind="'+page.kind+'"');
 for(const attribute of policyMetadata)if(!open.includes(attribute.split('=')[0]+'='))open=open.slice(0,-1)+' '+attribute+'>';
 const main=open+(preface?'<div class="rp-emergency">'+preface+'</div>':'')+(outsideBreadcrumb?'<div class="qr-breadcrumbs">'+breadcrumb.html+'</div>':'')+'<section class="qr-hero'+(page.photo?' qr-photo-hero':' qr-type-hero')+(title.length>74?' rp-compact-title':'')+'"><div class="qr-hero-copy">'+copy+'</div>'+visual+'</section><div class="qr-body sg-copy">'+index+'<div class="qr-sections">'+readingHTML+'</div></div></main>';
 const bridgeScript='<script data-quality-bridge-placement>/* '+release+' */(()=>{const place=()=>{const main=document.querySelector(\'main[data-approved-release="'+release+'"]\'),body=main?.querySelector(\'.qr-body\'),bridge=main?.querySelector(\'.sst-service-bridge\');if(body&&bridge&&(bridge.parentElement!==body||bridge!==body.lastElementChild))body.append(bridge);};new MutationObserver(place).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener(\'DOMContentLoaded\',place,{once:true});})();</script>';
 const root='html body main#main-content#main-content#main-content#main-content#main-content#main-content#main-content[data-approved-release="'+release+'"]';
 return withoutTicker(html.replace(old,main)).replace('</head>','<style data-approved-page-style="'+release+'">'+root+'::before,'+root+'::after{content:none!important;display:none!important}'+css.replaceAll('MAIN',root)+'</style>'+bridgeScript+'</head>');
}
export function wrap(original,media,ownedPaths){return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),page=identify(u.pathname),target=read&&page&&ownedPaths.includes(u.pathname+(u.search?'?':''));
 const asset=read&&media?.(u.pathname);if(asset)return new Response(request.method==='HEAD'?null:asset,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable'}});
 const response=await original.fetch(target&&request.method==='HEAD'?new Request(request,{method:'GET'}):request,env,ctx);
 if(!target||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const body=await response.text();let output;try{output=transform(body,page.key);}catch(error){console.error('Retained current supporting page',page.key,error.message);return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);headers.set('X-Shift-Approved-Pages',release);headers.set('Cache-Control','private, no-store');
 return new Response(request.method==='HEAD'?null:output,{status:response.status,headers});
}};}
