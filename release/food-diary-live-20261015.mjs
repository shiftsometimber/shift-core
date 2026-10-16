// Private acceptance contract only. No network, account or storage operations.
import assert from 'node:assert/strict';

export const SITE='https://shiftsometimber.co.uk';
export const API='https://api.shiftsometimber.co.uk';
export const FOOD_LIVE_SITE=SITE,FOOD_LIVE_API=API;
export const FOOD_LIVE_ASSET_PATH='/assets/member-experience/food-diary.mjs';
export const FOOD_LIVE_MEANING='Only foods and amounts you explicitly recorded as eaten. Recipe choices and plans do not count as intake; missing amounts are unknown.';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOLDER=/^shiftsometimber\+structured-growth-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@gmail\.com$/i;
const SOURCE=/^[0-9a-f]{40}$/;
const markerOK=value=>typeof value==='string'&&value.startsWith('Synthetic food acceptance ')&&UUID.test(value.slice('Synthetic food acceptance '.length));
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const exactKeys=(value,keys,message)=>{assert(object(value),message);assert.deepEqual(Object.keys(value).sort(),[...keys].sort(),message);};
function calendarDay(day){assert(typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day),'One exact calendar date is required');const time=Date.parse(day+'T00:00:00.000Z');assert(Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===day,'A real Gregorian calendar date is required');return time;}
const afterDay=day=>new Date(calendarDay(day)+86400000).toISOString().slice(0,10);
export function londonFoodDay(now=Date.now()){
 const instant=new Date(now);assert(Number.isFinite(instant.valueOf()),'A valid Food acceptance instant is required');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant),part=kind=>parts.find(p=>p.type===kind).value;
 return part('year')+'-'+part('month')+'-'+part('day');
}
export const nextLondonFoodDay=(now=Date.now())=>afterDay(londonFoodDay(now));

export function assertFoodLiveHolder({site,api,email,source,report}){
 assert.equal(site,SITE,'Only the original Food acceptance site is allowed');assert.equal(api,API,'Only the original Food acceptance API is allowed');
 assert(typeof email==='string'&&HOLDER.test(email),'Only the original structured-growth UUID holder is allowed');
 assert(typeof source==='string'&&SOURCE.test(source),'One literal source commit is required');
 assert(object(report)&&report.synthetic===true&&report.realCustomerRecordsRead===false,'Explicit synthetic report and no-real-customer declaration are required');
 assert.equal(report.commit,source,'The Food report must bind the exact source commit');assert.equal(report.status,'running','Food acceptance belongs to the running original Growth report');assert(Array.isArray(report.checks),'The original Growth check collection is required');
 return Object.freeze({site,api,email:email.toLowerCase(),source});
}

export function assertFoodLiveRequest({url,method,body,day,marker,ownedOperationId=null,allowFutureDenial=false}){
 assert.equal(typeof url,'string','An absolute Food request URL is required');const target=new URL(url);
 assert([SITE,API].includes(target.origin)&&target.protocol==='https:'&&!target.username&&!target.password&&!target.search&&!target.hash,'Only the two exact Food origins without queries or credentials are allowed');
 assert(method==='GET'||method==='POST','Only bounded Food GET/POST requests are allowed');
 assert.equal(typeof allowFutureDenial,'boolean','Future denial authority must be explicit boolean');
 if(method==='GET'){
  assert(body===undefined||body===null,'Food GET requests cannot carry a body');
  assert(['/v1/me','/v1/consents','/v1/grub/eaten',FOOD_LIVE_ASSET_PATH].includes(target.pathname),'Unapproved or held Food request route');
  return Object.freeze({origin:target.origin,path:target.pathname,method,kind:target.pathname===FOOD_LIVE_ASSET_PATH?'asset':'read'});
 }
 assert.equal(target.pathname,'/v1/grub/eaten','Every other mutation, including held email/support/payment/AI routes, is forbidden');
 exactKeys(body,['operationId','on','food'],'Only the observed Food operation, date and synthetic marker may be sent; unknown amounts stay omitted');
 assert(typeof body.operationId==='string'&&UUID.test(body.operationId),'The actual client UUID operation is required');
 if(ownedOperationId!==null){assert(typeof ownedOperationId==='string'&&UUID.test(ownedOperationId),'An observed owned operation UUID is required');assert.equal(body.operationId,ownedOperationId,'An unrelated existing operation cannot be replayed');}
 assert(markerOK(marker)&&body.food===marker,'The exact synthetic Food acceptance marker is required');calendarDay(day);
 assert.equal(body.on,allowFutureDenial?afterDay(day):day,allowFutureDenial?'Only the exact next London day may be denied':'Only the observed London day may be saved');
 return Object.freeze({origin:target.origin,path:target.pathname,method,operationId:body.operationId,kind:allowFutureDenial?'future-denial':'save'});
}

export function assertFoodLiveIdentity({status,body,email,holderId=null}){
 assert(typeof email==='string'&&HOLDER.test(email),'The original structured-growth holder is required');assert.equal(status,200,'The actual Food identity response must succeed');
 assert(object(body)&&object(body.user)&&typeof body.user.email==='string'&&body.user.email.toLowerCase()===email.toLowerCase(),'Food acceptance must retain the exact original identity');
 const id=body.user.id;assert(Number.isSafeInteger(id)&&id>0,'An actual positive member ID is required');
 if(holderId!==null){assert(Number.isSafeInteger(holderId)&&holderId>0,'The retained actual member ID is required');assert.equal(id,holderId,'Food acceptance cannot switch holder identity');}
 return id;
}

function noStore(headers){const value=typeof headers?.get==='function'?headers.get('cache-control'):headers?.['cache-control']??headers?.['Cache-Control'];assert(typeof value==='string'&&value.split(',').some(token=>token.trim().toLowerCase()==='no-store'),'Food responses must explicitly be no-store');}
export function assertFoodLiveResponse({kind,status,headers,body,operationId}){
 noStore(headers);assert(typeof operationId==='string'&&UUID.test(operationId),'The owned operation UUID is required');
 if(kind==='created'||kind==='retry'){
  assert.equal(status,kind==='created'?201:200,'The exact first-save or idempotent-retry status is required');exactKeys(body,['ok','id'],'The exact owned save response is required');assert.equal(body.ok,true);assert.equal(body.id,operationId,'The response must bind the observed owned operation');
 }else{
  assert.equal(kind,'future-denial','Only first save, idempotent retry and explicit future denial are authorised');assert.equal(status,400,'The exact future-date denial is required');exactKeys(body,['error','message'],'The exact future-date response is required');assert.equal(body.error,'invalid_entry');assert.equal(body.message,'Add what you ate and a valid date.');
 }
 return true;
}
export function assertFoodLiveSnapshot({status,headers,body,expectedEntries}){
 noStore(headers);assert.equal(status,200,'The owned saved Food list must succeed');exactKeys(body,['entries','historyMayBeLimited','meaning'],'The exact Food list contract is required');
 assert(Array.isArray(expectedEntries)&&Array.isArray(body.entries),'Exact expected owned Food entries are required');assert.equal(body.historyMayBeLimited,false,'A newly commissioned Food holder must not have truncated history');assert.equal(body.meaning,FOOD_LIVE_MEANING,'The recorded-food meaning must remain explicit');
 for(const entry of body.entries){exactKeys(entry,['id','operationId','on','food'],'Food proof must omit all unknown amounts and unrelated fields');assert(typeof entry.id==='string'&&UUID.test(entry.id)&&entry.id===entry.operationId,'Each listed entry must retain its observed operation');calendarDay(entry.on);assert(markerOK(entry.food),'Only synthetic Food acceptance records may be read');}
 assert.deepEqual(body.entries,expectedEntries,'Saved Food state must match exactly, including no duplicates or future mutation');return body.entries;
}

// Acceptance only: reuses the original in-process Growth commissioning holder.
import {randomUUID,createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {compiledTreatmentAssets} from './my-treatment-compiled-control.mjs';
import {memberReady,chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const HELD=/\/(?:contact|support|send|email|mail|invite|checkout|payment|order|verification|verify|forgot|recovery|reset)(?:[/?-]|$)/i;
async function compiledFoodAsset(source){
 const control=await compiledTreatmentAssets();assert.equal(control.source,source,'Compile the exact checked-out source');
 const scriptPath=join(control.directory,'worker.js'),require=createRequire(join(process.cwd(),'node_modules/wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=require(process.env.TREATMENT_MINIFLARE||'miniflare');
 const options={modules:true,modulesRoot:dirname(scriptPath),scriptPath,compatibilityDate:'2026-08-09',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{MEMBER_EXPERIENCE_V1_ENABLED:'true',MY_TREATMENT_ENABLED:'true'},outboundService:()=>new Response('Outbound requests disabled in compiled Food control',{status:503})};
 const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options);
 try{const response=await mf.dispatchFetch(FOOD_LIVE_SITE+FOOD_LIVE_ASSET_PATH);assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/javascript/);assert.match(response.headers.get('cache-control')||'',/no-store/);const body=await response.text();assert(body.length);return{source,bundleSha256:control.bundleSha256,body};}
 finally{await mf.dispose();}
}

export async function verifyFoodDiaryLive({page,site,api,email,dir,report,freshSession}){
 const source=process.env.GITHUB_SHA;assertFoodLiveHolder({site,api,email,source,report});assert.equal(typeof freshSession,'function','Reuse the original in-process server-login closure only');
 const row={requirement:'Food diary London-date live save',source,at:new Date().toISOString(),synthetic:true,realCustomerWrites:0,extraHolders:0,notificationsSent:0,status:'running',urls:[site+'/member/grub',site+'/v1/grub/eaten'],checks:[]};report.checks.push(row);
 let holderId=null,expected=[],activeSave=null,guardContext=null,guardPage=null,routeHandler=null;
 const blocked=[],pageErrors=[],onPageError=error=>pageErrors.push(error.message);
 async function self(){for(const origin of [site,api]){assertFoodLiveRequest({url:origin+'/v1/me',method:'GET'});const response=await page.context().request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.match(response.headers()['cache-control']||'',/no-store/);holderId=assertFoodLiveIdentity({status:response.status(),body:await response.json(),email,holderId});}return holderId;}
 async function consent(){await self();assertFoodLiveRequest({url:api+'/v1/consents',method:'GET'});const response=await page.context().request.get(api+'/v1/consents',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(response.status(),200);assert.match(response.headers()['cache-control']||'',/no-store/);const body=await response.json();assert(Array.isArray(body.consents));const latest=body.consents.filter(value=>value.consent_type==='my_shift_health_tracking').sort((a,b)=>Number(b.id)-Number(a.id))[0];assert.equal(Number(latest?.granted),1,'Preserve the existing original-holder optional health consent; do not grant it here');}
 async function snapshot(){await self();assertFoodLiveRequest({url:site+'/v1/grub/eaten',method:'GET'});const response=await page.context().request.get(site+'/v1/grub/eaten',{headers:{Origin:site,'Cache-Control':'no-cache'}});return assertFoodLiveSnapshot({status:response.status(),headers:response.headers(),body:await response.json(),expectedEntries:expected});}
 async function asset(control){assertFoodLiveRequest({url:site+FOOD_LIVE_ASSET_PATH,method:'GET'});const response=await page.context().request.get(site+FOOD_LIVE_ASSET_PATH,{headers:{'Cache-Control':'no-cache'},maxRedirects:0});assert.equal(response.status(),200);assert.match(response.headers()['content-type']||'',/javascript/);assert.match(response.headers()['cache-control']||'',/no-store/);const body=await response.text();assert.equal(body,control.body,'The live Food client must equal the exact compiled Worker response');return{url:site+FOOD_LIVE_ASSET_PATH,sha256:sha(body)};}
 async function install(){guardContext=page.context();guardPage=page;guardPage.on('pageerror',onPageError);routeHandler=async route=>{const request=route.request(),url=new URL(request.url()),method=request.method();try{assert(!url.pathname.startsWith('/v1/auth/')&&!HELD.test(url.pathname),'Held auth/email/support/reset/payment path');if(!['GET','HEAD','OPTIONS'].includes(method)){assert(activeSave,'No browser mutation is authorised outside the single observed Food save');await self();assertFoodLiveRequest({url:request.url(),method,body:request.postDataJSON(),...activeSave});}await route.continue();}catch(error){blocked.push({path:url.pathname,method,error:error.message});await route.abort('blockedbyclient');}};await guardContext.route('**/*',routeHandler);}
 async function uninstall(){if(guardContext&&routeHandler)await guardContext.unroute('**/*',routeHandler);if(guardPage)guardPage.off('pageerror',onPageError);guardContext=null;guardPage=null;routeHandler=null;}
 async function open({navigate=true}={}){if(navigate){const response=await page.goto(site+'/member/grub',{waitUntil:'domcontentloaded'});assert(response?.ok(),'The actual signed-in Grub document must load');}assert.equal(new URL(page.url()).pathname,'/member/grub');await chooseNecessaryCookies(page);const diary=page.locator('details.shift-food-diary');await diary.locator(':scope > summary').waitFor({state:'visible',timeout:30000});if(!await diary.evaluate(element=>element.open))await diary.locator(':scope > summary').click();await diary.locator('[data-eaten-form]').waitFor({state:'visible',timeout:30000});await page.waitForFunction(()=>{const text=document.querySelector('[data-eaten-status]')?.textContent;return text!==undefined&&!text.startsWith('Loading');},null,{timeout:30000});await self();return diary;}
 async function visibleExpected(diary){const history=diary.locator('[data-eaten-history]');for(const entry of expected)await history.getByText(entry.on+' · '+entry.food,{exact:false}).waitFor({state:'visible',timeout:30000});assert.equal(await history.locator('p').count(),expected.length,'Visible history must contain exactly the owned saved synthetic entries');}
 async function post(body,scope,kind){await self();assertFoodLiveRequest({url:site+'/v1/grub/eaten',method:'POST',body,...scope});const response=await page.context().request.post(site+'/v1/grub/eaten',{headers:{Origin:site,'Content-Type':'application/json'},data:body});assertFoodLiveResponse({kind,status:response.status(),headers:response.headers(),body:await response.json(),operationId:body.operationId});return response.status();}
 try{
  await consent();await snapshot();const control=await compiledFoodAsset(source);row.compiledControl={source,bundleSha256:control.bundleSha256,productionResources:0};row.assetBefore=await asset(control);await install();
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});await memberReady(page,{site});const diary=await open(),form=diary.locator('[data-eaten-form]'),day=londonFoodDay(),marker='Synthetic food acceptance '+randomUUID();
   assert.equal(await form.locator('[name="on"]').inputValue(),day,'The actual client defaults to the current London day');assert.equal(await form.locator('[name="on"]').getAttribute('max'),day);
   await form.locator('[name="food"]').fill(marker);await form.locator('[name="on"]').fill(day);for(const key of ['proteinG','waterMl'])assert.equal(await form.locator('[name="'+key+'"]').inputValue(),'','Unknown amounts remain omitted');
   activeSave={day,marker};const requests=[],listener=request=>{if(request.method()==='POST'&&request.url()===site+'/v1/grub/eaten')requests.push(request.postDataJSON());};page.on('request',listener);
   let body,created;
   try{const pending=page.waitForResponse(response=>response.request().method()==='POST'&&response.url()===site+'/v1/grub/eaten',{timeout:30000});await form.getByRole('button',{name:'Save eaten food',exact:true}).click();created=await pending;assert.equal(requests.length,1,'One ordinary UI save request');body=requests[0];assertFoodLiveRequest({url:created.url(),method:'POST',body,...activeSave});assertFoodLiveResponse({kind:'created',status:created.status(),headers:await created.allHeaders(),body:await created.json(),operationId:body.operationId});}
   finally{activeSave=null;page.off('request',listener);}
   await page.waitForFunction(()=>document.querySelector('[data-eaten-status]')?.textContent==='Eaten food saved. Meal plans remain separate.',null,{timeout:30000});
   expected=[{id:body.operationId,...body},...expected];await snapshot();await visibleExpected(diary);
   await post(body,{day,marker,ownedOperationId:body.operationId},'retry');await snapshot();
   const reloaded=await page.reload({waitUntil:'domcontentloaded'});assert(reloaded?.ok(),'The actual Grub page reload must succeed');const reopened=await open({navigate:false});await visibleExpected(reopened);await snapshot();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:join(dir,'food-diary-'+width+'.png'),fullPage:true});row.checks.push({width,url:site+'/member/grub',actualUiSave:201,observedOperationId:body.operationId,idempotentExactReplay:200,oneSavedEntryPerOperation:true,noStoreReadback:true,reloadRetained:true,unknownAmountsOmitted:true,noHorizontalOverflow:true,londonDay:day});
  }
  const day=londonFoodDay(),future={operationId:randomUUID(),on:nextLondonFoodDay(),food:'Synthetic food acceptance '+randomUUID()};assert(!expected.some(entry=>entry.id===future.operationId));await post(future,{day,marker:future.food,allowFutureDenial:true},'future-denial');await snapshot();row.checks.push({futureLondonDay:future.on,actualFutureDenial:400,savedStateUnchanged:true});
  await uninstall();page=await freshSession();await self();await consent();await install();await memberReady(page,{site});const returned=await open();await visibleExpected(returned);await snapshot();row.checks.push({freshOriginalServerLogin:true,newBrowserContext:true,sameActualHolder:true,savedStateRetained:true,publicLoginFormAcceptance:false});
  row.assetAfter=await asset(control);assert.deepEqual(row.assetAfter,row.assetBefore);assert.deepEqual(blocked,[]);assert.deepEqual(pageErrors,[]);row.status='pass';row.ordinarySignupAcceptance=false;row.calendarBoundaryScope='Current real London day live save; unchanged local actual-server regressions cover London/UTC boundary instants without changing the live clock';row.servingIdentity='Exact Food client matches the checked-out compiled Worker before and after; release owner must separately bind terminal production source/tree and stable provider pointer';row.stockAndRoleScope='Original production stock/role/privacy gates remain separately required; no stock, role or consent mutation by this helper';return page;
 }catch(error){row.status='fail';row.error=String(error.message).replaceAll(email,'[synthetic]');throw error;}
 finally{await uninstall();row.finishedAt=new Date().toISOString();row.blockedBrowserRequests=blocked;}
}
