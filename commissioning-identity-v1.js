const AUDIENCE='shift-production-commissioning';
const ISSUER='https://token.actions.githubusercontent.com';
const REPOSITORY='shiftsometimber/shift-core';
const ACTOR_ID='315011648';
const SYNTHETIC=/^shiftsometimber\+(?:finish|longitudinal|b03|structured|structured-authrender|sport|safety)-[a-z0-9-]+@gmail\.com$/i;
const ALLOWED_WORKFLOWS=['/.github/workflows/hq-controls-production-closeout.yml@','/.github/workflows/synthetic-production-safety-drills.yml@','/.github/workflows/master-integration-gate.yml@','/.github/workflows/production-commissioning.yml@','/.github/workflows/my-timber-final-production.yml@','/.github/workflows/gate1-rendered-browser.yml@','/.github/workflows/dave-release-gate.yml@','/.github/workflows/g2-011-progress-production.yml@','/.github/workflows/g2-012-progress-units.yml@','/.github/workflows/g2-013-progress-picture-production.yml@','/.github/workflows/g2-014-progress-picture-premium.yml@','/.github/workflows/g2-015-plan-manager.yml@','/.github/workflows/g1-real-password-recovery.yml@','/.github/workflows/shift-me-gate.yml@','/.github/workflows/final-v1-production-publication.yml@','/.github/workflows/sport-fit-production.yml@'];
const JWKS_URL=`${ISSUER}/.well-known/jwks`;
const JWKS_TTL_MS=5*60*1000;
let jwksMemory={expiresAt:0,keys:[]};
const elapsed=start=>Math.max(0,Math.round(performance.now()-start));

export async function handleCommissioningIdentity(request,env,ctx,next){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='POST'||p!=='/v1/auth/register')return null;
  const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();
  if(!token)return null;
  const body=await readJson(request.clone()),email=String(body.email||'').trim().toLowerCase();
  if(!SYNTHETIC.test(email))return json({ok:false,error:'commissioning_identity_email_rejected'},403);
  const verifyStarted=performance.now();
  const identity=await verifyGithubOidc(token);
  const verifyMs=elapsed(verifyStarted);
  if(!identity.ok)return json({ok:false,error:'commissioning_identity_rejected'},403);
  const coreStarted=performance.now();
  const response=await next(request,env,ctx);
  const coreRegisterMs=elapsed(coreStarted);
  if(!response.ok)return withTiming(response,{verifyMs,coreRegisterMs,postVerifyMs:0});
  let data={};try{data=await response.clone().json()}catch{return withTiming(response,{verifyMs,coreRegisterMs,postVerifyMs:0})}
  const userId=Number(data?.user?.id||0);if(!userId)return withTiming(response,{verifyMs,coreRegisterMs,postVerifyMs:0});
  const stamp=new Date().toISOString();
  const ops=[env.DB.prepare('UPDATE user_auth SET email_verified=1,email_verified_at=?,updated_at=? WHERE user_id=?').bind(stamp,stamp,userId),env.DB.prepare('INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)').bind(userId,'auth.commissioning_identity_verified','user',String(userId),JSON.stringify({issuer:identity.claims.iss,repository:identity.claims.repository,workflow_ref:identity.claims.workflow_ref,actor_id:identity.claims.actor_id}))];
  const postStarted=performance.now();
  try{if(typeof env.DB.batch==='function')await env.DB.batch(ops);else for(const op of ops)await op.run()}catch(e){console.warn('commissioning_identity_post_verify_warning',e?.message)}
  const postVerifyMs=elapsed(postStarted);
  const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('Content-Type','application/json; charset=utf-8');setTiming(headers,{verifyMs,coreRegisterMs,postVerifyMs});
  return new Response(JSON.stringify({...data,emailVerified:true,verificationRequired:false,commissioningIdentity:'github_actions_oidc'}),{status:response.status,headers});
}
function setTiming(headers,{verifyMs,coreRegisterMs,postVerifyMs}){headers.set('X-Shift-Commissioning-OIDC-Ms',String(verifyMs));headers.set('X-Shift-Core-Register-Ms',String(coreRegisterMs));headers.set('X-Shift-Commissioning-Postverify-Ms',String(postVerifyMs));headers.set('Server-Timing',`shift_oidc;dur=${verifyMs}, shift_register_core;dur=${coreRegisterMs}, shift_commissioning_postverify;dur=${postVerifyMs}`)}
function withTiming(response,timing){const h=new Headers(response.headers);setTiming(h,timing);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}

async function fetchJwks({force=false}={}){
  const now=Date.now();
  if(!force&&jwksMemory.keys.length&&jwksMemory.expiresAt>now)return jwksMemory.keys;
  const cache=globalThis.caches?.default;
  const cacheKey=new Request(JWKS_URL,{method:'GET'});
  if(!force&&cache){
    const cached=await cache.match(cacheKey).catch(()=>null);if(cached){const body=await cached.json().catch(()=>null);if(Array.isArray(body?.keys)&&body.keys.length){jwksMemory={keys:body.keys,expiresAt:now+JWKS_TTL_MS};return body.keys}}
  }
  const r=await fetch(JWKS_URL,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('jwks');
  const body=await r.json();if(!Array.isArray(body?.keys)||!body.keys.length)throw new Error('jwks_empty');
  jwksMemory={keys:body.keys,expiresAt:now+JWKS_TTL_MS};
  if(cache){const h=new Headers({'Content-Type':'application/json','Cache-Control':'public, max-age=300'});cache.put(cacheKey,new Response(JSON.stringify({keys:body.keys}),{status:200,headers:h}).clone()).catch(()=>{})}
  return body.keys;
}

export async function verifyGithubOidc(token){try{const parts=String(token).split('.');if(parts.length!==3)return{ok:false};const header=JSON.parse(text(parts[0])),claims=JSON.parse(text(parts[1]));if(header.alg!=='RS256'||!header.kid)return{ok:false};const now=Math.floor(Date.now()/1000),aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];if(claims.iss!==ISSUER||!aud.includes(AUDIENCE)||claims.repository!==REPOSITORY||String(claims.actor_id)!==ACTOR_ID)return{ok:false};if(Number(claims.exp||0)<=now||Number(claims.nbf||0)>now+60||Number(claims.iat||0)>now+60)return{ok:false};if(!ALLOWED_WORKFLOWS.some(x=>String(claims.workflow_ref||'').includes(x)))return{ok:false};let keys=await fetchJwks();let jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk){keys=await fetchJwks({force:true});jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA')}if(!jwk)return{ok:false};const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);const signed=new TextEncoder().encode(`${parts[0]}.${parts[1]}`),sig=bytes(parts[2]);const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,sig,signed);return valid?{ok:true,claims}:{ok:false}}catch{return{ok:false}}}
function text(s){return new TextDecoder().decode(bytes(s))}function bytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s);return Uint8Array.from(b,c=>c.charCodeAt(0))}async function readJson(r){try{return await r.json()}catch{return{}}}function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
