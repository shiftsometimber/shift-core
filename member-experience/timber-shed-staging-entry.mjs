// Isolated acceptance host only. No production bindings, communications or real members.
import {timberShedForumRoutes} from './timber-shed-forum-routes.mjs';
import {timberShedPresentationRoutes} from './timber-shed-presentation.mjs';
import {timberShedPrivateRoutes} from './timber-shed-private.mjs';
import {runTimberShedRetention} from './timber-shed-retention.mjs';
const tokens=Object.freeze({'member-one':'fictional-member-one','member-two':'fictional-member-two','moderator-one':'fictional-moderator-one','moderator-two':'fictional-moderator-two'});
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function syntheticEnv(env){
 return {...env,DB:env.SYNTHETIC_DB,TIMBER_SHED_AI_MODERATION_ENABLED:'false',TIMBER_SHED_AI_PROVIDER_APPROVED:'false',TIMBER_SHED_EMAIL_DELIVERY_ENABLED:'false'};
}
const validHost=env=>env.SHIFT_ENVIRONMENT==='timber-shed-synthetic-acceptance'&&env.TIMBER_SHED_SYNTHETIC_ONLY==='true'&&!!env.SYNTHETIC_DB;
export default {
 async fetch(request,env){
  if(!validHost(env))return new Response('Unavailable',{status:404,headers});
  if(!env.SHED_ACCEPTANCE_AUTHORIZATION||request.headers.get('Authorization')!==env.SHED_ACCEPTANCE_AUTHORIZATION)
   return new Response('Private acceptance host',{status:401,headers:{...headers,'WWW-Authenticate':'Basic realm="Private Timber Shed acceptance"'}});
  const url=new URL(request.url),path=url.pathname;
  if(path==='/__synthetic/session'&&request.method==='POST'){
   if(request.headers.get('Origin')!==url.origin)return new Response(null,{status:403,headers});
   if(Number(request.headers.get('Content-Length')||0)>200)return new Response(null,{status:413,headers});
   const raw=await request.text();if(raw.length>200)return new Response(null,{status:413,headers});
   const role=new URLSearchParams(raw).get('role'),token=tokens[role];
   if(!token)return new Response(null,{status:400,headers});
   return new Response(null,{status:303,headers:{...headers,Location:'/member/timber-shed','Set-Cookie':'sst_session='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict'}});
  }
  if(path==='/__synthetic/maintenance'&&request.method==='POST'){
   if(request.headers.get('Origin')!==url.origin)return new Response(null,{status:403,headers});
   return Response.json(await runTimberShedRetention(syntheticEnv(env)),{headers});
  }
  if(path==='/'&&request.method==='GET'){
   const forms=Object.keys(tokens).map(role=>'<form method="post" action="/__synthetic/session"><input type="hidden" name="role" value="'+role+'"><button>'+role+'</button></form>').join('');
   return new Response('<!doctype html><html lang="en-GB"><meta name="viewport" content="width=device-width"><title>Private Shed acceptance</title><h1>Fictional account acceptance</h1><p>Choose a seeded fictional account. No real member records, email or live AI calls are permitted here.</p>'+forms+'</html>',{headers:{...headers,'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8'}});
  }
  const allowed=path.startsWith('/v1/timber-shed/')||path.startsWith('/member/timber-shed')||['/assets/member-experience/timber-shed.mjs','/assets/member-experience/timber-shed-forum.mjs'].includes(path);
  if(!allowed)return new Response(null,{status:404,headers});
  const testEnv=syntheticEnv(env);
  return await timberShedPresentationRoutes(request,testEnv)||await timberShedForumRoutes(request,testEnv)||await timberShedPrivateRoutes(request,testEnv)||new Response(null,{status:404,headers});
 },
 async scheduled(controller,env,ctx){
  if(!validHost(env))return;
  const job=runTimberShedRetention(syntheticEnv(env));if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
 }
};
