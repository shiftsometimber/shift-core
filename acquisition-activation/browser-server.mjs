// TEST HARNESS ONLY: loopback, fictional accounts, recording email transport.
// Production imports no file in this test server. No CAPTCHA bypass is deployed.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {fixture,PASSWORD} from './fixture.mjs';
import {measurementAsset} from '../activation-measurement/assets.mjs';
import {handleEmailVerification} from '../auth-email-verification-v1.js';
import {fastMemberRegister} from '../member-register-fastpath-v2.js';
import {fastMemberLogin} from '../member-login-fastpath-v1.js';
import {authenticateMember} from '../member-state-fast-v1.js';
import {memberHealthRoutes} from '../member-experience/health-routes.mjs';
import {myJourneyRoutes} from '../my-journey-v1.js';
import {activationScorecard} from '../activation-measurement/scorecard.mjs';
const f=fixture(),origin='https://shiftsometimber.co.uk';
const json=(d,s=200)=>Response.json(d,{status:s});
async function dispatch(request){
 const u=new URL(request.url),p=u.pathname;
 if(p==='/__test/reset'){for(const t of ['users','user_auth','user_sessions','member_state','member_status','audit_log','auth_tokens','consents'])f.db.exec('DELETE FROM '+t);f.messages.length=0;return json({ok:true})}
 if(p==='/__test/report')return json(await activationScorecard(f.DB,{days:30,now:Date.now()+1000}));
 if(p==='/__test/verify'){
  const email=u.searchParams.get('email');const r=await f.verify(email);return r;
 }
 if(p==='/__test/grant-health'){
  const a=await authenticateMember(request,f.env);if(a.response)return a.response;
  f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(a.userId);return json({ok:true});
 }
 const asset=measurementAsset(request);if(asset)return asset;
 if(p==='/api-adapter-v33d.js')return new Response(readFileSync('frontend/member/api-adapter-v33d.js'),{headers:{'Content-Type':'application/javascript'}});
 if(p.startsWith('/v1/')){
  const login=await fastMemberLogin(request,f.env);if(login)return login;
  const email=await handleEmailVerification(request,f.env,{},fastMemberRegister);if(email)return email;
  const a=await authenticateMember(request,f.env);if(a.response)return a.response;
  if(p==='/v1/me')return json({user:a.user});
  if(p==='/v1/auth/logout'){f.db.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=?').run(new Date().toISOString(),a.userId);return new Response('{"ok":true}',{headers:{'Content-Type':'application/json','Set-Cookie':'sst_session=; Max-Age=0; Path=/; Domain=.shiftsometimber.co.uk; Secure; HttpOnly; SameSite=Lax'}})}
  const gate=await memberHealthRoutes(request,f.env);if(gate)return gate;
  const journey=await myJourneyRoutes(request,f.env);if(journey)return journey;
  return json({error:'not_in_test_harness'},404);
 }
 if(p==='/member/dashboard')return new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated attribution save test</title><script>window.SST_API_BASE=location.origin;</script><script src="/analytics-bootstrap-v1.js"></script><script src="/api-adapter-v33d.js"></script><script defer src="/consent-v4a.js"></script></head><body><h1>Fictional-account attribution test</h1><p>This is not a production dashboard or a clinical assessment.</p><button id="save">Save a fictional Journey</button><p id="result"></p><script>document.querySelector('#save').onclick=async()=>{await fetch('/__test/grant-health');const r=await SST_API.saveMyJourney({journey:{setup:{startDate:'2026-09-01',route:'lifestyle'},weight:{startKg:100,currentKg:99,targetKg:90}}});document.querySelector('#result').textContent=r.ok?'Saved':'Not saved'};</script></body></html>`,{headers:{'Content-Type':'text/html'}});
 if(/\.(?:js|mjs)$/.test(p))return new Response('// Unrelated runtime outside focused attribution test',{headers:{'Content-Type':'application/javascript'}});
 const name=p==='/member-login'||p==='/member-login.html'?'member-login.html':p==='/start-here'?'start-here.html':'programme.html';
 let html=readFileSync('acquisition-proof/baseline/'+name,'utf8');
 // Keep the actual inline public registration form/controller, not a fake register API.
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,tag=>name==='member-login.html'&&tag.includes('SST_API[mode](data)')?tag:'');
 html=html.replace(/<head([^>]*)>/i,'<head$1><script>window.SST_API_BASE=location.origin;</script><script src="/analytics-bootstrap-v1.js"></script><script src="/api-adapter-v33d.js"></script>');
 html=html.replace('</body>','<script src="/consent-v4a.js"></script></body>');
 return new Response(html,{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
}
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const ch of req)chunks.push(ch);const body=Buffer.concat(chunks);const r=await dispatch(new Request(origin+req.url,{method:req.method,headers:req.headers,...(body.length?{body,duplex:'half'}:{})}));const headers=Object.fromEntries(r.headers);if(r.headers.getSetCookie().length)headers['set-cookie']=r.headers.getSetCookie();res.writeHead(r.status,headers);res.end(Buffer.from(await r.arrayBuffer()))}catch(e){console.error('fixture_failure',e.message);res.writeHead(500);res.end('Fixture error')}});
server.listen(8766,'127.0.0.1');process.on('SIGTERM',()=>server.close(()=>{f.db.close();process.exit()}));
