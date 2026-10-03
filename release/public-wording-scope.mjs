import {WATCH_REGISTRY_WAVE_COMMIT} from './watch-registry-wave-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const PUBLIC_WORDING_PREVIEW='a3e2ebb4c585b0731e12511bf0325e6425ddc7b2';
export const PUBLIC_WORDING_RUN=37006333678;
export const PUBLIC_WORDING_PATHS=["medicines-watch/page.mjs","medicines-watch/page.test.mjs","medicines-watch/preservation.mjs","medicines-watch/preservation.test.mjs","cream-navigation.mjs"];
export function validatePublicWording(read){for(const path of PUBLIC_WORDING_PATHS)assert.equal(read('HEAD',path),read(path==='medicines-watch/page.mjs'?WATCH_REGISTRY_WAVE_COMMIT:PUBLIC_WORDING_PREVIEW,path),'Public wording/menu source drift: '+path);}
export async function verifyPublicWordingProof(get){
 const proof=await get('/actions/runs/'+PUBLIC_WORDING_RUN);
 assert.equal(proof.head_sha,PUBLIC_WORDING_PREVIEW);assert.equal(proof.path,'.github/workflows/public-wording-preview.yml');assert.equal(proof.conclusion,'success','Phone and desktop public preview must pass');
 validatePublicWording((ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim());
 return proof;
}
