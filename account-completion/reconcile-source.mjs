// Reconcile already-tested account functionality with the newer released Reta source.
// This is a source-preservation gate; it cannot publish or access production data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const account = '2afcd65015ab8ca7334d8c69a9f4bb3ce4707cd3';
const released = '77e1d0fb673277b77b46c2a924a4dafb0af75404';
const common = '4c014edce24bd9a37645dfbd6bad204ed3270091';
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
const files = (...args) => git('diff','--name-only',...args).split('\n').filter(Boolean);
for (const ref of [account,released]) git('merge-base','--is-ancestor',ref,'HEAD');
const releaseFiles = files(common,released);
const accountFiles = files(common,account);
assert.equal(releaseFiles.filter(p=>accountFiles.includes(p)).length,0,'Release/account paths overlap; manual review required');
const reconciliationFiles = new Set([
  '.github/workflows/account-completion-preview.yml',
  'member-experience/member-details.mjs',
  'member-experience/member-details-routes.mjs',
  'member-experience/member-details-lookups.mjs',
  'member-experience/member-delivery-client.mjs',
  'member-experience/member-delivery-routes.mjs',
  'member-experience/photon-address.mjs',
  'member-experience/photon-address-client.mjs',
  'member-experience/tests/photon-address.test.mjs',
  'member-experience/tests/photon-selection-order.test.mjs',
  'member-experience/tests/manual-address.test.mjs',
  'member-experience/tests/member-details.test.mjs',
  'member-experience/tests/lookup-continuation.test.mjs',
  'account-completion/apply-photon.mjs',
  'account-completion/photon-browser.mjs',
  'account-completion/delivery-browser.mjs',
  'preview/member-details/prepare.mjs',
  'preview/member-details/worker.mjs',
  'preview/member-details/browser-proof.mjs',
  'preview/member-details/reviewer-access-proof.mjs',
  'docs/decisions/2026-09-23-manual-addresses.md',
  'account-completion/reconcile-source.mjs',
  'account-completion/ACCEPTANCE.md',
  'release/member-details-live.mjs',
  'release/member-details-anonymous.mjs',
  'member-experience/tests/release-anonymous.test.mjs',
  'wrangler.jsonc',
  'release/member-details-schema.mjs',
  'member-experience/member-details.sql',
  'member-experience/tests/member-delivery.test.mjs',
  'member-experience/tests/fixtures/released-member-details-323f240.txt',
  'member-experience/tests/schema-cli-json.test.mjs',
  'tests/member-details-release.test.mjs',
  'release/b1-runtime-only.json',
  'scripts/b1-release-scope.mjs'
]);
const releasePinPaths=new Set(['release/b1-runtime-only.json','scripts/b1-release-scope.mjs']);
const releaseFilesPreserved=releaseFiles.filter(path=>!releasePinPaths.has(path));
for (const path of releaseFilesPreserved) assert.equal(git('rev-parse',`HEAD:${path}`),git('rev-parse',`${released}:${path}`),`Released source changed: ${path}`);
for (const path of accountFiles.filter(p=>!reconciliationFiles.has(p))) assert.equal(git('rev-parse',`HEAD:${path}`),git('rev-parse',`${account}:${path}`),`Verified account source changed: ${path}`);
for (const path of files(account,'HEAD')) assert(releaseFiles.includes(path)||reconciliationFiles.has(path),`Unreviewed reconciliation change: ${path}`);
assert.equal(git('rev-parse','HEAD:member-experience/tests/fixtures/released-member-details-323f240.txt'),git('rev-parse',released+':member-experience/member-details-routes.mjs'),'Legacy rollback fixture is not byte-exact released source');
const config=fs.readFileSync('wrangler.jsonc','utf8');
assert.equal(config,execFileSync('git',['show',released+':wrangler.jsonc'],{encoding:'utf8'}),'Unreviewed runtime configuration');
assert(!config.includes('"MEMBER_EMAIL_CHANGE_ENABLED": "true"'),'Real email-change gate must remain closed');
const report = {source:git('rev-parse','HEAD'),accountBaseline:account,releasedBaseline:released,
  releaseFiles,releaseFilesPreserved,reviewedReleasePinPaths:[...releasePinPaths],accountFiles,accountFilesPreserved:accountFiles.filter(p=>!reconciliationFiles.has(p)),reviewedSchemaChange:"Add delivery-preservation trigger for legacy runtime saves",applicationRouteChanges:true,reviewedAddressChange:"Remove address lookup and retain manual home/delivery entry; GP suggestions retained",proposedConfigurationChange:"None: configuration matches released main exactly",productionWrites:0,passed:true};
fs.mkdirSync('account-completion-evidence',{recursive:true});
fs.writeFileSync('account-completion-evidence/source-reconciliation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({source:report.source,releasedFilesPreserved:releaseFilesPreserved.length,accountFilesPreserved:report.accountFilesPreserved.length,passed:true}));
