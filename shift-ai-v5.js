import v4 from './shift-ai-v4.js';
import {memberBootstrap,proactiveFeed} from './member-experience-v1.js';
import {runAcademyRegression} from './academy-regression-runner-v2.js';
import {handleAuthRecovery} from './auth-recovery-v1.js';

export default{async fetch(request,env,ctx){const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
const authRecovery=await handleAuthRecovery(request,env,ctx,(r,e,c)=>v4.fetch(r,e,c));if(authRecovery)return authRecovery;
if(request.method==='GET'&&p==='/v1/shift-ai/experience/bootstrap')return memberBootstrap(request,env,ctx);
if(request.method==='GET'&&p==='/v1/shift-ai/proactive/feed')return proactiveFeed(request,env,ctx);
if(request.method==='POST'&&p==='/v1/shift-ai/academy/regression'){const auth=await v4.fetch(new Request(new URL('/v1/shift-ai/status',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!auth.ok)return auth;let body={};try{body=await request.json()}catch{}return json(await runAcademyRegression(env,{limit:Number(body.limit||12)}))}
return v4.fetch(request,env,ctx)}};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
