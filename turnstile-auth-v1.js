const PROTECTED_ACTIONS=new Map([
  ['/v1/auth/register','member_register'],
  ['/v1/auth/login','member_login'],
  ['/v1/auth/request-password-reset','password_reset'],
  ['/v1/hq/auth/bootstrap','hq_bootstrap'],
  ['/v1/hq/auth/login','hq_login']
]);

const truthy=value=>['1','true','yes','on'].includes(String(value||'').toLowerCase());
const clean=value=>String(value||'').trim();
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export function publicTurnstileConfig(env){
  const required=truthy(env.TURNSTILE_REQUIRED),siteKey=clean(env.TURNSTILE_SITE_KEY);
  return {ok:true,enabled:required&&Boolean(siteKey),required,siteKey:required?siteKey:''};
}

export async function turnstileGuard(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/',expectedAction=PROTECTED_ACTIONS.get(path);
  if(request.method!=='POST'||!expectedAction||!truthy(env.TURNSTILE_REQUIRED))return null;
  const secret=clean(env.TURNSTILE_SECRET_KEY),siteKey=clean(env.TURNSTILE_SITE_KEY);
  if(!secret||!siteKey)return json({ok:false,error:'turnstile_not_configured',message:'Secure sign-in is temporarily unavailable.'},503);
  let body={};try{body=await request.clone().json()}catch{}
  const token=clean(body.turnstileToken||body['cf-turnstile-response']);
  if(!token)return json({ok:false,error:'turnstile_required',message:'Complete the security check and try again.'},400);
  const form=new URLSearchParams({secret,response:token,idempotency_key:crypto.randomUUID()});
  const ip=clean(request.headers.get('CF-Connecting-IP'));if(ip)form.set('remoteip',ip);
  let result={};
  try{const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});result=await response.json();if(!response.ok)throw new Error('siteverify_failed')}catch{return json({ok:false,error:'turnstile_unavailable',message:'The security check could not be verified. Please try again.'},503)}
  const allowedHosts=new Set(String(env.TURNSTILE_ALLOWED_HOSTNAMES||'shiftsometimber.co.uk,www.shiftsometimber.co.uk,hq.shiftsometimber.co.uk').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
  if(result.success!==true||result.action!==expectedAction||(result.hostname&&!allowedHosts.has(String(result.hostname).toLowerCase())))return json({ok:false,error:'turnstile_failed',message:'That security check expired or was not accepted. Please try again.'},403);
  return null;
}

export const turnstileInternals={PROTECTED_ACTIONS,truthy};