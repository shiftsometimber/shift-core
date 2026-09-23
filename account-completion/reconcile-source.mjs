// Reconcile already-tested account functionality with the newer released Reta source.
// This is a source-preservation gate; it cannot publish or access production data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const account = '2afcd65015ab8ca7334d8c69a9f4bb3ce4707cd3';
const released = '323f2409c0bd7f719abb05969fe9aeb2a827261b';
const common = '4c014edce24bd9a37645dfbd6bad204ed3270091';
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
const files = (...args) => git('diff','--name-only',...args).split('\n').filter(Boolean);
for (const ref of [account,released]) git('merge-base','--is-ancestor',ref,'HEAD');
const releaseFiles = files(common,released);
const accountFiles = files(common,account);
assert.equal(releaseFiles.filter(p=>accountFiles.includes(p)).length,0,'Release/account paths overlap; manual review required');
const reconciliationFiles = new Set([
  '.github/workflows/account-completion-preview.yml',
  'account-completion/reconcile-source.mjs',
  'account-completion/ACCEPTANCE.md',
  'release/member-details-live.mjs',
  'release/member-details-anonymous.mjs',
  'member-experience/tests/release-anonymous.test.mjs',
  'wrangler.jsonc',
  'release/member-details-schema.mjs',
  'tests/member-details-release.test.mjs',
  'release/b1-runtime-only.json',
  'scripts/b1-release-scope.mjs'
]);
for (const path of releaseFiles) assert.equal(git('rev-parse',`HEAD:${path}`),git('rev-parse',`${released}:${path}`),`Released source changed: ${path}`);
for (const path of accountFiles.filter(p=>!reconciliationFiles.has(p))) assert.equal(git('rev-parse',`HEAD:${path}`),git('rev-parse',`${account}:${path}`),`Verified account source changed: ${path}`);
for (const path of files(account,'HEAD')) assert(releaseFiles.includes(path)||reconciliationFiles.has(path),`Unreviewed reconciliation change: ${path}`);
const providerFlag = '    "MEMBER_ADDRESS_PROVIDER": "photon",\n';
const config=fs.readFileSync('wrangler.jsonc','utf8');
assert.equal(config.split(providerFlag).length,2,'Exactly one proposed Photon flag required');
assert.equal(config.replace(providerFlag,''),execFileSync('git',['show',released+':wrangler.jsonc'],{encoding:'utf8'}),'Unreviewed runtime configuration');
assert(!config.includes('"MEMBER_EMAIL_CHANGE_ENABLED": "true"'),'Real email-change gate must remain closed');
const report = {source:git('rev-parse','HEAD'),accountBaseline:account,releasedBaseline:released,
  releaseFiles,accountFiles,applicationCodeChanges:false,proposedConfigurationChange:"MEMBER_ADDRESS_PROVIDER=photon",productionWrites:0,passed:true};
fs.mkdirSync('account-completion-evidence',{recursive:true});
fs.writeFileSync('account-completion-evidence/source-reconciliation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({source:report.source,releasedFilesPreserved:releaseFiles.length,accountFilesPreserved:accountFiles.length,passed:true}));
