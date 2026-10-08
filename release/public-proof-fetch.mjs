// Read-only verification transport. Content and authentication assertions stay in the caller.
export async function fetchPublicProof(url,options={}, {fetcher=globalThis.fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),timeoutMs=30000,report=entry=>console.log(JSON.stringify(entry))}={}){
 if((options.method||'GET').toUpperCase()!=='GET')throw Error('Verification retries are restricted to GET');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid bounded proof timeout');
 const path=new URL(url).pathname;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const r=await fetcher(url,{...options,signal:AbortSignal.timeout(timeoutMs)});
   if([502,503,504].includes(r.status)&&attempt<3){await r.body?.cancel();report({kind:'public_proof_transport_retry',path,attempt,status:r.status});await wait(1000);continue;}
   // Buffer within the attempt: a reset while reading bytes also needs a fresh GET.
   const bytes=await r.arrayBuffer();
   return new Response([204,205,304].includes(r.status)?null:bytes,{status:r.status,statusText:r.statusText,headers:r.headers});
  }catch(error){
   const code=error?.cause?.code||error?.code||error?.name;
   if(!['ECONNRESET','ETIMEDOUT','EAI_AGAIN','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT','TimeoutError'].includes(code)||attempt===3)throw error;
   report({kind:'public_proof_transport_retry',path,attempt,code});await wait(1000);
  }
 }
 throw Error('Public proof retry budget exhausted');
}
