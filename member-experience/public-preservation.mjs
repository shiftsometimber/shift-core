import {preserveLoginSession} from './session-preservation.mjs';
import {preserveBabyLoveKnowledge} from '../babylove/public-article.mjs';
import {preservePassportHead} from '../health-passport/production-preservation.mjs';
import {preserveHealthCardOrder} from '../testosterone-hub-order.mjs';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {publicPageEvidence,assertPublicPagesPreserved} from '../medicines-watch/preservation.mjs';
import {preserveContinuityContent} from '../public-continuity-preservation.mjs';
import {preserveTickerVersion} from '../public-ticker-preservation.mjs';
const [output,before]=process.argv.slice(2);
if(!output)throw Error('An evidence output path is required');
const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912','/articles/stopping-glp1'];
const pages=[];
const passportEnabled=/"HEALTH_PASSPORT_V1_ENABLED"\s*:\s*"true"/.test(readFileSync('wrangler.jsonc','utf8'));
const hash=body=>createHash('sha256').update(body).digest('hex');
for(const path of paths){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path+' must return HTTP 200');
 const body=Buffer.from(await r.arrayBuffer());
 let preserved=preservePassportHead(path,preserveContinuityContent(path,preserveHealthCardOrder(path,preserveTickerVersion(preserveBabyLoveKnowledge(path,body,{required:Boolean(before)}))),{required:Boolean(before)}),{required:Boolean(before)&&passportEnabled});
 preserved=preserveLoginSession(path,preserved);
 pages.push({...publicPageEvidence(path,r.status,preserved,{requireTreatmentsEntry:Boolean(before),hash}),actualSha256:hash(body),actualBytes:body.length,continuityAdditionRemoved:!preserved.equals(body)});
}
let comparison='baseline';
try{if(before)comparison=assertPublicPagesPreserved(pages,JSON.parse(readFileSync(before)).pages);}
catch(error){writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison:'failed',error:error.message},null,2));throw error;}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison},null,2));
console.log(before?'PASS: all '+paths.length+' public/login responses preserve existing content; exact approved Continuity entries and Life Back link are checked before comparison.':'Captured all '+paths.length+' public/login response hashes, including full raw-body hashes.');
