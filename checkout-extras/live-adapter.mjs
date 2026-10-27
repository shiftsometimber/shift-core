import {recommendations,extrasRoutes} from './server.mjs';
export const sha256=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');
async function member(request,env){
 const tokens=[];for(const match of (request.headers.get('Cookie')||'').matchAll(/(?:^|;\s*)sst_session=([^;]+)/g)){try{const token=decodeURIComponent(match[1]);if(token&&!tokens.includes(token))tokens.push(token);}catch{}}
 for(const token of tokens.slice(0,4)){const row=await env.DB.prepare('SELECT u.id,u.email,a.email_verified,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN user_auth a ON a.user_id=u.id WHERE s.token_hash=?').bind(await sha256(token)).first();if(row&&!row.revoked_at&&Date.parse(row.expires_at)>Date.now())return row;}return null;
}
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cors=request=>['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(request.headers.get('Origin'))?{'Access-Control-Allow-Origin':request.headers.get('Origin'),'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}:{};
export async function liveRecommendationRoute(request,env){
 const path=new URL(request.url).pathname;
 // This release cannot turn supplement purchasing on, even through an env edit.
 const safeEnv={...env,SUPPLEMENTS_CHECKOUT_ENABLED:'false'};
 if(path==='/shift-health/assets/checkout-recommendations.json'){
  if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);
  const items=await recommendations(safeEnv);return request.method==='HEAD'?new Response(null,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}):json({items,salesEnabled:false});
 }
 if(path==='/v1/commerce/basket-quote')return extrasRoutes(request,safeEnv,{member,json,cors,sha256,body:r=>r.json(),siteUrl:()=> 'https://shiftsometimber.co.uk'});
 return null;
}
