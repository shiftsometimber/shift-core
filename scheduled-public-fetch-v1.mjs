const PUBLIC_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);

export function scheduledEditorialFetcher(worker,env,ctx,networkFetch=fetch){
 if(!worker||typeof worker.fetch!=='function')throw Error('scheduled_public_worker_missing');
 if(typeof networkFetch!=='function')throw Error('scheduled_network_fetch_missing');
 return (input,init)=>{
  const requestedRedirect=init?.redirect||(input instanceof Request?input.redirect:null);
  const safeInit=requestedRedirect==='error'?{...(init||{}),redirect:'manual'}:init;
  const request=input instanceof Request?(safeInit?new Request(input,safeInit):input):new Request(input,safeInit);
  return PUBLIC_ORIGINS.has(new URL(request.url).origin)
   ? worker.fetch(request,env,ctx)
   : networkFetch(request);
 };
}
