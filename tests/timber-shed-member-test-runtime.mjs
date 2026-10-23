// Workerd + two distinct local D1 databases. No remote credentials or member data.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const dep=name=>require(process.env.TIMBER_SHED_RUNTIME_MODULES?process.env.TIMBER_SHED_RUNTIME_MODULES+'/'+name:name);
const {Miniflare}=dep('miniflare'),{build}=dep('esbuild');
const root=new URL('../',import.meta.url);
const bundle=await build({entryPoints:[new URL('member-experience/timber-shed-member-test-entry.mjs',root).pathname],bundle:true,write:false,format:'esm',platform:'browser'});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2025-11-01',d1Databases:{MEMBER_AUTH_DB:'fictional-auth-only',SYNTHETIC_DB:'fictional-content-only'},bindings:{TIMBER_SHED_MEMBER_TEST_RELEASE:'true',TIMBER_SHED_TEST_MEMBER_ID:'11245'},outboundService:()=>new Response(null,{status:503})});
try{
 const auth=await mf.getD1Database('MEMBER_AUTH_DB'),data=await mf.getD1Database('SYNTHETIC_DB');
 for(const sql of ['CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT)','CREATE TABLE user_sessions(id TEXT PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT)'])await auth.prepare(sql).run();
 for(const [id,email,token]of [[11245,'shiftsometimber@gmail.com','local-owner-test-cookie'],[99,'other@example.invalid','local-other-cookie']]){
  await auth.prepare('INSERT INTO users VALUES(?,?)').bind(id,email).run();
  await auth.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').bind(String(id),id,createHash('sha256').update(token).digest('hex'),new Date(Date.now()+3600000).toISOString()).run();
 }
 for(const file of ['timber-shed-acceptance-base.sql','timber-shed-forums.sql','timber-shed-private.sql','timber-shed-acceptance-seed.sql']){
  for(const sql of readFileSync(new URL('member-experience/'+file,root),'utf8').replace(/--[^\n]*/g,'').split(';'))if(sql.trim())await data.prepare(sql).run();
 }
 await data.prepare('INSERT INTO timber_shed_maintenance VALUES(1,?)').bind(new Date().toISOString()).run();
 const checks=[];const check=(name,value)=>{assert(value,name);checks.push(name)};
 async function call(path,{token='local-owner-test-cookie',body,origin='https://shiftsometimber.co.uk'}={}){
  return mf.dispatchFetch('https://shiftsometimber.co.uk'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:'sst_session='+token,...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 }
 check('liveCookieRendersLabelledPage',(await(await call('/member/timber-shed')).text()).includes('PRIVATE TEST · TEST ACCOUNT ONLY'));
 check('unrelatedAccountDenied',(await call('/member/timber-shed',{token:'local-other-cookie'})).status===404);
 check('fictionalCookieNotAcceptedAsLiveLogin',(await call('/member/timber-shed',{token:'fictional-member-one'})).status===401);
 check('unrelatedAccountCannotReadFeed',(await call('/v1/timber-shed/forum/latest',{token:'local-other-cookie'})).status===404);
 const api='/v1/timber-shed/forum/';
 const p=await(await call(api+'participation')).json();check('fictionalEligibilityOnly',p.adultAccess);
 check('testAgreementRecordedOnlyInFictionalDB',(await call(api+'participation/consent',{body:{version:p.policy.version,rulesAccepted:true,privacyAcknowledged:true,healthConsent:true}})).status===200);
 check('testAliasSaved',(await call(api+'profile/save',{body:{displayName:'Test Member'}})).status===201);
 const post=await call(api+'submit',{body:{roomId:'main-shed',title:'Weekend plans',body:'I went for a walk today. It felt good to get outside.'}});const posted=await post.json();
 check('recognisedRoutinePublished',post.status===201&&posted.publication==='automated-routine');
 check('publishedInLiveAccountFeed',(await(await call(api+'latest')).json()).posts.some(p=>p.id===posted.id));
 check('unfamiliarTextHeld',(await call(api+'submit',{body:{roomId:'main-shed',title:'An unfamiliar question',body:'I would like to discuss an unusual situation and hear your thoughts.'}})).status===202);
 check('crossOriginSubmissionDenied',(await call(api+'submit',{origin:'https://elsewhere.example',body:{}})).status===403);
 check('noModeratorRoleFromLiveTestAccount',(await call(api+'moderation')).status===403);
 check('noForumTablesInLiveAuthDB',!(await auth.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'timber_shed_%'").all()).results.length);
 check('noLiveAccountRowCopiedToFictionalDB',!await data.prepare('SELECT id FROM users WHERE id=11245').first());
 await auth.prepare("UPDATE user_sessions SET revoked_at='revoked' WHERE user_id=11245").run();
 check('revokedLiveSessionImmediatelyDenied',(await call('/member/timber-shed')).status===401);
 console.log(JSON.stringify({checks:checks.length,passed:checks,localFictionalOnly:true},null,2));
}finally{await mf.dispose()}
