import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CONTINUITY_PATHS,CONTINUITY_REDIRECTS,continuityPages,continuityEntries,NEW_LIFE_LINK} from '../public-continuity.mjs';
import {preserveContinuityContent} from '../public-continuity-preservation.mjs';
import {NUTRITION_PATHS,NUTRITION_NOTE,preserveNutritionSignposting} from '../public-nutrition-mytimber.mjs';
const origin=process.argv[2]||'https://shiftsometimber.co.uk',production='https://shiftsometimber.co.uk',preview=origin!==production;
const hash=value=>createHash('sha256').update(value).digest('hex');
const get=async path=>{const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return {r,html:await r.text()}};
const redirects=[];
for(const [from,to] of Object.entries(CONTINUITY_REDIRECTS)){
 for(const method of ['GET','HEAD'])for(const suffix of ['','/','.html']){
  const path=from+suffix;
  const r=await fetch(origin+path,{method,redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(r.status,301,path+' '+method);assert.equal(r.headers.get('location'),origin+to,path+' location');
  if(method==='HEAD')assert.equal(await r.text(),'');
  redirects.push({path,method,status:r.status,location:r.headers.get('location')});
 }
 const destination=await fetch(origin+to,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(destination.status,200,to+' must resolve without a second redirect');
}
const pages=[],links=new Set();
for(const path of CONTINUITY_PATHS){
 const {r,html}=await get(path);assert.equal((html.match(/<h1\b/g)||[]).length,1,path);assert.equal((html.match(/rel="canonical"/g)||[]).length,1,path);assert.ok(html.includes('href="'+production+path+'"'));assert.ok(html.includes(continuityPages[path].heading));assert.ok(html.includes('/consent-v4a.js'));assert.equal((html.match(/id="shift-public-news"/g)||[]).length,1,path);assert.ok(!/complete interactive route loads below|noindex/i.test(html));assert.equal(r.headers.get('x-robots-tag')?.includes('noindex')||false,preview);
 if(NUTRITION_PATHS.has(path))assert.equal(html.split(NUTRITION_NOTE).length,2,path+' must contain exactly the approved My Timber signpost');
 const main=html.match(/<main\b[\s\S]*?<\/main>/i)[0],approvedMain=preserveNutritionSignposting(path,Buffer.from(main)).toString();assert.ok(approvedMain.includes(continuityPages[path].body),path+' must contain the exact approved body');const words=approvedMain.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;const minimum=['/clinic-gone-quiet','/provider-switch','/husband-help'].includes(path)?180:400;assert.ok(words>minimum,path);
 for(const m of main.matchAll(/href="(\/[^"#]*)/g))links.add(m[1].split('#')[0]);
 pages.push({path,status:r.status,words,sha256:hash(html)});
 for(const method of ['GET','HEAD']){const redirect=await fetch(origin+path+'.html?from=proof',{method,redirect:'manual'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),origin+path+'?from=proof')}
}
const related=[];
for(const path of Object.keys(continuityEntries)){
 const {html}=await get(path);assert.ok(html.includes(continuityEntries[path]),path+' must retain its exact approved Continuity block');const preserved=preserveContinuityContent(path,Buffer.from(html),{required:true});
 if(path==='/programme')assert.ok(html.includes(NEW_LIFE_LINK));
 if(preview){const before=await (await fetch(production+path)).text();assert.equal(preserved.toString(),preserveContinuityContent(path,Buffer.from(before)).toString(),path+' changed beyond exact approved additions')}
 related.push({path,sha256:hash(html),preservedSha256:hash(preserved)});
}
const internalLinks=[];
for(const path of links){const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});assert.ok(r.status>=200&&r.status<400,path+': '+r.status);internalLinks.push({path,status:r.status})}
const {html:xml}=await get('/sitemap.xml');const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(new Set(locations).size,locations.length,'duplicate sitemap locations');for(const path of CONTINUITY_PATHS)assert.ok(locations.includes(production+path));
let sitemap={after:locations.length,added:CONTINUITY_PATHS};
if(preview){const base=await(await fetch(production+'/sitemap.xml')).text(),before=[...base.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);for(const url of before)assert.ok(locations.includes(url),'removed sitemap entry '+url);sitemap={before:before.length,after:locations.length,added:locations.filter(x=>!before.includes(x)),removed:before.filter(x=>!locations.includes(x))};assert.deepEqual(sitemap.added.sort(),CONTINUITY_PATHS.map(p=>production+p).filter(url=>!before.includes(url)).sort());assert.deepEqual(sitemap.removed,[])}
const feed=await(await fetch(origin+'/v1/radar/ticker')).json();
const result={checkedAt:new Date().toISOString(),origin,redirects,pages,related,internalLinks,sitemap,feed:{current:feed.current,status:feed.status,reasons:feed.freshness?.reasons}};
writeFileSync('public-continuity-live-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
