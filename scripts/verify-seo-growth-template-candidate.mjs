import fs from 'node:fs';import assert from 'node:assert/strict';
import {repairRankingGrowth,RANKING_GROWTH_PATHS,RANKING_GROWTH_DATE} from '../public-seo-growth.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/seo-growth-20261007.json',import.meta.url),'utf8'));
const nativeFetch=globalThis.fetch,log=console.log,paths=[];
globalThis.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url||input.href);if(url.origin==='https://shiftsometimber.co.uk'&&RANKING_GROWTH_PATHS.includes(url.pathname)){const before=fixtures[url.pathname].before,html=repairRankingGrowth(url.pathname,before);assert.notEqual(html,before);paths.push(url.pathname);return new Response(html,{status:200,headers:{'Content-Type':'text/html','X-Shift-Ranking-Growth':RANKING_GROWTH_DATE}});}return nativeFetch(input,init);};
process.argv.push('--live');console.log=()=>{};
try{await import('./verify-seo-template.mjs');}finally{console.log=log;globalThis.fetch=nativeFetch;process.argv.pop();}
const file='seo-template-live-proof/proof.json',proof=JSON.parse(fs.readFileSync(file,'utf8'));
proof.mode='captured_approved_candidate_and_current_public_controls';proof.simulatedCandidatePaths=[...new Set(paths)].sort();proof.sourceScope='Exact approved three-page runtime transformation; all other public URLs fetched unchanged.';
fs.writeFileSync(file,JSON.stringify(proof,null,2)+'\n');assert.deepEqual(proof.simulatedCandidatePaths,[...RANKING_GROWTH_PATHS].sort());assert.equal(proof.pass,true,JSON.stringify(proof.failures));
log(JSON.stringify({passed:true,mode:proof.mode,approvedPages:proof.simulatedCandidatePaths,publicPagesChecked:proof.pages.length,redirectsChecked:proof.redirects.length}));
