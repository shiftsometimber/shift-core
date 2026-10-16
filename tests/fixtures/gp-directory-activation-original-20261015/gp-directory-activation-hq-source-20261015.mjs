import assert from 'node:assert/strict';
import {gpActivationGitBlob} from './gp-directory-activation-contract-20261015.mjs';
const once=(s,b,a)=>{assert.equal(s.split(b).length,2,'One exact activation HQ source hook required: '+b.slice(0,100));return s.replace(b,a);};
const oldImport="from './release/gp-hq-preservation-successor-20261015.mjs';\n",newImport="from './release/gp-directory-activation-hq-20261015.mjs';\n";
const adapterImport="import {assertActivatedGpHqProviderSnapshot,assertGpHqUnaffectedBindings} from './gp-directory-activation-provider-20261015.mjs';\n";
export const GP_ACTIVATION_HQ_CALLERS=Object.freeze(['hq-management-release-gate.mjs','hq-management-deploy.mjs','hq-management-public-preservation.mjs']);
export function gpActivationHqPredecessor(receipt){assert.match(receipt.source||'',/^[a-f0-9]{40}$/);const h=receipt.hq;assert.equal(h.source,receipt.source);assert.equal(h.gpEnabled,false);assert.equal(h.partnersEnabled,true);assert.equal(h.percentage,100);for(const p of ['deploymentId','versionId'])assert.match(h[p]||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);assert.match(h.bundleSha256||'',/^[a-f0-9]{64}$/);assert.match(h.otherBindingsSha256||'',/^[a-f0-9]{64}$/);assert(Number.isSafeInteger(h.bundleBytes)&&h.bundleBytes>0);assert(Number.isSafeInteger(h.run)&&h.run>0);return{deployment:h.deploymentId,version:h.versionId,sha256:h.bundleSha256,bytes:h.bundleBytes,source:receipt.source,sourceProofRun:h.run,otherBindingsSha256:h.otherBindingsSha256};}
function replacements(){return[
 ["versionRead(accountId,token,HQ_GP_START.version,fetchImpl),bundle=await readBundle(accountId,token,HQ_GP_START.version,fetchImpl)","versionRead(accountId,token,HQ_DIRECTORY_ACTIVATION_START.version,fetchImpl),bundle=await readBundle(accountId,token,HQ_DIRECTORY_ACTIVATION_START.version,fetchImpl)"],
 ['assertHqProviderSnapshot({deployment:before,version,bundle},HQ_GP_START)','(assertGpHqUnaffectedBindings(version,HQ_DIRECTORY_ACTIVATION_START),assertHqProviderSnapshot({deployment:before,version,bundle},HQ_DIRECTORY_ACTIVATION_START))'],
 ['assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},HQ_GP_START)','assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},HQ_DIRECTORY_ACTIVATION_START)'],
 [" const candidate={source:proof.head,predecessorSource:proof.predecessorHead,gpMemberCode:true,sha256:sha(bytes),bytes:bytes.length};"," const candidate={source:proof.head,predecessorSource:proof.predecessorHead,gpMemberCode:true,sha256:sha(bytes),bytes:bytes.length};\n assert.equal(candidate.sha256,HQ_DIRECTORY_ACTIVATION_START.sha256,'Flags-only activation must preserve the exact accepted GP-code bundle');assert.equal(candidate.bytes,HQ_DIRECTORY_ACTIVATION_START.bytes,'Flags-only activation must preserve accepted bundle size');"],
 ['assertHqProviderSnapshot({deployment:active,version,bundle},expected)','assertActivatedGpHqProviderSnapshot({deployment:active,version,bundle},{...expected,otherBindingsSha256:HQ_DIRECTORY_ACTIVATION_START.otherBindingsSha256},assertHqProviderSnapshot)'],
 ['assertHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},expected)','assertActivatedGpHqProviderSnapshot({deployment:await activeRead(accountId,token,fetchImpl),version,bundle},{...expected,otherBindingsSha256:HQ_DIRECTORY_ACTIVATION_START.otherBindingsSha256},assertHqProviderSnapshot)'],
 ["invitationEnabled:false,gpEnabled:false,authenticatedRoleAcceptance:","invitationEnabled:false,gpEnabled:true,authenticatedRoleAcceptance:"],
 ["unchanged invitation/sharing source and GP-off binding; no live mutations","unchanged invitation/sharing source and exact true V2 binding; no live mutations"]
];}
export function buildGpActivationHqSource(originalGpOff,receipt){const expected=gpActivationHqPredecessor(receipt);assert(!originalGpOff.includes(adapterImport));let current=originalGpOff;for(const[b,a]of replacements())current=once(current,b,a);return adapterImport+'export const HQ_DIRECTORY_ACTIVATION_START=Object.freeze('+JSON.stringify(expected)+');\n'+current;}
export function originalGpActivationHqSource(current,receipt){const prefix=adapterImport+'export const HQ_DIRECTORY_ACTIVATION_START=Object.freeze('+JSON.stringify(gpActivationHqPredecessor(receipt))+');\n';assert(current.startsWith(prefix),'Literal accepted GP-code provider predecessor required');let original=current.slice(prefix.length);for(const[b,a]of replacements().reverse())original=once(original,a,b);return original;}
export function buildGpActivationHqCaller(path,source){assert(GP_ACTIVATION_HQ_CALLERS.includes(path),'Only three existing HQ callers may be switched');return once(source,oldImport,newImport);}
export function originalGpActivationHqCaller(path,current){assert(GP_ACTIVATION_HQ_CALLERS.includes(path));return once(current,newImport,oldImport);}
export function verifyGpActivationHqSource({current,original,receipt,currentCallers,originalCallers}){assert.equal(originalGpActivationHqSource(current,receipt),original);for(const p of GP_ACTIVATION_HQ_CALLERS)assert.equal(originalGpActivationHqCaller(p,currentCallers[p]),originalCallers[p],'Every unrelated HQ caller assertion remains: '+p);return{originalBlob:gpActivationGitBlob(original),predecessor:gpActivationHqPredecessor(receipt)};}
export const GP_ACTIVATION_HQ_PROOF_IMPORT="import {gpDirectoryActivationHistoricalView} from './gp-directory-activation-20261015.mjs';\nimport {buildGpActivationHqCaller,originalGpActivationHqCaller} from './gp-directory-activation-hq-source-20261015.mjs';\n";
export const GP_ACTIVATION_HQ_PROOF_WRAPPERS=`
// The old caller proof remains literal. This explicit outer layer authenticates
// its sole import successor against the independently admitted activation.
export function buildGpHqCallerSource(path,original){
 const activation=gpDirectoryActivationHistoricalView();activation.assertCurrent();try{
  const gpOff=buildGpHqCallerSourceBeforeDirectoryActivation(path,original);
  if(activation.head===activation.rawHead)return gpOff;
  assert.equal(gpOff,activation.content(activation.head,path),'Literal accepted GP-off caller required');
  return buildGpActivationHqCaller(path,gpOff);
 }finally{activation.assertCurrent();}
}
export function originalGpHqCallerSource(path,current){
 const activation=gpDirectoryActivationHistoricalView();activation.assertCurrent();try{
  const gpOff=activation.head===activation.rawHead||current===activation.content(activation.head,path)?current:originalGpActivationHqCaller(path,current);
  return originalGpHqCallerSourceBeforeDirectoryActivation(path,gpOff);
 }finally{activation.assertCurrent();}
}
`;
export const GP_ACTIVATION_HQ_PROOF_REPLACEMENTS=Object.freeze([
 ['export function buildGpHqCallerSource(path,original){','function buildGpHqCallerSourceBeforeDirectoryActivation(path,original){'],
 ['export function originalGpHqCallerSource(path,current){','function originalGpHqCallerSourceBeforeDirectoryActivation(path,current){']
].map(p=>Object.freeze(p)));
export function buildGpActivationHqProofSource(original){assert(!original.includes(GP_ACTIVATION_HQ_PROOF_IMPORT));let current=original;for(const[b,a]of GP_ACTIVATION_HQ_PROOF_REPLACEMENTS)current=once(current,b,a);return GP_ACTIVATION_HQ_PROOF_IMPORT+current+GP_ACTIVATION_HQ_PROOF_WRAPPERS;}
export function originalGpActivationHqProofSource(current){assert(current.startsWith(GP_ACTIVATION_HQ_PROOF_IMPORT));assert(current.endsWith(GP_ACTIVATION_HQ_PROOF_WRAPPERS));let original=current.slice(GP_ACTIVATION_HQ_PROOF_IMPORT.length,-GP_ACTIVATION_HQ_PROOF_WRAPPERS.length);for(const[b,a]of[...GP_ACTIVATION_HQ_PROOF_REPLACEMENTS].reverse())original=once(original,a,b);return original;}
