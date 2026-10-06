import {mkdirSync} from 'node:fs';
mkdirSync('sitewide-seo-proof',{recursive:true});
import assert from 'node:assert/strict';import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {sitewideProofMarker,assertSitewideLiveReceipt} from '../release/sitewide-seo-scope.mjs';
assert(process.env.BASELINE_WORKER,'Exact baseline worker path required');
const {default:baseline}=await import(pathToFileURL(process.env.BASELINE_WORKER));
import candidate from '../shift-coach/worker.mjs';
import {PROGRAMME_PATHS,PROGRAMME_DRAFTS,programmeStyle,improveProgrammeSupport} from '../public-seo-programme.mjs';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function normalize(h,p){const d=PROGRAMME_DRAFTS.find(d=>d.path===p);if(!d||!h.includes('data-programme-support='))return h;const tags=[programmeStyle];if(d.title)for(const [a,n,v] of [['name','description',d.description],['property','og:description',d.description],['name','twitter:description',d.description],['property','og:title',d.title],['name','twitter:title',d.title]])tags.push('<meta '+a+'="'+n+'" content="'+esc(v)+'">');for(const t of tags){assert.equal(h.split(t).length,2,'Owned tag must occur once');h=h.replace(t,'')}return h.replace('</head>',tags.join('')+'</head>');}
const originalFetch=globalThis.fetch,cache=new Map();globalThis.fetch=async(input,init)=>{const r=new Request(input,init),key=r.method+' '+r.url;if(!cache.has(key))cache.set(key,originalFetch(r));return(await cache.get(key)).clone()};
const env={DB:{prepare(){return{bind(){return this},async first(){return null},async all(){return{results:[]}},async run(){throw Error('Public proof forbids writes')}}}}},ctx={waitUntil(){}},out=[];
for(const p of [...PROGRAMME_PATHS,'/','/start-here','/sitemap.xml','/wegovy','/mounjaro','/mens-weight-management','/mens-mental-health','/explore-knowledge','/guides/retatrutide-uk-guide','/member-login','/member-fit-programme-v1.js','/member-grub-programme-v1.js','/medicine-news/bolt-pharmacy-ads-banned-asa']){
 const a=await baseline.fetch(new Request('https://shiftsometimber.co.uk'+p),env,ctx),b=await candidate.fetch(new Request('https://shiftsometimber.co.uk'+p),env,ctx);assert.equal(a.status,b.status);const before=await a.text(),after=await b.text();const expected=improveProgrammeSupport(before,p);if(normalize(after,p)!==normalize(expected,p)){const i=[...after].findIndex((c,i)=>c!==expected[i]);console.log(JSON.stringify({path:p,actualBytes:after.length,expectedBytes:expected.length,index:i,actual:after.slice(i-100,i+300),expected:expected.slice(i-100,i+300)}));fs.writeFileSync('sitewide-seo-proof/handler-actual.html',after);fs.writeFileSync('sitewide-seo-proof/handler-expected.html',expected);throw Error('Unexpected difference')} out.push({path:p,status:b.status,exactTransform:true,additionPresent:after.includes('data-programme-support='),protected:!PROGRAMME_PATHS.includes(p)});
}fs.writeFileSync('sitewide-seo-proof/full-handler-proof.json',JSON.stringify(out,null,2));console.log(JSON.stringify({pass:true,responses:out.length,protected:out.filter(r=>r.protected).length,additions:out.filter(r=>r.additionPresent).length}));
const receiptText=fs.readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8'),receipt=assertSitewideLiveReceipt(JSON.parse(receiptText)),live=[];
for(const expected of receipt.liveProof.checks){
 const response=await originalFetch('https://shiftsometimber.co.uk'+expected.path,{signal:AbortSignal.timeout(30000)});
 const text=await response.text(),sha256=createHash('sha256').update(text).digest('hex');
 assert.equal(sha256,expected.sha256,'Live document drift: '+expected.path);
 if(!expected.protected){assert.equal(response.status,200);assert.equal(response.headers.get('x-shift-seo-programme'),'2026-10-06-v2');assert(text.includes('data-programme-support='));}
 live.push({path:expected.path,sha256,exact:true});
}
fs.writeFileSync('sitewide-seo-proof/live-verification.json',JSON.stringify(live,null,2));
console.log('SITEWIDE_SEO_PROOF '+JSON.stringify(sitewideProofMarker(receiptText)));
