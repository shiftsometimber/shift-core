import {partnerRoute} from './hq-partner-api.mjs';
import hq from './hq-ai-v2.js';
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 if(/^\/v1\/hq\/management\/(partners|partner-handovers)(?:\/|$)/.test(path)){
   if(request.method==='OPTIONS')return hq.fetch(request,env,ctx);
   const response=await partnerRoute(request,env,ctx,(r,e,c)=>hq.fetch(r,e,c));if(!response)return new Response('Not found',{status:404});
   const headers=new Headers(response.headers);if(request.headers.get('Origin')==='https://hq.shiftsometimber.co.uk'){headers.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');headers.set('Access-Control-Allow-Credentials','true');headers.set('Vary','Origin');}
   return new Response(response.body,{status:response.status,headers});
 }
 const management=['/v1/hq/management/report' ,'/v1/hq/management/export'].includes(path);
 const staff=path.match(/^\/v1\/hq\/management\/users\/(\d+)$/);
 if(staff&&['PATCH','OPTIONS'].includes(request.method)){url.pathname='/v1/hq/users/'+staff[1];return hq.fetch(new Request(url,request),env,ctx);}
 if(!management)return new Response('Not found',{status:404});
 return hq.fetch(request,env,ctx);
}};
