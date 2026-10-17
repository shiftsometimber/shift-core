// Existing growth commissioning holder only. No identity creation or mail path.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {memberReady,memberReload,withdrawOptionalHealthTracking,chooseOptionalHealthTracking} from '../rendered-member-acceptance-support.mjs';
import {compiledTreatmentAssets} from './my-treatment-compiled-control.mjs';

const SITE='https://shiftsometimber.co.uk',API='https://api.shiftsometimber.co.uk';
const ROOT='/v1/member/treatment',DAY=86400000;
const SYNTHETIC=/^shiftsometimber\+structured-growth-[a-f0-9-]{36}@gmail\.com$/i;
const HELD=/\/(?:contact|support|send|email|mail|invite|checkout|payment|order|recruit|verification|verify|forgot|recovery|reset)(?:[/?-]|$)/i;
const sha=value=>createHash('sha256').update(value).digest('hex');
const ASSETS=['/assets/member-experience/treatment-week.mjs','/assets/member-experience/treatment-week.css'];

async function compiledWeekAssets(source){
 // Reuse the original production-configured compilation, then ask its isolated
 // Worker for the two extra assets. Source-function strings are not controls.
 const compiled=await compiledTreatmentAssets();assert.equal(compiled.source,source);
 const scriptPath=join(compiled.directory,'worker.js'),require=createRequire(join(process.cwd(),'node_modules/wrangler/package.json'));
 const{Miniflare,convertV4MiniflareOptions}=require(process.env.TREATMENT_MINIFLARE||'miniflare');
 const options={modules:true,modulesRoot:dirname(scriptPath),scriptPath,compatibilityDate:'2026-08-09',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{MEMBER_EXPERIENCE_V1_ENABLED:'true',MY_TREATMENT_ENABLED:'true',MY_TIMBER_WEEK_VIEW_ENABLED:'true'},outboundService:()=>new Response('External requests disabled in compiled asset control',{status:503})};
 const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options),assets={};
 try{for(const path of ASSETS){const r=await mf.dispatchFetch(SITE+path);assert.equal(r.status,200);assets[path]=await r.text();assert(assets[path].length);}}finally{await mf.dispose();}
 return{source:compiled.source,bundleSha256:compiled.bundleSha256,assets};
}

export function assertRecordedWeekHolder({site,api,email,source,report}){
 assert.equal(site,SITE);assert.equal(api,API);
 assert(SYNTHETIC.test(String(email||'')),'Existing labelled growth holder required');
 assert.match(source||'',/^[a-f0-9]{40}$/,'Literal checked-out production source required');
 assert.equal(report.synthetic,true);assert.equal(report.realCustomerRecordsRead,false);
}
export function assertRecordedWeekRequest({url,method,body,ownedTreatmentId,allowForeignDenial=false}){
 const target=new URL(url);assert([SITE,API].includes(target.origin),'Only existing member origins permitted');
 assert(!HELD.test(target.pathname),'Email, support and commitment paths are held');
 if(method==='GET'){assert([ROOT,ROOT+'/week',ROOT+'/insights','/v1/me','/v1/consents','/assets/member-experience/treatment-week.mjs','/assets/member-experience/treatment-week.css'].includes(target.pathname),'Unscoped recorded-week read');return;}
 assert.equal(method,'POST','Only explicit scoped synthetic writes permitted');
 assert([ROOT+'/records',ROOT+'/events',ROOT+'/week-note'].includes(target.pathname),'Unscoped recorded-week write');
 assert(body&&typeof body==='object'&&!Array.isArray(body),'Explicit synthetic body required');
 if(target.pathname.endsWith('/records')){
  assert.deepEqual(Object.keys(body).sort(),['medicine','nextAt','prescriptionDetails','supply']);
  assert.equal(body.medicine,'Mounjaro');assert.equal(body.supply,0);assert.equal(body.nextAt,null);
  assert.match(body.prescriptionDetails,/^Fictional release acceptance only; no treatment or prescription\./);
 }else{
  assert(ownedTreatmentId,'Confirmed synthetic owned treatment required');
  assert(body.treatmentId===ownedTreatmentId||allowForeignDenial&&/^unowned-release-denial-[a-f0-9-]{36}$/.test(body.treatmentId),'Unowned treatment write is forbidden');
  if(target.pathname.endsWith('/events')){
   assert(['dose_taken','checkin'].includes(body.kind),'No treatment, schedule or stock changes');
   assert.match(body.note,/^Fictional release acceptance/);
  }else assert.match(body.note,/^Fictional private release note /);
 }
}
export function assertRecordedWeekFacts(week,seed){
 assert.equal(week?.contract,'member-recorded-week/v1');
 assert.deepEqual(week.curve,{status:'not_included',scope:'recorded_facts_only'});
 assert.deepEqual(week.context.sources,['treatment']);
 for(const key of ['food','progress','exercises'])assert.deepEqual(week.context[key],[],'Unselected context must stay unread');
 assert.equal(week.cycles.length,5);assert(week.cycles.every(c=>c.treatmentId===seed.treatmentId));
 assert.deepEqual(week.cycles.map(c=>c.id).sort(),seed.doseIds.slice().sort());
 const older=week.cycles.find(c=>c.id===seed.unknownDose);assert.equal(older.strengthMg,null);assert.equal(older.recordedStrength,null);
 const current=week.cycles.find(c=>c.id===seed.currentDose);assert.equal(current.state,'incomplete');
 assert.equal(current.days.length,7);assert.equal(current.days[6].state,'not_observed');
 const repeated=week.observations.find(o=>o.type==='Nausea');
 assert(repeated,'Three completed recorded weeks must produce factual repeated timing');
 assert.equal(repeated.day,3);assert.equal(repeated.evidence.matchedCycles,3);assert.equal(repeated.evidence.completedCycles,3);
 assert.match(repeated.limitation,/not symptom risk or proof of cause/);
 assert(week.limitations.some(v=>v.includes('No diagnosis, symptom forecast or treatment advice.')));
}

export async function verifyRecordedWeekLive({page,site,api,email,dir,report,freshSession}){
 const source=process.env.GITHUB_SHA;
 assertRecordedWeekHolder({site,api,email,source,report});
 assert.equal(typeof freshSession,'function','Reuse the original authorised fresh-session flow');
 const row={requirement:'factual recorded treatment weeks',at:new Date().toISOString(),source,synthetic:true,realCustomerWrites:0,urls:[site+'/member/dashboard#visualise',site+ROOT+'/week?sources=treatment'],checks:[],status:'running'};
 report.checks.push(row);
 let holderId=null,ownedTreatmentId=null,routeHandler=null,routeContext=null,compiled=null,interruptNextNote=false;
 const blocked=[],failures=[],savedNotes=[];
 async function identity(){
  for(const origin of [site,api]){
   const r=await page.context().request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}}),b=await r.json();
   assert.equal(r.status(),200);assert.equal(String(b?.user?.email||'').toLowerCase(),email.toLowerCase(),'Never access another member');
   const id=String(b.user.id);assert(id&&id!=='undefined');if(holderId!==null)assert.equal(id,holderId,'Synthetic holder changed');else holderId=id;
  }
 }
 async function request(path,body,{expect=200,allowForeignDenial=false}={}){
  const method=body?'POST':'GET',url=site+path;
  assertRecordedWeekRequest({url,method,body,ownedTreatmentId,allowForeignDenial});
  await identity();
  const r=await page.context().request.fetch(url,{method,headers:{Origin:site,'Cache-Control':'no-cache'},...(body?{data:body}:{})});
  assert.equal(r.status(),expect,path+' must return '+expect);
  assert.match(r.headers()['cache-control']||'',/no-store/,'Private results must not be stored');
  return r.json();
 }
 async function installGuard(){
  routeContext=page.context();routeHandler=async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method();
   try{
    assert(!HELD.test(url.pathname),'Held email/support/commitment route');
    if(!['GET','HEAD','OPTIONS'].includes(method)){
     assert([site,api].includes(url.origin),'No external messages');
     const body=req.postDataJSON();
     if(url.pathname==='/v1/consents'){
      assert.equal(method,'POST');assert.equal(body.type,'my_shift_health_tracking');assert.equal(typeof body.granted,'boolean');
     }else assertRecordedWeekRequest({url:req.url(),method,body,ownedTreatmentId});
     await identity();
    }
    if(interruptNextNote&&url.pathname===ROOT+'/week-note'&&method==='POST'){interruptNextNote=false;await route.abort('failed');return;}
    await route.continue();
   }catch(error){blocked.push({path:url.pathname,method});failures.push(error.message);await route.abort('blockedbyclient');}
  };
  await routeContext.route('**/*',routeHandler);
 }
 async function removeGuard(){if(routeContext&&routeHandler)await routeContext.unroute('**/*',routeHandler);routeContext=null;routeHandler=null;}
 async function servedAssets(){
  const results=[];
  for(const path of ASSETS){
   assertRecordedWeekRequest({url:site+path,method:'GET'});
   const r=await page.context().request.get(site+path,{headers:{'Cache-Control':'no-cache'},maxRedirects:0});
   assert.equal(r.status(),200,'Exact compiled source asset is served');const body=await r.text();assert.equal(body,compiled.assets[path],'Live asset differs from compiled checked-out source');results.push({url:site+path,sha256:sha(body)});
  }return results;
 }
 async function openWeek({reload=false}={}){
  if(reload)await memberReload(page,{site,panel:'visualise'});else await memberReady(page,{site,panel:'visualise'});
  const patterns=page.locator('.shift-pattern-panel');await patterns.waitFor({state:'visible',timeout:30000});
  await patterns.getByLabel('Jabs and symptoms',{exact:true}).check();
  for(const label of ['Food notes and protein snapshots','Exercises marked done','Steps and sleep readings'])await patterns.getByLabel(label,{exact:true}).uncheck();
  await patterns.getByRole('button',{name:'Show context',exact:true}).click();
  const week=page.locator('.shift-treatment-week');await week.locator('summary').first().click();await week.getByLabel('Choose a recorded week').waitFor({timeout:30000});
  assert.equal(await week.locator('svg path').count(),0);assert.doesNotMatch(await week.innerText(),/awaiting qualified model|Estimated medication curve/);
  return week;
 }
 try{
  compiled=await compiledWeekAssets(source);row.compiledControl={source:compiled.source,bundleSha256:compiled.bundleSha256,productionResources:0};
  await identity();await installGuard();row.assetsBefore=await servedAssets();
  const empty=await request(ROOT);assert.deepEqual(empty.treatments,[],'Existing growth holder must have no treatment record to overwrite');assert.deepEqual(empty.events,[]);
  const consent=await request('/v1/consents');const latest=consent.consents.filter(v=>v.consent_type==='my_shift_health_tracking').sort((a,b)=>Number(b.id)-Number(a.id))[0];assert.equal(Number(latest?.granted),1,'Retain original explicitly authorised synthetic tracking choice');
  const record=await request(ROOT+'/records',{medicine:'Mounjaro',prescriptionDetails:'Fictional release acceptance only; no treatment or prescription. '+randomUUID(),supply:0,nextAt:null},{expect:201});ownedTreatmentId=record.id;
  const at=Date.now(),iso=t=>new Date(t).toISOString(),seed={treatmentId:record.id,doseIds:[]};
  for(const days of [42,28,21,14,2]){
   const id=randomUUID(),when=at-days*DAY;seed.doseIds.push(id);if(days===42)seed.unknownDose=id;if(days===2)seed.currentDose=id;
   await request(ROOT+'/events',{treatmentId:record.id,kind:'dose_taken',occurredAt:iso(when),note:'Fictional release acceptance: recorded dose only',operationId:id,...(days===42?{}:{doseStrength:'7.5 mg'})},{expect:201});
   if([28,21,14].includes(days))await request(ROOT+'/events',{treatmentId:record.id,kind:'checkin',occurredAt:iso(when+2*DAY+7200000),note:'Fictional release acceptance: recorded check-in',operationId:randomUUID(),checkin:{sideEffects:'Fictional nausea; release QA only',symptomType:'Nausea',symptomSeverity:5,symptomStartedAt:iso(when+2*DAY+3600000),appetite:'Low',energy:'Low'}},{expect:201});
  }
  assertRecordedWeekFacts((await request(ROOT+'/week?sources=treatment')).week,seed);
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});let week=await openWeek();
   assert.match(await week.innerText(),/day 3 after 3 of 3/);assert.equal(await week.locator('.shift-week-days article').count(),7);assert.equal(await week.locator('.shift-week-days article:visible').count(),1);
   await week.getByLabel('Choose a recorded week').selectOption(seed.unknownDose);assert.match(await week.innerText(),/Strength not recorded/);
   await week.getByRole('tab',{name:'Day 7',exact:true}).click();await week.getByRole('tab',{name:'Day 7',exact:true}).press('Home');await week.getByRole('tab',{name:'Day 1',exact:true}).press('ArrowRight');assert.equal(await week.getByRole('tab',{name:'Day 2',exact:true}).getAttribute('aria-selected'),'true');
   await week.getByLabel('Choose a recorded week').selectOption(seed.currentDose);
   const note='Fictional private release note '+width+' '+randomUUID();savedNotes.push(note);await week.getByLabel('A question or note for your prescriber').fill(note);
   let savedOperation=null;const operations=[],observe=req=>{if(new URL(req.url()).pathname===ROOT+'/week-note'){savedOperation=req.postDataJSON();operations.push(savedOperation);}};page.on('request',observe);
   try{
    interruptNextNote=true;await week.getByRole('button',{name:'Save my note',exact:true}).click();
    await page.waitForFunction(()=>{const root=document.querySelector('.shift-treatment-week');return !!root?.querySelector('[data-week-status]')?.textContent&&!root.querySelector('form button')?.disabled;},null,{timeout:30000});
    assert.equal(await week.getByLabel('A question or note for your prescriber').inputValue(),note,'Client retains input after the declared simulated request interruption');
    await week.getByRole('button',{name:'Save my note',exact:true}).click();await week.getByText('Your private note is saved.',{exact:true}).waitFor({timeout:30000});assert.equal(operations.length,2);assert.deepEqual(operations[0],operations[1],'The ordinary client retries the same operation');
   }finally{interruptNextNote=false;page.off('request',observe);}
   assert(savedOperation,'Observe the ordinary client save');const replay=await request(ROOT+'/week-note',savedOperation);assert.equal(replay.replayed,true,'Same original operation retries idempotently');
   const readback=(await request(ROOT+'/week?sources=treatment')).week;assertRecordedWeekFacts(readback,seed);assert.equal(readback.questionNotes.filter(n=>n.text===note).length,1,'One private note only');
   week=await openWeek({reload:true});await week.getByLabel('Choose a recorded week').selectOption(seed.currentDose);assert.match(await week.innerText(),new RegExp(note));
   const[download]=await Promise.all([page.waitForEvent('download'),week.getByRole('button',{name:'Download this recorded week (text)',exact:true}).click()]);const exported=readFileSync(await download.path(),'utf8');assert(exported.includes(note));assert.match(exported,/No information sent automatically\./);assert.doesNotMatch(exported,/exposure|medication estimate/i);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');await page.screenshot({path:join(dir,'recorded-week-'+width+'.png'),fullPage:true});
   row.checks.push({width,sevenDays:true,keyboard:true,unknownStrengthPreserved:true,factualRepeatedTiming:true,declaredSimulatedRequestInterruption:true,clientRetainedInputAndRetriedSameOperation:true,privateNoteSavedOnce:true,reloadRetained:true,factualLocalTextDownload:true});
  }
  const foreign=await request(ROOT+'/week-note',{treatmentId:'unowned-release-denial-'+randomUUID(),note:'Fictional private release note ownership denial',operationId:randomUUID(),occurredAt:iso(Date.now())},{expect:404,allowForeignDenial:true});assert.equal(foreign.error,'treatment_not_found');
  const anonymous=await page.context().browser().newContext();try{const denied=await anonymous.request.get(api+ROOT+'/week?sources=treatment');assert.equal(denied.status(),401);assert.match(denied.headers()['cache-control']||'',/no-store/);assert.deepEqual(await denied.json(),{error:'authentication_required'});}finally{await anonymous.close();}
  const beforeWithdrawal=(await request(ROOT+'/week?sources=treatment')).week.questionNotes.length;
  await withdrawOptionalHealthTracking(page,{site});const denied=await request(ROOT+'/week?sources=treatment',undefined,{expect:409});assert.equal(denied.error,'tracking_off');
  await memberReady(page,{site,panel:'visualise'});await page.locator('#shiftProgressStory[aria-busy="false"]').waitFor({timeout:30000});
  const patterns=page.locator('.shift-pattern-panel');
  if(await patterns.count()&&await patterns.isVisible()){
   await patterns.getByLabel('Jabs and symptoms',{exact:true}).check();await patterns.getByRole('button',{name:'Show context',exact:true}).click();await patterns.getByText('Optional health tracking is off or paused. Review your tracking choice first.',{exact:true}).waitFor();row.withdrawnUi='existing pattern controls show explicit denial';
  }else{
   assert.match(await page.locator('#panel-visualise').innerText(),/optional (?:health )?tracking is off|tracking is off or paused|review your tracking choice/i,'Absent controls require an explicit tracking-off explanation');row.withdrawnUi='explicit tracking-off notice';
  }
  assert.equal(await page.locator('.shift-treatment-week').count(),0);for(const note of savedNotes)assert(!(await page.locator('#panel-visualise').innerText()).includes(note),'Withdrawn private notes must not remain rendered');
  await chooseOptionalHealthTracking(page,{site});assert.equal((await request(ROOT+'/week?sources=treatment')).week.questionNotes.length,beforeWithdrawal);
  await removeGuard();page=await freshSession();await identity();await installGuard();const returnedUi=await openWeek(),returnedWeek=(await request(ROOT+'/week?sources=treatment')).week;assertRecordedWeekFacts(returnedWeek,seed);assert.equal(returnedWeek.questionNotes.length,beforeWithdrawal);for(const note of savedNotes){assert.equal(returnedWeek.questionNotes.filter(n=>n.text===note).length,1);assert((await returnedUi.innerText()).includes(note),'Private note survives fresh browser sign-in');}
  row.assetsAfter=await servedAssets();assert.deepEqual(row.assetsAfter,row.assetsBefore,'Exact live assets changed during acceptance');assert.deepEqual(blocked,[]);assert.deepEqual(failures,[]);
  row.checks.push({anonymousDenied:true,unknownTreatmentDenied:true,consentWithdrawalDenied:true,privateUiCleared:true,consentRestoredThroughUi:true,freshBrowserSignIn:true});
  const marker={schema:'recorded-week-existing-holder-isolation/v1',source,synthetic:true,holderId,treatmentId:ownedTreatmentId,noteHashes:savedNotes.map(sha),at:new Date().toISOString()};
  const markerBody=JSON.stringify(marker,null,2)+'\n';writeFileSync(join(dir,'recorded-week-isolation-marker.json'),markerBody);row.markerMetadataSha256=sha(markerBody);
  row.twoAccountIsolation='First-holder markers prepared; the next existing G2-011 holder must prove isolation separately';row.sameServing='Exact week JS/CSS match this source before and after; terminal deployment identity is recorded separately by the release owner';row.status='pass';return page;
 }catch(error){row.status='fail';row.error=String(error.message).replaceAll(email,'[synthetic]');throw error;}
 finally{await removeGuard();row.finishedAt=new Date().toISOString();row.blockedRequests=blocked;}
}

export function assertRecordedWeekIsolationMarker(marker,{source,holderId}){
 assert.equal(marker.schema,'recorded-week-existing-holder-isolation/v1');assert.equal(marker.source,source);assert.equal(marker.synthetic,true);
 assert.match(String(marker.holderId),/^(?:\d{1,20}|[a-f0-9-]{36})$/i);assert.notEqual(String(marker.holderId),String(holderId),'Two different actual existing holders required');
 assert.match(marker.treatmentId,/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
 assert.equal(marker.noteHashes.length,2);for(const hash of marker.noteHashes)assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(new Set(marker.noteHashes).size,2);
 assert.deepEqual(Object.keys(marker).sort(),['at','holderId','noteHashes','schema','source','synthetic','treatmentId']);
}

// Called after the existing G2-011 account's normal login and original seed.
// No registration, password, cookie, second-account handoff or GP activation.
export async function verifyRecordedWeekIsolationFromExistingHolder({page,site,api,email}){
 assert.equal(site,SITE);assert.equal(api,API);assert.match(email,/^shiftsometimber\+structured-progressstory-\d+-desktop@gmail\.com$/i);
 const source=process.env.GITHUB_SHA;assert.match(source||'',/^[a-f0-9]{40}$/);
 const markerRaw=readFileSync('growth-member-live-evidence/recorded-week-isolation-marker.json','utf8'),marker=JSON.parse(markerRaw),growth=JSON.parse(readFileSync('growth-member-live-evidence/results.json','utf8'));
 assert.equal(growth.commit,source);assert.equal(growth.status,'pass');assert.equal(growth.synthetic,true);assert.equal(growth.realCustomerRecordsRead,false);
 assert(growth.checks.some(row=>row.requirement==='factual recorded treatment weeks'&&row.source===source&&row.status==='pass'&&row.markerMetadataSha256===sha(markerRaw)),'Bind the first holder to its actual successful same-source live report');
 let holderId=null;
 const identity=async()=>{for(const origin of [site,api]){const r=await page.context().request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}}),body=await r.json();assert.equal(r.status(),200);assert.equal(String(body?.user?.email||'').toLowerCase(),email.toLowerCase());const id=String(body.user.id);assert(id&&id!=='undefined');if(holderId!==null)assert.equal(id,holderId);else holderId=id;assertRecordedWeekIsolationMarker(marker,{source,holderId});}};
 const read=async()=>{await identity();const r=await page.context().request.get(site+ROOT+'/week?sources=treatment',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(r.status(),200);assert.match(r.headers()['cache-control']||'',/no-store/);const body=await r.json();assert.equal(body.week?.contract,'member-recorded-week/v1');assert.deepEqual(body.week.context.sources,['treatment']);assert(body.week.cycles.every(c=>c.treatmentId!==marker.treatmentId));assert(body.week.questionNotes.every(n=>!marker.noteHashes.includes(sha(n.text))));return body.week;};
 const before=await read();await identity();
 const denied=await page.context().request.post(site+ROOT+'/week-note',{headers:{Origin:site,'Content-Type':'application/json'},data:{treatmentId:marker.treatmentId,note:'Fictional private release note cross-account denial '+randomUUID(),operationId:randomUUID(),occurredAt:new Date().toISOString()}});
 assert.equal(denied.status(),404);assert.match(denied.headers()['cache-control']||'',/no-store/);assert.deepEqual(await denied.json(),{error:'treatment_not_found'});
 const after=await read();for(const key of ['cycles','questionNotes','observations','curve','context'])assert.deepEqual(after[key],before[key],'Foreign-owner denial must not change the existing holder\'s private week state');
 return{source,synthetic:true,holderA:marker.holderId,holderB:holderId,actualDistinctAccounts:true,firstHolderMarkersAbsent:true,actualForeignTreatmentNoteDenied:404,noStore:true,secondHolderStateUnchanged:true,urls:[site+ROOT+'/week?sources=treatment',site+ROOT+'/week-note'],ordinaryAccountAcceptance:false,hqAcceptance:false};
}
