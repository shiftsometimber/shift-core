import {ARTICLES,UPDATED,VERSION,STATS} from './content.mjs';
export {ARTICLES,UPDATED,VERSION,STATS};
export const PATHS=Object.freeze(Object.keys(ARTICLES));
const ORIGIN='https://shiftsometimber.co.uk';
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalPath=p=>String(p).replace(/\/+$/,'').replace(/\.html$/,'')||'/';
export const isArticle=p=>Object.hasOwn(ARTICLES,normalPath(p));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(x=>[x[1].toLowerCase(),x[2]??x[3]??x[4]]));
function publicationDate(html){
 const dates=new Set();
 for(const match of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)){
  if(attrs(match[0].split('>')[0]).type?.toLowerCase()!=='application/ld+json')continue;
  try{const data=JSON.parse(match[0].replace(/^<script\b[^>]*>/i,'').replace(/<\/script\s*>$/i,''));const nodes=Array.isArray(data)?data:data['@graph']||[data];for(const n of nodes){const t=[n['@type']].flat();if(!t.some(x=>['Article','MedicalWebPage','WebPage'].includes(x)))continue;const day=String(n.datePublished||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day&&day<=UPDATED)dates.add(day)}}catch{}
 }
 return dates.size===1?[...dates][0]:null;
}
export const STYLE=`<style data-five-article-style>
article.fa-guide{box-sizing:border-box;width:min(1000px,calc(100% - 40px));margin:36px auto 64px!important;padding:0!important;background:#050505!important;color:#E7E3DA!important;font:17px/1.65 Arial,Helvetica,sans-serif!important;overflow-wrap:break-word}
article.fa-guide *{box-sizing:border-box}article.fa-guide h1{font:700 clamp(32px,4.5vw,52px)/1.15 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:16px 0 22px!important;letter-spacing:-.025em}
article.fa-guide h2{font:700 clamp(23px,3vw,31px)/1.25 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:32px 0 14px!important}article.fa-guide h3{font:700 20px/1.3 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:24px 0 10px!important}
article.fa-guide p,article.fa-guide li,article.fa-guide blockquote{font:17px/1.65 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important}article.fa-guide p{margin:12px 0 18px!important}article.fa-guide ul{padding-left:24px!important}article.fa-guide li{margin:8px 0!important}
article.fa-guide a{color:#E7E3DA!important;text-decoration:underline!important;text-underline-offset:4px;overflow-wrap:anywhere}article.fa-guide a:focus-visible,article.fa-guide [tabindex]:focus-visible{outline:3px solid #E7E3DA!important;outline-offset:4px!important}
article.fa-guide .fa-meta{font:14px/1.65 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important}article.fa-guide .fa-lead{font-size:20px!important;line-height:1.6!important}article.fa-guide .fa-toc{display:block!important;border-block:1px solid #707762;padding:16px 0;margin:24px 0;color:#E7E3DA!important;background:#050505!important}article.fa-guide .fa-toc a{display:inline-block;margin:4px 16px 4px 0;font:15px/1.65 Arial,Helvetica,sans-serif!important;min-height:24px}
article.fa-guide section{display:block!important;background:#050505!important;color:#E7E3DA!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}article.fa-guide blockquote{padding:18px 22px!important;margin:24px 0!important;border-left:4px solid #707762!important;background:#10110F!important}
article.fa-guide .fa-table{overflow-x:auto;max-width:100%;margin:22px 0;background:#050505!important;color:#E7E3DA!important}article.fa-guide table{border-collapse:collapse;width:100%;min-width:580px;background:#050505!important;color:#E7E3DA!important;font:15px/1.6 Arial,Helvetica,sans-serif!important}article.fa-guide caption{text-align:left;font-weight:700;padding:0 0 12px;color:#E7E3DA!important}article.fa-guide th,article.fa-guide td{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #707762;background:#050505!important;color:#E7E3DA!important;font-size:15px!important;line-height:1.6!important}article.fa-guide th{font-weight:700!important}
article.fa-guide figure{margin:24px 0!important}article.fa-guide img{display:block;width:100%;height:auto;max-width:100%;background:#050505!important}article.fa-guide figcaption{font:14px/1.6 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin-top:10px}article.fa-guide .fa-cite{font-size:14px!important;white-space:nowrap}article.fa-guide .fa-change{border-top:1px solid #707762;padding-top:18px;margin-top:28px}article.fa-guide [id]{scroll-margin-top:120px}
/* The existing shared service bridge is inserted after page load. Correct its
   two measured low-contrast surfaces only inside these five article bodies. */
#main-content article.fa-guide .sst-service-bridge .sst-service-bridge__kicker{color:#050505!important}
#main-content article.fa-guide .sst-service-bridge .sst-service-bridge__action{background:#E7E3DA!important;color:#050505!important}
#main-content article.fa-guide .sst-service-bridge .sst-service-bridge__action p{color:#050505!important}
#main-content article.fa-guide .sst-service-bridge .sst-service-bridge__action a{background:#050505!important;color:#E7E3DA!important}
@media(max-width:600px){article.fa-guide{width:calc(100% - 32px);margin-top:24px!important}article.fa-guide .fa-lead{font-size:18px!important}article.fa-guide .fa-table th,article.fa-guide .fa-table td{padding:10px}}
@media print{article.fa-guide .fa-toc{display:none!important}article.fa-guide,article.fa-guide section,article.fa-guide .fa-table,article.fa-guide table,article.fa-guide th,article.fa-guide td{background:transparent!important;color:#050505!important}article.fa-guide p,article.fa-guide li,article.fa-guide h1,article.fa-guide h2,article.fa-guide h3,article.fa-guide a{color:#050505!important}article.fa-guide{width:100%!important}article.fa-guide .fa-table{overflow:visible}article.fa-guide table{min-width:0}article.fa-guide a{overflow-wrap:anywhere}}
</style>`;
export function articleMain(path,{published=null}={}){
 path=normalPath(path);const a=ARTICLES[path];if(!a)return null;
 const aliasHTML=id=>Object.entries(a.aliases||{}).filter(([,target])=>target===id).map(([alias])=>'<span id="'+escapeHtml(alias)+'"></span>').join('');
 const sections=a.sections.map(s=>`<section aria-labelledby="heading-${s.id}">${aliasHTML(s.id)}<h2 id="${s.id}"><span id="heading-${s.id}">${escapeHtml(s.title)}</span></h2>${s.body}</section>`).join('');
 const sources=a.sources.map((s,i)=>`<li id="source-${i+1}"><a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a></li>`).join('');
 const faqs=a.faqs.map(([q,answer])=>'<h3>'+escapeHtml(q)+'</h3><p>'+escapeHtml(answer)+'</p>').join('');
 const date=published?'<span>Originally published '+escapeHtml(published)+' · </span>':'';
 return `<main id="main-content"><article class="fa-guide" data-five-article="${VERSION}"${path===STATS?' data-statistics-evidence':''}><p class="fa-meta">${escapeHtml(a.category)} · By SHIFT Newsroom</p><h1>${escapeHtml(a.title)}</h1><p class="fa-meta">${date}Editorial update and source check: <time datetime="${UPDATED}">19 September 2026</time><br>AI-assisted editorial work; not independent clinical review. General information, not individual medical advice.</p><p class="fa-lead">${a.lead}</p>${a.intro}<nav class="fa-toc" aria-label="On this page">${a.sections.map(s=>`<a href="#${s.id}">${escapeHtml(s.title)}</a>`).join('')}<a href="#faq">Questions</a><a href="#sources">Sources</a></nav>${sections}<section id="faq" aria-labelledby="fa-faq-heading"><h2 id="fa-faq-heading">Common questions</h2>${faqs}</section><section id="sources" aria-labelledby="fa-sources-heading"><h2 id="fa-sources-heading">Sources and editorial responsibility</h2><ol>${sources}</ol><p>Product information and access arrangements can change. Use the original source and your treating service for decisions about your care. <a href="/editorial-standards#newsroom">How SHIFT prepares articles</a> · <a href="/editorial-standards#corrections">Report a factual correction</a>.</p><p class="fa-change"><strong>What changed on 19 September 2026:</strong> ${escapeHtml(a.change)}</p></section></article></main>`;
}
export function rewriteArticle(html,path){
 path=normalPath(path);if(!isArticle(path))return html;
 if(!/<head\b[^>]*>/i.test(html)||!/<\/head\s*>/i.test(html)||[...html.matchAll(/<main\b/gi)].length!==1||[...html.matchAll(/<\/main\s*>/gi)].length!==1)throw Error('Five-article source requires one complete main and head: '+path);
 const a=ARTICLES[path],published=publicationDate(html),canonical=ORIGIN+path;
 html=html.replace(/<main\b[\s\S]*?<\/main\s*>/i,articleMain(path,{published}));
 // Remove only the retired in-page NHS finder, not general site scripts.
 if(path==='/guides/nhs-weight-loss-medication-pathways')html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,tag=>!attrs(tag.split('>')[0]).src&&/function\s+runNHSFinder\s*\(/.test(tag)?'':tag);
 html=html.replace(/<style\b[^>]*(?:data-five-article-style|data-editorial-resource-style)[^>]*>[\s\S]*?<\/style\s*>/gi,'');
 html=html.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi,'');
 const metaKeys=new Set(['description','og:title','og:description','og:url','og:type','twitter:title','twitter:description','article:modified_time','article:published_time']);
 html=html.replace(/<meta\b[^>]*>/gi,tag=>{const at=attrs(tag);return metaKeys.has(String(at.name||at.property||'').toLowerCase())?'':tag});
 html=html.replace(/<link\b[^>]*>/gi,tag=>String(attrs(tag).rel||'').toLowerCase().split(/\s+/).includes('canonical')?'':tag);
 // Remove stale ratings/FAQ/Article metadata, including mixed attribute order.
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,tag=>attrs(tag.split('>')[0]).type?.toLowerCase()==='application/ld+json'?'':tag);
 const logo={'@type':'ImageObject',url:ORIGIN+'/assets/shift-wordmark.png'};
 // Only the statistics article has a representative image in its visible body.
 // A site logo is publisher identity, not a substitute for an article photograph.
 const schema={'@context':'https://schema.org','@graph':[{'@type':'Article','@id':canonical+'#article',headline:a.title,description:a.description,mainEntityOfPage:canonical,url:canonical,inLanguage:'en-GB',dateModified:UPDATED,...(published?{datePublished:published}:{}),...(path===STATS?{image:ORIGIN+STATS+'/chart.svg'}:{}),author:{'@type':'Organization',name:'SHIFT Newsroom',url:ORIGIN+'/editorial-standards#newsroom',logo},publisher:{'@type':'Organization','@id':ORIGIN+'/#organization',name:'Shift Some Timber Ltd',url:ORIGIN,logo},citation:a.sources.map(x=>x.url)},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:a.title,item:canonical}]}]};
 const metas=[['name','description',a.description],['property','og:title',a.title],['property','og:description',a.description],['property','og:url',canonical],['property','og:type','article'],['name','twitter:title',a.title],['name','twitter:description',a.description],['property','article:modified_time',UPDATED],...(published?[['property','article:published_time',published]]:[])].map(([key,name,value])=>`<meta ${key}="${name}" content="${escapeHtml(value)}">`).join('');
 html=html.replace(/<\/head\s*>/i,'<title>'+escapeHtml(a.title)+' | SHIFT</title><link rel="canonical" href="'+canonical+'">'+metas+'<script type="application/ld+json" data-five-article-schema>'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>'+STYLE+'</head>');
 return html;
}
export function updateArticleSitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g,block=>{
  const loc=block.match(/<loc>\s*([^<]+)\s*<\/loc>/)?.[1];if(!loc)return block;
  let u;try{u=new URL(loc)}catch{return block}if(u.origin!==ORIGIN||!PATHS.includes(u.pathname))return block;
  return block.replace(/<lastmod\b[^>]*>[\s\S]*?<\/lastmod>/g,'').replace('</url>','<lastmod>'+UPDATED+'</lastmod></url>');
 });
}
