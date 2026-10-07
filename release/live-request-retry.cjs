const transientStatuses=new Set([429,500,502,503,504]);
const transientError=error=>error?.name==='TimeoutError'||error?.name==='AbortError'||(error?.name==='TypeError'&&/fetch failed/i.test(error.message))||/net::ERR_(TIMED_OUT|CONNECTION_RESET|CONNECTION_CLOSED|NETWORK_CHANGED)/.test(error?.message||'');
async function withLiveRequestRetry(operation,{attempts=3,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),label='live GET'}={}){
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const result=await operation();
   const response=result?.response??result;
   const status=typeof response?.status==='function'?response.status():response?.status;
   if(!transientStatuses.has(status)||attempt===attempts)return result;
   console.warn(label+': temporary HTTP '+status+'; retry '+attempt+'/'+attempts);
  }catch(error){
   if(!transientError(error)||attempt===attempts)throw error;
   console.warn(label+': temporary '+error.name+'; retry '+attempt+'/'+attempts);
  }
  await wait(1000*attempt);
 }
}
module.exports={withLiveRequestRetry};
