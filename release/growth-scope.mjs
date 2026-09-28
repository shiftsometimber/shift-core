import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const GROWTH_PREVIEW='44c5ebcef492ee9b6476f0343737afb085f579f3';
// Exact owner-reviewed payload and exact integration files. No generic directory exclusion.
const hashes={
  ".github/workflows/cloudflare-production-promote.yml": "9beb958983ae8b3f7637664d54c18bfe323038e6019b885d61f8471ce3517247",
  ".github/workflows/growth-member-preview.yml": "f2cc78d9f188bfd09bcec4569afd7b68800c760683f67ddd4bd9ecefc257a465",
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
  "preview/growth-member/verify.cjs": "8c660076f773341e59b7284a8c93dd8f1c1ad66f1fe31f88fdbcba5cf395bf70",
  "preview/growth-member/worker.mjs": "c5cd471dcafbe7162eb3b7a8f3e8eb301e8cd7dfb497cfdb4f9588ecb0979178",
  "release/growth-member-live.mjs": "b0345771269d507db19f3bbd2c96f621a70fea08a08204735e0b82b58dba98b1",
  "release/growth-preflight.mjs": "cafd73c75185f722eea4c0b9da17db7e439df850b91de04626f41578c368c01d",
  "release/growth-preservation.mjs": "a3c956a7a4f259f0d31b26090b5fd38d2fb639aae31202e4f2fc4e37f86da0b9",
  "release/growth-public-live.cjs": "7e93c062cf260b0a93207c626c72c9de4bec8a5766e1d45eec860beb21d76797",
  "tests/growth-release.test.mjs": "e1a88ba68b78e1f4072d515b52338b9d742c2661db80b416b44e2ae61e57fe8f",
  "worker-entry-v6.js": "ba9f0bf21980f3da179ecbe852e3b7f11fbfae0cbc164c5e8461670808ff9dd6",
  ".github/workflows/my-timber-pwa-production-release.yml": "cb98e47663fe1e23df61b7b0e806374ac59a80b8e3d21efca048ee2adfaf536b",
  "release/growth-adopt-deployment.mjs": "420c8d9fa5ebb2c62455b7e94e9547caba4a62ec767ee4d5d12d38b877d3f38e",
  "release/growth-public-baseline.json": "7804cf82404fad8cc9d02dd4cf8f2ff46bd0dac7aca86e08a2b366613bc3754e",
  "docs/growth-review/live-release-checkpoint-20260928.md": "c7a8870b0ec030e3272b02d55e87d59a53913bf4c99c39c74687b1a99bc61601",
  "member-experience/entry.mjs": "ef1d85c96e0d72178dc9b1258074ac50d461cbbed86e353e9df4c50384cd7bcc",
  "member-experience/member-details.mjs": "ffd448c116b544ce46729e65dd3599675837fa27c8bf99f08c7c5527cb5f7702",
  "member-experience/member-email-client.mjs": "fc113fd47073c9a7c49556658711fb3c8ccf17ab2d6189a9e843f39d89c6dedc",
  "member-experience/tests/email-change-capability.test.mjs": "49e9298ab0a09c056d860086023e7cafeb79f1539f8967bbfb430a48d237a8db",
  "my-timber-final-production.mjs": "b225d6db6c65cb4fd4c49274db89c680d314a766699f695cffb33c31c6fd1f3a",
  ".github/workflows/my-timber-final-production.yml": "3521bac3a10a6319cd7f751011b3d7bf10eaa605b60b8fdfa32526ff55df104a"
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
