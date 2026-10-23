import {clinicalAccessBoundary} from './clinical-assessment/clinical-access-boundary.mjs';
import {hqClinicalRoute} from './clinical-assessment/hq-clinical-api.mjs';
import {partnerRoute} from './hq-partner-api.mjs';
import hq from './hq-ai-v2.js';
export default {async fetch(request,env,ctx){
 const boundary=await clinicalAccessBoundary(request,env,async(r,e)=>{const response=await hq.fetch(new Request(new URL('/v1/hq/me',r.url),{headers:r.headers}),e,ctx);return response.ok?await response.json():{response};});if(boundary)return boundary;
 const clinical=await hqClinicalRoute(request,env,async(r,e)=>{const response=await hq.fetch(new Request(new URL('/v1/hq/me',r.url),{headers:r.headers}),e,ctx);return response.ok?await response.json():{response};});if(clinical)return clinical;
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 if(/^\/v1\/hq\/management\/(partners|partner-handovers)(?:\/|$)/.test(path)){
   if(request.method==='OPTIONS')return hq.fetch(request,env,ctx);
   const response=await partnerRoute(request,env,ctx,(r,e,c)=>hq.fetch(r,e,c));if(!response)return new Response('Not found',{status:404});
   const headers=new Headers(response.headers);if(request.headers.get('Origin')==='https://hq.shiftsometimber.co.uk'){headers.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');headers.set('Access-Control-Allow-Credentials','true');headers.set('Vary','Origin');}
   return new Response(response.body,{status:response.status,headers});
 }
 const memberGp=/^\/v1\/hq\/management\/people\/[1-9]\d*\/gp-details$/.test(path);
 const management=memberGp||['/v1/hq/management/report' ,'/v1/hq/management/export','/v1/hq/management/gp-directory'].includes(path);
 const staff=path.match(/^\/v1\/hq\/management\/users\/(\d+)$/);
 if(staff&&['PATCH','OPTIONS'].includes(request.method)){url.pathname='/v1/hq/users/'+staff[1];return hq.fetch(new Request(url,request),env,ctx);}
 if(!management)return new Response('Not found',{status:404});
 return hq.fetch(request,env,ctx);
}};
