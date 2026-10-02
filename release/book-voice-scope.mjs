import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import paths from '../editorial/book-voice/payload.json' with {type:'json'};
export const BOOK_VOICE_PREVIEW='1912c60073ef4f73b2c2ea36c1e7cca76da1579e';
export const BOOK_VOICE_RUN=37030676727;
export const BOOK_VOICE_PATHS=paths;
export function originalBookVoiceGate(path,source){
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
