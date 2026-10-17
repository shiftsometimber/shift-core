import assert from 'node:assert/strict';
export const navigationProtocol=Object.freeze({firstNavigations:30,repeatNavigations:30,p95TargetMs:1000,viewport:{width:390,height:844},cpuSlowdown:4,latencyMs:150,downloadBitsPerSecond:1600000,uploadBitsPerSecond:750000,serviceWorkers:'blocked',measure:'Each full document navigation start to its own visible enabled prepared action with bound controls'});
const p95=values=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];
export function summariseNavigations({cold,repeat,source}){
 assert.match(source,/^(?!0{40}$)[a-f0-9]{40}$/,'Frozen source identity required');
 assert.equal(cold.length,navigationProtocol.firstNavigations,'Exactly 30 first full-document navigations required');
 assert.equal(repeat.length,navigationProtocol.repeatNavigations,'Exactly 30 separate-document repeat navigations required');
 const all=[...cold,...repeat];
 for(const sample of all){assert(Number.isFinite(sample.ready)&&sample.ready>=0,'Every slow or failed timing must remain visible');assert(Number.isFinite(sample.origin)&&sample.origin>0,'A document time origin is required');assert.equal(sample.enabled,true,'The action must be enabled');assert.equal(sample.visible,true,'The action must be visible');assert.equal(sample.bound,true,'Controls must be bound');}
 assert.equal(new Set(all.map(x=>x.origin)).size,60,'Every sample must belong to a distinct full document');
 const coldP95=p95(cold.map(x=>x.ready)),repeatP95=p95(repeat.map(x=>x.ready));
 return{source,protocol:navigationProtocol,cold,repeat,coldP95,repeatP95,targetMet:coldP95<1000&&repeatP95<1000};
}
export function assertNavigationBudget(result){
 assert.deepEqual(summariseNavigations(result),result,'The declared benchmark must match all retained samples');
 assert(result.coldP95<1000,'First full-document navigation p95 must be strictly below 1000ms');
 assert(result.repeatP95<1000,'Separate-document repeat navigation p95 must be strictly below 1000ms');
 return true;
}
