// Retry only the idempotent GitHub ref read; never retry a publication here.
const REF_URL='https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/main';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function readCurrentMain(env=process.env,fetcher=fetch,{sleep=delay,now=Date.now}={}){
  if(env.GITHUB_REPOSITORY!=='shiftsometimber/shift-core'||env.GITHUB_REF!=='refs/heads/main'||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||''))throw Error('catalogue_workflow_context_invalid');
  if(typeof env.GITHUB_TOKEN!=='string'||!env.GITHUB_TOKEN.trim())throw Error('catalogue_main_check_token_missing');
  for(let attempt=1;attempt<=3;attempt++){
    let response;
    try{
      response=await fetcher(REF_URL,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${env.GITHUB_TOKEN}`},signal:AbortSignal.timeout(10000),redirect:'error'});
    }catch(error){
      if(attempt===3)throw Error('catalogue_main_check_transport_failed');
      await sleep(1000*attempt);continue;
    }
    if(response.ok){
      let body;try{body=await response.json()}catch{throw Error('catalogue_main_check_invalid_response')}
      if(!body||typeof body.object?.sha!=='string'||!/^[a-f0-9]{40}$/.test(body.object.sha))throw Error('catalogue_main_check_invalid_response');
      if(body.object.sha!==env.GITHUB_SHA)throw Error('catalogue_stale_main_rejected');
      return env.GITHUB_SHA;
    }
    const rateLimited=response.status===429||(response.status===403&&response.headers?.get('x-ratelimit-remaining')==='0');
    const retryable=rateLimited||[500,502,503,504].includes(response.status);
    const status=response.status;
    const retryAfter=response.headers?.get('retry-after');
    const reset=response.headers?.get('x-ratelimit-reset');
    // Release response resources. Never include authentication or response bodies in errors.
    try{await response.body?.cancel()}catch{}
    if(!retryable||attempt===3)throw Error(`catalogue_main_check_http_${status}`);
    let wait=1000*attempt;
    if(retryAfter!==null&&retryAfter!==undefined){
      const seconds=Number(retryAfter),until=Number.isFinite(seconds)?seconds*1000:Date.parse(retryAfter)-now();
      if(!Number.isFinite(until)||until<0)throw Error(`catalogue_main_check_http_${status}`);
      wait=Math.max(wait,until);
    }else if(rateLimited&&reset){
      const until=Number(reset)*1000-now();
      if(!Number.isFinite(until))throw Error(`catalogue_main_check_http_${status}`);
      wait=Math.max(wait,until);
    }else if(rateLimited){wait=60000}
    // A long rate-limit pause needs another workflow attempt, not a stalled release.
    if(wait>5000)throw Error(`catalogue_main_check_http_${status}_retry_later`);
    await sleep(wait);
  }
  throw Error('catalogue_main_check_failed');
}
