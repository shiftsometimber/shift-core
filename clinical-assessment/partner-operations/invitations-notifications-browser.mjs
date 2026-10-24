import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import worker from '../portal-release-worker.mjs';
import {partnerRoute} from './api.mjs';
import {notificationManagementRoute} from './notification-management.mjs';
import {notificationEventStatements} from './notification-events.mjs';
const {chromium}=await import('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs');
const db=new DatabaseSync(':memory:'),at=new Date().toISOString();
for(const path of ['./schema.sql','./invitation-drafts.sql','./notification-events.sql','../../migrations/clinical-member-records-v1.sql'])db.exec(readFileSync(new URL(path,import.meta.url),'utf8'));
db.exec(`CREATE TABLE hq_users(id INTEGER PRIMARY KEY,role TEXT,status TEXT,mfa_enabled INTEGER);CREATE TABLE hq_sessions(hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT);
CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER);
CREATE TABLE hq_comms_drafts(id TEXT PRIMARY KEY,hash TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',scheduled_at TEXT NOT NULL,created_by INTEGER NOT NULL,approved_by INTEGER,created_at TEXT NOT NULL,approved_at TEXT,cancelled_at TEXT);
CREATE TABLE hq_comms_recipients(draft_id TEXT NOT NULL,email TEXT NOT NULL,user_id INTEGER,status TEXT NOT NULL DEFAULT 'pending',provider_id TEXT,error_code TEXT,at TEXT,read_at TEXT,PRIMARY KEY(draft_id,email));
CREATE TABLE hq_comms_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,draft_id TEXT,actor_id INTEGER,action TEXT NOT NULL,at TEXT NOT NULL);
CREATE TABLE hq_notification_intents(event_key TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,occurred_at TEXT NOT NULL,recipient_kind TEXT NOT NULL,recipient_user_id INTEGER,template TEXT NOT NULL,link TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'awaiting_review',draft_id TEXT,reason TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
INSERT INTO hq_users VALUES(1,'owner','active',1);INSERT INTO users VALUES(44,'member@example.invalid');INSERT INTO user_auth VALUES(44,1);`);
db.prepare('INSERT INTO hq_sessions VALUES(1,?,?,NULL)').run(createHash('sha256').update('ui-fixture-owner').digest('hex'),'2099-01-01');
const env={PARTNER_OPERATIONS_ENABLED:'true',PARTNER_INTERNAL_SETUP_ONLY:'true',NOTIFICATION_EVENTS_ENABLED:'true',DB:{prepare(sql){return{args:[],bind(...a){this.args=a;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return{results:db.prepare(sql).all(...this.args)};},async run(){return{meta:{changes:Number(db.prepare(sql).run(...this.args).changes)}};}};},async batch(ss){db.exec('BEGIN');try{const out=[];for(const s of ss)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}}};
const auth=async req=>req.headers.get('cookie')?.includes('sst_hq_session=ui-fixture-owner')?{user:{id:1,role:'owner',mfaEnabled:true}}:{response:Response.json({error:'hq_sign_in_required'},{status:401})};
const org={id:'fixture-clinical-partner',kind:'clinical',name:'Fictional Clinical Partner',version:0};db.prepare('INSERT INTO partner_organisations VALUES(?,0,?,?)').run(org.id,JSON.stringify(org),at);
const record={id:'11111111-1111-4111-8111-111111111111',user_id:44,order_number:'TEST-1042'};db.prepare('INSERT INTO clinical_member_records(id,user_id,order_number,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(record.id,44,record.order_number,'TEST',at,at);
db.prepare('INSERT INTO partner_audit VALUES(?,?,?,0,?,?,?,?)').run('ui-event','order',record.order_number,'fictional-pharmacy','fulfilment_dispatch','{}',at);
await env.DB.batch(notificationEventStatements(env,record,{id:'partner:ui-event',kind:'fulfilment_dispatch',source:'partner',sourceId:'ui-event',at}));
const browser=await chromium.launch({headless:true}),errors=[],checks=[];
try{
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:1100}});await ctx.addCookies([{name:'sst_hq_session',value:'ui-fixture-owner',domain:'.shiftsometimber.co.uk',path:'/',secure:true,httpOnly:true,sameSite:'Lax'}]);const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const r=route.request(),req=new Request(r.url(),{method:r.method(),headers:await r.allHeaders(),body:['GET','HEAD'].includes(r.method())?undefined:r.postData()}),url=new URL(r.url());let result;
   if(url.hostname==='api.shiftsometimber.co.uk')result=await notificationManagementRoute(req,env,auth)||await partnerRoute(req,env,auth);
   else if(url.hostname==='hq.shiftsometimber.co.uk')result=await worker.fetch(req,env);
   assert(result,'No external network calls are permitted in this local fixture');await route.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:Buffer.from(await result.arrayBuffer())});
  });
  await page.goto('https://hq.shiftsometimber.co.uk/clinical-portal/partners');await page.getByRole('heading',{name:'Clinicians & GPs',exact:true}).waitFor();
  await page.screenshot({path:'partner-proof/invites-overview-'+width+'.png',fullPage:true});
  await page.getByRole('button',{name:'Invite clinician',exact:true}).click();await page.getByLabel('Partner organisation',{exact:true}).selectOption(org.id);await page.getByLabel('Full name',{exact:true}).fill('Dr Example '+width);await page.getByLabel('Professional email',{exact:true}).fill('doctor'+width+'@example.invalid');await page.getByLabel('Professional role',{exact:true}).selectOption('GP');await page.getByRole('button',{name:'Prepare invitation draft',exact:true}).click();await page.getByRole('heading',{name:'Invitation prepared · not sent',exact:true}).waitFor();assert.match(await page.locator('.invitation-preview').innerText(),/doctor\d+@example.invalid/);
  await page.reload();await page.getByText('Prepared invitations · not sent',{exact:true}).click();await page.getByRole('button',{name:'View invitation drafts',exact:true}).click();await page.getByRole('button',{name:'clinician · Dr Example '+width+' · not sent',exact:true}).click();await page.getByRole('heading',{name:'Invitation prepared · not sent',exact:true}).waitFor();assert.equal(await page.locator('input[type=file]').count(),0);
  await page.getByRole('button',{name:'Invite partner',exact:true}).click();await page.getByLabel('Partner organisation',{exact:true}).selectOption(org.id);await page.getByLabel('Full name',{exact:true}).fill('Partner Example '+width);await page.getByLabel('Professional email',{exact:true}).fill('partner'+width+'@example.invalid');await page.getByRole('button',{name:'Prepare invitation draft',exact:true}).click();await page.getByRole('heading',{name:'Invitation prepared · not sent',exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'partner-proof/invite-draft-'+width+'.png',fullPage:true});
  await page.goto('https://hq.shiftsometimber.co.uk/clinical-portal/notifications');await page.getByRole('button',{name:/TEST-1042/}).click();await page.getByRole('heading',{name:'Your order has been dispatched',exact:true,level:2}).waitFor();await page.getByRole('button',{name:'Prepare email & app drafts for review',exact:true}).click();await page.getByText('draft awaiting approval',{exact:true}).first().waitFor();assert.equal(await page.getByRole('heading',{name:'whatsapp',exact:true}).count(),1);assert.match(await page.locator('#detail').innerText(),/awaiting template opt in and provider/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'partner-proof/notification-review-'+width+'.png',fullPage:true});checks.push({width,clinicianBanner:true,clinicianInvitePersisted:true,partnerInvitePersisted:true,fullDraftPreview:true,threeChannelReview:true,overflow:false});await ctx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(db.prepare('SELECT COUNT(*) n FROM partner_invitation_drafts').get().n,4);assert.equal(db.prepare('SELECT COUNT(*) n FROM partner_access_tokens').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,2);assert.equal(db.prepare("SELECT COUNT(*) n FROM hq_comms_drafts WHERE status<>'draft' OR approved_at IS NOT NULL").get().n,0);assert.equal(db.prepare("SELECT COUNT(*) n FROM hq_comms_recipients WHERE status<>'pending'").get().n,0);
 const receipt={at:new Date().toISOString(),scope:'Actual UI and routes with local SQLite and fictional HQ identity; not production signed-in acceptance',checks,errors,messagesSent:0,accessTokensCreated:0};await writeFile('partner-proof/invitations-notifications-browser-receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{await browser.close();db.close();}
