import {createConnectedHealthRoutes} from './routes.mjs';
import {connectedHealthAsset,withConnectedHealth} from './presentation.mjs';
import {appendConnectedHealthExport} from './privacy.mjs';
// Composes the existing Worker without duplicating its account/product logic.
export function wrapConnectedHealth(core,authenticate){
 const route=createConnectedHealthRoutes(authenticate);
 return {...core,async fetch(request,env,ctx){
  const r=await route(request,env);if(r)return r;
  const asset=connectedHealthAsset(request,env);if(asset)return asset;
  if(env.CONNECTED_HEALTH_V1_ENABLED==='true'&&new URL(request.url).pathname==='/member/connected-health'&&request.method==='GET'){
   return new Response('Open Connected health data from My Timber Settings in the supported mobile app. No permission has been requested and no health data has been read.',{status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
  }
  let response=await core.fetch(request,env,ctx);
  response=await appendConnectedHealthExport(request,env,response,authenticate);
  return withConnectedHealth(request,response,env);
 }};
}
