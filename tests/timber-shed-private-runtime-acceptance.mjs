// Actual cookie authentication + local workerd/D1. Fictional accounts only.
// Runtime dependencies may be supplied from an existing Wrangler installation.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=fileURLToPath(new URL('../',import.meta.url));
const dependency=name=>require(process.env.TIMBER_SHED_RUNTIME_MODULES?process.env.TIMBER_SHED_RUNTIME_MODULES+'/'+name:name);
const {build}=dependency('esbuild'),{Miniflare}=dependency('miniflare');
const entry=String.raw`
import {timberShedForumRoutes} from './member-experience/timber-shed-forum-routes.mjs';
import {authenticateMember} from './member-state-fast-v1.js';
import {appendTimberShedPrivateExport,timberShedPrivateRoutes} from './member-experience/timber-shed-private.mjs';
import {timberShedForumPilotMarkup,timberShedForumPilotCSS,timberShedForumPilotClient} from './member-experience/timber-shed-forum-ui.mjs';
export default {async fetch(request,env){
 const pathname=new URL(request.url).pathname;
 if(pathname==='/member/timber-shed'){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const html='<!doctype html><html lang="en-GB"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#050505;color:#e7e3da;font:16px Arial;padding:20px}.section{max-width:1100px;margin:auto}'+timberShedForumPilotCSS+'</style>'+timberShedForumPilotMarkup+'<script>'+timberShedForumPilotClient+'</script></html>';
  return new Response(html,{headers:{'Content-Type':'text/html','Cache-Control':'private, no-store'}});
 }
 if(pathname==='/v1/privacy/export'&&request.method==='POST'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return new Response(null,{status:403});
  return appendTimberShedPrivateExport(request,env,Response.json({syntheticBaseExport:true}));
 }
 return await timberShedForumRoutes(request,env)||await timberShedPrivateRoutes(request,env)||new Response(null,{status:404});
}};
`;
const bundle=await build({stdin:{contents:entry,resolveDir:root,sourcefile:'timber-shed-synthetic-entry.mjs'},bundle:true,format:'esm',platform:'browser',write:false});
const flags={TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_PRIVATE_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2025-11-01',d1Databases:{DB:'timber-shed-synthetic-only'},bindings:flags,host:'127.0.0.1',port:0,outboundService:()=>new Response(null,{status:503})});
let browser;
try{
 const db=await mf.getD1Database('DB'),origin=String(await mf.ready).replace(/\/$/,'');
 for(const sql of [
 'CREATE TABLE users(id INTEGER PRIMARY KEY,date_of_birth TEXT)',
 'CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER)',
 'CREATE TABLE user_sessions(id TEXT PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT)',
 ...readFileSync(root+'member-experience/timber-shed-forums.sql','utf8').replace(/--[^\n]*/g,'').split(';'),
 ...readFileSync(root+'member-experience/timber-shed-private.sql','utf8').replace(/--[^\n]*/g,'').split(';')
 ])if(sql.trim())await db.prepare(sql).run();
 const tokens={1:'fictional-member-one',2:'fictional-member-two',3:'fictional-moderator-one',6:'fictional-moderator-two'};
 for(const id of [1,2,3,6]){
  await db.prepare("INSERT INTO users VALUES(?,?)").bind(id,'1980-01-01').run();
  await db.prepare("INSERT INTO user_auth VALUES(?,1)").bind(id).run();
  await db.prepare("INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)").bind('synthetic-session-'+id,id,createHash('sha256').update(tokens[id]).digest('hex'),new Date(Date.now()+3600000).toISOString()).run();
 }
 for(const id of [3,6])await db.prepare("INSERT INTO timber_shed_forum_moderators VALUES(?,1,'now')").bind(id).run();
 const checks=[];
 const check=(name,value)=>{assert(value,name);checks.push(name)};
 async function call(id,route,body,options={}){
  const path=route.startsWith('/')?route:'/v1/timber-shed/forum/'+route;
  const headers={Cookie:'sst_session='+tokens[id],...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...options.headers};
  const response=await mf.dispatchFetch(origin+path,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();return{status:response.status,data};
 }
 check('unauthenticatedDenied',(await mf.dispatchFetch(origin+'/v1/timber-shed/forum/rooms')).status===401);
 check('forgedIdentityIgnored',(await mf.dispatchFetch(origin+'/v1/timber-shed/forum/rooms',{headers:{'x-member':'1'}})).status===401);
 for(const [id,name] of [[1,'Shed Walker'],[2,'Weekend Walker']])check('profile'+id,(await call(id,'profile/save',{displayName:name})).status===201);
 const post=await call(1,'submit',{roomId:'main-shed',title:'A synthetic discussion',body:'This is fictional content for private runtime testing.'});
 check('submissionPending',post.status===202);
 check('pendingInvisible',(await call(2,'latest')).data.posts.length===0);
 check('myPostsIsolated',(await call(2,'mine')).data.posts.length===0);
 check('moderatorApproval',(await call(3,'moderate',{postId:post.data.id,action:'approve'})).status===200);
 check('approvedVisible',(await call(2,'latest')).data.posts.length===1);
 check('actualD1NotificationAtomic',(await call(1,'notifications')).data.unreadCount===1);
 check('crossOriginDenied',(await call(2,'block',{postId:post.data.id},{headers:{Origin:'https://elsewhere.test'}})).status===403);
 check('blockApplied',(await call(2,'block',{postId:post.data.id})).status===200);
 check('blockedDirectReadDenied',(await call(2,'threads?room=main-shed&threadId='+post.data.id)).data.posts.length===0);
 const block=(await call(2,'blocks')).data.blocks[0];
 check('otherAccountCannotUnblock',(await call(1,'unblock',{blockId:block.id})).status===200&&(await call(2,'blocks')).data.blocks.length===1);
 await call(2,'unblock',{blockId:block.id});
 const rejected=await call(1,'submit',{roomId:'main-shed',title:'Another synthetic discussion',body:'A fictional post to test a moderation appeal.'});
 await call(3,'moderate',{postId:rejected.data.id,action:'reject'});
 const appeal=await call(1,'appeal',{postId:rejected.data.id,reason:'missed-context'});
 check('actualD1AppealCreated',appeal.status===202);
 check('independentReviewerRequired',(await call(3,'appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===403);
 check('actualD1AppealTransaction',(await call(6,'appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===200);
 check('appealNeverPublishes',(await call(2,'latest')).data.posts.length===1);
 const restriction=await call(3,'restrict',{postId:post.data.id,kind:'banned',reason:'harassment'});
 check('actualD1RestrictionCreated',restriction.status===201);
 check('restrictedSessionDenied',(await call(1,'latest')).status===403);
 check('ownDataStillAccessible',(await call(1,'mine')).status===200);
 const accessAppeal=await call(1,'restriction/appeal',{restrictionId:restriction.data.id,reason:'other'});
 check('actualD1AccessAppeal',accessAppeal.status===202);
 check('actualD1Reinstatement',(await call(6,'restriction/review',{appealId:accessAppeal.data.id,outcome:'reinstated'})).status===200);
 check('accessRestored',(await call(1,'latest')).status===200);
 const exportResult=await call(1,'/v1/privacy/export',{});
 check('wholeAccountExportIntegrated',exportResult.status===200&&exportResult.data.syntheticBaseExport&&exportResult.data.timberShedForum.posts.length===2);
 check('exportExcludesOtherAccount',(await call(2,'export')).data.forum.posts.length===0);
 // Verify rollback in actual D1 batch, not only Node's SQLite facade.
 await db.prepare("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON timber_shed_access_audit BEGIN SELECT RAISE(ABORT,'synthetic audit failure'); END").run();
 check('actualD1FailureClosed',(await call(3,'restrict',{postId:post.data.id,kind:'banned',reason:'other'})).status===503);
 check('actualD1BatchRolledBack',(await call(1,'access')).data.restriction===null);
 await db.prepare("DROP TRIGGER synthetic_audit_failure").run();
 await db.prepare("UPDATE user_sessions SET revoked_at=? WHERE user_id=2").bind(new Date().toISOString()).run();
 check('revocationStopsExistingCookie',(await call(2,'mine')).status===401);
 await db.prepare("UPDATE user_sessions SET revoked_at=NULL,expires_at=? WHERE user_id=2").bind(new Date(Date.now()-1000).toISOString()).run();
 check('expiredCookieDenied',(await call(2,'mine')).status===401);
 await db.prepare("UPDATE user_sessions SET expires_at=? WHERE user_id=2").bind(new Date(Date.now()+3600000).toISOString()).run();
 if(process.env.TIMBER_SHED_PUPPETEER_PATH){
  const puppeteer=require(process.env.TIMBER_SHED_PUPPETEER_PATH);
  browser=await puppeteer.launch({headless:true,executablePath:process.env.TIMBER_SHED_CHROME_PATH,args:['--no-sandbox']});
  for(const [viewport,width,height] of [['desktop',1440,900],['mobile',390,844]]){
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
   await page.setViewport({width,height,deviceScaleFactor:1});
   await page.setCookie({name:'sst_session',value:tokens[2],url:origin,httpOnly:true,sameSite:'Strict'});
   await page.goto(origin+'/member/timber-shed',{waitUntil:'networkidle0'});
   await page.click('#shedLatestItems button');
   await page.waitForSelector('#shedTopics .shed-topic-live');
   const controls=await page.$$('#shedTopics .shed-topic-live button');
   const blockControl=await Promise.all(controls.map(async b=>({b,text:await b.evaluate(el=>el.textContent)})));
   await blockControl.find(b=>b.text==='Block this member').b.click();
   await page.waitForFunction(()=>document.getElementById('shedForumStatus').textContent.includes('hidden from each other'));
   await page.click('[data-shed-view="safety"]');
   await page.waitForFunction(()=>document.getElementById('shedBlocks').textContent.includes('Shed Walker'));
   await page.click('#shedBlocks button');
   await page.waitForFunction(()=>document.getElementById('shedBlocks').textContent.includes('not blocked anyone'));
   const buttons=await page.$$eval('button:not([hidden])',els=>els.filter(e=>e.offsetParent).map(e=>e.getAttribute('aria-label')||e.textContent.trim()));
   check('browser'+viewport+'ButtonsNamed',buttons.every(Boolean));
   check('browser'+viewport+'NoOverflow',!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
   check('browser'+viewport+'NoPageErrors',errors.length===0);
   await page.close();
  }
  const moderatorPage=await browser.newPage();moderatorPage.setDefaultTimeout(12000);
  await moderatorPage.setViewport({width:390,height:844,deviceScaleFactor:1});
  await moderatorPage.setCookie({name:'sst_session',value:tokens[3],url:origin,httpOnly:true,sameSite:'Strict'});
  await moderatorPage.goto(origin+'/member/timber-shed',{waitUntil:'networkidle0'});
  await moderatorPage.click('[data-shed-view="moderation"]');
  await moderatorPage.waitForNetworkIdle({idleTime:200});
  await moderatorPage.waitForSelector('#shedQueue details');
  await moderatorPage.click('#shedQueue details summary');
  await moderatorPage.click('#shedQueue details button');
  check('moderatorUIRequiresDeliberateConfirmation',(await call(1,'access')).data.restriction===null);
  await moderatorPage.click('#shedQueue details input[type=checkbox]');
  await moderatorPage.click('#shedQueue details button');
  await moderatorPage.waitForFunction(()=>document.getElementById('shedForumStatus').textContent.includes('restriction applied'));
  check('moderatorUICanSuspend',(await call(1,'access')).data.restriction?.kind==='suspended');
  check('moderatorExpandedControlsNoOverflow',!await moderatorPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await moderatorPage.click('#shedRestrictions button');
  await moderatorPage.waitForFunction(()=>document.getElementById('shedForumStatus').textContent.includes('access restored'));
  check('moderatorUICanRestore',(await call(1,'access')).data.restriction===null);
  await moderatorPage.close();
  const restricted=await call(3,'restrict',{postId:post.data.id,kind:'suspended',days:1,reason:'other'});
  const page=await browser.newPage();page.setDefaultTimeout(12000);
  await page.setCookie({name:'sst_session',value:tokens[1],url:origin,httpOnly:true,sameSite:'Strict'});
  await page.goto(origin+'/member/timber-shed',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>!document.getElementById('shedSafetyView').hidden);
  check('restrictedBrowserExplainsAccess',await page.$eval('#shedAccessStatus',el=>el.textContent.includes('suspended')));
  check('restrictedBrowserKeepsAppeal',await page.$eval('#shedAccessStatus',el=>el.textContent.includes('Appeal community restriction')));
  await page.close();await call(3,'restriction/lift',{restrictionId:restricted.data.id});
 }
 check('leaveClearsAccountContent',(await call(1,'leave',{confirm:'leave-community'})).status===200);
 check('leaveRemovesVisiblePosts',(await call(2,'latest')).data.posts.length===0);
 check('leaveKeepsMyTimberSession',(await call(1,'mine')).status===200);
 console.log(JSON.stringify({localRuntime:true,actualCookieAuthentication:true,actualD1:true,syntheticAccountsOnly:true,checks:checks.length,passed:checks},null,2));
}finally{if(browser)await browser.close();await mf.dispose()}
