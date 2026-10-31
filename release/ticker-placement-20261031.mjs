import assert from 'node:assert/strict';
import vm from 'node:vm';
export function patchTickerClient(source){
 const marker='  const start = async () => {';
 assert.equal(source.split(marker).length,2,'Exact current ticker start required');
 const guard="\n    // Approved placement correction; preserve every other ticker behaviour.\n    if (/^\\/(?:ask-timber|shift-health)(?:\\/|$)/.test(location.pathname)) {\n      document.getElementById('shift-public-news')?.remove();\n      return;\n    }";
 const result=source.replace(marker,marker+guard);
 assert.equal(result.replace(guard,''),source,'Only placement guard may change');
 return result;
}
export function testTickerClient(source){
 const patched=patchTickerClient(source);
 for(const path of ['/ask-timber','/ask-timber/','/shift-health','/shift-health/testing/bloods']){
  let removed=0,requests=0;
  vm.runInNewContext(patched,{location:{pathname:path},document:{readyState:'complete',getElementById(id){assert.equal(id,'shift-public-news');return{remove(){removed++}}}},fetch(){requests++;throw Error('Unexpected request')},URL,Date,Set});
  assert.equal(removed,1,path);assert.equal(requests,0,path);
 }
 assert(patched.includes("Date.parse('2026-10-31T20:00:00Z')"),'Retain dated lead expiry');
 assert(patched.includes("now < Date.parse('2026-10-31T20:00:00Z')"),'Lead automatically expires at its existing time');
 return {pass:true,blockedPaths:4,unexpectedRequests:0,originalBehaviourPreserved:true,pinExpiryPreserved:true};
}
