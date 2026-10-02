import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://shiftsometimber.co.uk',out='full-content-capture';
await fs.mkdir(out+'/html',{recursive:true});
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ');
const text=s=>decode(s.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const safe=raw=>{try{const u=new URL(decode(raw),origin);u.hash='';if(u.origin!==origin||u.search||!/^https:$/.test(u.protocol)||/^\/(?:api|v1|cdn-cgi|logout|signout|auth|checkout)(?:\/|$)/i.test(u.pathname)||/\.(?:js|css|png|jpe?g|svg|webp|woff2?|ttf|pdf|mp4|mov|zip)$/i.test(u.pathname))return null;return u.href;}catch{return null;}};
const get=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'follow',headers:{'User-Agent':'SHIFT-Content-Audit/1.0','Accept':'text/html,application/xml;q=0.9'}});if(new URL(r.url).origin!==origin)throw Error('external_redirect');return {r,body:await r.text()};};
const queue=[origin+'/'],seen=new Set(queue),sitemaps=[origin+'/sitemap.xml'],mapSeen=new Set(),pages=[],errors=[];
while(sitemaps.length){const url=sitemaps.shift();if(mapSeen.has(url))continue;mapSeen.add(url);const {r,body}=await get(url);if(!r.ok)throw Error('sitemap_http_'+r.status);await fs.writeFile(out+'/'+createHash('sha256').update(url).digest('hex').slice(0,12)+'.xml',body);for(const match of body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)){const u=safe(match[1]);if(!u)continue;if(u.endsWith('.xml'))sitemaps.push(u);else if(!seen.has(u)){seen.add(u);queue.push(u);}}}
const sitemapCount=seen.size-1;
while(queue.length&&pages.length<1400){
 const batch=queue.splice(0,4);
 const records=await Promise.all(batch.map(async url=>{
  try{const {r,body}=await get(url),type=r.headers.get('content-type')||'',id=createHash('sha256').update(url).digest('hex').slice(0,16);if(!type.includes('text/html'))return {url,status:r.status,type,notHtml:true};
   await fs.writeFile(out+'/html/'+id+'.html',body);
   const main=body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||body,visible=text(main),links=[...main.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({href:decode(m[1]),label:text(m[2])}));
   for(const l of [...body.matchAll(/href=["']([^"']+)["']/gi)]){const u=safe(l[1]);if(u&&!seen.has(u)&&seen.size<3000){seen.add(u);queue.push(u);}}
   const external=links.filter(l=>/^https?:/.test(l.href)&&!l.href.startsWith(origin));
   return {url,final:r.url,status:r.status,id,htmlSha256:createHash('sha256').update(body).digest('hex'),title:text(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),headings:[...main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:+m[1],text:text(m[2])})),text:visible,words:visible.split(' ').length,links,externalSources:external,hasMain:/<main\b/i.test(body),flags:[...(/missed dose|miss a dose|double dose/i.test(visible)?['missed-dose-review']:[]),...(/clinically reviewed|clinical team|prescrib|doctor|pharmacist/i.test(visible)?['clinical-or-service-claim-review']:[]),...(/guarantee|proven to|100%|miracle/i.test(visible)?['absolute-claim-review']:[])]};
  }catch(e){errors.push({url,error:e.message});return {url,error:e.message};}
 }));
 pages.push(...records);console.log('Captured '+pages.length+'; remaining '+queue.length);
 await fs.writeFile(out+'/pages.json',JSON.stringify(pages));
}
const proof={capturedAt:new Date().toISOString(),sourceSha:process.env.GITHUB_SHA||null,sitemapCount,uniqueDiscovered:seen.size,captured:pages.length,html:pages.filter(p=>!p.notHtml&&!p.error).length,remaining:queue.length,errors,httpFailures:pages.filter(p=>p.status>=400).map(p=>({url:p.url,status:p.status})),substantiveReviewComplete:false};
await fs.writeFile(out+'/proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
if(queue.length||errors.length||proof.httpFailures.length)process.exitCode=1;
