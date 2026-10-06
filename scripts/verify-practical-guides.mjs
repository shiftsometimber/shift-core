import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {improvePracticalGuides,PRACTICAL_GUIDES} from '../public-practical-guides.mjs';
const live=process.argv.includes('--live'),out='practical-guides-proof',base='https://shiftsometimber.co.uk';
const paths=['/articles/weight-loss-after-40-men','/guides/mens-weight-management-guide','/mens-weight-management','/guides/mounjaro-ultimate-uk-guide','/mounjaro'];
const sha=s=>createHash('sha256').update(s).digest('hex'),part=(h,t)=>h.match(new RegExp('<'+t+'\\b[\\s\\S]*?</'+t+'>','i'))?.[0]||'';
mkdirSync(out,{recursive:true});
const protectedPaths=['/','/start-here','/articles/wegovy-side-effects-timeline','/articles/nhs-weight-loss-drugs','/member-login','/member-fit-programme-v1.js','/member-grub-programme-v1.js','/member-my-timber-problem-v1.js'];
const read=async p=>{const r=await fetch(base+p,{signal:AbortSignal.timeout(25000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,p+' status');return {html:await r.text(),type:r.headers.get('content-type'),url:r.url}};
const targets=new Set(),report={checkedAt:new Date().toISOString(),mode:live?'live':'candidate',pages:[],links:[],protected:[],failures:[],rankingImprovementClaimed:false};
for(const p of paths){const slug=p.slice(1).replaceAll('/','_'),current=await read(p),before=current.html,c=PRACTICAL_GUIDES[p],h=live?before:improvePracticalGuides(before,p);
 assert(h.includes(c.html),'Exact practical content absent: '+p);assert.equal(improvePracticalGuides(h,p),h,'Idempotence');
 assert.equal((h.match(/<h1\b/gi)||[]).length,1);assert.equal((h.match(/rel=["']canonical["']/gi)||[]).length,1);
 assert(!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(h));
 const canonical=h.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]||h.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];assert(canonical);
 if(!live){assert.equal(part(h,'main').replace(c.html,''),part(before,'main'),'Pre-existing guidance changed');for(const tag of ['header','footer'])assert.equal(part(h,tag),part(before,tag));const schemas=s=>[...s.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/g)].map(x=>x[0]);assert.deepEqual(schemas(h),schemas(before));writeFileSync(out+'/'+slug+'-before.html',before);}
 for(const m of c.html.matchAll(/href="(\/[^"]+)"/g))targets.add(m[1]);
 writeFileSync(out+'/'+slug+(live?'-live':'-candidate')+'.html',h);
 report.pages.push({path:p,url:current.url,canonical,htmlSha256:sha(h),contentWords:c.html.replace(/<[^>]+>/g,' ').split(/\s+/).length,existingGuidancePreserved:!live});
}
for(const p of targets){const r=await read(p);assert(/<main\b/i.test(r.html));report.links.push({path:p,status:200});}
for(const p of protectedPaths){try{const r=await read(p);const key=p.replaceAll('/','_')||'home';if(!live)writeFileSync(out+'/protected-'+key+'.txt',r.html);else assert.equal(r.html,readFileSync(out+'/protected-'+key+'.txt','utf8'),'Protected response changed: '+p);report.protected.push({path:p,sha256:sha(r.html),unchanged:live});}catch(e){if(p==='/member-image-viewer.mjs'){report.protected.push({path:p,notPublicAsset:true});continue;}throw e;}}
report.pass=true;writeFileSync(out+'/'+(live?'live':'candidate')+'-receipt.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,pass:true,pages:report.pages.length,links:report.links.length,protected:report.protected.length}));
