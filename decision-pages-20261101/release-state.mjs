import assert from 'node:assert/strict';
const sorted=versions=>[...versions].sort((a,b)=>a.version_id.localeCompare(b.version_id));
export async function waitForDeployment(read,expected,{previousIds=[],maxAttempts=20,pause=()=>new Promise(r=>setTimeout(r,1500))}={}){
 assert(expected.id&&expected.versions?.length,'Provider creation receipt is required');
 let observed;
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  observed=await read();
  if(observed.id===expected.id){assert.deepEqual(sorted(observed.versions),sorted(expected.versions),'Created deployment has unexpected traffic');return observed;}
  assert(previousIds.includes(observed.id),'Another deployment replaced this release: '+observed.id);
  if(attempt<maxAttempts)await pause();
 }
 assert.equal(observed.id,expected.id,'Provider has not exposed its created deployment after the bounded wait');
}
