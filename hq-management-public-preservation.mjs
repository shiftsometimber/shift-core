// HQ makes no public-content changes: compare exact pre/post bodies, including
// the already-approved organic destinations, rather than asserting completion
// of an independent, historically published link-edit batch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {ORGANIC_LINK_EDITS} from './public-seo-organic-links.mjs';
const [output,before]=process.argv.slice(2);assert(output);
const paths=[...new Set(['/mens-mental-health','/clinic-gone-quiet','/provider-switch','/','/start-here','/programme','/help','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912','/articles/stopping-glp1','/sitemap.xml',...Object.keys(ORGANIC_LINK_EDITS)])];
const pages=[];
for(const path of paths){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);
 const raw=Buffer.from(await r.arrayBuffer());pages.push({path,status:r.status,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
}
const result={at:new Date().toISOString(),scope:'HQ release: exact public-page and asset preservation',pages,comparison:before?'pending':'baseline'};
writeFileSync(output,JSON.stringify(result,null,2));
if(before){assert.deepEqual(pages,JSON.parse(readFileSync(before)).pages,'Public response bytes changed during HQ release');result.comparison='identical';writeFileSync(output,JSON.stringify(result,null,2));}
console.log('PASS '+pages.length+' public/login/sitemap responses '+(before?'identical to pre-release':'captured'));
