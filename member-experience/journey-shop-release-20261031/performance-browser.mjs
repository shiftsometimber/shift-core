import {readFileSync,writeFileSync}from'node:fs';import{createRequire}from'node:module';import assert from'node:assert/strict';
import{augmentPerformanceDocument}from'./scoped-source/member-experience/performance-delivery.mjs';
import{shopPageRoutes}from'./scoped-source/member-experience/shop-routes.mjs';import{withShopNavigation}from'./scoped-source/member-experience/shop-navigation.mjs';
import{lifeBackRoutes}from'./scoped-source/member-experience/life-back-routes.mjs';
import{fixture}from'./scoped-source/health-passport/fixture.mjs';
import{wrapJourneyShopService}from'./scoped-source/member-experience/journey-shop-release.mjs';
const require=createRequire(import.meta.url),{chromium,webkit}=require('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright'),engine=process.env.MY_TIMBER_BROWSER_ENGINE||'chromium',mode=process.argv[2]||'local',before=process.argv.includes('--before');
const pages=JSON.parse(readFileSync('performance-browser-pages.json')),resources=JSON.parse(readFileSync('performance-browser-resources.json')),origin='https://shiftsometimber.co.uk',errors=[],calls=[],state={id:1,signedOut:false,delay:150,identityCount:0},f=fixture({seed:false});f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');f.db.exec('UPDATE consents SET granted=1');
const service=wrapJourneyShopService({fetch:async()=>new Response('retained',{status:404})});
const native=['native-presentation.js','ios-store-presentation.js'].map(n=>readFileSync('/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/MyTimber-1.0.0-8-unsigned.xcarchive/Products/Applications/MyTimber.app/'+n,'utf8'));
const results=[],waitChrome=page=>page.waitForSelector('#mtShopChrome .mt-shop-primary a',{state:'visible'});
async function checkJourney(h){
 const {page}=h;await page.goto(origin+'/member/life-back/journey');await waitChrome(page);await page.waitForSelector('[data-tj-add=win]');
 const today=await page.evaluate(()=>fetch('/v1/life-back/journey').then(r=>r.json()).then(d=>d.today));await page.locator('[data-tj-add=win]').click();assert.equal(await page.locator('[name=on]').inputValue(),today,'New records retain today as their default');await page.locator('[data-tj-back]').click();
 const add=async(kind,fill)=>{await page.click('[data-tj-add='+kind+']');await page.locator('[name=on]').fill('2026-10-28');await fill();await page.locator('[data-tj-record-form] button.tj-primary').click();try{await page.waitForSelector('[data-tj-add=win]',{timeout:10000});}catch(e){console.log('JOURNEY_SAVE_FAILED',await page.locator('main').innerText(),calls.slice(-8));throw e;}assert.match(await page.locator('#timberJourney').innerText(),/Your record is saved/);};
 await add('win',()=>page.locator('[name=text]').fill('Isolated browser win'));
 await page.reload();await page.waitForSelector('[data-tj-add=win]');assert.match(await page.locator('#timberJourney').innerText(),/Isolated browser win/);
 await page.locator('[data-tj-edit]').first().click();await page.locator('[name=text]').fill('Corrected isolated win');await page.locator('[data-tj-record-form] button.tj-primary').click();await page.waitForSelector('[data-tj-add=win]');
 await add('measurement',async()=>{if(await page.locator('[name=weight]').count())await page.locator('[name=weight]').fill('95.2');else{await page.locator('[name=stones]').fill('15');await page.locator('[name=pounds]').fill('0');}await page.locator('[name=waistCm]').fill('103.4');});
 await page.click('[data-tj-measure=clothes]');await add('clothes',async()=>{await page.locator('[name=top]').fill('L');await page.locator('[name=trousers]').fill('32 inch waist');});
 await page.click('[data-tj-guide]');await checkGuideInteractions(h);await page.click('[data-tj-add=feeling]');await page.locator('[name=on]').fill('2026-10-28');await page.locator('[name=feelings][value=okay]').check();await page.locator('[data-tj-record-form] button.tj-primary').click();await page.waitForSelector('[data-tj-add=win]');
 await add('treatment',()=>page.locator('[name=change]').selectOption('changed'));
 await add('injection',()=>page.locator('[name=site]').fill('My own past site record'));
 await page.locator('[data-tj-range]').selectOption('custom');await page.locator('[name=from]').fill('2026-10-01');await page.locator('[name=to]').fill('2026-10-31');await page.locator('[data-tj-dates] button').click();assert.equal(new URL(page.url()).searchParams.get('from'),'2026-10-01');
 await page.click('[data-tj-snapshot]');const text=await page.locator('[data-tj-snapshot-text]').inputValue();assert.match(text,/Corrected isolated win/);assert.match(text,/28 Oct|2026-10-28/);assert.match(text,/32 inch waist/);assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),true);assert.equal(await page.locator('[data-tj-share]').isDisabled(),true);
 await page.locator('[data-tj-accept]').check();assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),false);await page.locator('[data-tj-snapshot-text]').fill(text+'\\nMy checked note');assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),true);
 await page.locator('[data-tj-back]').click();await page.click('[data-tj-records]');const record=page.locator('.tj-record').filter({hasText:'Corrected isolated win'});await record.locator('[data-tj-edit]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-tj-delete]').click();await page.waitForSelector('.tj-record');assert.doesNotMatch(await page.locator('#timberJourney').innerText(),/Corrected isolated win/);
 await page.reload();await page.waitForSelector('[data-tj-add=win]');await page.click('[data-tj-records]');assert.equal(await page.locator('.tj-record').count(),5);assert.match(await page.locator('#timberJourney').innerText(),/32 inch waist/);assert.match(await page.locator('#timberJourney').innerText(),/My own past site record/);
 const before=await page.evaluate(()=>fetch('/v1/life-back/journey').then(r=>r.json()));assert.equal(before.records.length,5);h.state.id=2;await page.goto(origin+'/member/life-back/journey');await page.waitForSelector('[data-tj-add=win]');assert.doesNotMatch(await page.locator('#timberJourney').innerText(),/My own past site record|32 inch waist/);h.state.id=1;
}
async function checkGuideInteractions(h){
 const {page}=h,posts=h.requests.filter(r=>r.method==='POST').length,plot=page.locator('.tj-guide-visual [data-tj-medicine-plot]');
 assert.equal(await plot.count(),1,'The guide chart must use the drag/scroll handler, not only the date slider');
 const days=page.locator('.tj-days');await days.scrollIntoViewIfNeeded();
 assert.deepEqual(await days.locator('button').allTextContents(),Array.from({length:7},(_,i)=>'Day '+(i+1)));
 const visible=await days.evaluate(group=>({scrollWidth:group.scrollWidth,width:group.clientWidth,scrollLeft:group.scrollLeft,viewport:innerWidth,buttons:[...group.querySelectorAll('button')].map(button=>{const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {day:button.dataset.tjDay,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,hit:hit?.closest('[data-tj-day]')===button};})}));
 assert.ok(visible.scrollWidth<=visible.width+1,'All seven day controls must fit without horizontal scrolling');assert.equal(visible.scrollLeft,0);
 for(const b of visible.buttons){assert.ok(b.x>=0&&b.right<=visible.viewport,'Day '+b.day+' must be visible at once');assert.ok(b.width>=44&&b.height>=44,'Day '+b.day+' keeps a usable touch target');assert.equal(b.hit,true,'Day '+b.day+' must be unobscured');}
 const seventh=visible.buttons[6];await page.mouse.click(seventh.x+seventh.width/2,seventh.y+seventh.height/2);await page.waitForFunction(()=>document.querySelector('[data-tj-date]')?.value==='6');assert.equal(await page.locator('[data-tj-day="7"]').getAttribute('aria-pressed'),'true');
 const first=visible.buttons[0];await page.mouse.click(first.x+first.width/2,first.y+first.height/2);await page.waitForFunction(()=>document.querySelector('[data-tj-date]')?.value==='0');
 await days.screenshot({path:('all-seven-days-'+page.viewportSize().width+'.png')});
 const value=async()=>Number(await page.locator('[data-tj-date]').inputValue());
 const fill=async()=>Number(await page.locator('[data-tj-example-fill]').getAttribute('height'));
 const assertFill=async level=>{assert.ok(Math.abs(await fill()-197*level)<.000001,'Filled area must rise/fall with the example curve');assert.ok(Math.abs(Number(await page.locator('[data-tj-example-fill]').getAttribute('y'))-(207-197*level))<.000001);assert.equal(await page.locator('[data-tj-example-body]').getAttribute('fill'),'#E7E3DA');assert.equal(await page.locator('[data-tj-example-body]').getAttribute('opacity'),null,'Do not substitute colour/opacity changes for changing the filled area');};
 const waitIndex=async n=>page.waitForFunction(n=>Number(document.querySelector('[data-tj-date]')?.value)===n,n,{timeout:3000});
 assert.equal(await value(),0,'The guide must open at the beginning, without moving the slider first');assert.equal(await page.locator('[data-tj-day="1"]').getAttribute('aria-pressed'),'true');await assertFill(.25);const low=await fill();
 await plot.scrollIntoViewIfNeeded();const box=await plot.locator('svg').boundingBox();assert(box);
 const x=i=>box.x+(112+458*i/27)/600*box.width,y=box.y+70/175*box.height;
 await page.mouse.move(x(0),y);await page.mouse.down();await page.mouse.move(x(2),y,{steps:8});await page.mouse.up();await waitIndex(2);
 await assertFill(.87);assert.ok(await fill()>low,'Absorption is represented by a growing filled area');
 await page.locator('.tj-guide-visual').screenshot({path:('guide-day3-'+page.viewportSize().width+'.png')});
 await page.mouse.wheel(0,120);await waitIndex(3);await assertFill(.78);assert.ok(await fill()<197*.87,'Removal is represented by a shrinking filled area');await page.mouse.wheel(-120,0);await waitIndex(2);
 await page.locator('[data-tj-date]').focus();await page.keyboard.press('Home');await waitIndex(0);await page.locator('[data-tj-date]').scrollIntoViewIfNeeded();const slider=await page.locator('[data-tj-date]').boundingBox();assert(slider);
 await page.mouse.move(slider.x+10,slider.y+slider.height/2);await page.mouse.down();await page.mouse.move(slider.x+slider.width-10,slider.y+slider.height/2,{steps:20});await page.mouse.up();
 assert.ok(await value()>=26,'Dragging the range control keeps working through the whole movement');
 await page.locator('[data-tj-date]').focus();await page.keyboard.press('Home');await waitIndex(0);await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await waitIndex(2);
 await page.locator('[data-tj-day="1"]').click();await waitIndex(0);await assertFill(.25);
 await page.locator('[data-tj-day="3"]').click();await waitIndex(2);await page.locator('[data-tj-play]').click();await waitIndex(3);await page.locator('[data-tj-play]').click();
 assert.notEqual(await fill(),low);assert.match(await page.locator('.tj-badge').innerText(),/Illustration.*not your actual levels/);assert.match(await page.locator('#timberJourney').innerText(),/symbolic.*not medicine moving up your body/);
 await page.locator('[data-tj-date]').focus();await page.keyboard.press('End');await waitIndex(27);await page.locator('[data-tj-play]').click();await waitIndex(0);await page.locator('[data-tj-play]').click();
 await page.locator('[data-tj-back]').click();const today=await page.evaluate(()=>fetch('/v1/life-back/journey').then(r=>r.json()).then(d=>d.today));await page.locator('[data-tj-add=win]').click();assert.equal(await page.locator('[name=on]').inputValue(),today,'Exploring the example must not backdate a new win');await page.locator('[data-tj-back]').click();await page.locator('[data-tj-guide]').click();await waitIndex(0);await assertFill(.25);
 await page.locator('[data-tj-add=feeling]').click();await page.locator('[data-tj-back]').click();await page.locator('[data-tj-add=win]').click();assert.equal(await page.locator('[name=on]').inputValue(),today,'Cancelling a guide-date entry must restore the normal new-record date');await page.locator('[data-tj-back]').click();await page.locator('[data-tj-guide]').click();await waitIndex(0);
 assert.equal(h.requests.filter(r=>r.method==='POST').length,posts,'Exploring the illustration must not create health records or treatment changes');
 results.push({width:page.viewportSize().width,case:'all seven days visible and usable without sideways scroll; Day 1, changing fill, drag, wheel, range, keyboard and replay work without writes',pass:true});
}

const browser=await({chromium,webkit}[engine]).launch({headless:true});let context;
try{
context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await context.addInitScript(()=>{
 window.__MT_PERF_TEST__=true;
 window.__profilePending=0;window.__profileRequests=[];const fetchOriginal=window.fetch.bind(window);
 window.fetch=async(input,init)=>{let u;try{u=new URL(input instanceof Request?input.url:input,location.href)}catch{}const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase(),track=u?.pathname.startsWith('/v1/')&&method==='GET',at=Date.now();if(track)window.__profilePending++;
 try{const r=await fetchOriginal(input,init);if(track){await r.clone().arrayBuffer();window.__profileRequests.push({path:u.pathname,ms:Date.now()-at,status:r.status});}return r;}finally{if(track)window.__profilePending--;}};
 if(parent!==window)return;
 window.__profileSamples=[];window.__firstUsable=null;window.__perfFrames=[];let stable=0,ack=null;
 document.addEventListener('click',e=>{const a=e.target.closest?.('[data-mt-shop-tab]');if(a){sessionStorage.setItem('__mt_benchmark_tap',JSON.stringify({tab:a.dataset.mtShopTab,at:Date.now()}));stable=0;ack=null;}},true);
 const defaultTab=()=>{const u=new URL(location.href);return u.pathname.includes('/journey')?'journey':u.pathname.includes('/shop')?'shop':u.pathname==='/member/grub'?'grub':u.pathname==='/member/fit'?'fit':u.searchParams.get('timber')==='support'?'support':u.searchParams.get('timber')==='stuff'?'more':'today';};
 const firstAt=Date.now();
 function usable(tab){try{
 const w=window.MT_PERFORMANCE?.current()||window,d=w.document,b=d.body;
 const visible=e=>{if(!e)return false;const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;};
 if(b?.dataset.memberSession!=='ready'||!b.hasAttribute('data-mt-shop-navigation')||w.__profilePending>0||(b.dataset.memberPage==='dashboard'&&!d.querySelector('#previewMember.is-ready:not([hidden])'))||!visible(d.querySelector('main'))||[...d.querySelectorAll('main [aria-busy=true]')].some(visible))return false;
 if(tab==='journey')return visible(d.querySelector('[data-tj-add=win],[data-tj-record-form],[data-tj-snapshot-text]'));
 if(tab==='shop')return visible(d.querySelector('.mt-shop-category'));
 if(tab==='support')return visible(d.querySelector('#mtUtility'))&&/999/.test(d.querySelector('#mtUtility').textContent);
 if(tab==='more')return visible(d.querySelector('#mtUtility a[href="/member/settings"]'));
 if(tab==='grub')return b.dataset.memberPage==='grub'&&!!d.querySelector('#grubSearchGo,#grubSearch');
 if(tab==='fit')return b.dataset.memberPage==='fit'&&[...d.querySelectorAll('main button')].some(visible);
 return visible(d.querySelector('#todayActions'))&&[...d.querySelectorAll('#todayActions button')].some(visible);
 }catch{return false}}
 const tick=()=>{
 if(document.body){window.__perfFrames.push({at:Date.now(),website:[...document.querySelectorAll('header.site-header,#sst-header-c,#sst-footer-c,#todayBrand,.tj-brand,.mt-support-brand,nav.sst-member-tabs,#appBottomNav,#mtSixNav')].some(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.height>0&&r.width>0;})});if(window.__perfFrames.length>1000)window.__perfFrames.shift();
 if(!window.__firstUsable&&usable(defaultTab()))window.__firstUsable={tab:defaultTab(),usableMs:Date.now()-firstAt};
 let tap;try{tap=JSON.parse(sessionStorage.getItem('__mt_benchmark_tap'))}catch{}
 if(tap){if(ack===null&&document.querySelector('#mtShopChrome[aria-busy=true],#mtShopPending'))ack=Date.now()-tap.at;
 if(usable(tap.tab)){if(++stable>=2){window.__profileSamples.push({...tap,usableMs:Date.now()-tap.at,ackMs:ack});sessionStorage.removeItem('__mt_benchmark_tap');stable=0;ack=null;}}else stable=0;}
 }requestAnimationFrame(tick);
 };requestAnimationFrame(tick);
});
await context.route('**/*',async route=>{
const r=route.request(),u=new URL(r.url());calls.push({path:u.pathname,search:u.search,method:r.method(),at:Date.now(),frame:r.frame().url()});
if(u.pathname.startsWith('/v1/')){
 await new Promise(resolve=>setTimeout(resolve,state.delay));
 if(u.pathname==='/v1/me'){state.identityCount++;return route.fulfill({status:state.signedOut?401:200,json:state.signedOut?{error:'authentication_required'}:{user:{id:state.id,first_name:'Synthetic',email:'performance-fixture@example.invalid'}}});}
 if(u.pathname==='/v1/consents'&&r.method()==='GET')return route.fulfill({json:{consents:[{id:1,consent_type:'my_shift_health_tracking',granted:1}]}});
 if(state.signedOut)return route.fulfill({status:401,json:{error:'authentication_required'}});
 if(u.pathname==='/v1/life-back/journey'||(u.pathname==='/v1/life-back'&&r.method()==='POST')){const headers=new Headers(r.headers());headers.set('Cookie','sst_session=test-only-member-'+state.id);const response=await service.fetch(new Request(r.url(),{method:r.method(),headers,...(r.method()==='POST'?{body:r.postData()}: {})}),f.env,{});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});}
 if(u.pathname==='/v1/life-back'){const response=await lifeBackRoutes(new Request(r.url(),{headers:{Cookie:'sst_session=test-only-member-'+state.id}}),f.env);return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});}
 if(u.pathname==='/v1/commerce/active-checkout')return route.fulfill({json:{ok:true,accountReference:'a'.repeat(64),attempts:[]}});
 if(u.pathname==='/v1/commerce/basket-quote')return route.fulfill({json:{ok:true,accountReference:'a'.repeat(64),quote:{items:[],subtotalPence:0,totalPence:0,deliveries:[]},recommendations:[],products:[]}});
 const data={ok:true,user:{id:state.id,first_name:'Synthetic'},memory:null,journey:{records:[]},progress:{entries:[],count:0},entries:[],orders:[],consents:[],units:{weight:'kg'},support:{},profile:{first_name:'Synthetic'},state:{},preferences:{}};
 return route.fulfill({json:data});
}
if(!['GET','HEAD'].includes(r.method()))throw Error('Unexpected non-fixture write '+u.pathname);
if(mode!=='local'){
 if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(u.hostname))return route.fulfill({status:204,body:''});
 if(r.isNavigationRequest()){
 const headers={...r.headers()};if(mode==='candidate'){const state=JSON.parse(readFileSync('performance-release-state.json'));headers['Cloudflare-Workers-Version-Overrides']=state.owners.map(o=>o.name+'="'+o.versionId+'"').join(', ');}
 const res=await route.fetch({headers,timeout:30000}),h=res.headers();let body=await res.body();
 if((h['content-type']||'').includes('text/html')){if(['candidate','live'].includes(mode))assert.equal(h['x-my-timber-performance'],'20261101',u.pathname+' serving repair');body=Buffer.from(body.toString().replace('</body>',native.map(content=>'<script>'+content+'</script>').join('')+'</body>'));}
 return route.fulfill({response:res,body});
 }
 if(mode==='candidate'){const state=JSON.parse(readFileSync('performance-release-state.json'));return route.continue({headers:{...r.headers(),'Cloudflare-Workers-Version-Overrides':state.owners.map(o=>o.name+'="'+o.versionId+'"').join(', ')}});}
 return route.continue();
}

if(u.pathname.startsWith('/member/life-back/shop/')){const req=new Request(r.url()),res=await shopPageRoutes(req,{MEMBER_EXPERIENCE_V1_ENABLED:'true'},async req=>{const u=new URL(req.url);const name=u.pathname==='/shop'?(u.searchParams.has('item')?'kit-product':'kit'):u.pathname.includes('supplements')?'nutrition':u.pathname.includes('vitamin-d')?'testing-vitamin-d':'testing';return new Response(readFileSync('public-fixtures/live-'+name+'.html','utf8'),{headers:{'Content-Type':'text/html'}});});if(res){const html=augmentPerformanceDocument(await(await withShopNavigation(req,res,{MEMBER_EXPERIENCE_V1_ENABLED:'true'})).text());return route.fulfill({contentType:'text/html',body:html});}}
const key=u.pathname+u.search,canonical=u.pathname==='/member/dashboard'?'/member/dashboard?view=app':u.pathname;
const html=pages[key]||pages[canonical];
if(html){let text=before?html:augmentPerformanceDocument(html);text=text.replace('</body>',native.map(content=>'<script>'+content+'</script>').join('')+'</body>');return route.fulfill({contentType:'text/html',body:text});}
if(!before&&u.pathname==='/assets/member-experience/programme-shop-navigation.mjs'){const {shopNavigationAsset}=await import('./scoped-source/member-experience/shop-navigation.mjs');const r=shopNavigationAsset(new Request(origin+u.pathname));return route.fulfill({contentType:'text/javascript',body:await r.text()});}
const asset=resources[key]||resources[Object.keys(resources).find(k=>k.split('?')[0]===u.pathname)];
if(asset)return route.fulfill({contentType:asset.type,body:asset.body});
if(u.pathname==='/assets/favicon-shift-s-20261020.png')return route.fulfill({contentType:'image/png',body:readFileSync('scoped-source/member-experience/tests/fixtures/shift-s-20261020.png')});
if(/\.(?:png|webp|jpe?g|svg|woff2?)$/.test(u.pathname))return route.fulfill({status:204,body:''});
if(/\.(?:m?js|css)$/.test(u.pathname))return route.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript',body:''});
return route.fulfill({status:404,body:'Fixture missing '+u.pathname});
});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));

const paths={today:'/member/dashboard?view=app#today',journey:'/member/life-back/journey',shop:'/member/life-back/shop',grub:'/member/grub',fit:'/member/fit',support:'/member/dashboard?timber=support#today',more:'/member/dashboard?timber=stuff#today'},measurements=[];
const scope=()=>page.frames().find(frame=>frame!==page.mainFrame()&&frame.url()===activeUrl)||page;
let activeUrl='';
async function usable(tab){
 await page.waitForFunction(tab=>{
 const w=window.MT_PERFORMANCE?.current()||window,d=w.document,b=d.body;
 if(b?.dataset.memberSession!=='ready'||!b.hasAttribute('data-mt-shop-navigation')||(b.dataset.memberPage==='dashboard'&&!d.querySelector('#previewMember.is-ready:not([hidden])')))return false;
 const visible=e=>{if(!e)return false;const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;};
 if(!visible(d.querySelector('main'))||[...d.querySelectorAll('main [aria-busy=true]')].some(visible))return false;
 if(tab==='journey')return visible(d.querySelector('[data-tj-add=win]'));
 if(tab==='shop')return visible(d.querySelector('.mt-shop-category'));
 if(tab==='support')return visible(d.querySelector('#mtUtility'))&&/999/.test(d.querySelector('#mtUtility').textContent);
 if(tab==='more')return visible(d.querySelector('#mtUtility a[href="/member/settings"]'));
 if(tab==='grub')return !!d.querySelector('#grubSearchGo,#grubSearch');
 if(tab==='fit')return b.dataset.memberPage==='fit'&&/exercise|session|workout|movement/i.test(d.querySelector('main').textContent)&&[...d.querySelectorAll('main button')].some(visible);
 return visible(d.querySelector('#todayActions'))&&[...d.querySelectorAll('#todayActions button')].some(visible);
 },tab,{timeout:15000});
 await page.waitForFunction(()=>{const w=window.MT_PERFORMANCE?.current()||window;return !w.MT_SCREEN||w.MT_SCREEN.pending()===0;});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 activeUrl=await page.evaluate(()=>window.MT_PERFORMANCE?.current()?.location.href||location.href);
}
for(const [tab,path]of Object.entries(paths)){
 const t=performance.now();await page.goto(origin+path,{waitUntil:'domcontentloaded'});
 try{if(await page.getByRole('button',{name:'Necessary only',exact:true}).isVisible())await page.getByRole('button',{name:'Necessary only',exact:true}).click();await usable(tab);}catch(e){console.log('UNUSABLE',tab,await page.evaluate(()=>({body:document.body.dataset,main:document.querySelector('main')?.innerText.slice(0,700),frames:frames.length,errors:window.__errors})));throw e;}
 measurements.push({kind:'first-visit',tab,usableMs:Math.round(performance.now()-t)});
 console.log('FIRST',tab,measurements.at(-1).usableMs);
}
await page.goto(origin+paths.today,{waitUntil:'domcontentloaded'});await usable('today');const rootToken=await page.evaluate(()=>window.__testRootToken=crypto.randomUUID());
for(let cycle=0;cycle<3;cycle++)for(const tab of ['journey','shop','grub','fit','support','more','today']){
 const t=performance.now(),beforeRequests=calls.length;await page.locator('#mtShopChrome [data-mt-shop-tab='+tab+']').click();
 await usable(tab);await page.waitForFunction(()=>!sessionStorage.getItem('__mt_benchmark_tap'));const actual=await page.evaluate(()=>({token:window.__testRootToken,metrics:window.MT_PERFORMANCE?.samples.at(-1),profile:window.__profileSamples.at(-1)}));
 if(!before)assert.equal(actual.token,rootToken,'The parent document must survive every ordinary navigation');
 const m={kind:cycle===0?'first-navigation':'repeat-navigation',cycle,tab,usableMs:actual.profile?.usableMs??Math.round(performance.now()-t),ackMs:actual.profile?.ackMs??actual.metrics?.ackMs??null,documentRequests:calls.slice(beforeRequests).filter(c=>!c.path.startsWith('/v1/')&&c.path.startsWith('/member/')&&!/\.(?:m?js|css)$/.test(c.path)).length};measurements.push(m);console.log('TAP',JSON.stringify(m));
}
if(!before){
 await checkJourney({page,state,requests:calls});console.log('JOURNEY_SIX_TYPES_EDIT_DELETE_SNAPSHOT_GUIDE_PASSED');
 await page.goto(origin+paths.today,{waitUntil:'domcontentloaded'});await usable('today');await page.locator('#mtShopChrome [data-mt-shop-tab=journey]').click();await usable('journey');
 const frame=scope();await frame.locator('[data-tj-add=win]').click();await frame.locator('[name=text]').fill('Retained unsaved synthetic draft');
 await page.locator('#mtShopChrome [data-mt-shop-tab=shop]').click();await usable('shop');await page.locator('#mtShopChrome [data-mt-shop-tab=journey]').click();
 await page.waitForFunction(()=>window.MT_PERFORMANCE.current().document.querySelector('[name=text]')?.value==='Retained unsaved synthetic draft');
 activeUrl=await page.evaluate(()=>window.MT_PERFORMANCE.current().location.href);assert.equal(await scope().locator('[name=text]').inputValue(),'Retained unsaved synthetic draft');
 console.log('DRAFT_PRESERVED');
 await page.goBack();await usable('shop');await page.goForward();await page.waitForFunction(()=>window.MT_PERFORMANCE.current().document.querySelector('[name=text]')?.value==='Retained unsaved synthetic draft');console.log('BACK_FORWARD_PRESERVED');
 const beforeResume=state.identityCount;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(30);assert.equal(await page.locator('html').getAttribute('data-mt-screen-locked'),'1');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-mt-screen-locked'));assert(state.identityCount>beforeResume,'Resume needs a new server identity check');await page.waitForFunction(()=>window.MT_PERFORMANCE.current().document.querySelector('[name=text]')?.value==='Retained unsaved synthetic draft');console.log('RESUME_VERIFIED_WITH_DRAFT');

 state.id=2;await page.evaluate(()=>document.dispatchEvent(new Event('sst:account-changed')));await page.waitForFunction(()=>document.body.dataset.memberSession==='ready'&&!document.querySelector('.mt-retained-screen'));assert.doesNotMatch(await page.locator('main').innerText(),/Retained unsaved synthetic draft/);console.log('ACCOUNT_SWITCH_PRIVATE_CONTENT_CLEARED');
 state.id=1;await page.goto(origin+paths.shop);await usable('shop');await page.locator('.mt-shop-category[href$="/testing"]').click();await page.waitForURL('**/member/life-back/shop/testing');try{await page.waitForSelector('#mtShopChrome .mt-shop-primary a',{timeout:6000});}catch(e){console.log('CATALOGUE_NAV_FAILED',await page.evaluate(()=>({href:location.href,body:document.body.dataset,html:document.documentElement.dataset,top:parent===window,chrome:document.querySelector('#mtShopChrome')?.outerHTML,main:document.querySelector('main')?.innerText.slice(0,1500)})),errors);throw e;}assert.equal(await page.locator('.mt-retained-screen').count(),0,'Product catalogue uses canonical top-level workflow');assert.match(await page.locator('main').innerText(),/Vitamin D/);await page.locator('main a[href$="/testing/vitamin-d"]').first().click();await page.waitForSelector('[data-testing-purchase]');assert(await page.locator('[data-testing-purchase] button[type=submit]').isDisabled());await page.goto(origin+'/member/life-back/shop/nutrition');await page.waitForSelector('.shop-toolbar');assert.equal(await page.locator('.shop-toolbar').getAttribute('action'),'/member/life-back/shop/nutrition');await page.goto(origin+'/member/life-back/shop/kit?item=heavyweight-tee&colour=ash-green');await page.waitForSelector('#mtShopChrome .mt-shop-primary a');assert.match(await page.locator('main').innerText(),/Heavyweight Tee/);await page.locator('[data-tm-colour=cream]').click();assert.match(await page.locator('[data-tm-colour-name]').innerText(),/Cream/);console.log('SHOP_TOP_LEVEL_DETAILS_FILTERS_SUPPLIER_HOLD_PASSED');
 await page.goto(origin+paths.today);await usable('today');await page.locator('#mtShopChrome [data-mt-shop-tab=more]').click();await usable('more');const m=scope();for(const path of ['/member/settings','/member/orders','/member/plans'])assert(await m.locator('#mtUtility a[href="'+path+'"]').count());await m.locator('#mtUtility a[href="/member/settings"]').click();await page.waitForURL('**/member/settings');await page.waitForSelector('#mtShopChrome .mt-shop-primary a');assert.equal(await page.locator('.mt-retained-screen').count(),0);console.log('MORE_ACCOUNT_CONTROLS_PRESERVED');
 state.signedOut=true;await page.evaluate(()=>window.MT_MEMBER_IDENTITY(true).catch(()=>{}));await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out');assert.equal(await page.locator('.mt-retained-screen').count(),0);assert.equal(await page.locator('main').isVisible(),false);console.log('EXPIRED_SESSION_PRIVATE_CONTENT_CLEARED');
}
const report={at:new Date().toISOString(),engine,mode,before,verified:true,source:mode==='candidate'||mode==='live'?JSON.parse(readFileSync('performance-release-state.json')).source:null,conditions:{viewport:'390x844',network:mode==='local'?'Fully intercepted captured documents and scripts':'Actual '+mode+' documents and static resources from SST Mac through London connection; no artificial bandwidth throttle',identityAndData:'Fictional account, all API traffic intercepted with 150ms response delay',nativePresentation:'Actual build-8 bundled scripts, injected unchanged',physicalIphone:false},measurements,functionalChecks:results,identityRequests:state.identityCount,errors,productionRequests:mode==='local'?0:'GET documents and static resources only',productionWrites:0};
writeFileSync(mode==='candidate'?'performance-candidate-'+engine+'.json':mode==='live'?'performance-live-'+engine+'.json':'performance-browser-'+(before?'before':'after')+'-'+engine+'.json',JSON.stringify(report,null,2));console.log('BENCHMARK',JSON.stringify({engine,before,samples:measurements.length,identityRequests:state.identityCount,errors}));
await page.screenshot({path:'performance-browser-'+engine+'.png',fullPage:false});
}finally{await context?.close();await browser.close();f.close();}
