import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const repo='https://api.github.com/repos/shiftsometimber/shift-core';
const transient=new Set(['UND_ERR_SOCKET','ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT']);
// Only transport failures from this repository's GET proof lookup are retried.
// HTTP errors, malformed evidence and every caller's approval assertions fail closed.
export function createGithubProofGet({fetcher=fetch,token=process.env.GITHUB_TOKEN,wait=delay}={}){
 return async function get(path){
  assert.equal(typeof path,'string');
  assert(path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\'),'Repository-relative GitHub proof path required');
  const url=new URL(repo+path);assert(url.href.startsWith(repo+'/'),'Exact GitHub repository required');
  for(let attempt=0;attempt<3;attempt++){
   let r;
   try{r=await fetcher(url.href,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});}
   catch(error){
    if(attempt===2||!transient.has(error?.cause?.code??error?.code))throw error;
    await wait(1000*(attempt+1));continue;
   }
   assert(r.ok,'GitHub verification '+r.status);
   return r.json();
  }
 };
}
