// ISOLATED TEST HARNESS ONLY. Never imported by the production Worker.
// Actual Passport/Journey/authentication handlers and SQLite; fictional login.
// Unrelated dashboard runtimes are omitted, so this is focused integration only.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fixture} from './fixture.mjs';
import {passportRoutes,appendPassportExport} from './routes.mjs';
import {passportAssets,withPassportPresentation} from './presentation.mjs';
import {myJourneyRoutes} from '../my-journey-v1.js';
import {authenticateMember} from '../member-state-fast-v1.js';
import {memberHealthRoutes} from '../member-experience/health-routes.mjs';
import {healthRuntime} from '../member-experience/health-runtime.mjs';
import {memberChromeClient} from '../member-experience/chrome.mjs';
import {privacyHealthErasureRoute} from '../privacy-health-erasure-route-v1.js';
const fixtureDB=fixture(),{db,env}=fixtureDB;
const baseline=resolve(process.env.PASSPORT_BASELINE||'passport-proof/baseline');
const manifest=JSON.parse(readFileSync(join(baseline,'manifest.json'),'utf8'));
const lookup=new Map(manifest.map(x=>[x.path,x]));
const port=Number(process.env.PORT||8765),origin='http://127.0.0.1:'+port;
const initialPrefs=db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences;
const initialProgress=db.prepare('SELECT * FROM progress_entries').all();
function reset(){db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(initialPrefs);db.exec('DELETE FROM progress_entries');for(const row of initialProgress){const keys=Object.keys(row);db.prepare('INSERT INTO progress_entries('+keys.join(',')+') VALUES('+keys.map(()=>'?').join(',')+')').run(...Object.values(row));}db.exec("DELETE FROM health_passport_records; DELETE FROM audit_log;DELETE FROM consents;INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0),(2,'my_shift_health_tracking',0);UPDATE member_state SET preferences='{\"grubV2\":{\"savedRecipes\":[\"kept\"]}}' WHERE user_id=2;");}
reset();
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function coreMe(request){const a=await authenticateMember(request,env);return a.response||json({user:a.user});}
async function dispatch(request){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/__preview/reset'&&request.method==='POST'){reset();return json({ok:true})}
 if(path==='/__preview/login'&&request.method==='POST'){
  const form=await request.formData(),id=form.get('email')==='fictional-1@example.invalid'?1:form.get('email')==='fictional-2@example.invalid'?2:0;
  if(!id||form.get('password')!=='preview-only')return json({error:'invalid_preview_credentials'},401);
  return new Response(null,{status:303,headers:{Location:'/member/dashboard?passport=1#journey','Set-Cookie':'sst_session='+fixtureDB.sessions.get(id)+'; Path=/; HttpOnly; SameSite=Lax','Cache-Control':'no-store'}});
 }
 if(path==='/__preview/login')return new Response('<!doctype html><html lang="en"><head><title>Isolated SHIFT preview login</title><meta name="robots" content="noindex"><style>body{font:18px Arial;background:#050505;color:#E7E3DA;max-width:650px;margin:60px auto;padding:24px}label{display:block;margin:20px 0}input,button{font:18px Arial;padding:12px;display:block;max-width:100%;box-sizing:border-box}input{width:100%}</style></head><body><h1>Isolated preview</h1><p>Fictional accounts. No production data, payment or clinical service.</p><form action="/__preview/login" method="post"><label>Email<input name="email" type="email" required></label><label>Preview password<input name="password" type="password" required></label><button>Sign in to the preview</button></form></body></html>',{headers:{'Content-Type':'text/html'}});
 if(path.startsWith('/v1/')){
  const p=await passportRoutes(request,env);if(p)return p;
  const a=await authenticateMember(request,env);if(a.response)return a.response;
  if(path==='/v1/me')return json({user:a.user});
  if(path==='/v1/auth/logout')return new Response('{"ok":true}',{headers:{'Content-Type':'application/json','Set-Cookie':'sst_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'}});
  if(path==='/v1/consents'){
   if(request.method==='POST'){const b=await request.json();if(b.type!=='my_shift_health_tracking'||typeof b.granted!=='boolean')return json({error:'invalid_consent'},400);db.prepare('INSERT INTO consents(user_id,consent_type,granted,consent_version) VALUES(?,?,?,?)').run(a.userId,b.type,b.granted?1:0,b.version||'preview');return json({ok:true})}
   return json({consents:db.prepare('SELECT * FROM consents WHERE user_id=? ORDER BY id DESC').all(a.userId)});
  }
  if(path==='/v1/privacy/export')return appendPassportExport(request,env,json({user:{id:a.userId},source:'isolated_preview'}));
  const erase=await privacyHealthErasureRoute(request,env,{},coreMe);if(erase)return erase;
  const gate=await memberHealthRoutes(request,env);if(gate)return gate;
  const journey=await myJourneyRoutes(request,env);if(journey)return journey;
  return json({error:'unimplemented_preview_route',path},404);
 }
 const asset=passportAssets(request,env);if(asset)return asset;
 const overrides={'/api-adapter-v33d.js':['frontend/member/api-adapter-v33d.js','application/javascript'],'/member-my-journey-v2.js':['frontend/member/member-my-journey-v2.js','application/javascript']};
 if(overrides[path]){const [file,type]=overrides[path];return new Response(readFileSync(file),{headers:{'Content-Type':type}})}
 if(path==='/assets/member-experience/health.mjs')return new Response(healthRuntime,{headers:{'Content-Type':'application/javascript'}});
 if(path==='/assets/member-experience/chrome.mjs')return new Response(memberChromeClient,{headers:{'Content-Type':'application/javascript'}});
 if(path==='/treatment-order')return new Response('<h1>Preview navigation checkpoint</h1><p>Original medicine recommendation destination preserved. No purchase or clinical actions run in this preview.</p>',{headers:{'Content-Type':'text/html'}});
 const item=lookup.get(path+url.search)||lookup.get(path)||manifest.find(x=>new URL(x.path,origin).pathname===path);
 if(!item)return new Response('Not part of isolated preview',{status:404});
 let body=readFileSync(join(baseline,item.name));
 if(['/start-here','/member/dashboard','/member/settings'].includes(path)){
  let html=body.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  const notice='<aside style="padding:10px 18px;background:#E7E3DA;color:#050505;font:14px Arial" data-preview-notice>Isolated integration preview · fictional accounts and data · no production writes</aside>';
  html=html.replace(/(<body\b[^>]*>)/i,'$1'+notice);
  if(path==='/member/dashboard'){
   // Anonymous capture requires both hidden-state and is-ready state changes.
   // Only the real cookie/session verifier authorises this TEST HARNESS render.
   const auth=await authenticateMember(request,env);
   if(auth.response)return new Response(null,{status:302,headers:{Location:'/__preview/login','Cache-Control':'no-store'}});
   html=html.replace(/(<section\b[^>]*\bid="previewAuth")([^>]*>)/,'$1 hidden$2');
   html=html.replace(/(<(?:section|nav)\b[^>]*\bid="(?:previewMember|memberTabs)"[^>]*?)\s+hidden(?:="[^"]*")?/g,'$1');
   html=html.replace('class="preview-member"','class="preview-member is-ready"');
  }
  let scripts='<script>window.SST_API_BASE=location.origin;</script>';
  if(path==='/start-here')scripts+='<script defer src="/start-here-v72.js?v=direct-detail-20260912"></script>';
  else scripts+='<script defer src="/api-adapter-v33d.js"></script><script defer src="/assets/member-experience/health.mjs"></script>'+(path==='/member/dashboard'?'<script defer src="/member-my-journey-v2.js"></script><script defer src="/assets/member-experience/chrome.mjs"></script>':'');
  html=html.replace('</body>',scripts+'</body>');body=Buffer.from(html);
 }
 return withPassportPresentation(request,env,new Response(body,{headers:{'Content-Type':item.type,'Cache-Control':'no-store'}}));
}
const server=createServer(async(req,res)=>{try{const parts=[];for await(const chunk of req)parts.push(chunk);const body=Buffer.concat(parts);const request=new Request(origin+req.url,{method:req.method,headers:req.headers,...(body.length?{body,duplex:'half'}:{})});const response=await dispatch(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error('PREVIEW ERROR',e);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'preview_server_error',message:e.message}));}});
server.listen(port,'127.0.0.1',()=>console.log('Isolated preview listening on '+origin));
process.on('SIGTERM',()=>server.close(()=>{fixtureDB.close();process.exit()}));
