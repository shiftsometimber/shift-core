import legacy from './hq-ai.js';
import {watchtowerSnapshot} from './watchtower-v1.js';
import {outcomesSnapshot} from './outcomes-v1.js';
import {memberJourneySnapshot} from './journey-analytics-v1.js';
export default{async fetch(request,env,ctx){const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(request.method==='GET'&&['/v1/hq/watchtower','/v1/hq/outcomes','/v1/hq/journey','/v1/hq/attention'].includes(path)){const auth=await legacy.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!auth.ok)return auth;if(path==='/v1/hq/outcomes')return json(await outcomesSnapshot(env.DB));if(path==='/v1/hq/journey')return json(await memberJourneySnapshot(env.DB));const w=await watchtowerSnapshot(env);if(path==='/v1/hq/attention')return json({ok:w.ok,status:w.status,generatedAt:w.generatedAt,summary:w.summary,attention:w.attention});return json(w)}return legacy.fetch(request,env,ctx)}};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
