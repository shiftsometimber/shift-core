import {stageSelectedTools,verifyToolsPackage} from './selected-tools-preservation-20261031.mjs';
import {captureIndependentPresentation} from './independent-presentation-preservation.mjs';
import {canonicalRuntime,uploadedVersion,digest} from './canonical-runtime-build.mjs';
import {ensureQueryRedaction} from './query-log-redaction.mjs';
// Record the version returned by this exact CLI invocation. A subsequent
// deployment must never be mistaken for this release's failed runtime.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {latestDeployment} from './runtime-rollback-guard.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');
assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
assert.match(process.env.GITHUB_RUN_ID||'',/^\d+$/);
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4e6});
const before=latestDeployment(JSON.parse(readFileSync('deployment-before.json')));
const active=latestDeployment(JSON.parse(cli('deployments','list','--json')));
assert.equal(active.id,before.id,'Runtime moved since capture; stop stale release');
mkdirSync('b1-runtime-release',{recursive:true});
// Read the zone before building/uploading; this version-only release adds no routes.
execFileSync('python3',['scripts/cloudflare-route-capacity.py','check','--intent','content-only','--report','b1-runtime-release/route-capacity.json'],{stdio:'inherit'});
const independentOptions={accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN};
const independentBefore=await captureIndependentPresentation(independentOptions);
writeFileSync('b1-runtime-release/independent-presentation-before.json',JSON.stringify(independentBefore,null,2));
// Build without publishing; restore the native strings before staging traffic.
cli('deploy','--dry-run','--outdir','b1-runtime-release/staged-runtime');
const built=canonicalRuntime(readFileSync('b1-runtime-release/staged-runtime/worker.js','utf8'));
writeFileSync('b1-runtime-release/staged-runtime/worker.js',built.bundle);
writeFileSync('b1-runtime-release/canonical-build.json',JSON.stringify({...built,bundle:undefined},null,2));
const entry=await stageSelectedTools(built);
const output=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','versions','upload',entry,'--no-bundle','--config','october-package.wrangler.jsonc'],{encoding:'utf8',maxBuffer:4e6});
writeFileSync('b1-runtime-release/runtime-upload.log',output);
const versionId=uploadedVersion(output);
writeFileSync('b1-runtime-release/staged-version.json',JSON.stringify({versionId,source:process.env.GITHUB_SHA,buildSHA256:built.buildSHA256}));
const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/workers/shift-core/versions/'+versionId+'?include=modules',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});
assert(response.ok,'Cannot authenticate uploaded version');const staged=await response.json();assert(staged.success);assert.equal(staged.result.id,versionId);
verifyToolsPackage(staged.result,built.buildSHA256);
assert.equal(latestDeployment(JSON.parse(cli('deployments','list','--json'))).id,before.id,'Runtime moved during staging');
// A durable intent permits reconciliation if the CLI exits after changing traffic.
writeFileSync('b1-runtime-release/promotion-intent.json',JSON.stringify({versionId,previousDeploymentId:before.id,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID}));
let promotionError;
try{writeFileSync('b1-runtime-release/runtime-deploy.log',cli('versions','deploy',versionId+'@100%','--yes'));}catch(error){promotionError=error;}
const list=JSON.parse(cli('deployments','list','--json'));
const owned=list.filter(d=>d.versions?.length===1&&d.versions[0].percentage===100&&d.versions[0].version_id===versionId);
assert.equal(owned.length,1,'Owned deployment cannot be uniquely identified');
const receipt={kind:'owned_runtime_deployment',at:new Date().toISOString(),source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,deploymentId:owned[0].id,versionId,previousDeploymentId:before.id,previousVersionId:before.versions[0].version_id,dataRestored:false,buildSHA256:built.buildSHA256};
writeFileSync('b1-runtime-release/owned-runtime-deployment.json',JSON.stringify(receipt,null,2));
assert.equal(latestDeployment(list).id,receipt.deploymentId,'Another deployment followed this release; stop verification');
console.log(JSON.stringify(receipt));

const logPrivacy=await ensureQueryRedaction({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});
writeFileSync('b1-runtime-release/query-log-redaction.json',JSON.stringify(logPrivacy,null,2));
console.log(JSON.stringify(logPrivacy));
const independentAfter=await captureIndependentPresentation(independentOptions);
assert.deepEqual(independentAfter,independentBefore,'Latest independent presentation must be preserved');
writeFileSync('b1-runtime-release/independent-presentation-preservation.json',JSON.stringify({ok:true,before:independentBefore,after:independentAfter},null,2));
if(promotionError)throw promotionError;
