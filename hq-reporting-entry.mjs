import {businessRoute} from './hq-business-snapshot.mjs';
import {launchKpiPage} from './hq-launch-kpis.mjs';
import {managementRoute} from './hq-management-api.mjs';
import {notificationRoute,reconcileNotifications} from './hq-event-notifications.mjs';
const origin='https://hq.shiftsometimber.co.uk';
const paths=new Set(['/v1/hq/management/report','/v1/hq/management/export']);
export function reportWorker(fetchImpl=null){
 return {async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  const business=['/v1/hq/management/report/business','/v1/hq/management/report/business/export'].includes(path);
  const kpis=path==='/v1/hq/management/report/kpis/view';
  const notification=path==='/v1/hq/management/report/notifications'||path.startsWith('/v1/hq/management/report/notifications/');
  if(!paths.has(path)&&!notification&&!kpis&&!business)return new Response('Not found',{status:404});
  const trusted=request.headers.get('Origin')===origin;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie, Origin','X-Shift-HQ-Reporting':'business-snapshot-20261024-v1','X-Shift-Prescription-Alerts':'20261024-v1'};
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
   let response;if(business)response=await businessRoute(request,env,authenticate);else if(kpis){if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});const url=new URL(request.url);url.pathname='/v1/hq/management/report';url.searchParams.set('kind','management');const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(!url.searchParams.has('start'))url.searchParams.set('start',day.slice(0,8)+'01');if(!url.searchParams.has('end'))url.searchParams.set('end',day);const report=await managementRoute(new Request(url,{headers:request.headers}),env,ctx,authenticate);response=report.ok?launchKpiPage(await report.json()):report;}else response=notification?await notificationRoute(request,env,authenticate):await managementRoute(request,env,ctx,authenticate);
   if(!response)return new Response('Not found',{status:404,headers});
   const combined=new Headers(response.headers);for(const [key,value] of Object.entries(headers))combined.set(key,value);
   return new Response(response.body,{status:response.status,headers:combined});
  }catch{return Response.json({ok:false,error:'reporting_unavailable'},{status:503,headers});}
 },async scheduled(event,env,ctx){
  const work=reconcileNotifications(env,new Date(),{kind:'scheduled',scheduledAt:Number.isFinite(event?.scheduledTime)?new Date(event.scheduledTime).toISOString():null});
  if(ctx?.waitUntil)ctx.waitUntil(work);else return await work;
 }};
}
export default reportWorker();
