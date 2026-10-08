import hq from './hq-ai-v2.js';
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 const management=['/v1/hq/management/report','/v1/hq/management/export'].includes(path);
 const staff=path.match(/^\/v1\/hq\/management\/users\/(\d+)$/);
 if(staff&&['PATCH','OPTIONS'].includes(request.method)){url.pathname='/v1/hq/users/'+staff[1];return hq.fetch(new Request(url,request),env,ctx);}
 if(!management)return new Response('Not found',{status:404});
 return hq.fetch(request,env,ctx);
}};
