import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const GROWTH_PREVIEW='44c5ebcef492ee9b6476f0343737afb085f579f3';
// Exact owner-reviewed payload and exact integration files. No generic directory exclusion.
const hashes={
  ".github/workflows/cloudflare-production-promote.yml": "f95f9a1e66f8a63aff58620456990951ea85bb40d282e5ef691fcc9abdab12e5",
  ".github/workflows/growth-member-preview.yml": "2504002114f448635365c693f7d97065119608be1a3975f5b3d19ab5d2843098",
  ".github/workflows/rendered-member-production-acceptance.yml": "932e7f8e375b78a02f32dba1b452e63c62954e879e08ce61f5aaf9d2a974b5bc",
  "docs/growth-review/2026-09-27.md": "3244a00605dfd2b856109b42095787ca979ee4faff3283e85ed51eea290fd2b0",
  "docs/growth-review/local-test-results.txt": "edf614202a255cf31edcbf561671d1d52d9bd7b945f1a425a4ec8da6a7dfdcfa",
  "growth-member-public.mjs": "4db4cd1998d63b2fe34bd10ce46192147445ee11da5e2efa9b73503a8e8fc420",
  "member-experience/life-back/next-shift.mjs": "67bac6eafdea8f8c9b437b58f99db850c899b8db2ed21df8998fc0cc7f344159",
  "member-experience/public-preservation.mjs": "7f8da90951a8438ef42f1f5de4f3aa68ada841adc8b94cd52429d938b483e71f",
  "member-experience/staging/pins.json": "fac6eb5268ff9109cd6e4a7c75ce55f006e2c1281bb3056814a41201cac973d9",
  "member-experience/tests/next-shift-loop.test.mjs": "64c5efda834fb03f3362ba4d4d1505c0b6c640944da10c8f633ff25f5f7d4334",
  "preview/growth-member/prepare.mjs": "438d031a42d1253d9775ebf979f46d594d5d2afdb8e1d110632b25ff2c9f500b",
  "preview/growth-member/public-copy.mjs": "7c24b8dd90334c4e2746b0882ffef1ab3aa0b6ca1022bb25f39bbab24db78811",
  "preview/growth-member/verify.cjs": "a198ed33c32cd54e12dd221d5b945b69055e932fa37b55ffb42aa64af67ef4dd",
  "preview/growth-member/worker.mjs": "c5cd471dcafbe7162eb3b7a8f3e8eb301e8cd7dfb497cfdb4f9588ecb0979178",
  "release/growth-member-live.mjs": "b0345771269d507db19f3bbd2c96f621a70fea08a08204735e0b82b58dba98b1",
  "release/growth-preflight.mjs": "af5c02733740c9760d396572a80cebdbb0085282e03473214440c053dca55c0c",
  "release/growth-preservation.mjs": "a3c956a7a4f259f0d31b26090b5fd38d2fb639aae31202e4f2fc4e37f86da0b9",
  "release/growth-public-live.cjs": "7e93c062cf260b0a93207c626c72c9de4bec8a5766e1d45eec860beb21d76797",
  "tests/growth-release.test.mjs": "e1a88ba68b78e1f4072d515b52338b9d742c2661db80b416b44e2ae61e57fe8f",
  "worker-entry-v6.js": "ba9f0bf21980f3da179ecbe852e3b7f11fbfae0cbc164c5e8461670808ff9dd6"
};
export const GROWTH_PINNED_PATHS=Object.keys(hashes);
export const GROWTH_PATHS=new Set([...GROWTH_PINNED_PATHS,'release/growth-scope.mjs']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function validateGrowthEntry(before,after){
 const expected="import {withGrowthPublicCopy} from './growth-member-public.mjs';\n"+before.replace("return withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final));","return withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final)));");
 assert.equal(after,expected,'Entry changed outside the exact growth response adapter');
}
export function validateGrowthSource(){
 git('merge-base','--is-ancestor',GROWTH_PREVIEW,'HEAD');
 for(const path of ['member-experience/life-back/next-shift.mjs','preview/growth-member/public-copy.mjs'])assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',GROWTH_PREVIEW+':'+path),'Reviewed growth payload changed: '+path);
 for(const [path,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(execFileSync('git',['show','HEAD:'+path])).digest('hex'),hash,'Growth release integration drift: '+path);
}
