import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {commissioningLogin,memberReady,requireMemberPanel,chooseNecessaryCookies,memberReload} from '../rendered-member-acceptance-support.mjs';
import {revealSetupField} from '../release/app-member-live.mjs';
import {savedFitIssues} from '../member-experience/fit-saved-review.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk',oidc=process.env.SHIFT_COMMISSIONING_OIDC,out='premortem-evidence';assert(oidc);mkdirSync(out,{recursive:true});
async function freshOIDC(){const endpoint=process.env.ACTIONS_ID_TOKEN_REQUEST_URL,credential=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;if(!endpoint||!credential)return oidc;const url=new URL(endpoint);url.searchParams.set('audience','shift-production-commissioning');const r=await fetch(url,{headers:{Authorization:'bearer '+credential},signal:AbortSignal.timeout(30000)});assert(r.ok);const data=await r.json();assert(data.value);return data.value}
const report={at:new Date().toISOString(),source:process.env.ACCEPTANCE_SOURCE,scope:'Supplemental fictional production browser proof; historical guard fixtures are isolated technical proof, not real member history',checks:[],errors:[],networkFailures:[]};
const write=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const browser=await chromium.launch();
try{
 for(const [name,width] of [['phone',390],['desktop',1440]]){
 const identity={email:'shiftsometimber+structured-authrender-premortem-trust-'+Date.now()+'-'+name+'@gmail.com',password:'Sst-'+randomUUID()+'-Aa1!'};
 const r=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await freshOIDC()},body:JSON.stringify({...identity,firstName:'Fictional trust acceptance',source:'commissioning-premortem'})});assert.equal(r.status,201);
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/'+name}}),page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',e=>{report.errors.push({name,error:e.message});write()});page.on('response',r=>{if(r.status()>=500){report.networkFailures.push({name,path:new URL(r.url()).pathname,status:r.status()});write()}});
 const call=async p=>{const r=await context.request.get(site+p);assert.equal(r.status(),200,p);return r.json()};
 const check=async(label,f)=>{try{await f();report.checks.push({name,label,pass:true});console.log('PASS '+name+' '+label)}catch(e){report.checks.push({name,label,pass:false,error:e.message.slice(0,1500)});console.log('FAIL '+name+' '+label+' '+e.message.slice(0,1000));await page.screenshot({path:out+'/'+name+'-'+report.checks.length+'-failure.png',timeout:10000}).catch(()=>{})}write()};
 try{
 await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity});await memberReady(page,{site});
 await check('First-use Journey offers starting point and opens form without saving',async()=>{
 const before=await call('/v1/check-ins');await requireMemberPanel(page,'journey');
 const cta=page.getByRole('button',{name:'Add your starting point',exact:true});await cta.waitFor({state:'visible'});assert.equal(await page.locator('.mj-stat-grid').count(),0);await cta.click();
 const form=page.locator('[data-mj-form]');await form.waitFor({state:'visible'});assert(await form.locator('[name=why]').isVisible());assert.equal(await form.locator('[name=life_energy]').inputValue(),'');
 assert.deepEqual(await call('/v1/check-ins'),before);await page.screenshot({path:out+'/'+name+'-journey.png'});
 });
 for(const [prompt,mode] of [['Working late','working_late'],['Garage / petrol station food','next_three_hours'],['Ten minutes free','no_time']]){
 await check('Ask Timber '+prompt+' actual handoff preserves state and explicitly saves once',async()=>{
 const beforeFood=await call('/v1/grub/workspace'),beforeFit=await call('/v1/fit/activity');let saves=0;const onRequest=r=>{if(new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.method()==='POST')saves++};page.on('request',onRequest);
 try{await page.goto(site+'/member/ask-timber',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);const inventory=await page.locator('[data-prompt]').evaluateAll(nodes=>nodes.map(n=>({prompt:n.dataset.prompt,text:n.textContent.trim()})));report.promptInventory=inventory;console.log('PROMPT INVENTORY '+JSON.stringify(inventory));
 const target=prompt==='Working late'?page.locator('[data-prompt="Working late"]'):page.locator('[data-prompt]').filter({hasText:prompt.startsWith('Garage')?/garage|petrol/i:/(?:ten|10)\s*(?:minutes|mins)/i});assert.equal(await target.count(),1,'One visible scenario shortcut must match '+prompt);await target.click();await page.locator('[data-handoff]').click();await page.locator('#confirmYes').click();
 const button=page.locator('[data-adjust="'+mode+'"]');await button.waitFor({state:'visible'});assert.equal(saves,0,'Opening cannot save');
 const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.request().method()==='POST');await button.click();assert.equal((await pending).status(),200);await page.locator('.mt-sheet-wrap').waitFor({state:'detached'});assert.equal(saves,1);
 assert.deepEqual(await call('/v1/grub/workspace'),beforeFood);assert.deepEqual(await call('/v1/fit/activity'),beforeFit);await memberReload(page,{site});assert.equal(saves,1);await page.screenshot({path:out+'/'+name+'-ask-'+mode+'.png'});
 }finally{page.off('request',onRequest)}
 });
 }
 await check('New Fit session maps movement names groups instructions and images to saved plan',async()=>{
 await page.goto(site+'/member/fit',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);
 const days=await revealSetupField(page,'#fitDays'),minutes=await revealSetupField(page,'#fitMinutes');await days.selectOption('1');await minutes.selectOption('10');const generate=page.locator('#fitGenerate');await generate.waitFor({state:'attached'});for(let attempt=0;attempt<5;attempt++){const closed=generate.locator('xpath=ancestor::details[not(@open)]');if(!await closed.count())break;let opened=false;for(let i=0;i<await closed.count();i++){const summary=closed.nth(i).locator(':scope > summary');if(await summary.isVisible()){await summary.click();opened=true;break}}assert(opened,'Visible Fit setup disclosure')}await generate.waitFor({state:'visible'});
 const built=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/fit/plan'&&r.request().method()==='POST');await page.locator('#fitGenerate').click();assert.equal((await built).status(),200);
 await page.locator('.sf-exercise').first().waitFor();const saved=await call('/v1/fit/activity');assert.equal(savedFitIssues(saved.plan).length,0);const movements=saved.plan.sessions.flatMap(s=>s.exercises);assert(movements.length);
 for(const item of movements){const card=page.locator('.sf-exercise').filter({has:page.locator('h4',{hasText:item.name})}).first();assert.equal((await card.locator('h4').innerText()).trim(),item.name);assert.equal(await card.getAttribute('data-exercise-id'),String(item.id));assert.equal(await card.getAttribute('data-exercise-group'),item.group);
 assert(!/Cool-Down|Warm-Up|Advanced|Standard$/.test(item.name),'Beginner main movements cannot inherit phase or higher-difficulty labels');
 assert.deepEqual(await card.locator('details ol li').allTextContents(),item.how||[]);
 const image=card.locator('img.sf-approved-exercise-image');await image.scrollIntoViewIfNeeded();await page.waitForFunction(src=>{const i=[...document.images].find(i=>i.getAttribute('src')===src);return i?.complete&&i.naturalWidth>0},await image.getAttribute('src'));assert((await image.getAttribute('src')).includes(item.canonical_movement||item.visual?.canonical_movement));
 }
 const first=page.locator('.sf-exercise').first(),id=await first.getAttribute('data-exercise-id');await first.locator('[data-sf-complete="done"]').click();await page.waitForFunction(id=>document.querySelector('[data-exercise-id="'+id+'"]')?.dataset.completion==='done',id);const after=await call('/v1/fit/activity');report.checks.push({name,label:'Saved Fit completion evidence',pass:true,evidence:after});await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-exercise-id="'+id+'"][data-completion="done"]').waitFor();const screen=await page.screenshot({path:out+'/'+name+'-fit.png'});console.log('PROOF_SCREENSHOT '+name+' '+screen.toString('base64'));
 });
 await check('Actual browser cookie expiry blocks access and fresh login restores retained Fit state',async()=>{
 const before=await call('/v1/fit/activity');const cookies=(await context.cookies()).filter(c=>c.name==='sst_session');assert(cookies.length,'Real server-issued session cookie must exist');
 await context.addCookies(cookies.map(c=>({...c,expires:Math.floor(Date.now()/1000)+2})));await page.waitForTimeout(3100);
 assert.equal((await context.request.get(site+'/v1/fit/activity')).status(),401);
 await page.goto(site+'/member/dashboard',{waitUntil:'domcontentloaded'});await page.locator('#previewAuth').waitFor({state:'visible'});assert.equal(await page.locator('#previewMember.is-ready').count(),0);
 await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity});await memberReady(page,{site});assert.deepEqual(await call('/v1/fit/activity'),before);
 report.checks.push({name,label:'Expiry method',pass:true,scope:'Browser naturally expires shortened lifetime of its real cookie; production server TTL not accelerated or claimed'});
 });
 }finally{
 await context.request.delete(site+'/v1/privacy/health-tracking',{headers:{Origin:site}}).catch(()=>{});await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},data:{}}).catch(()=>{});await context.close();write();
 }
 }
 const legacy={minutes_per_day:12,location:'home',sessions:[{exercises:[{id:'calf-raise-cool-down-advanced',name:'Calf Raise Cool-Down Advanced',group:'legs'},{id:'glute-bridge-cool-down-beginner',name:'Glute Bridge Cool-Down Beginner',group:'legs'},{id:'push-up-cool-down-standard',name:'Push-Up Cool-Down Standard',group:'upper-body'}]}]};
 const untouched=JSON.stringify(legacy),issues=savedFitIssues(legacy);assert.equal(issues.length,3);assert.equal(JSON.stringify(legacy),untouched);report.checks.push({label:'Isolated original named historical phase fixtures rejected read-only',pass:true,issues,scope:'Synthetic fixtures only; no existing member record inspected or rewritten'});
}catch(e){report.error=e.message;process.exitCode=1}
finally{await browser.close();report.pass=!report.error&&!report.errors.length&&!report.networkFailures.length&&report.checks.every(x=>x.pass);write();console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(({name,label,pass,error})=>({name,label,pass,error})),errors:report.errors,networkFailures:report.networkFailures}));if(!report.pass)process.exitCode=1}
