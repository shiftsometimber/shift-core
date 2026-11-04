// The serving Core keeps every original export and handler. Preparation runs
// in its own small service so it cannot compete with member API memory.
import {WorkerEntrypoint} from 'cloudflare:workers';
import {authenticateMember} from '../member-state-fast-v1.js';
import {withV7Privacy} from './v7-privacy.mjs';
import original from '__MY_TIMBER_CURRENT_CORE__';
export * from '__MY_TIMBER_CURRENT_CORE__';
const current=withV7Privacy(original);
export default {...current,async fetch(request,env,ctx){
 const response=await current.fetch(request,env,ctx),path=new URL(request.url).pathname;
 if(response.ok&&['POST','PATCH','PUT'].includes(request.method)&&['/v1/member-state','/v1/profile','/v1/consents','/v1/my-journey/setup'].includes(path)&&env.V7_PREPARER){
  const auth=await authenticateMember(request,env);if(!auth.response){const task=env.V7_PREPARER.initialiseMember({userId:auth.userId}).catch(()=>({initialisationDeferred:true}));if(ctx?.waitUntil)ctx.waitUntil(task);else await task;}
 }return response;
}};
// Retain the internal entrypoint while existing callers transition in this release.
export class V7Planner extends WorkerEntrypoint {
 async initialiseMember(input){return this.env.V7_PREPARER.initialiseMember(input);}
 async prepareV7Fit(input){return this.env.V7_PREPARER.prepareV7Fit(input);}
 async prepareV7FitBatch(input){return this.env.V7_PREPARER.prepareV7FitBatch(input);}
}
export class PublicAssets extends WorkerEntrypoint {
 async fetch(request){const u=new URL(request.url);if(!u.pathname.startsWith('/assets/')||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname+u.search,{method:request.method,redirect:'error'});}
}
