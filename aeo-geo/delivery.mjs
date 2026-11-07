import {ORIGIN,esc,isPrivatePath,enhancePublicHtml,TRUST_LINKS,breadcrumbs} from './schema.mjs';
import {detail,indexPage,page} from './content.mjs';
import {repairAnalytics} from './analytics.mjs';
import {repairPublicChrome} from './chrome.mjs';
import {withRetatrutideEvidence,retatrutideImage,isRetaDocument,RETA_RELEASE} from './retatrutide.mjs';
export const RELEASE='aeo-geo-20261102-v1';
// Review candidate: one retired public alias, with no account or clinical route changes.
export const PUBLIC_CONTINUITY_ALIASES=Object.freeze({
 '/when-the-clinic-goes-quiet':'/clinic-gone-quiet'
});
export function continuityAliasResponse(request){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method)||!['http:','https:'].includes(url.protocol)||!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname))return null;
 const path=url.pathname.replace(/\/+$/,'').replace(/\.html$/,'');
 if(!Object.hasOwn(PUBLIC_CONTINUITY_ALIASES,path))return null;
 const target=new URL(PUBLIC_CONTINUITY_ALIASES[path],ORIGIN);target.search=url.search;
 return new Response(null,{status:301,headers:{
  Location:target.href,'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin'
 }});
}
// Two bounded link edits in the existing Programme feature section. If its
// inspected source changes, leave the complete section untouched for review.
export function programmePublicLibraryLinks(html,path){
 if(path!=='/programme')return html;
 if(/<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*noindex)[^>]*>/i.test(html))return html;
 const sections=[...html.matchAll(/<section\b[^>]*\baria-labelledby="pv-week-title"[^>]*>[\s\S]*?<\/section>/g)];
 if(sections.length!==1)return html;
 const before=sections[0][0];
 const pairs=[
  ['href="https://shiftsometimber.co.uk/member/grub" target="_blank" rel="noopener"','href="/recipes"'],
  ['href="https://shiftsometimber.co.uk/member/fit" target="_blank" rel="noopener"','href="/exercises"'],
  ['<span class="pv-text-link">Explore Grub ','<span class="pv-text-link">Browse public recipes '],
  ['<span class="pv-text-link">Explore Fit ','<span class="pv-text-link">Browse movement guides ']
 ];
 if(!pairs.every(([old,next])=>before.split(old).length===2&&!before.includes(next)))return html;
 let after=before;for(const [old,next] of pairs)after=after.replace(old,next);
 return html.replace(before,after);
}
export const ROBOTS=`# Public search and AI crawling; account, payment and administration routes stay private.
User-agent: *
User-agent: Googlebot
User-agent: Bingbot
User-agent: OAI-SearchBot
User-agent: GPTBot
User-agent: PerplexityBot
User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /member
Disallow: /account/
Disallow: /checkout
Disallow: /admin
Disallow: /hq/
Disallow: /v1/
Disallow: /api/
Disallow: /auth/
Disallow: /reset-password
Disallow: /treatment-order
Disallow: /email-templates
Allow: /

Sitemap: https://shiftsometimber.co.uk/sitemap.xml
Sitemap: https://shiftsometimber.co.uk/recipes/sitemap.xml
Sitemap: https://shiftsometimber.co.uk/exercises/sitemap.xml
`;
const LLMS_BLOCK=`## Public food and movement libraries
- [Recipes](https://shiftsometimber.co.uk/recipes): Ingredients, methods and estimated nutrition. Nutrition is an estimate, not individual dietary advice.
- [Exercises](https://shiftsometimber.co.uk/exercises): Movement instructions and example variations, not individual exercise prescriptions.

## Responsibility and editorial transparency
- [About SHIFT](https://shiftsometimber.co.uk/about)
- [Authors and review transparency](https://shiftsometimber.co.uk/expert-contributors)
- [Editorial standards](https://shiftsometimber.co.uk/editorial-standards)
- [Clinical governance](https://shiftsometimber.co.uk/clinical-governance)
- [Medical disclaimer](https://shiftsometimber.co.uk/medical-disclaimer)

Public information may be cited with its canonical URL and recorded update date. Account records, health logs, check-ins, saved plans, checkout and administration routes are private. This file is a discovery aid, not a permission to access private data or a guarantee of search visibility.
`;
export function repairLlms(text){
 const expanded=text.includes('## Public food and movement libraries')?text:text.trimEnd()+'\n\n'+LLMS_BLOCK;
 return expanded.replace(/^- (https:\/\/shiftsometimber\.co\.uk\/[^\s]*)\s*$/gm,(_,href)=>{
  const path=new URL(href).pathname,label=path.split('/').filter(Boolean).at(-1)?.replace(/-/g,' ')||'Shift Some Timber';
  return '- ['+label[0].toUpperCase()+label.slice(1)+']('+href+')';
 });
}
const secured={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Strict-Transport-Security':'max-age=31536000; includeSubDomains','X-Frame-Options':'SAMEORIGIN'};
const freshHeaders=()=>new Headers({...secured,'X-Shift-AEO-GEO':RELEASE});
function textResponse(body,type,request,{status=200,cache='public, max-age=300',headers={}}={}){
 return new Response(request.method==='HEAD'?null:body,{status,headers:{...secured,'X-Shift-AEO-GEO':RELEASE,'Content-Type':type,'Cache-Control':cache,...headers}});
}
function htmlResponse(result,request){return textResponse(result.html,'text/html; charset=utf-8',request,{status:result.status,cache:result.status===200?'public, max-age=300, stale-while-revalidate=3600':'no-store',headers:{'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"}});}
const xmlNode=(path,date)=>'<url><loc>'+ORIGIN+esc(path)+'</loc>'+(date?'<lastmod>'+esc(date)+'</lastmod>':'')+'</url>';
export function catalogueSitemap(rows,date){return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+rows.map(r=>xmlNode(r.path,date)).join('')+'</urlset>';}
export function completeSitemap(xml,data,metadata={}){
 const seen=new Set();
 const cleaned=xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>{
  const raw=node.match(/<loc>([^<]+)<\/loc>/i)?.[1];let u;try{u=new URL(raw.replace(/&amp;/g,'&'))}catch{return '';}
  // Existing sitemap entries include eight distinct, canonical supplement
  // guides selected by ?product=. Preserve those audited public documents.
  const productGuide=u.pathname==='/shift-health/supplements-nutrition'&&/^\?product=(?:chunky|clear|creatine|crunch|skill|sticks|tablets|whey)$/.test(u.search);
  if(u.origin!==ORIGIN||isPrivatePath(u.pathname)||(u.search&&!productGuide)||u.hash||seen.has(u.href))return '';
  const fix=metadata[u.pathname];if(fix?.exclude)return '';
  seen.add(u.href);
  if(fix?.lastmod){
   const current=node.match(/<lastmod>([^<]*)<\/lastmod>/i)?.[1],modified=Date.parse(current),audited=Date.parse(fix.lastmod);
   const keepCurrent=u.pathname.startsWith('/articles/')&&Number.isFinite(modified)&&modified>audited&&modified<=Date.now();
   const lastmod=keepCurrent?current:fix.lastmod;
   node=node.replace(/<lastmod>[^<]*<\/lastmod>/gi,'');node=node.replace('</url>','<lastmod>'+esc(lastmod)+'</lastmod></url>');
  }
  else node=node.replace(/<lastmod>2026-08-27<\/lastmod>/gi,'');
  return node;
 });
 const rows=[{path:'/recipes'},{path:'/exercises'},...data.recipes,...data.exercises].filter(r=>!seen.has(ORIGIN+r.path));
 return cleaned.replace(/<\/urlset>/i,rows.map(r=>xmlNode(r.path,data.publishedAt)).join('')+'</urlset>');
}
export function publicSupportContinuityCopy(html,path){
 const support='You can use My Timber free alongside your own clinic and keep using it after treatment ends.';
 let existing, revised;
 if(path==='/'){
  existing='<p class="sst-free-intro">Food, movement, check-ins and progress — all in one place.</p>';
  revised=`<p class="sst-free-intro">${support}</p>`;
 }else if(path==='/faq/does-sst-prescribe'){
  const gpAdvice='Speak to your GP or an appropriately qualified prescriber about treatment.';
  existing=`<p>${gpAdvice} Use SHIFT to organise practical food, movement and day-to-day questions.</p>`;
  revised=`<p style="color:#E7E3DA!important">${gpAdvice} ${support}</p>`;
 }else return html;
 if(html.includes(support)||html.split(existing).length!==2)return html;
 return html.replace(existing,revised);
}

export function withAeoGeo(original,{catalogue,shell,metadata={}}){
 return {...original,async fetch(request,...args){
  const url=new URL(request.url),host=url.hostname,path=url.pathname;
  if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(host)||!['GET','HEAD'].includes(request.method)||isPrivatePath(path))return original.fetch(request,...args);
  const alias=continuityAliasResponse(request);if(alias)return alias;
  // The owned public routes run before the retained origin handler, so they
  // must retain its HTTP-to-HTTPS policy instead of returning an HTTP body.
  if(url.protocol==='http:'){
   const target=new URL(url);target.protocol='https:';target.hostname='shiftsometimber.co.uk';
   if(/^\/(?:recipes|exercises)(?:\/|$)/.test(path)||path==='/experts')target.pathname=path.replace(/\/+$/,'').replace(/\.html$/,'');
   return new Response(null,{status:301,headers:{Location:target.href,'Cache-Control':'public, max-age=300'}});
  }
  if(path==='/robots.txt')return textResponse(ROBOTS,'text/plain; charset=utf-8',request);
  const retaImage=retatrutideImage(request);if(retaImage)return retaImage;
  const owned=/^\/(?:recipes|exercises)(?:\/|$)/.test(path)||path==='/experts';
  if(owned){
   const normalized=path.replace(/\/+$/,'').replace(/\.html$/,'');
   if(host!=='shiftsometimber.co.uk'||path!==normalized){const target=new URL(url);target.hostname='shiftsometimber.co.uk';target.pathname=normalized;return new Response(null,{status:301,headers:{Location:target.href,'Cache-Control':'public, max-age=300'}});}
   const data=await catalogue();
   if(path==='/experts')return new Response(null,{status:301,headers:{Location:ORIGIN+'/expert-contributors','Cache-Control':'public, max-age=300'}});
   const kind=path.startsWith('/recipes')?'recipes':'exercises';
   if(path==='/'+kind+'/sitemap.xml')return textResponse(catalogueSitemap(data[kind],data.publishedAt),'application/xml; charset=utf-8',request);
   if(path==='/'+kind)return htmlResponse(indexPage(kind,data,shell,url),request);
   const item=data[kind].find(r=>r.path===path);
   if(item)return htmlResponse(detail(item,kind,data,shell),request);
   return htmlResponse(page({title:'That page has wandered off',description:'Browse the current public food and movement libraries.',path,body:'<h1>That page has wandered off.</h1><p><a href="/recipes">Browse recipes</a> or <a href="/exercises">browse exercises</a>.</p>',date:data.publishedAt,shell,status:404,noindex:true}),request);
  }
  const response=await original.fetch(request,...args);
  if(response.status!==200)return response;
  const isSitemap=path==='/sitemap.xml',isLlms=path==='/llms.txt',isAnalytics=path==='/analytics-bootstrap-v1.js',isChrome=path==='/assets/v42.js',isHtml=(response.headers.get('Content-Type')||'').includes('text/html');
  if(!isSitemap&&!isLlms&&!isAnalytics&&!isChrome&&!isHtml)return response;
  // HEAD and GET must share the same response policy, but HEAD never has a body.
  if(request.method==='HEAD'){const headers=new Headers(response.headers);headers.set('X-Shift-AEO-GEO',RELEASE);if(isRetaDocument(path)){headers.set('X-Shift-Retatrutide-Evidence',RETA_RELEASE);headers.delete('Last-Modified');}return new Response(null,{status:response.status,statusText:response.statusText,headers});}
  const before=await response.text();let after=before;
  if(isAnalytics)after=repairAnalytics(before);
  else if(isChrome)after=repairPublicChrome(before);
  else if(isSitemap)after=completeSitemap(before,await catalogue(),metadata);
  else if(isLlms)after=repairLlms(before);
  else if(isHtml){
   const enhanced=await withRetatrutideEvidence(enhancePublicHtml(before,path,metadata[path]),path);
   after=publicSupportContinuityCopy(programmePublicLibraryLinks(enhanced,path),path);
  }
  const headers=new Headers(response.headers);
  // The marker confirms this wrapper inspected the public response, including
  // already-correct documents. It does not claim that its content changed.
  headers.set('X-Shift-AEO-GEO',RELEASE);
  if(isHtml&&isRetaDocument(path)){headers.set('X-Shift-Retatrutide-Evidence',RETA_RELEASE);headers.delete('Last-Modified');}
  if(after!==before){for(const h of ['Content-Length','Content-Encoding','ETag','Content-MD5','Digest'])headers.delete(h);}
  return new Response(after,{status:response.status,statusText:response.statusText,headers});
 }};
}
