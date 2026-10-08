import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
assert(process.env.BASELINE_WORKER,'Baseline Worker source path required');
const {default:baseline}=await import(pathToFileURL(process.env.BASELINE_WORKER));
import candidate from '../shift-coach/worker.mjs';
import {improvePracticalGuides,PRACTICAL_GUIDES} from '../public-practical-guides.mjs';
const baselineGuides=await import(new URL('../public-practical-guides.mjs',pathToFileURL(process.env.BASELINE_WORKER)));
const originalFetch=globalThis.fetch,cache=new Map();
globalThis.fetch=async(input,init)=>{const r=new Request(input,init),key=r.method+' '+r.url;if(!cache.has(key))cache.set(key,originalFetch(r));return (await cache.get(key)).clone();};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function canonicalize(h,p){const c=PRACTICAL_GUIDES[p];if(!c)return h;const style=h.match(/<style data-practical-guide-style>[\s\S]*?<\/style>/)?.[0];assert(style,'Practical style absent: '+p);assert.equal(h.split(style).length,2);h=h.replace(style,'');let metas='';if(c.title){for(const [a,n,v] of [['name','description',c.description],['property','og:title',c.title],['name','twitter:title',c.title],['property','og:description',c.description],['name','twitter:description',c.description]]){const tag='<meta '+a+'="'+n+'" content="'+esc(v)+'">';assert.equal(h.split(tag).length,2);h=h.replace(tag,'');metas+=tag;}}return h.replace('</head>',style+metas+'</head>');}
const ctx={waitUntil(){}},result=[];
const {ARTICLE}=await import('../babylove/editorial/oral-bundle.mjs');
const env={DB:{prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return sql.includes('knowledge_article_reviews')&&values[0]===ARTICLE.slug?{...ARTICLE,status:'published',decision:'approved',publish_at:'2026-09-20T00:00:00Z'}:null},async all(){return {results:[]}},async run(){throw Error('Synthetic public proof forbids writes')}}}}};
for(const p of [...Object.keys(PRACTICAL_GUIDES),'/','/start-here','/wegovy','/mens-mental-health','/explore-knowledge','/guides/retatrutide-uk-guide','/member-login','/member-fit-programme-v1.js','/member-grub-programme-v1.js']){
 const req=new Request('https://shiftsometimber.co.uk'+p),a=await baseline.fetch(req,env,ctx),b=await candidate.fetch(req,env,ctx);assert.equal(b.status,a.status);const before=await a.text(),after=await b.text();
 if(process.env.SERVING_SEO_PRESERVATION_PROOF==='1'){
  assert.equal(b.headers.get('location'),a.headers.get('location'),'Approved destination changed: '+p);
  assert.equal(b.headers.get('content-type'),a.headers.get('content-type'),'Approved response type changed: '+p);
  assert.equal(after,before,'Full public response differs from latest approved source: '+p);
 }else if(process.env.ORAL_CANONICAL_PROOF==='1'){
  assert.equal(b.headers.get('location'),a.headers.get('location'),'Existing destination changed: '+p);
  assert.equal(b.headers.get('content-type'),a.headers.get('content-type'),'Response type changed: '+p);
  let exactExpected=before;
  if(p==='/articles/oral-semaglutide-for-weight-loss'){
   const prior=baselineGuides.PRACTICAL_GUIDES[p].html,current=PRACTICAL_GUIDES[p].html;
   assert.equal(before.split(prior).length-1,1,'Exact prior oral section required');
   exactExpected=before.replace(prior,current);
  }
  assert.equal(after,exactExpected,'Full response differs outside exact one-anchor repair: '+p);
 }else{
  const expected=process.env.TABLET_USEFULNESS_PROOF&&p==='/foundayo'?before.replace(baselineGuides.PRACTICAL_GUIDES[p].html,PRACTICAL_GUIDES[p].html):improvePracticalGuides(before,p);
  assert.equal(canonicalize(after,p),canonicalize(expected,p),'Full document differs outside exact reviewed payload: '+p);
 }
 fs.writeFileSync('practical-guides-proof/full-handler-'+p.replaceAll('/','_')+'.html',after);result.push({path:p,status:b.status,baselineStatus:a.status,exactReviewedTransform:true,protected:!PRACTICAL_GUIDES[p]});
}
fs.writeFileSync('practical-guides-proof/full-handler-receipt.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,responses:result.length,protected:result.filter(r=>r.protected).length}));