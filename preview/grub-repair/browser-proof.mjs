import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {mealFamily} from '../../member-experience/grub-workspace.mjs';
const origin=process.env.PREVIEW_URL,dir='work/staging/generated/five-points-evidence/grub';mkdirSync(dir,{recursive:true});
assert(process.env.GITHUB_ACTIONS==='true'&&origin==='https://shift-stabilisation-preview.matobrien.workers.dev');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json')),report={source:process.env.GITHUB_SHA,cases:[],productionWrites:0};
const meta=await(await fetch(origin+'/__preview/meta')).json();assert.equal(meta.sourceSha||meta.source||meta.commit||meta.sourceSHA,process.env.GITHUB_SHA);
async function api(ctx,path,body){const response=await ctx.request.fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{}),timeout:45000});assert(response.ok(),path+' '+response.status());return response.json()}
const matrix=[['chromium-desktop',chromium,{width:1440,height:1000},'protein'],['chromium-phone',chromium,{width:390,height:844},'fast'],['webkit-desktop',webkit,{width:1440,height:1000},'budget'],['webkit-phone',webkit,{width:390,height:844},'vegetarian']];
try{for(const [index,[name,engine,viewport,style]]of matrix.entries()){
 const browser=await engine.launch(),ctx=await browser.newContext({viewport}),page=await ctx.newPage(),row={name,style,checks:[],requests:[],failedRequests:[],browserErrors:[]};report.cases.push(row);
 page.on('request',request=>{if(new URL(request.url()).pathname==='/v1/grub/workspace')row.requests.push({method:request.method(),at:Date.now()})});page.on('requestfailed',request=>{if(new URL(request.url()).pathname==='/v1/grub/workspace')row.failedRequests.push(request.failure())});page.on('pageerror',e=>row.browserErrors.push(e.message));
 async function login(){await api(ctx,'/v1/auth/login',{email:'probe'+fixture.browserIds[index]+'@example.invalid',password:fixture.password})}
 async function ready(){await page.goto(origin+'/member/grub',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#grubAccountStatus')?.textContent.includes('up to date'),null,{timeout:45000})}
 async function action(locator){const pending=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/grub/workspace',{timeout:45000});await locator.click();const response=await pending;assert.equal(response.status(),200);const result=await response.json();await page.waitForFunction(()=>!document.querySelector('#grubReload')?.disabled);return result}
 try{
  await ctx.route('**/*',route=>{const r=route.request();return new URL(r.url()).origin!==origin&&!['GET','HEAD'].includes(r.method())?route.abort():route.continue()});
  await login();await ready();let state=await api(ctx,'/v1/grub/workspace');
  for(const mode of ['protein','quicker','protein','protein','quicker']){
   const before=state.recommendation.recipe;state=await action(page.locator('[data-grub-adjust="'+mode+'"]'));const after=state.recommendation.recipe;
   if(after.id===before.id){assert.match(state.recommendation.message,/unchanged/);assert.match(await page.locator('#grubAccountStatus').innerText(),/unchanged/)}
   else assert(mode==='protein'?after.protein_g>before.protein_g:after.minutes<before.minutes);
   assert.equal(state.week.length,0);row.checks.push(mode+': '+before.id+' -> '+after.id);
  }
  const pick=state.recommendation.recipe.id;await ready();assert.equal((await api(ctx,'/v1/grub/workspace')).recommendation.recipe.id,pick);row.checks.push('recommendation survives reload');
  await page.locator('[data-grub-tab="week"]').click();await page.locator('#grubDays').selectOption('7');await page.locator('#grubStyle').selectOption(style);await page.locator('#grubServings').selectOption('2');
  state=await action(page.locator('#grubWeekGenerate'));assert.equal(state.week.length,21);assert(state.shopping.length>0);
  const lookup=new Map(state.recipes.map(r=>[r.id,r])),main=state.week.filter(x=>x.slot!=='breakfast').map(x=>lookup.get(x.recipeId));
  assert(main.filter(r=>mealFamily(r)==='bread').length<=2);assert(new Set(main.map(mealFamily)).size>=3);assert.equal(new Set(state.week.map(x=>x.recipeId)).size,21);row.meals=main.map(r=>({name:r.name,family:mealFamily(r),minutes:r.minutes}));
  await page.screenshot({path:dir+'/'+name+'-week.png',fullPage:true});row.checks.push('21 saved meals, varied formats, at most two bread meals, real shopping list');
  const saved=state.week,shopping=state.shopping;await page.reload();await page.waitForFunction(()=>document.querySelector('#grubAccountStatus')?.textContent.includes('up to date'));
  state=await api(ctx,'/v1/grub/workspace');assert.deepEqual(state.week,saved);assert.deepEqual(state.shopping,shopping);
  await page.locator('[data-grub-tab="week"]').click();await page.locator('#grubWeekGenerate').click();await page.getByRole('button',{name:'Keep current week',exact:true}).click();assert.deepEqual((await api(ctx,'/v1/grub/workspace')).week,saved);
  await page.locator('#grubWeekGenerate').click();state=await action(page.getByRole('button',{name:'Replace and save week',exact:true}));assert.equal(state.week.length,21);assert(!state.week.some(x=>saved.some(old=>old.recipeId===x.recipeId)));row.checks.push('reload retains week and shopping; cancel preserves; confirmed rebuild rotates recipes');
  const rebuilt=state.week;await api(ctx,'/v1/auth/logout',{});await login();await ready();assert.deepEqual((await api(ctx,'/v1/grub/workspace')).week,rebuilt);row.checks.push('new login retains exact week');
  await page.route('**/v1/grub/workspace',r=>r.request().method()==='POST'?r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary preview failure. Try again.'})}):r.continue());
  await page.locator('[data-grub-adjust="quicker"]').click();await page.waitForFunction(()=>document.querySelector('#grubAccountStatus')?.dataset.error==='true');assert.deepEqual((await api(ctx,'/v1/grub/workspace')).week,rebuilt);await page.unroute('**/v1/grub/workspace');await action(page.locator('[data-grub-adjust="quicker"]'));row.checks.push('failed action preserves week; retry succeeds');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  for(const path of ['/guides/nutrition-guide','/articles/air-fryer-meals-men','/tools/protein']){await page.goto(origin+path);const note=page.locator('[data-nutrition-mytimber]');await note.waitFor();assert.match(await note.innerText(),/inside My Timber/);assert.equal(await note.locator('a').getAttribute('href'),'/member/grub');}
  await page.screenshot({path:dir+'/'+name+'-nutrition.png',fullPage:true});row.checks.push('nutrition pages explain My Timber recipe access');row.pass=true;
 }catch(e){row.pass=false;row.visibleStatus=await page.locator('#grubAccountStatus').innerText().catch(()=>'unavailable');row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true});throw e}finally{await ctx.close();await browser.close();writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(row))}
}}finally{writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}
