// Isolated device acceptance harness. Never part of the production worker.
import {deviceHealthSyncRoute,appendDeviceHealthExport} from '../../member-experience/device-health-sync.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import {connectedHealthMarkup,connectedHealthStyles,connectedHealthRuntime} from '../../member-experience/connected-health.mjs';

const MODE='isolated-health-test';
const HEADERS={'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const json=(body,status=200,extra={})=>Response.json(body,{status,headers:{...HEADERS,...extra}});
async function hash(raw){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function ready(request,env){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||url.hostname==='shiftsometimber.co.uk'||url.hostname.endsWith('.shiftsometimber.co.uk')||env.HEALTH_TEST_ENVIRONMENT!==MODE||typeof env.HEALTH_TEST_ACCESS_CODE!=='string'||env.HEALTH_TEST_ACCESS_CODE.length<24)return false;
 try{
  const marker=await env.DB.prepare("SELECT value FROM health_test_environment WHERE name='environment'").first();
  const unexpected=await env.DB.prepare('SELECT count(*) AS n FROM users WHERE id NOT IN (101,102)').first();
  return marker?.value===MODE&&Number(unexpected?.n)===0;
 }catch{return false}
}
const page=()=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber · isolated health test</title><style>body{background:#050505;color:#e7e3da;font:16px/1.5 Arial;padding:20px;max-width:920px;margin:auto}input,select,button{font:inherit;padding:12px;margin:5px;max-width:100%}label{display:block;margin:12px 0}a{color:#c5cdb3}${connectedHealthStyles}</style><body>
<header><p>DEVELOPMENT ONLY · SEPARATE HEALTH DATABASE</p><h1>My Timber health acceptance</h1><p>Two test accounts. No medicine, payment, email or AI service. Device health values stay in this test database until you clear them or delete the database.</p></header>
<form id="signIn"><label>Test account <select id="testMember"><option value="101">Test member A</option><option value="102">Test member B</option></select></label><label>Private test access code <input id="testCode" type="password" autocomplete="off" required minlength="24"></label><button>Sign in</button></form>
<p id="testResult" role="status"></p><button id="signOut">Sign out</button><button id="enable">Turn optional health tracking on</button><button id="disable">Turn optional health tracking off</button><button id="clear">Delete my test readings</button>
<main>${connectedHealthMarkup}</main><script src="/assets/connected-health-test.mjs"></script><script>
const result=document.getElementById('testResult');
async function send(path,body){const r=await fetch(path,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.message||data.error);return data}
async function run(path,body){try{await send(path,body);location.reload()}catch(e){result.textContent=e.message}}
document.getElementById('signIn').addEventListener('submit',e=>{e.preventDefault();const code=document.getElementById('testCode');const value=code.value;code.value='';run('/health-test/sign-in',{member:Number(document.getElementById('testMember').value),code:value})});
document.getElementById('signOut').onclick=()=>run('/health-test/sign-out',{});
document.getElementById('enable').onclick=()=>run('/health-test/consent',{enabled:true});
document.getElementById('disable').onclick=()=>run('/health-test/consent',{enabled:false});
document.getElementById('clear').onclick=()=>{if(confirm('Delete all readings in this test account?'))run('/health-test/clear',{})};
fetch('/health-test/account',{credentials:'include'}).then(r=>r.json()).then(d=>{result.textContent=d.member?'Signed in: test member '+(d.member===101?'A':'B'):'Sign in to a test account.'});
</script></body></html>`;

export async function healthTestFetch(request,env){
 if(!await ready(request,env))return json({error:'isolated_test_not_ready',message:'The isolated health-test environment is not configured.'},503);
 const url=new URL(request.url),path=url.pathname;
 if(request.method==='GET'&&path==='/v1/device-health/test-environment')return json({environment:MODE});
 if(request.method==='GET'&&path==='/member/dashboard')return new Response(page(),{headers:{...HEADERS,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
 if(request.method==='GET'&&path==='/assets/connected-health-test.mjs')return new Response(connectedHealthRuntime,{headers:{...HEADERS,'Content-Type':'text/javascript; charset=utf-8'}});
 if(request.method==='POST'&&path.startsWith('/health-test/')){
  if(request.headers.get('Origin')!==url.origin)return json({error:'origin_not_allowed'},403);
  if(Number(request.headers.get('Content-Length')||0)>4096)return json({error:'request_too_large'},413);
  const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return json({error:'request_too_large'},413);
  let body;try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
  if(path==='/health-test/sign-in'){
   if(![101,102].includes(body?.member)||typeof body?.code!=='string'||await hash(body.code)!==await hash(env.HEALTH_TEST_ACCESS_CODE))return json({error:'test_access_denied'},401);
   const token=crypto.randomUUID()+crypto.randomUUID(),expires=new Date(Date.now()+8*3600000).toISOString();
   await env.DB.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').bind(body.member,await hash(token),expires).run();
   return json({ok:true,member:body.member},200,{'Set-Cookie':'sst_session='+token+'; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict'});
  }
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  if(path==='/health-test/sign-out'){
   await env.DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE id=?').bind(new Date().toISOString(),auth.user.session_id).run();
   return json({ok:true},200,{'Set-Cookie':'sst_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'});
  }
  if(path==='/health-test/consent'){
   if(typeof body?.enabled!=='boolean')return json({error:'invalid_consent'},400);
   await env.DB.prepare('INSERT INTO consents(user_id,consent_type,granted) VALUES(?,?,?)').bind(auth.userId,'my_shift_health_tracking',body.enabled?1:0).run();return json({ok:true});
  }
  if(path==='/health-test/clear'){
   await env.DB.batch(['device_health_readings','device_health_connections'].map(table=>env.DB.prepare('DELETE FROM '+table+' WHERE user_id=?').bind(auth.userId)));return json({ok:true});
  }
  return json({error:'not_found'},404);
 }
 if(request.method==='GET'&&path==='/health-test/account'){
  const auth=await authenticateMember(request,env);return auth.response?json({member:null},401):json({member:auth.userId});
 }
 if(request.method==='POST'&&path==='/v1/privacy/export'){
  if(request.headers.get('Origin')!==url.origin)return json({error:'origin_not_allowed'},403);
  return appendDeviceHealthExport(request,env,json({environment:MODE}));
 }
 const health=await deviceHealthSyncRoute(request,env);return health||json({error:'not_found'},404);
}
export default {fetch:healthTestFetch};
