import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {improvePracticalGuides,PRACTICAL_GUIDES} from '../public-practical-guides.mjs';
const live=process.argv.includes('--live'),out='practical-guides-proof',base='https://shiftsometimber.co.uk';
const priorGuides=process.env.BASELINE_GUIDES?(await import(pathToFileURL(process.env.BASELINE_GUIDES))).PRACTICAL_GUIDES:PRACTICAL_GUIDES;
const canonicalProof=process.env.ORAL_CANONICAL_PROOF==='1';
const paths=canonicalProof?['/articles/oral-semaglutide-for-weight-loss']:Object.keys(PRACTICAL_GUIDES);
if(canonicalProof){
 assert(process.env.BASELINE_GUIDES,'Exact baseline guides required');
 const receipt=JSON.parse(readFileSync(out+'/full-handler-receipt.json','utf8'));
 for(const p of Object.keys(PRACTICAL_GUIDES)){
  assert(receipt.some(r=>r.path===p&&r.exactReviewedTransform===true),'Complete handler proof required: '+p);
  if(!paths.includes(p))assert.equal(PRACTICAL_GUIDES[p].html,priorGuides[p].html,'Unchanged practical section changed: '+p);
 }
}
const sha=s=>createHash('sha256').update(s).digest('hex'),part=(h,t)=>h.match(new RegExp('<'+t+'\\b[\\s\\S]*?</'+t+'>','i'))?.[0]||'';
mkdirSync(out,{recursive:true});
const protectedPaths=['/','/start-here','/articles/wegovy-side-effects-timeline','/articles/nhs-weight-loss-drugs','/member-login','/member-fit-programme-v1.js','/member-grub-programme-v1.js','/member-my-timber-problem-v1.js'];
const read=async p=>{const r=await fetch(base+p,{signal:AbortSignal.timeout(25000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,p+' status');return {html:await r.text(),type:r.headers.get('content-type'),url:r.url}};
const targets=new Set(),report={checkedAt:new Date().toISOString(),mode:live?'live':'candidate',pages:[],links:[],protected:[],failures:[],rankingImprovementClaimed:false};
if(process.env.SERVING_SEO_PRESERVATION_PROOF==='1'){
 assert(!live&&process.env.BASELINE_GUIDES,'Existing approved source baseline required for preservation');
 const receipt=JSON.parse(readFileSync(out+'/full-handler-receipt.json','utf8'));
 const expected=[...Object.keys(PRACTICAL_GUIDES),'/','/start-here','/wegovy','/mens-mental-health','/explore-knowledge','/guides/retatrutide-uk-guide','/member-login','/member-fit-programme-v1.js','/member-grub-programme-v1.js'];
 assert.deepEqual(receipt.map(r=>r.path),expected,'Every complete public response must be compared');
 for(const r of receipt){assert.equal(r.exactReviewedTransform,true);assert.equal(r.status,r.baselineStatus,'Existing handler status changed: '+r.path);}
 assert.deepEqual(PRACTICAL_GUIDES,priorGuides,'This release must preserve all approved guide templates');
 // This preservation release does not add guide content. Verify the changed serving SEO destinations and Programme, alongside complete unchanged guide responses.
 const preservedTitles={'/articles/wegovy-side-effects-timeline':'Do Wegovy Side Effects Go Away? How Long They Last | SHIFT','/articles/nhs-weight-loss-drugs':'NHS Weight-Loss Drugs: Eligibility & Access in the UK | SHIFT'};
 for(const p of ['/programme',...Object.keys(preservedTitles)]){
  const r=await read(p);if(preservedTitles[p])assert(r.html.includes('<title>'+preservedTitles[p].replaceAll('&','&amp;')+'</title>'),'Serving SEO title drift: '+p);
  assert(/<main\b/i.test(r.html),'Existing public page missing: '+p);
  assert.equal((r.html.match(/<h1\b/gi)||[]).length,1,'One existing page heading required: '+p);
  assert.equal((r.html.match(/rel=["']canonical["']/gi)||[]).length,1,'One canonical required: '+p);
  assert(!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(r.html));
  report.pages.push({path:p,status:200,approvedTemplateUnchanged:true,completeCandidateResponsePreserved:true});
  if(preservedTitles[p])targets.add(p);
 }
 for(const p of targets){const r=await read(p);assert(/<main\b/i.test(r.html));report.links.push({path:p,status:200});}
 for(const p of protectedPaths){const r=await read(p);report.protected.push({path:p,status:200,sha256:sha(r.html)});}
 report.mode='serving-seo-preservation';report.pass=true;report.completePublicResponses=receipt.length;
 writeFileSync(out+'/candidate-receipt.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({mode:report.mode,pass:true,pages:report.pages.length,links:report.links.length,protected:report.protected.length,completePublicResponses:receipt.length}));
 process.exit(0);
}
for(const p of paths){const slug=p.slice(1).replaceAll('/','_'),current=await read(p),before=current.html,c=PRACTICAL_GUIDES[p],h=live?before:before.includes(priorGuides[p].html)?before.replace(priorGuides[p].html,c.html):improvePracticalGuides(before,p);
 assert(h.includes(c.html),'Exact practical content absent: '+p);assert.equal(improvePracticalGuides(h,p),h,'Idempotence');
 assert.equal((h.match(/<h1\b/gi)||[]).length,1);assert.equal((h.match(/rel=["']canonical["']/gi)||[]).length,1);
 assert(!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(h));
 const canonical=h.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]||h.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];assert(canonical);
 if(!live){assert.equal(part(h,'main').replace(c.html,''),part(before,'main').replace(priorGuides[p].html,''),'Pre-existing guidance changed');for(const tag of ['header','footer'])assert.equal(part(h,tag),part(before,tag));const schemas=s=>[...s.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/g)].map(x=>x[0]);assert.deepEqual(schemas(h),schemas(before));writeFileSync(out+'/'+slug+'-before.html',before);}
 for(const m of c.html.matchAll(/href="(\/[^"]+)"/g))targets.add(m[1]);
 writeFileSync(out+'/'+slug+(live?'-live':'-candidate')+'.html',h);
 report.pages.push({path:p,url:current.url,canonical,htmlSha256:sha(h),contentWords:c.html.replace(/<[^>]+>/g,' ').split(/\s+/).length,existingGuidancePreserved:!live});
}
for(const p of targets){const r=await read(p);assert(/<main\b/i.test(r.html));report.links.push({path:p,status:200});}
for(const p of protectedPaths){try{const r=await read(p);const key=p.replaceAll('/','_')||'home';if(!live)writeFileSync(out+'/protected-'+key+'.txt',r.html);else assert.equal(r.html,readFileSync(out+'/protected-'+key+'.txt','utf8'),'Protected response changed: '+p);report.protected.push({path:p,sha256:sha(r.html),unchanged:live});}catch(e){if(p==='/member-image-viewer.mjs'){report.protected.push({path:p,notPublicAsset:true});continue;}throw e;}}
report.pass=true;writeFileSync(out+'/'+(live?'live':'candidate')+'-receipt.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,pass:true,pages:report.pages.length,links:report.links.length,protected:report.protected.length}));