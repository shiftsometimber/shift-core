import {WATCH_REGISTRY_WAVE_COMMIT} from './watch-registry-wave-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const PUBLIC_WORDING_PREVIEW='a3e2ebb4c585b0731e12511bf0325e6425ddc7b2';
export const PUBLIC_WORDING_RUN=37006333678;
export const PUBLIC_WORDING_PATHS=["medicines-watch/page.mjs","medicines-watch/page.test.mjs","medicines-watch/preservation.mjs","medicines-watch/preservation.test.mjs","cream-navigation.mjs"];
export const ARTICLE_PRESERVATION_SOURCE='0d084f00cf6c4593dd0c11dfd047daf4e5103295';
export const ARTICLE_PRESERVATION_PREVIEW='6349ca6f038a9e4587d8d1ad27d9c3ec987602de';
export const ARTICLE_PRESERVATION_PATHS=new Set(['medicines-watch/preservation.mjs','medicines-watch/preservation.test.mjs']);
export function validatePublicWording(read){for(const path of PUBLIC_WORDING_PATHS)assert.equal(read('HEAD',path),read(path==='medicines-watch/page.mjs'?WATCH_REGISTRY_WAVE_COMMIT:ARTICLE_PRESERVATION_PATHS.has(path)?ARTICLE_PRESERVATION_SOURCE:PUBLIC_WORDING_PREVIEW,path),'Public wording/menu source drift: '+path);}
export async function verifyPublicWordingProof(get){
 const proof=await get('/actions/runs/'+PUBLIC_WORDING_RUN);
 assert.equal(proof.head_sha,PUBLIC_WORDING_PREVIEW);assert.equal(proof.path,'.github/workflows/public-wording-preview.yml');assert.equal(proof.conclusion,'success','Phone and desktop public preview must pass');
 const article=await get('/actions/runs/37152993782');assert.equal(article.head_sha,ARTICLE_PRESERVATION_PREVIEW);assert.equal(article.path,'.github/workflows/medicines-watch-check.yml');assert.equal(article.conclusion,'success','Reviewed article preservation proof must pass');
 for(const path of ARTICLE_PRESERVATION_PATHS)assert.equal(execFileSync('git',['rev-parse',ARTICLE_PRESERVATION_SOURCE+':'+path],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',ARTICLE_PRESERVATION_PREVIEW+':'+path],{encoding:'utf8'}).trim(),'Merged article preservation differs from passing preview: '+path);
 validatePublicWording((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());
 return proof;
}
