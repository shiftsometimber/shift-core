const assert=require('node:assert/strict');
const paths=new Set(['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water']);
const temporaryStatus=new Set([408,429,500,502,503,504]);
function requirePublicRead(url){const u=new URL(url);assert.equal(u.origin,'https://shiftsometimber.co.uk');assert(paths.has(u.pathname)&&!u.search&&!u.hash,'Only the original nine public read routes may retry');return u.href;}
function isTransportFailure(error,kind){
 if(kind==='navigation')return error?.name==='TimeoutError'&&/^page\.goto: Timeout 30000ms exceeded\./.test(error.message||'');
 return error?.name==='TimeoutError'||(error?.name==='TypeError'&&error.message==='fetch failed'&&(!error.cause?.code||['UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET','ECONNRESET','ETIMEDOUT','EAI_AGAIN'].includes(error.cause.code)));
}
async function retryPublicRead(task,{url,kind,record=()=>{}}){
 requirePublicRead(url);assert(['navigation','fetch'].includes(kind));
 for(let attempt=1;attempt<=2;attempt++){
  let response;try{response=await task(attempt);}catch(error){if(attempt!==1||!isTransportFailure(error,kind))throw error;record({url,kind,failedAttempt:1,nextAttempt:2,reason:error.message,perAttemptTimeoutMs:30000});continue;}
  if(kind==='fetch'&&temporaryStatus.has(response?.status)&&attempt===1){record({url,kind,failedAttempt:1,nextAttempt:2,reason:'HTTP '+response.status,perAttemptTimeoutMs:30000});continue;}
  return response;
 }
 throw Error('Bounded public read exhausted');
}
function wrapPublicFetch(fetchImpl,record=()=>{}){return async(url,options={})=>{requirePublicRead(url);assert.equal((options.method||'GET').toUpperCase(),'GET','Read retry cannot submit data');return retryPublicRead(()=>fetchImpl(url,{...options,signal:AbortSignal.timeout(30000)}),{url,kind:'fetch',record});};}
module.exports={requirePublicRead,isTransportFailure,retryPublicRead,wrapPublicFetch};
