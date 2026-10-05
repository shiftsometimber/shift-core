import {preserveSixTopicSeo} from '../release/six-topic-seo-preservation.mjs';
import {restoreTrustCentre,restoreStoppingCitation} from '../shift-coach/public-trust-repair.mjs';
import {restoreBookVoiceCopy} from '../book-voice.mjs';
import {applySharedFooter} from '../shared-footer.mjs';
import {preserveGrowthCopy} from '../release/growth-preservation.mjs';
import {preserveApprovedStartup} from '../release/member-details-preservation.mjs';
import {preserveSeo794} from '../release/seo794-preservation.mjs';
import {preserveCalculatorsNavigation} from '../public-calculators-preservation.mjs';
import {preserveNutritionSignposting} from '../public-nutrition-mytimber.mjs';
import {preservePwaPresentation} from '../my-timber-pwa/preservation.mjs';
import {preserveTreatmentCentreAccuracy} from '../public-promise-preservation.mjs';
import {preserveServiceBridgePaint} from '../public-service-bridge-preservation.mjs';
import {preserveOralKnowledge} from '../babylove/oral-public.mjs';
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
import {contrastSafetyClient,contrastSafetyVersion} from '../public-navigation-policy.mjs';
import {pathToFileURL} from 'node:url';

// PR #1010 changed only this exact client function so translucent panels are
// composited over their real ancestors. Normalise that reviewed delta during
// the pre/post full-page comparison; every other byte remains hash-locked.
const priorBackground="function background(el){let n=el;while(n){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=rgb(s.backgroundColor);if(c&&c.a>.01)return c.a<1?blend(c,{r:255,g:255,b:255,a:1}):c;n=n.parentElement}return{r:255,g:255,b:255,a:1}}";
const currentBackground="function background(el){const layers=[];let n=el;while(n){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=rgb(s.backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=1)break}n=n.parentElement}let result={r:255,g:255,b:255,a:1};for(let i=layers.length-1;i>=0;i--)result=blend(layers[i],result);return result}";
assert.equal(contrastSafetyClient.split(currentBackground).length-1,1,'Current contrast guard signature changed');
export const priorContrastSafetyClient=contrastSafetyClient.replace(currentBackground,priorBackground);
export function preserveReviewedContrastGuard(path,input,{required=false}={}){
 if(path==='/turnstile-auth-v1.js?v=timeout-20260912')return input;
 const html=input.toString('utf8');
 const tag=client=>`<script data-shift-contrast-guard="${contrastSafetyVersion}">${client}</script>`;
 const prior=tag(priorContrastSafetyClient),current=tag(contrastSafetyClient);
 const priorCount=html.split(prior).length-1,currentCount=html.split(current).length-1;
 assert.equal(priorCount+currentCount,1,'Public page must contain exactly one reviewed contrast guard');
 if(required)assert.equal(currentCount,1,'Public page is missing the reviewed translucent-panel contrast repair');
 return Buffer.from(html.replace(prior,current));
}

export async function runPublicPreservation([output,before]=process.argv.slice(2)){
if(!output)throw Error('An evidence output path is required');
const paths=['/mens-mental-health','/clinic-gone-quiet','/provider-switch','/','/start-here','/programme','/help','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912','/articles/stopping-glp1'];
const pages=[];
const passportEnabled=/"HEALTH_PASSPORT_V1_ENABLED"\s*:\s*"true"/.test(readFileSync('wrangler.jsonc','utf8'));
const hash=body=>createHash('sha256').update(body).digest('hex');
for(const path of paths){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path+' must return HTTP 200');
 const body=Buffer.from(await r.arrayBuffer());
 const reviewedSource=restoreStoppingCitation(path,body,{required:Boolean(before)});
 const footerPreserved=Buffer.from(applySharedFooter(restoreBookVoiceCopy(path,restoreTrustCentre(path,reviewedSource.toString('utf8'),{required:Boolean(before)}))));
 const pwaPreserved=preservePwaPresentation(path,preserveApprovedStartup(path,preserveGrowthCopy(path,footerPreserved,{required:Boolean(before)})),{required:Boolean(before)});
 let preserved=preservePassportHead(path,preserveContinuityContent(path,preserveHealthCardOrder(path,preserveTickerVersion(preserveBabyLoveKnowledge(path,preserveOralKnowledge(path,pwaPreserved),{required:Boolean(before)}))),{required:Boolean(before)}),{required:Boolean(before)&&passportEnabled});
 preserved=preserveServiceBridgePaint(preserveLoginSession(path,preserved),{required:Boolean(before)});
 preserved=preserveTreatmentCentreAccuracy(path,preserved,{required:Boolean(before)});
 preserved=preserveNutritionSignposting(path,preserved);
 preserved=preserveCalculatorsNavigation(path,preserved,{required:Boolean(before)});
 // Includes only the two exact shared support links on the public login page.
 preserved=preserveSeo794(path,preserved,{required:Boolean(before)});
 preserved=preserveReviewedContrastGuard(path,preserved,{required:Boolean(before)});
 preserved=preserveSixTopicSeo(path,preserved,{required:Boolean(before)});
 pages.push({...publicPageEvidence(path,r.status,preserved,{requireTreatmentsEntry:Boolean(before),hash}),actualSha256:hash(body),actualBytes:body.length,continuityAdditionRemoved:!preserved.equals(body)});
}
let comparison='baseline';
try{if(before)comparison=assertPublicPagesPreserved(pages,JSON.parse(readFileSync(before)).pages);}
catch(error){writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison:'failed',error:error.message},null,2));throw error;}
writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),pages,comparison},null,2));
console.log(before?'PASS: all '+paths.length+' public/login responses preserve existing content; exact approved Continuity entries and Life Back link are checked before comparison.':'Captured all '+paths.length+' public/login response hashes, including full raw-body hashes.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runPublicPreservation();
