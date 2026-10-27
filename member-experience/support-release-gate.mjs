// Acceptance runs use normal sessions. This selector changes no authentication
// rules and grants no permissions; the selected handlers still authenticate.
const memberEmails=new Set(['my-timber-v6-dan@example.invalid','my-timber-v6-lee@example.invalid','my-timber-v6-moderator@example.invalid','my-timber-v6-review@example.invalid']);
const hash=async raw=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');
export async function isReservedV6AcceptanceRequest(request,env){
 const cookies=request.headers.get('Cookie')||'';
 try{
  for(const match of cookies.matchAll(/(?:^|;\s*)sst_session=([^;]+)/g)){
   const token=decodeURIComponent(match[1]);
   const row=await env.DB.prepare('SELECT u.email,m.source,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id JOIN member_status m ON m.user_id=u.id WHERE s.token_hash=?').bind(await hash(token)).first();
   if(row&&!row.revoked_at&&Date.parse(row.expires_at)>Date.now()&&row.source==='my_timber_release_test_v6'&&memberEmails.has(row.email))return true;
  }
  const match=cookies.match(/(?:^|;\s*)sst_hq_session=([^;]+)/);
  if(match){const row=await env.DB.prepare('SELECT h.email,h.role,h.status,s.expires_at,s.revoked_at FROM hq_sessions s JOIN hq_users h ON h.id=s.hq_user_id WHERE s.token_hash=?').bind(await hash(decodeURIComponent(match[1]))).first();if(row&&!row.revoked_at&&Date.parse(row.expires_at)>Date.now()&&row.status==='active'&&row.role==='support_test'&&row.email==='my-timber-v6-operator@example.invalid')return true;}
 }catch{}
 return false;
}
export async function isV6AcceptanceRequest(request,env){return env.MY_TIMBER_V6_RELEASE_ENABLED==='true'||await isReservedV6AcceptanceRequest(request,env);}
export function gateV6Owner(before,after){return {...before,async fetch(request,env,ctx){
 const path=new URL(request.url).pathname;
 const controlled=path.startsWith('/member/')||path.startsWith('/v1/life-back')||path.startsWith('/assets/member-experience/programme-')||path==='/assets/my-timber-layout.mjs';
 if(!controlled)return before.fetch(request,env,ctx);
 const response=await(await isV6AcceptanceRequest(request,env)?after:before).fetch(request,env,ctx);
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store, private');headers.append('Vary','Cookie');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};}

// The qualified successor must retain the established browser/runtime repairs.
export function composeV6Owner(beforeFactory,afterFactory,original){const inherited=beforeFactory(original);return gateV6Owner(inherited,afterFactory(inherited));}
