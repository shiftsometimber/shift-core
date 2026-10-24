import {managementRoute} from './hq-management-api.mjs';
import {notificationRoute,reconcileNotifications} from './hq-event-notifications.mjs';
const origin='https://hq.shiftsometimber.co.uk';
const paths=new Set(['/v1/hq/management/report','/v1/hq/management/export']);
export function reportWorker(fetchImpl=null){
 return {async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  const notification=path==='/v1/hq/management/report/notifications'||path.startsWith('/v1/hq/management/report/notifications/');
  if(!paths.has(path)&&!notification)return new Response('Not found',{status:404});
  const trusted=request.headers.get('Origin')===origin;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie, Origin','X-Shift-HQ-Reporting':'launch-operations-20261024-v1'};
  if(trusted)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'});
  if(request.method==='OPTIONS'){
   if(!trusted)return new Response(null,{status:403,headers});
   return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}});
  }
  const authenticate=async()=>{
   const authHeaders=new Headers();
   for(const name of ['Cookie','Authorization'])if(request.headers.has(name))authHeaders.set(name,request.headers.get(name));
   authHeaders.set('Origin',origin);
   const authFetch=fetchImpl||((url,options)=>env.CORE.fetch(new Request(url,options)));
   const auth=await authFetch('https://api.shiftsometimber.co.uk/v1/hq/me',{method:'GET',headers:authHeaders,redirect:'manual'});
   if(auth.status>=300&&auth.status<400)return Response.json({ok:false,error:'hq_auth_unavailable'},{status:503});
   return auth;
  };
  try{
   const response=notification?await notificationRoute(request,env,authenticate):await managementRoute(request,env,ctx,authenticate);
   if(!response)return new Response('Not found',{status:404,headers});
   const combined=new Headers(response.headers);for(const [key,value] of Object.entries(headers))combined.set(key,value);
   return new Response(response.body,{status:response.status,headers:combined});
  }catch{return Response.json({ok:false,error:'reporting_unavailable'},{status:503,headers});}
 },async scheduled(event,env,ctx){
  const work=reconcileNotifications(env,new Date());
  if(ctx?.waitUntil)ctx.waitUntil(work);else return await work;
 }};
}
export default reportWorker();
