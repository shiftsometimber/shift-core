import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import paths from '../editorial/book-voice/payload.json' with {type:'json'};
export const BOOK_VOICE_PREVIEW='1912c60073ef4f73b2c2ea36c1e7cca76da1579e';
export const BOOK_VOICE_RUN=37030676727;
export const BOOK_VOICE_PATHS=paths;
export function originalBookVoiceGate(path,source){
 if(path==='member-experience/verify-production-member.mjs')return source.replace("import {withTrustRepair} from '../shift-coach/public-trust-repair.mjs';\n",'').replace('expected=Buffer.from(await (await withTrustRepair(request,footerWrapped)).arrayBuffer());','expected=Buffer.from(await footerWrapped.arrayBuffer());');
 if(path==='member-experience/public-preservation.mjs'){
  // Reverse only the reviewed source-anchor preservation delta before comparing
  // every remaining byte with the original editorial preview.
  source=source.replace("import {restoreTrustCentre,restoreStoppingCitation} from '../shift-coach/public-trust-repair.mjs';\n","import {restoreTrustCentre} from '../shift-coach/public-trust-repair.mjs';\n")
   .replace(' const reviewedSource=restoreStoppingCitation(path,body,{required:Boolean(before)});\n','')
   .replace("restoreTrustCentre(path,reviewedSource.toString('utf8'),{required:Boolean(before)})","restoreTrustCentre(path,body.toString('utf8'),{required:Boolean(before)})");
  source=source.replace("import {restoreTrustCentre} from '../shift-coach/public-trust-repair.mjs';\n",'').replace("restoreBookVoiceCopy(path,restoreTrustCentre(path,body.toString('utf8'),{required:Boolean(before)}))","restoreBookVoiceCopy(path,body.toString('utf8'))");
  const contrastAddition=`import {contrastSafetyClient,contrastSafetyVersion} from '../public-navigation-policy.mjs';
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
 const tag=client=>\`<script data-shift-contrast-guard="\${contrastSafetyVersion}">\${client}</script>\`;
 const prior=tag(priorContrastSafetyClient),current=tag(contrastSafetyClient);
 const priorCount=html.split(prior).length-1,currentCount=html.split(current).length-1;
 assert.equal(priorCount+currentCount,1,'Public page must contain exactly one reviewed contrast guard');
 if(required)assert.equal(currentCount,1,'Public page is missing the reviewed translucent-panel contrast repair');
 return Buffer.from(html.replace(prior,current));
}

`;
  if(source.split(contrastAddition).length-1!==1)return source;
  return source.replace(contrastAddition,'')
   .replace('export async function runPublicPreservation([output,before]=process.argv.slice(2)){','const [output,before]=process.argv.slice(2);')
   .replace(' preserved=preserveReviewedContrastGuard(path,preserved,{required:Boolean(before)});\n','')
   .replace("\n}\nif(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runPublicPreservation();\n",'\n');
 }
 if(path!=='release/home-banner-scope.mjs')return source;
 source=source.replace(" if(path==='release/member-details-preservation.mjs')source=source.replace(\"import {restoreHomeFont} from '../shift-coach/public-font-delivery.mjs';\\n\",'').replace(\"removeCreamNavigation(restoreHomeFont(path,body.toString('utf8')))\",\"removeCreamNavigation(body.toString('utf8'))\");\n",'');
 return source.replace("import {coachingHistoricalRef,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';\n",'').replace(' verifyCoachingRelease();\n','').replace("read(coachingHistoricalRef('HEAD','.github/workflows/cloudflare-production-promote.yml'),'.github/workflows/cloudflare-production-promote.yml')","read('HEAD','.github/workflows/cloudflare-production-promote.yml')");
}
export function validateBookVoice(read){for(const path of BOOK_VOICE_PATHS)assert.equal(originalBookVoiceGate(path,read('HEAD',path)),read(BOOK_VOICE_PREVIEW,path),'Approved book voice/preview source drift: '+path);}
export async function verifyBookVoiceProof(get){
 const proof=await get('/actions/runs/'+BOOK_VOICE_RUN);
 assert.equal(proof.head_sha,BOOK_VOICE_PREVIEW);assert.equal(proof.path,'.github/workflows/book-voice-preview.yml');assert.equal(proof.conclusion,'success','All 23 edits and signed-in phone/desktop preview must pass');
 validateBookVoice((ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'}));return {id:proof.id,sha:proof.head_sha,path:proof.path,conclusion:proof.conclusion};
}
