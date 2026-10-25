import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const APPROVED_COMPILED_MODULE_PATHS=Object.freeze(["acquisition-activation/server.mjs","auth-email-verification-v1.js","auth-recovery-v1.js","member-design.mjs","member-experience/account-deletion.mjs","my-timber-pwa/ui.mjs","preview/app-layout/refinement.mjs","privacy-account-request-v1.js","worker.js","auth-delivery-v1.js","auth-recovery-page-v1.mjs","hq-commerce-delivery.mjs","hq-mfa-readiness.mjs","hq-service-job-runs.mjs","medicine-commerce-v1.js","member-register-fastpath-v2.js","password-policy-v1.js","shift-coach/worker.mjs","transactional-email-v1.js","worker-entry-v6.js"]);
const multiplicities=Object.freeze({'shift-coach/worker.mjs':3,'worker-entry-v6.js':5});
export function indexCompiledSections(code){
 assert.equal(typeof code,'string');
 const markers=[...code.matchAll(/^\/\/ ([a-zA-Z0-9_./@+-]+\.(?:js|mjs|json))\n/gm)],byPath=new Map(),order=[];
 for(let i=0;i<markers.length;i++){const m=markers[i],path=m[1],section=code.slice(m.index,markers[i+1]?.index??code.length);if(!byPath.has(path))byPath.set(path,[]);byPath.get(path).push(section);order.push(path);}
 return {byPath,order};
}
export function verifyApprovedCompiledModules(live,candidate){
 // Each immutable input is indexed once. Every actual repeated esbuild section
 // is compared, in order and byte-for-byte. No source text is normalised.
 const actual=indexCompiledSections(live),expected=indexCompiledSections(candidate),out={};
 for(const path of APPROVED_COMPILED_MODULE_PATHS){
  const count=multiplicities[path]??1,a=actual.byPath.get(path)??[],e=expected.byPath.get(path)??[];
  assert.equal(e.length,count,'Approved compiled section identity changed: '+path);
  assert.equal(a.length,count,'Deployed compiled section identity changed: '+path);
  assert.deepEqual(a,e,'Deployed implementation differs: '+path);
  const bytes=a.join('');out[path]={sha256:createHash('sha256').update(bytes).digest('hex'),bytes:Buffer.byteLength(bytes),segments:count};
 }
 const selected=new Set(APPROVED_COMPILED_MODULE_PATHS);
 assert.deepEqual(actual.order.filter(x=>selected.has(x)),expected.order.filter(x=>selected.has(x)),'Affected compiled section execution order changed');
 return out;
}
