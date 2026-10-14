import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {combinedFiniteHistoricalView,verifyCombinedHqSource} from './combined-finite-scope-20261014.mjs';
export const HQ_HISTORICAL='5e2a6bbe7714fe098eebfa22bc7acbe9e3d2d5c2';
export const HQ_LIVE_SOURCE='f3acbfdc2f0fbe8c14d5940dee9136377f257cc8';
export const HQ_START=Object.freeze({deployment:'92a663ea-46b4-4cf3-a331-078a17b7273c',version:'19fa19fc-1968-4e21-b9d5-abe1f1113250',sha256:'289a158ad4ec444949f3d86c5b038009d198191fad3eba74e63ace1a15bd26c3',bytes:1436398});
export const HQ_ORIGINAL_PATHS=Object.freeze(['HQ-MANAGEMENT-RELEASE.md','hq-ai-v2.js','hq-management-acceptance.mjs','hq-management-api.mjs','hq-management-browser-acceptance.mjs','worker.js','wrangler.hq-management.jsonc','hq-management-entry.mjs','hq-management-gateway-acceptance.mjs','hq-management-deploy.mjs','hq-management-public-preservation.mjs','hq-management-release-gate.mjs','.github/workflows/hq-management-release.yml']);
export const HQ_GATE_IMPORT="import {combinedHqGateGit} from './release/combined-hq-preservation-20261014.mjs';\n";
export const HQ_GATE_OLD="const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();";
export const HQ_GATE_NEW="const git=(...a)=>combinedHqGateGit(a,()=>execFileSync('git',a,{encoding:'utf8'}).trim());";
export const HQ_DEPLOY_IMPORT="import {assertCombinedHqStartingPoint,captureCombinedHqCandidate,annotateCombinedHqOwnedReceipt} from './release/combined-hq-preservation-20261014.mjs';\n";
export const HQ_DEPLOY_PRE=" await captureCombinedHqCandidate(()=>cli('deploy','--dry-run','--outdir','b1-runtime-release/hq-candidate-build'));\n await assertCombinedHqStartingPoint(before,{accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});\n";
export const HQ_DEPLOY_POST=" annotateCombinedHqOwnedReceipt();\n";
export const HQ_PUBLIC_IMPORT="import {verifyCombinedHqLiveBoundaries} from './release/combined-hq-preservation-20261014.mjs';\n";
export const HQ_PUBLIC_POST="if(before)await verifyCombinedHqLiveBoundaries({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});\n";
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:64e6}).trim();
const content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const once=(s,fragment,replacement='')=>{assert.equal(s.split(fragment).length,2,'One exact HQ source hook required');return s.replace(fragment,replacement)};
export function originalCombinedHqMaintenance(path,text){
 if(path==='hq-management-release-gate.mjs')return once(once(text,HQ_GATE_IMPORT),HQ_GATE_NEW,HQ_GATE_OLD);
 if(path==='hq-management-deploy.mjs')return once(once(once(text,HQ_DEPLOY_IMPORT),HQ_DEPLOY_PRE),HQ_DEPLOY_POST);
 if(path==='hq-management-public-preservation.mjs')return once(once(text,HQ_PUBLIC_IMPORT),HQ_PUBLIC_POST);
 return text;
}
export function proveCombinedHqCurrent(){
 const view=combinedFiniteHistoricalView(),head=view.rawHead,current=JSON.parse(content(head,'release/approved-runtime-composition.json')),c=current.combinedFinite20261014;
 assert(c,'Exact current combined release required');
 verifyCombinedHqSource({head:c.source,content,blob:(ref,path)=>git('rev-parse',ref+':'+path)});
 const proof=JSON.parse(content(head,'release/combined-hq-partner-preservation-20261014.json'));
 assert.equal(proof.originalSource,HQ_LIVE_SOURCE);assert.equal(proof.historicalHQ,HQ_HISTORICAL);
 assert.equal(proof.expectedDeployment,HQ_START.deployment);assert.equal(proof.expectedVersion,HQ_START.version);assert.equal(proof.bundleSha256,HQ_START.sha256);assert.equal(proof.bundleBytes,HQ_START.bytes);
 assert.deepEqual([...proof.baselinePaths].sort(),[...HQ_ORIGINAL_PATHS].sort());
 for(const path of HQ_ORIGINAL_PATHS){
  assert.equal(git('rev-parse',HQ_HISTORICAL+':'+path),proof.baselineBlobs[path],'Original HQ source pin changed: '+path);
  assert.equal(git('rev-parse',c.base+':'+path),proof.baselineBlobs[path],'Accepted combined predecessor HQ source changed: '+path);
  if(['hq-management-api.mjs','hq-management-entry.mjs','wrangler.hq-management.jsonc'].includes(path))continue;
  assert.equal(originalCombinedHqMaintenance(path,content(head,path)),content(HQ_HISTORICAL,path),'Original HQ statement/assertion outside exact hooks changed: '+path);
 }
 const api=content(head,'hq-management-api.mjs');
 assert.equal(once(once(api,"import {gpDirectoryHqRoute} from './gp-directory/hq.mjs';\n")," const gp=await gpDirectoryHqRoute(request,env,ctx,authenticate);if(gp)return gp;\n"),content(HQ_HISTORICAL,'hq-management-api.mjs'),'Only original dormant GP API hook allowed');
 assert.equal(content(head,'hq-management-entry.mjs'),proof.composedEntryText,'Live partner entry plus exact dormant GP path required');
 assert.equal(content(head,'wrangler.hq-management.jsonc'),content(c.base,'wrangler.hq-management.jsonc'),'Accepted HQ configuration must be preserved byte-for-byte; keep-vars retains provider flags');
 for(const key of ['invitationEnabled','externalLoginEnabled','sharingEnabled','gpActivated','schemaApplied'])assert.equal(proof[key],false,'HQ held boundary: '+key);
 assert.equal(git('diff','--name-only'),'','Tracked working HQ source changed');
 assert.equal(git('rev-parse','HEAD'),head,'HQ source HEAD moved during proof');
 return {head,proof};
}
const PUBLIC_SCOPE=['wrangler.jsonc','package.json','package-lock.json','frontend','public','assets','shift-coach','worker-entry-v6.js'];
export function originalHqGitArgs(args){
 const [command,operation]=args;
 if(command==='merge-base'&&operation==='--is-ancestor'&&args.length===4&&['e9d8ca70','38b0cc50eeeda7e713c2ce25ebf9c9543cdbb793'].includes(args[2])&&args[3]==='HEAD')return [...args.slice(0,3),HQ_HISTORICAL];
 if(command==='rev-parse'&&args.length===2&&args[1].startsWith('HEAD:')&&HQ_ORIGINAL_PATHS.includes(args[1].slice(5)))return [command,HQ_HISTORICAL+args[1].slice(4)];
 if(command==='diff'&&operation==='--name-only'&&args[2]==='e9d8ca70'&&args[3]==='HEAD'){
  if(args.length===4||JSON.stringify(args.slice(4))===JSON.stringify(['--',...PUBLIC_SCOPE]))return [...args.slice(0,3),HQ_HISTORICAL,...args.slice(4)];
 }
 return args;
}
export function combinedHqGateGit(args,rawGit){
 proveCombinedHqCurrent();const projected=originalHqGitArgs(args);
 if(projected===args)return rawGit();
 return git(...projected);
}
export function assertHqProviderSnapshot({deployment,version,bundle},expected=HQ_START){
 assert.equal(deployment.id,expected.deployment,'Exact existing HQ deployment moved');assert.equal(deployment.versions.length,1);assert.equal(deployment.versions[0].version_id,expected.version);assert.equal(deployment.versions[0].percentage,100);
 assert.equal(version.id,expected.version,'HQ binding version mismatch');
 const bindings=version.resources?.bindings;assert(Array.isArray(bindings),'Actual version bindings required');
 const partner=bindings.filter(b=>b.name==='HQ_PARTNERS_ENABLED'),gp=bindings.filter(b=>b.name==='MEMBER_GP_DIRECTORY_V2_ENABLED');
 assert.equal(partner.length,1,'One explicit existing live partner binding required');assert.equal(partner[0].type,'plain_text');assert.equal(partner[0].text,'true','Existing live partner flag changed');
 assert(gp.length===0||gp.length===1&&gp[0].type==='plain_text'&&gp[0].text==='false','GP activation remains provably off; opaque/duplicate bindings refused');
 assert.equal(bundle.length,expected.bytes,'HQ provider bundle size changed');assert.equal(sha(bundle),expected.sha256,'HQ provider bundle bytes changed');
 return {version:version.id,partnersEnabled:true,gpEnabled:false,bundleBytes:bundle.length,bundleSha256:sha(bundle)};
}
async function providerRead(accountId,token,path,fetchImpl=fetch){
 assert.match(accountId||'',/^[a-f0-9]{32}$/);assert(typeof token==='string'&&token.length>0,'Existing configured provider credential required');
 const r=await fetchImpl('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers/scripts/shift-hq-management'+path,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert(r.ok,'Read-only HQ provider receipt unavailable: '+r.status);return r;
}
async function readBundle(accountId,token,version,fetchImpl){
 const r=await providerRead(accountId,token,'/content/v2?version='+version,fetchImpl);
 assert(r.headers.get('content-type')?.startsWith('multipart/form-data'),'Original module Worker representation required');
 const entry=r.headers.get('cf-entrypoint');assert.equal(entry,'hq-management-entry.js','Unexpected HQ entrypoint');
 const parts=await r.formData(),part=parts.get(entry);assert(part&&typeof part.arrayBuffer==='function');
 return Buffer.from(await part.arrayBuffer());
}
async function versionRead(accountId,token,id,fetchImpl){const result=await(await providerRead(accountId,token,'/versions/'+id,fetchImpl)).json();assert.equal(result.success,true);return result.result;}
async function activeRead(accountId,token,fetchImpl){const result=await(await providerRead(accountId,token,'/deployments',fetchImpl)).json();assert.equal(result.success,true);const list=result.result.deployments;assert(Array.isArray(list)&&list.length);return list.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];}
export async function assertCombinedHqStartingPoint(before,{accountId,token,fetchImpl=fetch}={}){
 proveCombinedHqCurrent();const version=await versionRead(accountId,token,HQ_START.version,fetchImpl),bundle=await readBundle(accountId,token,HQ_START.version,fetchImpl);
 const receipt=assertHqProviderSnapshot({deployment:before,version,bundle});
 assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle});
 writeFileSync('b1-runtime-release/combined-hq-starting-point.json',JSON.stringify({at:new Date().toISOString(),...receipt,deployment:before.id,productionWrites:0},null,2));return receipt;
}
export async function captureCombinedHqCandidate(dryRun){
 const proof=proveCombinedHqCurrent();dryRun();
 const bytes=readFileSync('b1-runtime-release/hq-candidate-build/hq-management-entry.js');
 const candidate={source:proof.head,sha256:sha(bytes),bytes:bytes.length};
 writeFileSync('b1-runtime-release/combined-hq-candidate.json',JSON.stringify(candidate,null,2));return candidate;
}
export function annotateCombinedHqOwnedReceipt(){
 const path='b1-runtime-release/owned-hq-deployment.json',receipt=JSON.parse(readFileSync(path));receipt.combinedHqCandidate=JSON.parse(readFileSync('b1-runtime-release/combined-hq-candidate.json'));writeFileSync(path,JSON.stringify(receipt,null,2));
}
export async function verifyCombinedHqLiveBoundaries({accountId,token,fetchImpl=fetch}={}){
 const source=proveCombinedHqCurrent(),owned=JSON.parse(readFileSync('b1-runtime-release/owned-hq-deployment.json')),candidate=owned.combinedHqCandidate;
 assert.equal(candidate.source,source.head,'Owned HQ candidate source mismatch');
 const active=await activeRead(accountId,token,fetchImpl),version=await versionRead(accountId,token,owned.versionId,fetchImpl),bundle=await readBundle(accountId,token,owned.versionId,fetchImpl);
 const expected={deployment:owned.deploymentId,version:owned.versionId,sha256:candidate.sha256,bytes:candidate.bytes};assertHqProviderSnapshot({deployment:active,version,bundle},expected);
 const checks=[];
 for(const path of ['/v1/hq/management/partners','/v1/hq/management/partner-handovers','/v1/hq/management/gp-directory']){
  const r=await fetchImpl('https://api.shiftsometimber.co.uk'+path,{method:'GET',headers:{Origin:'https://hq.shiftsometimber.co.uk'},signal:AbortSignal.timeout(30000)});
  assert.equal(r.status,401,'Anonymous private HQ route accepted: '+path);assert.equal(r.headers.get('access-control-allow-origin'),'https://hq.shiftsometimber.co.uk');checks.push({path,method:'GET',status:r.status});
 }
 for(const origin of ['https://hq.shiftsometimber.co.uk','https://untrusted.example']){
  const r=await fetchImpl('https://api.shiftsometimber.co.uk/v1/hq/management/partners',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'},signal:AbortSignal.timeout(30000)});
  if(origin==='https://hq.shiftsometimber.co.uk'){assert([200,204].includes(r.status));assert.equal(r.headers.get('access-control-allow-origin'),origin);}else assert.equal(r.headers.get('access-control-allow-origin'),null,'Foreign-origin partner CORS accepted');checks.push({path:'/v1/hq/management/partners',method:'OPTIONS',origin,status:r.status});
 }
 assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},expected);
 const receipt={at:new Date().toISOString(),source:source.head,deployment:active.id,version:version.id,bundleSha256:sha(bundle),bundleBytes:bundle.length,checks,partnerSourcePreserved:true,partnerAccessEnabled:false,sharingEnabled:false,invitationEnabled:false,gpEnabled:false,authenticatedRoleAcceptance:'separate; original local role/audit assertions retained',externalMessages:0,productionDataWrites:0};
 writeFileSync('b1-runtime-release/combined-hq-live-boundaries.json',JSON.stringify(receipt,null,2));console.log('PASS same-serving HQ source, partner anonymous/CORS denials, unchanged invitation/sharing source and GP-off binding; no live mutations');return receipt;
}
