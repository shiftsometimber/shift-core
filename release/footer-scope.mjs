// Matt's explicit 1 October instruction: approved footer on every website/PWA/app page.
// Exact footer payload only. Historical runtime comparisons still check pre-footer bytes.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const FOOTER_BASE='baec2cef3dbaf993ba00a3c10927d6dc6062a532';
export const FOOTER_CANDIDATE='66e15d16143cb7bcbfeb9ee149cc047523ce52c7';
export const FOOTER_PROOF_RUN=36915747155;
export const FOOTER_RUNTIME_PATHS=new Set(['worker-entry-v6.js','my-timber-pwa/service-worker.mjs','preview/app-layout/presentation.mjs','preview/app-layout/screens.mjs','preview/app-layout/tabs.mjs']);
export const FOOTER_PAYLOAD_PATHS=new Set([...FOOTER_RUNTIME_PATHS,'shared-footer.mjs','tests/shared-footer.test.mjs','scripts/prove-shared-footer.cjs','preview/shared-footer/worker.mjs','preview/shared-footer/wrangler.jsonc','.github/workflows/shared-footer-proof.yml']);
export const FOOTER_PATHS=new Set([...FOOTER_PAYLOAD_PATHS,'release/footer-scope.mjs','.github/workflows/shared-footer-release-proof.yml']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function historicalFooterRef(ref,path){return ref==='HEAD'&&FOOTER_RUNTIME_PATHS.has(path)?FOOTER_BASE:ref;}
export function originalFooterEntry(source){return source.replace("import {withSharedFooter} from './shared-footer.mjs';\n",'').replace('if(appStorePublic)return withSharedFooter(request,appStorePublic);','if(appStorePublic)return appStorePublic;').replace("return withSharedFooter(request,await withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final))));","return withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final)));");}
export function validateFooterSource(){
 git('merge-base','--is-ancestor',FOOTER_BASE,FOOTER_CANDIDATE);git('merge-base','--is-ancestor',FOOTER_CANDIDATE,'HEAD');
 for(const path of FOOTER_PAYLOAD_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',FOOTER_CANDIDATE+':'+path),'Footer payload differs from the browser-tested candidate: '+path);
 assert.equal(originalFooterEntry(execFileSync('git',['show','HEAD:worker-entry-v6.js'],{encoding:'utf8'})),execFileSync('git',['show',FOOTER_BASE+':worker-entry-v6.js'],{encoding:'utf8'}),'Unrelated Worker change');
}
export async function verifyFooterProof(get){
 const receipt=await get('/actions/runs/'+FOOTER_PROOF_RUN);assert.equal(receipt.head_sha,FOOTER_CANDIDATE);assert.equal(receipt.path,'.github/workflows/shared-footer-proof.yml');assert.equal(receipt.conclusion,'success','Footer browser proof must pass before production promotion');return receipt;
}

