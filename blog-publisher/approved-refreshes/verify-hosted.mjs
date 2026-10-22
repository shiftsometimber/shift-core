// Read-only hosted acceptance. No key creation, queue run, DB edits or publication.
import fs from 'node:fs';
import {REFRESHES,BACKLINKS} from './refreshes.mjs';
const root=new URL('../',import.meta.url);
const staging=process.argv.includes('--staging');
const secret=staging?JSON.parse(fs.readFileSync(new URL('staging-access.private.json',root),'utf8')).BLOG_STAGING_ACCESS:null;
const base=staging?'https://shift-blog-publisher-staging.matobrien.workers.dev':'https://shiftsometimber.co.uk';
const evidence='/Users/shiftsometimberltd/SST/blog-contributor-policy-20261021/reconciliation-20261021/refresh-20261022/';
const headers=secret?{'X-Blog-Staging-Access':secret}:{};
const checks=[];
async function get(path){
 const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(60000)});
 const text=await r.text();if(r.status!==200)throw Error(path+' HTTP '+r.status);
 return {response:r,text};
}
for(const p of REFRESHES){
 const {response,text}=await get(p.path);
 fs.writeFileSync(evidence+p.day+(staging?'-stage':'-live')+'.html',text);
 if(response.headers.get('X-Shift-Approved-Refresh')!=='20261022')throw Error(p.path+': approved refresh missing; '+response.headers.get('X-Shift-Refresh-Hold'));
 const nodes=[...text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(x=>{const s=JSON.parse(x[1]);return s['@graph']||[s]});
 const a=nodes.find(x=>[x['@type']].flat().some(t=>['Article','MedicalWebPage'].includes(t)));
 if(a.datePublished!==p.published||a.dateModified!==p.modified)throw Error(p.path+': dates wrong');
 const canonical=[...text.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/g)].map(x=>x[0].match(/\bhref=["']([^"']+)["']/)?.[1]);
 if(canonical.length!==1||canonical[0]!=='https://shiftsometimber.co.uk'+p.path)throw Error(p.path+': canonical mismatch');
 const before=fs.readFileSync(evidence+p.day+'-before.html','utf8');
 const hrefs=t=>new Set([...t.matchAll(/href=["']([^"']+)["']/g)].map(x=>x[1]));
 const old=hrefs(before.match(/<main\b[\s\S]*?<\/main>/)?.[0]||''),newLinks=hrefs(text);
 for(const url of old)if(!newLinks.has(url))throw Error(p.path+': lost original link '+url);
 checks.push({path:p.path,HTTP:200,published:a.datePublished,modified:a.dateModified,canonical:true,originalLinksPreserved:old.size,FAQ:nodes.find(x=>x['@type']==='FAQPage')?.mainEntity?.length});
 if(p.hero){
  const image=await fetch(base+new URL(p.hero.url).pathname,{headers});
  const bytes=new Uint8Array(await image.arrayBuffer());
  if(image.status!==200||bytes[0]!==255||bytes[1]!==216)throw Error('Hero JPEG unavailable');
  checks.push({path:new URL(p.hero.url).pathname,HTTP:200,imageBytes:bytes.length});
 }
}
for(const path of Object.keys(BACKLINKS)){
 const {text}=await get(path);
 for(const [,url]of BACKLINKS[path])if(!text.includes('href="'+url+'"'))throw Error(path+': backlink missing');
 checks.push({path,HTTP:200,backlinks:true});
}
for(const p of REFRESHES){const {response}=await get(p.path+'?utm_source=refresh-check');if(response.headers.get('X-Shift-Approved-Refresh')!=='20261022')throw Error('Tracking URL lost refresh: '+p.path);checks.push({path:p.path+'?utm_source=refresh-check',HTTP:200,refreshApplied:true})}
const {text:sitemap}=await get('/sitemap.xml');
for(const p of REFRESHES)if(!sitemap.includes('<loc>https://shiftsometimber.co.uk'+p.path+'</loc><lastmod>2026-10-22</lastmod>'))throw Error('Sitemap lastmod missing: '+p.path);
checks.push({path:'/sitemap.xml',HTTP:200,allRefreshLastmods:true});
const {text:listing}=await get('/explore-knowledge?limit=200');
for(const p of REFRESHES)if(!listing.includes(p.path))throw Error('Knowledge entry missing '+p.path);
checks.push({path:'/explore-knowledge?limit=200',HTTP:200,allRefreshURLs:true});
const result={checkedAt:new Date().toISOString(),staging,pass:true,checks};
fs.writeFileSync(evidence+(staging?'hosted-stage':'hosted-live')+'.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
