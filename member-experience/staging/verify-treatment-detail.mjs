// Local synthetic acceptance only: real candidate assets/routes; no production requests.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {treatmentHTML,treatmentStyles,treatmentRuntime} from '../treatment-page.mjs';
import {sessionRuntime} from '../session-state.mjs';
import {treatmentRoutes} from '../treatment-routes.mjs';
const require=createRequire(process.env.TREATMENT_PLAYWRIGHT_PACKAGE||new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright');
const out=process.env.TREATMENT_DETAIL_PROOF_DIR||'treatment-detail-local-proof';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);INSERT INTO users VALUES(1,'synthetic@example.invalid');INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1);");
sql.exec(readFileSync(new URL('../treatment.sql',import.meta.url),'utf8'));
const DB={prepare(query){let values=[];return{bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return{results:sql.prepare(query).all(...values)};},async run(){return{meta:{changes:Number(sql.prepare(query).run(...values).changes)}}}}},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const env={DB,MY_TREATMENT_ENABLED:'true'};
const token=crypto.randomUUID(),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('local-synthetic',1,hash,'2099-01-01');
let rejectNextPost=false;
const server=createServer(async(req,res)=>{
 try{
 const origin='http://127.0.0.1:'+server.address().port,url=origin+req.url;
 let response;const path=new URL(url).pathname;
 const assets={'/member/treatment':[treatmentHTML(false),'text/html'],'/assets/member-experience/treatment.css':[treatmentStyles,'text/css'],'/assets/member-experience/treatment.mjs':[treatmentRuntime,'text/javascript'],'/assets/member-experience/session.mjs':[sessionRuntime,'text/javascript']};
 if(assets[path])response=new Response(assets[path][0],{headers:{'Content-Type':assets[path][1]}});
 else if(path==='/v1/me')response=Response.json({user:{id:1}});
 else if(path.startsWith('/v1/member/treatment')){
  let body='';for await(const part of req)body+=part;
  if(rejectNextPost&&req.method==='POST'){rejectNextPost=false;response=Response.json({error:'test_save_unavailable',message:'Synthetic save unavailable. Your fields remain here.'},{status:503});}
  else response=await treatmentRoutes(new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})}),env);
 }else response=new Response('Not found',{status:404});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500);res.end('Synthetic test server error');errors.push(e.message);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const recordId=crypto.randomUUID(),created=new Date(Date.now()-100*86400000).toISOString();
sql.prepare('INSERT INTO member_treatment_records(id,user_id,medicine,prescription_details,status,supply,next_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(recordId,1,'Mounjaro','Synthetic prescription · follow original instructions','active',8,null,created,created);
function seed(kind,details,daysAgo){const at=new Date(Date.now()-daysAgo*86400000).toISOString();sql.prepare('INSERT INTO member_treatment_events(id,user_id,treatment_id,kind,body_json,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),1,recordId,kind,JSON.stringify(details),at,at);}
seed('dose_taken',{note:'Synthetic previous dose',injectionSite:'abdomen_left'},7);
seed('checkin',{note:'Synthetic check-in',checkin:{weight:93.2,appetite:'Low',energy:'Usual',sideEffects:'Synthetic nausea note',symptomImpact:'Some'}},6);
seed('checkin',{note:'Older entry',checkin:{weight:93.2,appetite:'Usual',energy:'Usual',sideEffects:'OLDER_SYNTHETIC_ENTRY'}},95);
const browser=await chromium.launch({headless:true});
try{
 for(const width of [380,1440]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  await context.addCookies([{name:'sst_session',value:token,url:origin}]);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/member/treatment');await page.getByRole('heading',{name:'Mounjaro',exact:true}).waitFor();
  assert.match(await page.locator('.last-dose').innerText(),/Abdomen · left|Thigh · right/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:out+'/current-'+width+'.png',fullPage:true});
  await page.getByRole('button',{name:'Log a dose',exact:true}).click();
  const form=page.locator('article form').filter({has:page.getByRole('button',{name:'Confirm dose taken'})});
  await form.locator('[name=injectionSite]').selectOption('thigh_right');
  await form.locator('[name=note]').fill('<script>PRIVATE_SYNTHETIC_NOTE</script>');
  rejectNextPost=true;await page.getByRole('button',{name:'Confirm dose taken',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Synthetic save unavailable'}).waitFor();
  assert.equal(await form.locator('[name=note]').inputValue(),'<script>PRIVATE_SYNTHETIC_NOTE</script>');
  await page.getByRole('button',{name:'Confirm dose taken',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Saved to your account.'}).waitFor();
  assert.match(await page.locator('.last-dose').innerText(),/Thigh · right/);
  await page.getByText('Quick treatment check-in',{exact:true}).click();
  const check=page.locator('form').filter({has:page.getByRole('button',{name:'Save check-in',exact:true})});
  await check.locator('[name=appetite]').selectOption('Low');await check.locator('[name=energy]').selectOption('Usual');
  await check.locator('[name=effects]').fill('Synthetic symptom diary');await check.locator('[name=symptomImpact]').selectOption('A little');
  await check.getByText('Food, protein and water (optional)',{exact:true}).click();
  await check.locator('[name=foodNote]').fill('Synthetic breakfast');await check.locator('[name=proteinGrams]').fill('0');await check.locator('[name=waterMl]').fill('250');
  await page.getByRole('button',{name:'Save check-in',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved to your account.'}).waitFor();
  await page.getByRole('button',{name:'Timeline',exact:true}).focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Your treatment timeline',exact:true}).waitFor();
  const timeline=await page.locator('#content').innerText();assert.match(timeline,/Synthetic symptom diary/);assert.match(timeline,/Effect on your day: A little/);assert.match(timeline,/Protein so far that day: 0 g/);assert.match(timeline,/Water so far that day: 250 ml/);assert.match(timeline,/<script>PRIVATE_SYNTHETIC_NOTE<\/script>/);assert(!timeline.includes('OLDER_SYNTHETIC_ENTRY'));assert.equal(await page.locator('#content script').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:out+'/timeline-'+width+'.png',fullPage:true});
  await page.locator('[name=period]').selectOption('all');assert.match(await page.locator('#content').innerText(),/OLDER_SYNTHETIC_ENTRY/);
  await page.getByRole('button',{name:'Doctor summary',exact:true}).click();
  assert.match(await page.locator('.summary').innerText(),/Synthetic breakfast/);assert.match(await page.locator('.summary').innerText(),/Thigh · right/);
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();const download=await downloading;const pdf=out+'/summary-'+width+'.pdf';await download.saveAs(pdf);assert.match(readFileSync(pdf,'utf8'),/Synthetic breakfast/);
  await page.reload();await page.getByRole('heading',{name:'Mounjaro',exact:true}).waitFor();assert.match(await page.locator('.last-dose').innerText(),/Thigh · right/);
  for(const [text,href]of [['Journey','/member/dashboard#journey'],['Measurements & photos','/member/dashboard#visualise'],['Life Back','/member/life-back'],['Food & recipes','/member/grub']])assert.equal(await page.getByRole('link',{name:text,exact:true}).getAttribute('href'),href);
  checks.push({width,pass:true,checks:['last-dose/site','dose-save/failure/retry','symptom/food/water-save','keyboard-timeline','28-day/full-history-filter','text-only-note-rendering','PDF-download','reload-persistence','existing-journey-links','no-overflow']});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:380,height:900}});await context.addCookies([{name:'sst_session',value:token,url:origin}]);const page=await context.newPage();await page.goto(origin+'/member/treatment');await page.getByRole('heading',{name:'Mounjaro',exact:true}).waitFor();
 sql.exec("UPDATE user_sessions SET expires_at='2000-01-01'");await page.reload();await page.waitForFunction(()=>document.getElementById('content').textContent==='');assert(!await page.locator('#content').innerText());assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM member_treatment_events").get().count,7);checks.push({width:380,pass:true,checks:['expired-private-record-cleared','no-duplicate-dose-on-retry']});await context.close();
 assert.deepEqual(errors,[]);
}catch(error){checks.push({pass:false,error:error.stack});process.exitCode=1;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));sql.close();writeFileSync(out+'/receipt.json',JSON.stringify({at:new Date().toISOString(),scope:'Local synthetic candidate browser acceptance, not live or physical-device proof',checks,errors},null,2));console.log(JSON.stringify({pass:checks.every(c=>c.pass),checks,errors}));}
