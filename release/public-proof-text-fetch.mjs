import {setTimeout as delay} from 'node:timers/promises';
const transportCodes=new Set(['ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET']);
export async function fetchPublicProofText(url,{fetcher=fetch,pause=delay}={}){
 const failures=[];
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
   // An HTTP failure is evidence, not a transport retry. The caller's exact
   // status/content assertions remain authoritative.
   const body=response.status===200?await response.text():'';
   return {status:response.status,body,attempts:attempt,transportFailures:failures};
  }catch(error){
   const code=error?.cause?.code||error?.code||error?.name;
   if(!transportCodes.has(code)&&code!=='TimeoutError')throw error;
   failures.push({attempt,code});
   if(attempt===3)throw error;
   await pause(250*attempt);
  }
 }
}
