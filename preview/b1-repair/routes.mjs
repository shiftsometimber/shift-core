// Preview only. Production never imports this module.
import core from '../../worker-entry-v6.js';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function b1PreviewRoutes(request,env,ctx){
 const u=new URL(request.url),p=u.pathname;
 if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT||0))return null;
 if(['/reset-password','/reset-password.html','/member-login.html'].includes(p)&&request.method==='GET'){
  if(p==='/member-login.html')return new Response(null,{status:302,headers:{...headers,Location:'/member-login'+u.search}});
  const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/b1/reset-password.html',u)));if(!r.ok)return new Response('Pinned reset page unavailable',{status:503,headers});
  let body=await r.text();body=body.replace(/https:\/\/api\.shiftsometimber\.co\.uk/g,u.origin).replace(/(<head\b[^>]*>)/i,'$1<script>window.SST_API_BASE=location.origin;</script>').replace(/(<body\b[^>]*>)/i,'$1<aside style="padding:12px;background:#e7e3da;color:#050505">B1 preview — fictional account only. Your live password is unchanged.</aside>');
  return new Response(body,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"}});
 }
 if(!['/v1/auth/request-password-reset','/v1/auth/reset-password','/v1/auth/change-password'].includes(p))return null;
 if(request.method!=='POST'||request.headers.get('Origin')!==u.origin)return new Response('Same-origin POST only',{status:403,headers});
 let checkedEnv={...env,EMAIL:undefined,PUBLIC_SITE_URL:u.origin,ALLOWED_ORIGINS:u.origin};
 if(p==='/v1/auth/request-password-reset'){
  const input=await request.clone().json().catch(()=>({})),email=String(input?.email||'').trim().toLowerCase();
  if(email===env.PREVIEW_B1_MAILBOX&&env.EMAIL){
   // One owner-authorised email per candidate, even on duplicate requests.
   // No tokens or credentials are exposed by this preview-only gate.
   const claim=await env.DB.prepare('INSERT OR IGNORE INTO preview_b1_email_gate(candidate,created_at) VALUES(?,?)').bind(env.PREVIEW_SOURCE_SHA,new Date().toISOString()).run();
   if(Number(claim.meta?.changes)!==1)return Response.json({ok:true,message:'If that account exists, reset instructions will be sent shortly.'},{headers});
   checkedEnv.EMAIL={send:async message=>{
    if(message.to!==env.PREVIEW_B1_MAILBOX||message.subject!=='Reset your My Shift password')throw Error('preview_mail_not_allowed');
    return env.EMAIL.send({...message,subject:message.subject+' [B1 preview '+env.PREVIEW_SOURCE_SHA.slice(0,7)+']'});
   }};
  }
 }
 return core.fetch(request,checkedEnv,ctx);
}
