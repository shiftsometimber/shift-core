import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(process.env.TIMBER_BROWSER_PACKAGE||'/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json');
const {chromium,webkit}=require('playwright');
const root=path.resolve(import.meta.dirname,'../..','v6-live-acceptance');
const sessions=JSON.parse(fs.readFileSync(path.join(root,'synthetic-sessions.json'),'utf8'));
const base='https://shiftsometimber.co.uk',results=[];
const check=(v,m)=>{if(!v)throw Error(m);};
const receipt=()=>fs.writeFileSync(path.join(root,'core-journey-receipt.json'),JSON.stringify({at:new Date().toISOString(),target:base,syntheticOnly:true,externalCommunicationsSent:0,physicalPhoneTested:false,cases:results},null,2)+'\n');
async function run(name,engine){
 const b=await engine.launch({headless:true});const c=await b.newContext({baseURL:base,viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
 const user=sessions.members[name==='chromium'?0:1];check(sessions.tag==='my_timber_release_test_v6'&&['my-timber-v6-dan@example.invalid','my-timber-v6-lee@example.invalid'].includes(user.email),'Synthetic identity required');
 await c.addCookies([{name:'sst_session',value:user.token,url:base,httpOnly:true,secure:true,sameSite:'Lax'}]);
 await c.route('**/v1/events',r=>r.abort());const page=await c.newPage();page.setDefaultTimeout(15000);
 const api=async(url,body)=>{const r=body?await c.request.post(url,{data:body,headers:{Origin:base}}):await c.request.get(url);const d=await r.json();check(r.ok(),url+' HTTP '+r.status()+' '+(d.error||''));return d;};
 const state=async()=>api('/v1/life-back');
 const record=async(id,detail={})=>{const screenshot=path.join(root,'screens',name+'-core-'+id.replaceAll(':','-')+'.png');await page.screenshot({path:screenshot,fullPage:true});results.push({engine:name,id,status:'PASS',...detail,screenshot});receipt();console.log(JSON.stringify({engine:name,id,status:'PASS',...detail}));};
 const ready=async()=>{await page.locator('#supportPlanMain h1').waitFor();};
 const reload=async()=>{await page.goto('/member/life-back/support');await ready();};
 const expand=async el=>{const parents=el.locator('xpath=ancestor::details');for(let i=await parents.count()-1;i>=0;i--){const p=parents.nth(i);if(await p.getAttribute('open')===null)await p.locator(':scope > summary').click();}};
 const submit=async(action,click)=>{const [response]=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/life-back'&&r.request().postDataJSON()?.action===action),click()]);const d=await response.json();check(response.ok(),action+' HTTP '+response.status()+' '+(d.error||''));await ready();return d;};
 const start=async(words='Synthetic late finishes make dinner difficult')=>{const form=page.locator('[data-support-start]');await expand(form);await form.locator('[name="choice"]').selectOption('late');await form.locator('[name="words"]').fill(words);return submit('support-start',()=>form.locator('button').click());};
 const feedback=async(outcome,reason)=>{if(outcome==='not-fit'){await page.locator('[data-support-feedback="not-fit"]').click();return submit('shift-feedback',()=>page.locator('[data-support-reason="'+reason+'"]').click());}return submit('shift-feedback',()=>page.locator('[data-support-feedback="'+outcome+'"]').click());};
 try{
  const profile=(await api('/v1/profile')).profile;check(profile.id===user.id&&profile.source===sessions.tag,'Account guard failed');
  await api('/v1/consents',{type:'my_shift_health_tracking',granted:true,version:'synthetic-release-acceptance-v6'});
  let current=await state();await api('/v1/life-back',{action:'goal',goal:'Synthetic goal: more energy for family time',expectedAccount:user.id,revision:current.progress.revision,operationId:crypto.randomUUID()});
  await reload();
  for(const reason of ['timing','effort','idea']){
   const before=await start('Synthetic late finish: dinner goes wrong after work');const initial=before.progress.nextShift;
   const after=await feedback('not-fit',reason);check(after.progress.nextShift?.id!==initial.id,'Rejected offer repeated');
   if(reason==='timing')check(after.progress.nextShift?.kind==='routine','Wrong time did not change timing');
   check(after.progress.supportSummary.response.includes(reason==='timing'?'timing':reason==='effort'?'effort':'idea')||reason==='effort'&&after.progress.supportSummary.response.includes('simpler'),'Reason not reflected');
   await page.reload();await ready();await record('C2:'+reason,{before:initial.practical?.name,after:after.progress.nextShift?.practical?.name||after.progress.nextShift?.title});
  }
  for(const outcome of ['helped','not-fit','not-helped','not-tried']){
   const before=await start();const id=before.progress.nextShift.id;const after=await feedback(outcome,'idea');await page.reload();await ready();const fresh=await state();
   const rows=[...(fresh.progress.shiftHistory||[]),fresh.progress.nextShift].filter(Boolean);check(rows.some(x=>x.id===id&&x.reviews?.some(r=>r.outcome===outcome)),'Outcome not saved');
   if(outcome==='not-tried')check(fresh.progress.nextShift.id===id,'Untried step replaced');if(['not-fit','not-helped'].includes(outcome))check(fresh.progress.nextShift?.id!==id,'Unsuitable step repeated');
   await record('C4:'+outcome);
  }
  // Correction and deletion are performed through actual member controls.
  await start('Synthetic words to correct in the member interface');let fresh=await state();const memory=fresh.progress.memberSupport.memories.at(-1);
  let form=page.locator('[data-support-memory="'+memory.id+'"]');await expand(form);await form.locator('textarea').fill('Synthetic corrected words: my shifts have changed');
  await submit('support-memory',()=>form.getByRole('button',{name:'Save correction',exact:true}).click());await page.reload();await ready();
  form=page.locator('[data-support-memory="'+memory.id+'"]');await expand(form);check(await form.locator('textarea').inputValue()==='Synthetic corrected words: my shifts have changed','Correction lost after refresh');
  await record('F1:memory-correct');
  page.once('dialog',d=>d.accept());await submit('support-memory',()=>page.locator('[data-support-delete="'+memory.id+'"]').click());await page.reload();await ready();check(await page.locator('[data-support-memory="'+memory.id+'"]').count()===0,'Deleted memory returned');await record('F1:memory-delete');
  const goal=page.locator('[data-record="goal"]');await expand(goal);await goal.locator('textarea').fill('Synthetic corrected goal');await submit('support-record',()=>goal.locator('button').first().click());await page.reload();await ready();await expand(page.locator('[data-record="goal"]'));check(await page.locator('[data-record="goal"] textarea').inputValue()==='Synthetic corrected goal','Goal correction lost');await record('F1:goal-correct');
  await start();fresh=await state();const helpfulBefore=fresh.progress.supportSummary.helpful.reduce((n,x)=>n+x.count,0);
  await submit('support-accept-step',()=>page.locator('[data-support-accept]').click());await page.reload();await ready();fresh=await state();check(fresh.progress.supportSummary.helpful.reduce((n,x)=>n+x.count,0)===helpfulBefore,'Keeping a plan invented helpful feedback');await record('F4:keep-not-helped');
  let plan=page.locator('[data-record="plan"]');await expand(plan);await plan.locator('textarea').fill('Synthetic edited agreed plan');await submit('support-record',()=>plan.locator('button').first().click());await page.reload();await ready();await expand(page.locator('[data-record="plan"]'));check(await page.locator('[data-record="plan"] textarea').inputValue()==='Synthetic edited agreed plan','Agreed-plan correction lost');await record('F5:plan-correct');
  for(const preference of ['weekly','monthly','on-request','never','fortnightly']){
   const pref=page.locator('[data-review-preference]');await expand(pref);await pref.locator('select').selectOption(preference);await submit('support-review-preference',()=>pref.locator('button').first().click());await page.reload();await ready();await expand(page.locator('[data-review-preference]'));check(await page.locator('[data-review-preference] select').inputValue()===preference,'Review preference lost');await record('R3:'+preference);
  }
  let pref=page.locator('[data-review-preference]');await expand(pref);await submit('support-review-request',()=>page.locator('[data-request-review]').click());
  const review=page.locator('[data-personal-review]');await review.locator('textarea').fill('Synthetic checked review plan');await review.locator('[name="confirmed"]').check();await submit('support-review-accept',()=>review.locator('button').click());await page.reload();await ready();fresh=await state();check(fresh.progress.memberSupport.agreedPlan.text==='Synthetic checked review plan','Accepted plan lost');check(fresh.progress.supportSummary.helpful.reduce((n,x)=>n+x.count,0)===helpfulBefore,'Review acceptance invented helpful feedback');await record('R4:review-accept');
  const note=page.locator('[data-support-note]');await expand(note);const noteText='My synthetic editable prescriber notes. I choose whether to share.';await note.locator('textarea').fill(noteText);await submit('support-note',()=>note.locator('button').first().click());await page.reload();await ready();await expand(page.locator('[data-support-note]'));check(await page.locator('[data-support-note] textarea').inputValue()===noteText,'Prescriber note edit lost');
  const downloading=page.waitForEvent('download');await page.locator('[data-support-download]').click();const download=await downloading;const contents=fs.readFileSync(await download.path(),'utf8');check(contents===noteText,'Downloaded notes do not match the edited note');await record('C6:edit-download');
  const change=page.locator('[data-support-circumstance]');await expand(change);await change.locator('[name="stage"]').selectOption('changing');await change.locator('[name="cadence"]').selectOption('monthly');await submit('support-circumstance',()=>change.locator('button').click());await page.reload();await ready();fresh=await state();check(fresh.progress.memberSupport.stage==='changing'&&fresh.progress.memberSupport.cadence==='monthly','Changed circumstances lost');await record('C9:change');
  const finish=page.locator('[data-support-finish]');await expand(finish);await finish.locator('[name="words"]').fill('Synthetic stage complete');await finish.locator('[name="plan"]').fill('Keep my familiar fallback');page.once('dialog',d=>d.accept());await submit('support-finish',()=>finish.locator('button').click());await page.reload();await ready();check((await state()).progress.memberSupport.finished.words==='Synthetic stage complete','Finishing summary lost');await record('C10:finish');
  await submit('support-resume',()=>page.locator('[data-support-resume]').click());await page.reload();await ready();check((await state()).progress.memberSupport.stage==='returning','Way back did not work');await record('C10:return');
  await page.goto('/member/dashboard#today');await page.locator('[data-support-rescue]').waitFor();await page.locator('[data-support-rescue]').click();await page.locator('#mtSupportRescue').waitFor({state:'visible'});check(!/\bstreak\b|missed.day|\d/.test(await page.locator('#mtSupportRescue').innerText),'Rescue has a count or streak');await record('C7:rough-day');
 }catch(e){results.push({engine:name,id:'core-journey',status:'FAIL',error:e.message,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,5000)});receipt();console.log(JSON.stringify(results.at(-1)));}
 finally{await c.close();await b.close();}
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])await run(name,engine);
process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
