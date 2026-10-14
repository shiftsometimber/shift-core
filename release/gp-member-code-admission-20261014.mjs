import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {isAbsolute,resolve} from 'node:path';
import {GP_CI_BOOTSTRAP_PATHS,GP_CI_BOOTSTRAP_WORKFLOWS,verifyGpCiWorkflowText} from './gp-ci-source-prerequisites-20261014.mjs';

export const GP_MEMBER_CODE_BASE='f82bdb66a54d4b2778f4df737648b127cc1f748d';
export const GP_MEMBER_CODE_SOURCE='3655de34b128950553cda7f6a7b612adab338b5c';
export const GP_MEMBER_CODE_ORIGINAL_BASE='685ede249cd20c4801d0a25227fed16d46860618';
export const GP_MEMBER_CODE_TREE='d895dc3ed7b86a468f27a171f5beb3824d09ef33';
export const GP_MEMBER_SAVED_SOURCE='0ae606fe5fd254cf717c3a853d7829801aaa8934';
export const GP_MEMBER_SAVED_TREE='b132bc8866b64c7e131cbcc5a1d7c9d5078e1462';
export const GP_MEMBER_SAVED_BLOBS=Object.freeze({
 'gp-directory/client.mjs':'5b73f91e9eec8fd6e33cb50cd5f0dcf666b043cc',
 'gp-directory/saved-profile-browser.mjs':'7fd083f08c3bbb7a20cabc240f7b95230609d0e6',
 'gp-directory/saved-profile-browser-receipt.json':'273150784c0892d673926bac41201b609ec7d1f3',
 'member-experience/gp-form.mjs':'0c029aa1f01be0ea9e1d2b7fe71515f73cba7e88'
});
export const GP_MEMBER_CODE_BLOBS=Object.freeze({
 'gp-directory/hq-member-gp-browser.mjs':'c45cac4aeabce650566e94565a90158fc5629033',
 'gp-directory/hq-member-gp-client.js':'5e2b253fb0bb31fb598e727b937c8f86ff6430fa',
 'gp-directory/hq-member-gp-preparation-receipt.json':'f19f7c02c4046a0e61c1cb1c9fec109b347c0a8c',
 'gp-directory/hq-member-gp.mjs':'98bace1c20c6fc703fc6dd6edb33e419ffa960ba',
 'gp-directory/hq-member-gp.test.mjs':'f4ed994b9873a89a90d8eb4c96d6830d76506902',
 'hq-management-api.mjs':'04ce31bea920bca6017f2e808e103997c5a674c7',
 'hq-management-entry.mjs':'0e442f6343dcb576c48e108d6ddbdd2dc12c88ad',
 ...GP_MEMBER_SAVED_BLOBS
});
export const GP_MEMBER_SOURCE_AUTHORITIES=Object.freeze({
 A021:{source:GP_MEMBER_CODE_SOURCE,scope:'Seven original member GP editing backend/client/test/evidence/routing paths.'},
 A011:{source:GP_MEMBER_SAVED_SOURCE,scope:'Four original saved-profile code/evidence paths only; both configuration paths excluded.'}
});
export const GP_MEMBER_FRONTEND_BASE='d2df57b400bdb0072d10c1ef9c2cb0e938ef5f03';
export const GP_MEMBER_FRONTEND_SOURCE='3120bb939d7f08da7de9062989cfe1f13b92d5be';
export const GP_MEMBER_FRONTEND_TREE='7343e9e0e3e7cfa61deafe0dcfc14ba99024a7cd';
export const GP_MEMBER_FRONTEND_BLOBS=Object.freeze({
 'gp-directory.js':'3e5d44c3662c20f66ca16c6b33f39f4069da46f5',
 'hq.js':'5e549b24624f2fd08ffc9bf56874ebe60a360bfd',
 'index.html':'6770379d2d76bda508718f33217cbfdb8b05e8d9'
});
export const GP_MEMBER_FRONTEND_ASSET_PATH='.assetsignore';
export const GP_MEMBER_FRONTEND_ASSET_BASE_BLOB='44efd1714afcf40550861bfddef14ee3e9500b96';
export const GP_MEMBER_FRONTEND_ASSET_BLOB='0f867dbc14dbd0c803abd7464363cd5a72a489a3';
export const GP_MEMBER_FRONTEND_ASSET_SUFFIX='!gp-directory.js\n';
export const GP_MEMBER_CODE_BUNDLE_BLOBS=Object.freeze({
 'release/source-objects/core-original.bundle':'3264d76679e6087da4896d60bcb80a0429db12e2',
 'release/source-objects/core-saved-profile.bundle':'a1c3e6b1aed1460220a7c6e42d7edd54893c51ce',
 'release/source-objects/hq-original.bundle':'c9e6ed6198b197aef1e72be43d10f68d03edeca4',
 'release/source-objects/hq-static-packaging.bundle':'c4e9019ba501aa64b7fcc700a5dcad3716706c22'
});
export const GP_MEMBER_CODE_MAINTENANCE=Object.freeze([
 'release/gp-member-code-admission-20261014.mjs',
 'tests/gp-member-code-admission-20261014.test.mjs',
 'release/prepare-gp-source-objects-20261014.mjs',
 'tests/prepare-gp-source-objects-20261014.test.mjs',
 ...Object.keys(GP_MEMBER_CODE_BUNDLE_BLOBS),
 'release/gp-ci-source-prerequisites-20261014.mjs',
 'tests/gp-ci-source-prerequisites-20261014.test.mjs',
 ...GP_CI_BOOTSTRAP_PATHS
]);
export const GP_MEMBER_CODE_RECORD_PATH='release/gp-member-code-admission-20261014.json';
export const GP_MEMBER_CODE_AUTHORITY=Object.freeze({
 owner:'Matt',instruction:'Deploy A021 member and HQ code before enabling A011 GP lookup flags.',
 recordedLocal:'14 October 2026 21:53 BST',integrationIssue:1065,
 flagsEnabled:false,emailAuthority:false,notificationSent:false,
 clinicalRegistrationVerified:false,partnerControlsChanged:false,
 broaderProductionAuthority:false,genericAdoptionAllowed:false
});
const sorted=v=>[...v].sort(),sha=v=>assert.match(v,/^[a-f0-9]{40}$/);
const raw=(cwd,args)=>{
 const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('GIT_'))delete env[k];
 return execFileSync('/usr/bin/git',['--no-replace-objects',...args],{cwd,env,encoding:'utf8',maxBuffer:64e6});
};
export function gpMemberCodeChangedPaths(repositoryPath,a,b){
 sha(a);sha(b);
 return raw(repositoryPath,['diff','--no-renames','--name-only',a,b]).trim().split('\n').filter(Boolean);
}
export function gpMemberCodeCleanSource(repositoryPath){
 const git=args=>raw(repositoryPath,args);
 const flags=git(['ls-files','-v','-z']).split('\0').filter(Boolean);
 assert(!flags.some(x=>x[0]==='S'||/[a-z]/.test(x[0])),'Assume-unchanged and skip-worktree index flags are forbidden');
 assert.equal(git(['diff','--no-renames','--name-only','HEAD','--']).trim(),'','Tracked GP code changed');
 assert.equal(git(['diff','--no-renames','--cached','--name-only','--']).trim(),'','Staged GP code changed');
}
function native(cwd){
 const git=args=>raw(cwd,args),head=git(['rev-parse','HEAD']).trim();
 const clean=()=>gpMemberCodeCleanSource(cwd);
 assert.equal(git(['for-each-ref','refs/replace','--format=%(refname)']).trim(),'','Replacement objects are forbidden');
 const graft=git(['rev-parse','--git-path','info/grafts']).trim();
 assert.equal(existsSync(isAbsolute(graft)?graft:resolve(cwd,graft)),false,'Graft metadata is forbidden');
 return {head,headNow:()=>git(['rev-parse','HEAD']).trim(),clean,
  blob:(r,p)=>git(['rev-parse',r+':'+p]).trim(),
  mode:(r,p)=>git(['ls-tree',r,'--',p]).trim().split(/\s+/)[0],
  tree:r=>git(['rev-parse',r+'^{tree}']).trim(),
  content:(r,p)=>git(['show',r+':'+p]),
  diff:(a,b)=>gpMemberCodeChangedPaths(cwd,a,b),
  ancestor:(a,b)=>git(['merge-base','--is-ancestor',a,b])};
}
// Deterministic fact checker. The runnable admission below obtains its own native
// facts and does not accept a caller's reader, diff, ancestry or source substitute.
export function verifyGpMemberCodeFacts(c,f){
 try{
  f.clean();sha(f.head);sha(c.payloadSource);sha(c.maintenanceSource);
  assert.deepEqual(sorted(Object.keys(c)),sorted(['proof','base','originalSource','originalTree','savedProfileSource','savedProfileTree','sourceAuthorities','payloadSource','maintenanceSource','paths','maintenancePaths','authority']),'Literal GP code registration fields required');
  assert.equal(c.proof,'EXACT_A021_GP_MEMBER_CODE_20261014');
  assert.equal(c.base,GP_MEMBER_CODE_BASE);assert.deepEqual(c.authority,GP_MEMBER_CODE_AUTHORITY);
  assert.equal(c.originalSource,GP_MEMBER_CODE_SOURCE);assert.equal(c.originalTree,GP_MEMBER_CODE_TREE);
  assert.equal(c.savedProfileSource,GP_MEMBER_SAVED_SOURCE);assert.equal(c.savedProfileTree,GP_MEMBER_SAVED_TREE);
  assert.deepEqual(c.sourceAuthorities,GP_MEMBER_SOURCE_AUTHORITIES,'A021 and A011 source authority must remain distinct');
  assert.deepEqual(c.paths,sorted(Object.keys(GP_MEMBER_CODE_BLOBS)));
  assert.deepEqual(c.maintenancePaths,GP_MEMBER_CODE_MAINTENANCE);
  assert.equal(f.tree(c.originalSource),GP_MEMBER_CODE_TREE);
  assert.equal(f.tree(c.savedProfileSource),GP_MEMBER_SAVED_TREE);
  for(const p of c.paths){
   const packet=Object.hasOwn(GP_MEMBER_SAVED_BLOBS,p)?c.savedProfileSource:c.originalSource;
   assert.equal(f.blob(packet,p),GP_MEMBER_CODE_BLOBS[p],'Original GP source object changed: '+p);
   assert.equal(f.blob(c.payloadSource,p),GP_MEMBER_CODE_BLOBS[p],'GP payload must be exact original bytes: '+p);
   assert.equal(f.blob(f.head,p),GP_MEMBER_CODE_BLOBS[p],'Current GP payload drift: '+p);
   for(const r of [packet,c.payloadSource,f.head])assert.equal(f.mode(r,p),'100644','Exact original GP file mode required: '+p);
  }
  for(const[a,b,paths]of [[c.base,c.payloadSource,c.paths],[c.payloadSource,c.maintenanceSource,c.maintenancePaths],[c.maintenanceSource,f.head,[GP_MEMBER_CODE_RECORD_PATH]]]){
   assert.notEqual(f.ancestor(a,b),false,'Actual source ancestry required');assert.deepEqual(sorted(f.diff(a,b)),sorted(paths),'Unapproved GP source boundary');
  }
  assert.deepEqual(sorted(f.diff(c.base,f.head)),sorted([...c.paths,...c.maintenancePaths,GP_MEMBER_CODE_RECORD_PATH]),'Every unrelated path must remain exact');
  for(const p of c.maintenancePaths)assert.equal(f.blob(f.head,p),f.blob(c.maintenanceSource,p),'GP maintenance source drift: '+p);
  for(const[p,b]of Object.entries(GP_MEMBER_CODE_BUNDLE_BLOBS))for(const r of[c.maintenanceSource,f.head]){
   assert.equal(f.blob(r,p),b,'Exact original GP source bundle required: '+p);
   assert.equal(f.mode(r,p),'100644','Exact GP source bundle file mode required: '+p);
  }
  assert.deepEqual(JSON.parse(f.content(f.head,GP_MEMBER_CODE_RECORD_PATH)),c,'Exact GP code ledger required');
  for(const p of ['wrangler.jsonc','wrangler.hq-management.jsonc','release/approved-runtime-composition.json','release/approved-runtime-composition.mjs','release/combined-finite-scope-20261014.mjs'])
   assert.equal(f.blob(f.head,p),f.blob(c.base,p),'Existing release/partner/config boundary changed: '+p);
  for(const p of GP_CI_BOOTSTRAP_PATHS){
   assert.equal(f.blob(c.base,p),GP_CI_BOOTSTRAP_WORKFLOWS[p].blob,'Exact accepted-week CI workflow baseline required: '+p);
   for(const r of[c.base,f.head])assert.equal(f.mode(r,p),'100644','Exact GP CI workflow file mode required: '+p);
   verifyGpCiWorkflowText(p,f.content(f.head,p),f.content(c.base,p));
  }
  for(const p of ['wrangler.jsonc','wrangler.hq-management.jsonc']){
   const text=f.content(f.head,p);assert(!/"MEMBER_GP_DIRECTORY_V2_ENABLED"\s*:\s*"true"/.test(text),'GP lookup flag must remain OFF');
  }
  return c;
 }finally{f.clean();assert.equal(f.headNow(),f.head,'Source HEAD changed during GP admission');}
}
export function verifyGpMemberFrontendFacts(f){
 try{
  f.clean();sha(f.head);assert.equal(f.tree(GP_MEMBER_FRONTEND_SOURCE),GP_MEMBER_FRONTEND_TREE);
  assert.notEqual(f.ancestor(GP_MEMBER_FRONTEND_BASE,f.head),false,'Actual HQ ancestry required');
  const paths=sorted([...Object.keys(GP_MEMBER_FRONTEND_BLOBS),GP_MEMBER_FRONTEND_ASSET_PATH]);
  assert.deepEqual(sorted(f.diff(GP_MEMBER_FRONTEND_BASE,f.head)),paths,'Only exact four HQ GP code and asset paths are authorised');
  for(const[p,b]of Object.entries(GP_MEMBER_FRONTEND_BLOBS)){
   assert.equal(f.blob(GP_MEMBER_FRONTEND_SOURCE,p),b,'Original HQ source drift: '+p);
   assert.equal(f.blob(f.head,p),b,'Actual HQ GP source drift: '+p);
   for(const r of [GP_MEMBER_FRONTEND_SOURCE,f.head])assert.equal(f.mode(r,p),'100644','Exact original HQ GP file mode required: '+p);
  }
  for(const r of [GP_MEMBER_FRONTEND_BASE,GP_MEMBER_FRONTEND_SOURCE]){
   assert.equal(f.blob(r,GP_MEMBER_FRONTEND_ASSET_PATH),GP_MEMBER_FRONTEND_ASSET_BASE_BLOB,'Original HQ asset allowlist drift');
   assert.equal(f.mode(r,GP_MEMBER_FRONTEND_ASSET_PATH),'100644','Exact original HQ asset allowlist mode required');
  }
  assert.equal(f.blob(f.head,GP_MEMBER_FRONTEND_ASSET_PATH),GP_MEMBER_FRONTEND_ASSET_BLOB,'Actual HQ GP asset allowlist drift');
  assert.equal(f.mode(f.head,GP_MEMBER_FRONTEND_ASSET_PATH),'100644','Exact HQ GP asset allowlist mode required');
  const before=f.content(GP_MEMBER_FRONTEND_BASE,GP_MEMBER_FRONTEND_ASSET_PATH),after=f.content(f.head,GP_MEMBER_FRONTEND_ASSET_PATH);
  assert.equal(after,before+GP_MEMBER_FRONTEND_ASSET_SUFFIX,'Only the exact GP script asset allowlist suffix is authorised');
  return {head:f.head,source:GP_MEMBER_FRONTEND_SOURCE,tree:GP_MEMBER_FRONTEND_TREE,paths,assetAllowlist:{path:GP_MEMBER_FRONTEND_ASSET_PATH,baseBlob:GP_MEMBER_FRONTEND_ASSET_BASE_BLOB,blob:GP_MEMBER_FRONTEND_ASSET_BLOB},flagsChanged:false};
 }finally{f.clean();assert.equal(f.headNow(),f.head,'HQ source HEAD changed during GP admission');}
}
export function verifyGpMemberCodeAdmission(repositoryPath=process.cwd()){
 const f=native(repositoryPath),c=JSON.parse(f.content(f.head,GP_MEMBER_CODE_RECORD_PATH));
 return verifyGpMemberCodeFacts(c,f);
}
export function verifyGpMemberFrontendAdmission(repositoryPath){assert.equal(typeof repositoryPath,'string');return verifyGpMemberFrontendFacts(native(repositoryPath));}
