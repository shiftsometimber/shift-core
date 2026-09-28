import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const GROWTH_PREVIEW='15c4deabe68530f3ce49712638d76453adba3b96';
// Exact owner-reviewed payload and exact integration files. No generic directory exclusion.
const hashes={
  ".github/workflows/cloudflare-production-promote.yml": "32ac650c8e6b747cefb479fe5eb5ee27f413c6ffcec904f92bdd309e35ffd8d9",
  ".github/workflows/growth-member-preview.yml": "35e5b2ef34e158fe438ee426d932463a9d5e280ffe70775812e27cb9084e66ab",
  ".github/workflows/rendered-member-production-acceptance.yml": "932e7f8e375b78a02f32dba1b452e63c62954e879e08ce61f5aaf9d2a974b5bc",
  "docs/growth-review/2026-09-27.md": "3244a00605dfd2b856109b42095787ca979ee4faff3283e85ed51eea290fd2b0",
  "docs/growth-review/local-test-results.txt": "edf614202a255cf31edcbf561671d1d52d9bd7b945f1a425a4ec8da6a7dfdcfa",
  "growth-member-public.mjs": "de67b1c007d2f5af37027c7ca24d8deda991c3eb7c48e448443a64c548a9e941",
  "member-experience/life-back/next-shift.mjs": "67bac6eafdea8f8c9b437b58f99db850c899b8db2ed21df8998fc0cc7f344159",
  "member-experience/public-preservation.mjs": "329b12f1bf31c7338697f4be1ee2ed8a703d02b0549adafc78b5f8043fe3abef",
  "member-experience/staging/pins.json": "fac6eb5268ff9109cd6e4a7c75ce55f006e2c1281bb3056814a41201cac973d9",
  "member-experience/tests/next-shift-loop.test.mjs": "64c5efda834fb03f3362ba4d4d1505c0b6c640944da10c8f633ff25f5f7d4334",
  "preview/growth-member/prepare.mjs": "438d031a42d1253d9775ebf979f46d594d5d2afdb8e1d110632b25ff2c9f500b",
  "preview/growth-member/public-copy.mjs": "ec773f124a631c1b8aec516630609ebf64799af1cbfe82449d956bcc882c6f2b",
  "preview/growth-member/verify.cjs": "28ce476d807a0118f6f7d54d006aba3115b4e15a5f8758f061b6c59313045b46",
  "preview/growth-member/worker.mjs": "e8bd80e58bdd330e8dfcef1d246d6f2fd0099a049fe3247479416fa5f53abbee",
  "release/growth-member-live.mjs": "1d53c8dde247b9ab90f85bd9974c55f05d7d4aed0db6929f73271689c6e0bba6",
  "release/growth-preflight.mjs": "733b6553ff4db387a1476f4a5e604e8bce0700bff447d3a8c7ec14b72f8b310c",
  "release/growth-preservation.mjs": "abe4c4af1bb1f835977fa3f9620b289330f558778a27c55ba5e95fdfd5bd6476",
  "release/growth-public-live.cjs": "2de2f16eda21d984a01a2507b5fdc73194528589aa72a0e199f19c9fee99beec",
  "tests/growth-release.test.mjs": "52e72797f5753d792edebc2dc9039caae30b8b8fc6ca64632892f4fb7f3ea19e",
  "worker-entry-v6.js": "ba9f0bf21980f3da179ecbe852e3b7f11fbfae0cbc164c5e8461670808ff9dd6",
  ".github/workflows/my-timber-pwa-production-release.yml": "cb98e47663fe1e23df61b7b0e806374ac59a80b8e3d21efca048ee2adfaf536b",
  "release/growth-adopt-deployment.mjs": "a50e2fcb1f6ddfc54d71f876671198ee26106ad72fe3f025dd276ff5ee295e6e",
  "release/growth-public-baseline.json": "7804cf82404fad8cc9d02dd4cf8f2ff46bd0dac7aca86e08a2b366613bc3754e",
  "docs/growth-review/live-release-checkpoint-20260928.md": "c7a8870b0ec030e3272b02d55e87d59a53913bf4c99c39c74687b1a99bc61601",
  "member-experience/entry.mjs": "ef1d85c96e0d72178dc9b1258074ac50d461cbbed86e353e9df4c50384cd7bcc",
  "member-experience/member-details.mjs": "ffd448c116b544ce46729e65dd3599675837fa27c8bf99f08c7c5527cb5f7702",
  "member-experience/member-email-client.mjs": "fc113fd47073c9a7c49556658711fb3c8ccf17ab2d6189a9e843f39d89c6dedc",
  "member-experience/tests/email-change-capability.test.mjs": "49e9298ab0a09c056d860086023e7cafeb79f1539f8967bbfb430a48d237a8db",
  "my-timber-final-production.mjs": "b225d6db6c65cb4fd4c49274db89c680d314a766699f695cffb33c31c6fd1f3a",
  ".github/workflows/my-timber-final-production.yml": "3521bac3a10a6319cd7f751011b3d7bf10eaa605b60b8fdfa32526ff55df104a",
  "docs/growth-review/continuity-release-20260928.md": "47c3cea1237c2c4d5b7246dd6b146114cca8325ec74d487cb9a3316589da4a07",
  "member-experience/tests/growth-continuity-preview.test.mjs": "c09e5551ab1a57a0d22234e2663a0b6960b1dc3cc00b023c11f9a72969f2473f",
  "preview/growth-member/continuity-journey.mjs": "755359a468a3f76f5593963ccea8ba4045389ae5e4087644dbd3e3a77a311416",
  "scripts/verify-public-continuity-live.mjs": "f1ef660b0f0bbf6fbffeb6bfb310b7cde277aed6f7769b9aa4ee4eb00153cc2c",
  "release/ai-response-proof.mjs": "1bb95227a37baab536194092f4c8190aaea082b1c76de4136d2d822eb24d5c47",
  "release/shift-ai-live.mjs": "af94714ece6ef04b681e7553cdb976b080988d5c4353900e11ae0dad97408142",
  "tests/shift-ai-edge-proof.test.mjs": "025227f5e4a57d13c1f2806cf3a9122de065bc76a3a51c62dd738d5c0dc67a1a"
};
export const GROWTH_PINNED_PATHS=Object.keys(hashes);
export const GROWTH_PATHS=new Set([...GROWTH_PINNED_PATHS,'release/growth-scope.mjs']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function validateGrowthEntry(before,after){
 const expected="import {withGrowthPublicCopy} from './growth-member-public.mjs';\n"+before.replace("return withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final));","return withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED==='true'?await withPwa(request,final):final)));");
 assert.equal(after,expected,'Entry changed outside the exact growth response adapter');
}
export function validateGrowthSource(){
 git('merge-base','--is-ancestor','33c1b98cbb39dfd6154af3c673d9ee784371260e','HEAD');
 for(const path of ['member-experience/life-back/next-shift.mjs','preview/growth-member/public-copy.mjs','preview/growth-member/continuity-journey.mjs'])assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',GROWTH_PREVIEW+':'+path),'Reviewed growth payload changed: '+path);
 for(const [path,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(execFileSync('git',['show','HEAD:'+path])).digest('hex'),hash,'Growth release integration drift: '+path);
}
