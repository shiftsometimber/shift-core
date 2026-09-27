// Only the temporary preview route can briefly return an edge 404 after creation.
// Never retry model errors or use this helper in production.
// Pace synthetic acceptance traffic below the owner-configured 10/minute gateway limit.
// This delay is test-only; it is never imported by the production chat.
export async function previewInference(input){await new Promise(resolve=>setTimeout(resolve,7000));for(let attempt=0;attempt<4;attempt++){const r=await fetch(process.env.SHIFT_EVAL_URL+'/run',{method:'POST',headers:{Authorization:'Bearer '+process.env.SHIFT_EVAL_KEY,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(45000)});if(r.status!==404||attempt===3)return r;await r.body?.cancel();console.log('PREVIEW_ROUTE_PROPAGATION_RETRY '+(attempt+1));await new Promise(resolve=>setTimeout(resolve,1500));}}
