import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(process.env.TIMBER_BROWSER_PACKAGE||'/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json');
const {chromium,webkit}=require('playwright');const root=path.resolve(import.meta.dirname,'../..','v6-live-acceptance');
const sessions=JSON.parse(fs.readFileSync(path.join(root,'synthetic-sessions.json'),'utf8')),base='https://shiftsometimber.co.uk',cases=[];
const check=(v,m)=>{if(!v)throw Error(m);};
const save=()=>fs.writeFileSync(path.join(root,'support-roundtrip-receipt.json'),JSON.stringify({at:new Date().toISOString(),target:base,syntheticOnly:true,realMemberDataRead:false,externalCommunicationsSent:0,cases},null,2)+'\n');
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
 if(process.env.TIMBER_ENGINE&&process.env.TIMBER_ENGINE!==engine)continue;
 const browser=await type.launch({headless:true});const contexts=[];let member,hq;
 try{
  check(sessions.tag==='my_timber_release_test_v6'&&sessions.hq.role==='support_test','Reserved test sessions required');
  const context=async account=>{const c=await browser.newContext({baseURL:base,viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});contexts.push(c);await c.route('**/v1/events',r=>r.abort());await c.addCookies([{name:account.role?'sst_hq_session':'sst_session',value:account.token,url:base,httpOnly:true,secure:true,sameSite:'Lax'}]);return c;};
  const mc=await context(sessions.members[0]),hc=await context(sessions.hq),other=await context(sessions.members[1]);
  const profile=await(await mc.request.get('/v1/profile')).json();check(profile.profile?.id===sessions.members[0].id&&profile.profile.source===sessions.tag,'Member identity check failed');
  const consent=await mc.request.post('/v1/consents',{headers:{Origin:base},data:{type:'my_shift_health_tracking',granted:false,version:'synthetic-H2-tracking-off'}});check(consent.ok(),'Could not set the test tracking preference');
  member=await mc.newPage();await member.goto('/member/life-back/support#contact');await member.locator('[data-contact-form]').waitFor({timeout:20000});
  const question='Synthetic '+engine+' release test '+crypto.randomUUID()+': I cannot find a saved plan in the app.';
  await member.locator('[data-contact-form] textarea').fill(question);
  const submitted=member.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/life-back/member-support');
  await member.locator('[data-contact-form] button').click();const sent=await submitted;check(sent.ok(),'Member request failed');const {reference}=await sent.json();check(reference.startsWith('APP-'+sessions.members[0].id+'-'),'Reference is not owned by the test member');
  await member.reload();await member.getByRole('heading',{name:reference,exact:true}).waitFor();
  hq=await hc.newPage();await hq.goto('/member/life-back/support-inbox');const ticket=hq.locator('[data-ticket="'+reference+'"]');await ticket.waitFor({timeout:20000});
  const queue=await(await hc.request.get('/v1/life-back/support-inbox')).json();check(queue.tickets.every(t=>sessions.members.some(m=>t.reference.startsWith('APP-'+m.id+'-'))),'HQ test queue exposed a non-test reference');
  await ticket.getByRole('button',{name:'Take ownership',exact:true}).click();await ticket.locator('form').waitFor();
  const reply='Synthetic release test reply: open Stuff, then Saved & plans.';
  await ticket.locator('textarea').fill(reply);const replied=hq.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/life-back/support-inbox');await ticket.locator('form button').click();check((await replied).ok(),'HQ reply failed');
  await member.reload();await member.locator('article').filter({has:member.getByRole('heading',{name:reference,exact:true})}).getByText(reply,{exact:true}).waitFor({timeout:20000});
  const op=await other.newPage();await op.goto('/member/life-back/support#contact');await op.locator('[data-contact-form]').waitFor();check(!(await op.locator('body').innerText()).includes(reference),'Reply leaked to the other member');
  for(const width of [320,360,390,430]){await member.setViewportSize({width,height:844});check(await member.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Member inbox overflow');await member.screenshot({path:path.join(root,'screens',engine+'-H1-member-'+width+'.png'),fullPage:true});await hq.setViewportSize({width,height:844});check(await hq.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'HQ inbox overflow');}
  const resolution=member.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/life-back/member-support');
  await member.locator('article').filter({has:member.getByRole('heading',{name:reference,exact:true})}).getByRole('button',{name:'This answered my question',exact:true}).click();
  check((await resolution).ok(),'Member resolution failed');
  const final=await(await mc.request.get('/v1/life-back/member-support')).json();check(final.tickets.find(t=>t.reference===reference)?.status==='closed','Member resolution did not persist');
  cases.push({engine,id:'H1',status:'PASS',reference,memberQuestion:question,hqReply:reply,replyAuthor:'My Timber automated test operator',actualHumanReplyClaimed:false,refresh:true,otherAccountIsolated:true,widths:[320,360,390,430]});
  cases.push({engine,id:'H2',status:'PASS',optionalTrackingOff:true,attachment:'Question only; no health records',otherAccountIsolated:true});save();console.log(JSON.stringify(cases.slice(-2)));
 }catch(e){cases.push({engine,status:'FAIL',error:e.message,memberBody:member?(await member.locator('body').innerText()).slice(0,3000):null,hqBody:hq?(await hq.locator('body').innerText()).slice(0,3000):null});save();console.log(JSON.stringify(cases.at(-1)));}
 finally{for(const c of contexts)await c.close();await browser.close();}
}
process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
