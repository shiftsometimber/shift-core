// Three source-page refreshes explicitly approved by Matt on 22 October 2026.
// This does not grant contributors authority to rewrite static pages.
import packs from './content.json' with {type:'json'};
export const ROOT='https://shiftsometimber.co.uk';
export const REFRESHES=Object.freeze(packs);
const byPath=new Map(packs.map(p=>[p.path,p]));
export const BACKLINKS=Object.freeze({
 '/guides/blood-pressure-guide':[['If you’re carrying extra weight, find out which health check to get first.','/male-obesity#first-health-check']],
 '/articles/men-belly-fat':[['Worried about your waist? Find out which health check to get first.','/male-obesity#first-health-check'],['Testosterone and weight: which comes first?','/articles/testosterone-weight-men']],
 '/shift-health':[['Men’s health MOT: what’s checked and is it worth it?','/guides/mens-health-mot-guide']],
 '/articles/weight-loss-blood-tests':[['Before paying for tests, see what the NHS Health Check already covers.','/guides/mens-health-mot-guide']],
 '/shift-health/testosterone-energy':[['Testosterone and weight: which comes first?','/articles/testosterone-weight-men']]
});
export const cleanPath=p=>p.replace(/\.html$/,'').replace(/\/$/,'')||'/';
export const hasRefreshPrefix=p=>[...byPath.keys(),...Object.keys(BACKLINKS)].some(prefix=>cleanPath(p).startsWith(prefix));
export const ownsRefreshPath=p=>byPath.has(cleanPath(p))||Object.hasOwn(BACKLINKS,cleanPath(p));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
const byline=p=>'<p class="approved-refresh-dates">By <a href="/authors/matt-obrien">Matt O’Brien</a> · Published <time datetime="'+p.published+'">'+date(p.published)+'</time> · Updated <time datetime="'+p.modified+'">'+date(p.modified)+'</time></p>';
const figure=p=>p.hero?'<figure class="approved-refresh-image"><img src="'+esc(p.hero.url)+'" alt="'+esc(p.hero.alt)+'" width="1200" height="675" loading="eager" decoding="async" style="width:100%;height:auto;display:block"><figcaption>'+esc(p.hero.caption)+'</figcaption></figure>':'';
function replaceRequired(text,pattern,replacement,label){
 if(!pattern.test(text))throw Error('refresh_layout_changed:'+label);
 return text.replace(pattern,replacement);
}
function schemaText(value){return JSON.stringify(value).replace(/</g,'\\u003c')}
export function applyRefreshHTML(original,path){
 path=cleanPath(path);
 const p=byPath.get(path);let html=original;
 if(!p){
  const links=BACKLINKS[path];if(!links)return original;
  if(html.includes('data-approved-refresh-links="20261022"'))return html;
  html=replaceRequired(html,/<\/main>/,'<section data-approved-refresh-links="20261022" class="approved-health-refresh"><h2>Related reading</h2><ul>'+links.map(([label,url])=>'<li><a href="'+esc(url)+'">'+esc(label)+'</a></li>').join('')+'</ul></section></main>','backlink-main');
  html=html.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(_,attrs,text)=>{const data=JSON.parse(text);const nodes=data['@graph']||[data];for(const node of nodes)if([node['@type']].flat().some(t=>['Article','MedicalWebPage','WebPage'].includes(t)))node.dateModified='2026-10-22';return '<script'+attrs+'>'+schemaText(data)+'</script>'});
  return html;
 }
 if(html.includes('data-approved-blog-refresh="20261022"'))return html;
 const firstParagraph=/<p>[\s\S]*?<\/p>/;
 const bodyWithoutIntro=p.html.replace(firstParagraph,'');
 if(p.day==='day1'){
  html=replaceRequired(html,/<h2 id="getting-help">/,byline(p)+p.html+'<h2 id="getting-help">','obesity-insertion');
 }else if(p.day==='day2'){
  html=replaceRequired(html,/<article\b([^>]*\bclass="[^"]*\bsst-reading-article-v31\b[^"]*"[^>]*)>/,'<article$1>'+byline(p)+figure(p)+bodyWithoutIntro,'mot-article');
  html=replaceRequired(html,/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/,'$1'+esc(p.title)+'$2','mot-title');
  html=replaceRequired(html,/(<\/h1>)<p>[\s\S]*?<\/p>/,'$1<p>'+esc(p.intro)+'</p>','mot-intro');
  html=html.replace(/Reading copy and listed sources checked 3 October 2026\./,'Copy and listed sources checked 22 October 2026.');
 }else{
  html=replaceRequired(html,/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/,'$1'+esc(p.title)+'$2','testosterone-title');
  html=replaceRequired(html,/<p class="cluster-intro">[\s\S]*?<\/p>/,'<p class="cluster-intro">'+esc(p.intro)+'</p>','testosterone-intro');
  html=replaceRequired(html,/<p class="cluster-byline">[\s\S]*?<\/p>/,byline(p),'testosterone-dates');
  html=replaceRequired(html,/<section class="cluster-takeaways">[\s\S]*?(?=<section class="cluster-related">)/,figure(p)+'<section class="cluster-section approved-health-refresh">'+bodyWithoutIntro+'</section>','testosterone-body');
 }
 html=replaceRequired(html,/<title>[\s\S]*?<\/title>/,'<title>'+esc(p.seoTitle)+'</title>','title-tag');
 html=html.replace(/<meta\b[^>]*>/g,tag=>{
  const name=tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  const value=name==='description'||['og:description','twitter:description'].includes(name)?p.description:['og:title','twitter:title'].includes(name)?p.seoTitle:name==='article:modified_time'?p.modified:name==='article:published_time'?p.published:null;
  return value!==null?tag.replace(/\bcontent=["'][^"']*["']/i,'content="'+esc(value)+'"'):tag;
 });
 const faq={'@context':'https://schema.org','@type':'FAQPage','@id':ROOT+path+'#faq',mainEntity:p.faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))};
 let sawArticle=false,sawFAQ=false;
 function update(node){
  if(!node||typeof node!=='object')return node;
  if(Array.isArray(node))return node.map(update);
  const types=[node['@type']].flat();
  if(types.includes('FAQPage')){sawFAQ=true;return faq}
  if(types.some(t=>['Article','BlogPosting','MedicalWebPage'].includes(t))){
   if(node.datePublished!==p.published)throw Error('original_publication_date_changed');
   sawArticle=true;node.dateModified=p.modified;
   if(types.includes('MedicalWebPage'))node.name=p.title;else node.headline=p.title;
   node.description=p.description;node.mainEntityOfPage=ROOT+path;
   node.author={'@type':'Person',name:"Matt O'Brien",url:ROOT+'/authors/matt-obrien'};
   node.citation=[...new Set([...(node.citation||[]),...p.sources])];
   if(p.hero)node.image=p.hero.url;
  }
  if(types.includes('BreadcrumbList'))for(const entry of node.itemListElement||[])if(entry.item===ROOT+path)entry.name=p.title;
  if(node['@graph'])node['@graph']=node['@graph'].map(update);
  return node;
 }
 html=html.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(_,attrs,text)=>'<script'+attrs+'>'+schemaText(update(JSON.parse(text)))+'</script>');
 if(!sawArticle)throw Error('original_article_schema_missing');
 if(!sawFAQ)html=html.replace('</head>','<script type="application/ld+json">'+schemaText(faq)+'</script></head>');
 const style='<style data-approved-blog-refresh="20261022">.approved-health-refresh{max-width:100%;padding:20px 0}.approved-health-refresh details{margin:12px 0}.approved-health-refresh summary{cursor:pointer;font-weight:700}.approved-refresh-image{margin:24px 0}.approved-refresh-image figcaption,.approved-refresh-dates{font-size:14px;line-height:1.5}.approved-health-refresh p,.approved-health-refresh li{line-height:1.65}</style>';
 return html.replace('</head>',style+'</head>');
}
export function refreshSitemap(text){
 for(const p of [...packs,...Object.keys(BACKLINKS).map(path=>({path,modified:'2026-10-22'}))]){
  const loc=ROOT+p.path,pattern=new RegExp('<url>\\s*<loc>'+loc.replaceAll('.','\\.').replaceAll('/','\\/')+'<\\/loc>[\\s\\S]*?<\\/url>');
  const entry='<url><loc>'+loc+'</loc><lastmod>'+p.modified+'</lastmod></url>';
  text=pattern.test(text)?text.replace(pattern,entry):text.replace('</urlset>',entry+'</urlset>');
 }
 return text;
}
export function refreshCatalogue(rows){
 const map=new Map(rows.map(r=>[r.href,r]));
 for(const p of packs){
  const old=map.get(p.path)||{type:p.day==='day2'?'Ultimate Guide':p.day==='day1'?'Guide':'Article',topic:p.day==='day3'?'health':'weight'};
  map.set(p.path,{...old,title:p.title,description:p.description,href:p.path,date:'Published '+date(p.published)});
 }
 return [...map.values()];
}
export function upstreamFor(path,env){
 const p=cleanPath(path);
 return p.startsWith('/male-obesity')?env.OBESITY:p.startsWith('/shift-health')?env.HEALTH:env.CORE;
}
export async function approvedRefreshRoute(request,env){
 const u=new URL(request.url),path=cleanPath(u.pathname);
 if(!ownsRefreshPath(path)){
  // A trailing route wildcard also catches query strings. Preserve the previous
  // upstream's complete behaviour for every sibling path that is not in the pack.
  if(hasRefreshPrefix(path))return upstreamFor(path,env).fetch(request);
  return null;
 }
 const upstream=upstreamFor(path,env);if(!upstream?.fetch)throw Error('refresh_upstream_unavailable');
 if(!['GET','HEAD'].includes(request.method))return upstream.fetch(request);
 const response=await upstream.fetch(request);
 if(!response.ok||request.method==='HEAD')return response;
 const original=await response.text();let html;
 try{html=applyRefreshHTML(original,path)}catch{
  const h=new Headers(response.headers);h.set('Cache-Control','no-store');h.delete('Content-Length');h.delete('Content-Encoding');
  h.set('X-Shift-Refresh-Hold','upstream-content-changed');
  return new Response(original,{status:response.status,headers:h});
 }
 const h=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);
 h.set('Cache-Control','no-store, must-revalidate');h.set('X-Shift-Approved-Refresh','20261022');
 return new Response(html,{status:response.status,headers:h});
}
