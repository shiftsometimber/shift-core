const AUDIENCE='shift-production-commissioning';
const ISSUER='https://token.actions.githubusercontent.com';
const REPOSITORY='shiftsometimber/shift-core';
const ACTOR_ID='315011648';
const SYNTHETIC=/^shiftsometimber\+(?:finish|longitudinal|b03|structured)-[a-z0-9-]+@gmail\.com$/i;
const ALLOWED_WORKFLOWS=['/.github/workflows/master-integration-gate.yml@','/.github/workflows/production-commissioning.yml@','/.github/workflows/gate1-rendered-browser.yml@'];

export async function handleCommissioningIdentity(request,env,ctx,next){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='POST'||p!=='/v1/auth/register')return null;
  const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();
  if(!token)return null;
  const body=await readJson(request.clone()),email=String(body.email||'').trim().toLowerCase();
  if(!SYNTHETIC.test(email))return json({ok:false,error:'commissioning_identity_email_rejected'},403);
  const identity=await verifyGithubOidc(token);
  if(!identity.ok)return json({ok:false,error:'commissioning_identity_rejected'},403);

  const response=await next(request,env,ctx);
  if(!response.ok)return response;
  let data={};try{data=await response.clone().json()}catch{return response}
  const userId=Number(data?.user?.id||0);if(!userId)return response;
  const stamp=new Date().toISOString();
  await env.DB.prepare('UPDATE user_auth SET email_verified=1,email_verified_at=?,updated_at=? WHERE user_id=?').bind(stamp,stamp,userId).run();
  try{await env.DB.prepare('INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)').bind(userId,'auth.commissioning_identity_verified','user',String(userId),JSON.stringify({issuer:identity.claims.iss,repository:identity.claims.repository,workflow_ref:identity.claims.workflow_ref,actor_id:identity.claims.actor_id})).run()}catch{}
  const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('Content-Type','application/json; charset=utf-8');
  return new Response(JSON.stringify({...data,emailVerified:true,verificationRequired:false,commissioningIdentity:'github_actions_oidc'}),{status:response.status,headers});
}

export async function verifyGithubOidc(token){
  try{
    const parts=String(token).split('.');if(parts.length!==3)return{ok:false};
    const header=JSON.parse(text(parts[0])),claims=JSON.parse(text(parts[1]));
    if(header.alg!=='RS256'||!header.kid)return{ok:false};
    const now=Math.floor(Date.now()/1000),aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
    if(claims.iss!==ISSUER||!aud.includes(AUDIENCE)||claims.repository!==REPOSITORY||String(claims.actor_id)!==ACTOR_ID)return{ok:false};
    if(Number(claims.exp||0)<=now||Number(claims.nbf||0)>now+60||Number(claims.iat||0)>now+60)return{ok:false};
    if(!ALLOWED_WORKFLOWS.some(x=>String(claims.workflow_ref||'').includes(x)))return{ok:false};
    const jwks=await fetch(`${ISSUER}/.well-known/jwks`).then(r=>{if(!r.ok)throw new Error('jwks');return r.json()});
    const jwk=(jwks.keys||[]).find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return{ok:false};
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const signed=new TextEncoder().encode(`${parts[0]}.${parts[1]}`),sig=bytes(parts[2]);
    const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,sig,signed);
    return valid?{ok:true,claims}:{ok:false};
  }catch{return{ok:false}}
}
function text(s){return new TextDecoder().decode(bytes(s))}
function bytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s);return Uint8Array.from(b,c=>c.charCodeAt(0))}
async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
