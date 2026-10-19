// Uses only the two already authorised, normally signed-in commissioning holders.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {compiledTreatmentAssets} from './my-treatment-compiled-control.mjs';
import {assertGpHolder,assertGpSave,assertGpRequest,assertDirectoryResult,gpView,GP_FIELDS,GP_SITE,GP_API} from './gp-directory-live-contract-20261015.mjs';

const sha=v=>createHash('sha256').update(v).digest('hex');
const ASSETS=['/assets/member-experience/member-details.mjs','/assets/member-experience/member-details.css','/assets/member-experience/gp-form.mjs'];
const HELD=/\/(?:contact|support|send|email|mail|invite|checkout|payment|order|verification|verify|forgot|recovery|reset)(?:[/?-]|$)/i;
const onlyGp=d=>gpView(d),withoutGp=d=>Object.fromEntries(Object.entries(d).filter(([k])=>!GP_FIELDS.includes(k)));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function identity(page,{site,api,email,holderId=null}){
 let id=holderId;
 for(const origin of [site,api]){
  const r=await page.context().request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}}),b=await r.json();
  assert.equal(r.status(),200);assert.equal(String(b?.user?.email||'').toLowerCase(),email.toLowerCase(),'Use the actual existing synthetic holder only');
  const actual=String(b.user.id);assert.match(actual,/^[1-9]\d*$/);if(id===null)id=actual;else assert.equal(actual,id,'Actual account identity must remain stable at both origins');
 }
 return id;
}
async function compiledGpAssets(source){
 const control=await compiledTreatmentAssets();assert.equal(control.source,source);
 const scriptPath=join(control.directory,'worker.js'),require=createRequire(join(process.cwd(),'node_modules/wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=require(process.env.TREATMENT_MINIFLARE||'miniflare');
 const options={modules:true,modulesRoot:dirname(scriptPath),scriptPath,compatibilityDate:'2026-08-09',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{MEMBER_EXPERIENCE_V1_ENABLED:'true',MY_TREATMENT_ENABLED:'true',MY_TIMBER_WEEK_VIEW_ENABLED:'true',MEMBER_GP_DIRECTORY_V2_ENABLED:'true',MEMBER_GP_LOOKUP_ENABLED:'true'},outboundService:()=>new Response('Outbound requests disabled in compiled control',{status:503})};
 const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options),assets={};
 try{for(const path of ASSETS){const r=await mf.dispatchFetch(GP_SITE+path);assert.equal(r.status,200);assets[path]=await r.text();assert(assets[path].length);}}finally{await mf.dispose();}
 return {source:control.source,bundleSha256:control.bundleSha256,assets};
}

export async function verifyGpDirectoryLive({page,site,api,email,dir,report,freshSession}){
 const source=process.env.GITHUB_SHA;assertGpHolder({site,api,email,source,report});assert.equal(typeof freshSession,'function');
 const row={requirement:'GP directory member flow',source,at:new Date().toISOString(),synthetic:true,realCustomerWrites:0,notificationsSent:0,urls:[site+'/member/settings'],checks:[],status:'running'};
 report.checks.push(row);
 let holderId=null,baseline=null,guardContext=null,guardPage=null,handler=null,interruptSave=false,interruptSearch=false,lastSave=null;
 const blocked=[],pageErrors=[];
 const onPageError=e=>pageErrors.push(e.message);
 async function self(){holderId=await identity(page,{site,api,email,holderId});}
 async function read(path){await self();assertGpRequest({url:site+path,method:'GET'});const r=await page.context().request.get(site+path,{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(r.status(),200,path);assert.match(r.headers()['cache-control']||'',/no-store/);return r.json();}
 async function profile(){const value=await read('/v1/member/details');assert.equal(value.ok,true);return value;}
 async function assets(control){const out=[];for(const path of ASSETS){const r=await page.context().request.get(site+path,{headers:{'Cache-Control':'no-cache'},maxRedirects:0});assert.equal(r.status(),200);const text=await r.text();assert.equal(text,control.assets[path],'Exact compiled GP source is served: '+path);out.push({url:site+path,sha256:sha(text)});}return out;}
 async function install(){
  guardContext=page.context();guardPage=page;guardPage.on('pageerror',onPageError);handler=async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method();
   try{
    assert(!HELD.test(u.pathname),'Held email/support/commitment path');
    if(!['GET','HEAD','OPTIONS'].includes(method)){
     await self();assertGpRequest({url:req.url(),method,body:req.postDataJSON(),baseline:baseline.details});
     if(interruptSave){interruptSave=false;await route.abort('failed');return;}
    }
    if(interruptSearch&&u.pathname==='/v1/member/details/gp-search'){interruptSearch=false;await route.abort('failed');return;}
    await route.continue();
   }catch(error){blocked.push({path:u.pathname,method,error:error.message});await route.abort('blockedbyclient');}
  };
  await guardContext.route('**/*',handler);
 } 
 async function uninstall(){if(guardContext&&handler)await guardContext.unroute('**/*',handler);if(guardPage)guardPage.off('pageerror',onPageError);guardContext=null;guardPage=null;handler=null;}
 async function open(){
  await page.goto(site+'/member/settings',{waitUntil:'domcontentloaded'});
  await page.locator('#memberDetailsForm[data-gp-directory-v2="true"]').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#memberDetailsFields')?.disabled===false,{},{timeout:30000});
  assert.equal(await page.locator('#memberEmail').inputValue(),email);await self();
 }
 async function save({retry=false}={}){
  const observations=[],listener=req=>{if(new URL(req.url()).pathname==='/v1/member/details'&&req.method()==='PATCH')observations.push(req.postDataJSON());};
  page.on('request',listener);
  try{
   if(retry)interruptSave=true;
   await page.locator('#memberDetailsSave').click();
   if(retry){await page.getByRole('button',{name:'Retry save',exact:true}).waitFor({timeout:30000});assert.equal(observations.length,1);const retained=observations[0];assertGpSave(retained,baseline.details);await page.getByRole('button',{name:'Retry save',exact:true}).click();}
   await page.waitForFunction(()=>document.querySelector('#memberDetailsStatus')?.textContent==='Member details saved.',null,{timeout:30000});
   assert.equal(observations.length,retry?2:1);if(retry)assert.deepEqual(observations[1],observations[0],'Normal UI must retry the same operation and retained details');
   lastSave=observations.at(-1);assertGpSave(lastSave,baseline.details);
   const value=await profile();assert.deepEqual(withoutGp(value.details),withoutGp(baseline.details),'GP edits must preserve all other member details');assert.deepEqual(onlyGp(value.details),onlyGp(lastSave.details));
   return value;
  }finally{interruptSave=false;page.off('request',listener);}
 }
 try{
  await self();baseline=await profile();const control=await compiledGpAssets(source);row.compiledControl={source,bundleSha256:control.bundleSha256,productionResources:0};row.assetsBefore=await assets(control);
  if(baseline.gpDirectoryV2!==true){assert.equal(baseline.gpDirectoryV2,false);row.flagsOff=true;row.status='code_only_verified';row.featureAcceptance=false;row.assetsAfter=await assets(control);assert.deepEqual(row.assetsAfter,row.assetsBefore);return page;}
  assert.equal(baseline.gpLookupConfigured,true);
  for(const key of GP_FIELDS.filter(k=>k!=='gpSelectionMode'))assert.equal(baseline.details[key]??'','','The fresh existing QA holder must have no GP details to overwrite');
  await install();
  const byNation={};
  for(const [nation,q]of [['England','London'],['Wales','Cardiff'],['Scotland','Edinburgh'],['Northern Ireland','Belfast']]){
   await pause(700);const result=await read('/v1/member/details/gp-search?'+new URLSearchParams({q}));assertDirectoryResult(result,{nation});byNation[nation]=result.practices.find(p=>p.nation===nation);
   row.checks.push({nation,actualMatchingResults:true,directoryVersion:result.directoryVersion});
  }
  await pause(700);const nearest=await read('/v1/member/details/gp-search?'+new URLSearchParams({q:'London',near:byNation.England.postcode}));assertDirectoryResult(nearest,{nation:'England'});assert.equal(nearest.order,'nearest_matching_practices','Actual recognised GB postcode must exercise the nearest option');
  await pause(700);const ni=await read('/v1/member/details/gp-search?'+new URLSearchParams({q:'Belfast',near:'BT1 1AA'}));assertDirectoryResult(ni,{nation:'Northern Ireland',nearNorthernIreland:true});row.checks.push({nearestMatching:true,niDistanceExplicitlyUnknown:true});
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});await open();const before=await profile();
   if(width===390){
    interruptSearch=true;await page.locator('#memberGpPractice').fill('London');
    await page.waitForFunction(()=>{const t=document.querySelector('#memberGpDirectoryHelp')?.textContent||'';return t&&!/Finding|Type three|Choose your/.test(t);},null,{timeout:15000});
    assert.equal(await page.locator('#memberGpPractice').inputValue(),'London','Declared interrupted lookup preserves the member input');
   }
   await page.locator('#memberDetailsForm').getByRole('button',{name:'Enter GP details manually',exact:true}).click();
   await page.locator('#memberGpPractice').fill('Edinburgh');
   await page.locator('#memberGpDirectorySelect option[value="0"]').waitFor({state:'attached',timeout:15000});
   const noAutoSave=await profile();assert.deepEqual(noAutoSave.details,before.details);assert.equal(noAutoSave.revision,before.revision);
   await page.locator('#memberGpDirectorySelect').selectOption('0');
   assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),'directory');assert(await page.locator('#memberGpCode').inputValue());assert(await page.locator('#memberGpAddress').inputValue());
   assert.match(await page.locator('#memberGpDirectorySelected').innerText(),/Registration and the clinical notification destination have not been verified/);
   const selected=onlyGp((await page.locator('#memberDetailsForm').evaluate(form=>Object.fromEntries(new FormData(form)))));
   assert.deepEqual((await profile()).details,before.details,'Selection alone must not save the account');
   await save({retry:width===390});await open();for(const [key,id]of Object.entries({gpPractice:'memberGpPractice',gpPostcode:'memberGpPostcode',gpCode:'memberGpCode',gpAddress:'memberGpAddress',gpSelectionMode:'memberGpSelectionMode'}))assert.equal(await page.locator('#'+id).inputValue(),selected[key]);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:join(dir,'gp-member-'+width+'.png'),fullPage:true});
   row.checks.push({width,normalSignedInUi:true,searchAndExplicitSelection:true,noAutomaticSave:true,fullAddressSaved:true,reopenRetained:true,noHorizontalOverflow:true,...(width===390?{declaredSimulatedSearchAndSaveInterruption:true,sameOperationRetry:true}:{})});
  }
  await page.locator('#memberGpSelectionMode').selectOption('no_gp');for(const id of ['memberGpPractice','memberGpPostcode','memberGpAddress','memberGpCode'])assert.equal(await page.locator('#'+id).inputValue(),'');await save();await open();assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),'no_gp');
  await page.locator('#memberDetailsForm').getByRole('button',{name:'Enter GP details manually',exact:true}).click();
  const markerText='Fictional release GP '+randomUUID();await page.locator('#memberGpPractice').fill(markerText);await page.locator('#memberGpAddress').fill('Fictional release acceptance only; no GP notification or registration.');await page.locator('#memberGpPostcode').fill('SK10 1AA');
  assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),'manual');assert.equal(await page.locator('#memberGpCode').inputValue(),'');const finalProfile=await save();
  const assessment=await page.context().newPage();assessment.on('pageerror',onPageError);try{
   await assessment.goto(site+'/treatment-assessment',{waitUntil:'domcontentloaded'});
   const load=assessment.getByRole('button',{name:'Use GP details saved in My Timber',exact:true}),use=assessment.getByRole('button',{name:'Use these GP details',exact:true});await load.waitFor({timeout:30000});
   const unchanged=await assessment.locator('[name="gpPractice"]').inputValue();await load.click();await use.waitFor({timeout:15000});assert.equal(await assessment.locator('[name="gpPractice"]').inputValue(),unchanged);assert.equal(await assessment.locator('[name="gpContactConsent"]').isChecked(),false);
   await use.click();assert.equal(await assessment.locator('[name="gpPractice"]').inputValue(),markerText);assert.equal(await assessment.locator('[name="gpContactConsent"]').isChecked(),false);assert.deepEqual((await profile()).details,finalProfile.details);row.checks.push({savedAssessmentDetailsLoadedOnlyOnRequest:true,separateGpSharingConsentUnchecked:true,assessmentNeverSubmitted:true});
  }finally{await assessment.close();}
  await uninstall();page=await freshSession();await self();await install();await open();assert.deepEqual((await profile()).details,finalProfile.details);assert.equal(await page.locator('#memberGpPractice').inputValue(),markerText);row.checks.push({manualSaved:true,noGpSavedAndReopened:true,freshNormalSignIn:true});
  const anonymous=await page.context().browser().newContext();try{for(const path of ['/v1/member/details','/v1/member/details/gp-search?q=London']){const r=await anonymous.request.get(site+path);assert.equal(r.status(),401);assert.match(r.headers()['cache-control']||'',/no-store/);assert(!(await r.text()).includes(markerText));}}finally{await anonymous.close();}
  row.assetsAfter=await assets(control);assert.deepEqual(row.assetsAfter,row.assetsBefore);assert.deepEqual(blocked,[]);assert.deepEqual(pageErrors,[]);
  const marker={schema:'gp-existing-holder-isolation/v1',source,synthetic:true,holderId,gpHashes:Object.fromEntries(GP_FIELDS.map(k=>[k,sha(String(finalProfile.details[k]??''))])),at:new Date().toISOString()};
  const raw=JSON.stringify(marker,null,2)+'\n';writeFileSync(join(dir,'gp-isolation-marker.json'),raw);row.markerMetadataSha256=sha(raw);row.twoAccountIsolation='Requires the next existing desktop holder receipt';row.hqSignedInAcceptance=false;row.ordinarySignupAcceptance=false;row.servingIdentity='The release owner separately binds terminal production deployment; assets match this exact checked-out source before and after';row.status='pass';return page;
 }catch(error){row.status='fail';row.error=String(error.message).replaceAll(email,'[synthetic]');throw error;}
 finally{await uninstall();row.finishedAt=new Date().toISOString();row.blockedRequests=blocked;}
}

export async function verifyGpIsolationFromExistingHolder({page,site,api,email}){
 const source=process.env.GITHUB_SHA;assertGpHolder({site,api,email,source,second:true});
 const growth=JSON.parse(readFileSync('growth-member-live-evidence/results.json','utf8'));assert.equal(growth.commit,source);assert.equal(growth.status,'pass');assert.equal(growth.synthetic,true);assert.equal(growth.realCustomerRecordsRead,false);
 const first=growth.checks.find(r=>r.requirement==='GP directory member flow'&&r.source===source);assert(first);
 if(first.status==='code_only_verified'){assert.equal(first.flagsOff,true);return{source,status:'not_enabled',featureAcceptance:false};}
 assert.equal(first.status,'pass');const raw=readFileSync('growth-member-live-evidence/gp-isolation-marker.json','utf8'),marker=JSON.parse(raw);assert.equal(sha(raw),first.markerMetadataSha256);assert.equal(marker.schema,'gp-existing-holder-isolation/v1');assert.equal(marker.source,source);assert.equal(marker.synthetic,true);assert.match(marker.holderId,/^[1-9]\d*$/);assert.deepEqual(Object.keys(marker.gpHashes).sort(),[...GP_FIELDS].sort());
 const holderId=await identity(page,{site,api,email});assert.notEqual(holderId,marker.holderId);
 const read=async()=>{await identity(page,{site,api,email,holderId});const r=await page.context().request.get(site+'/v1/member/details',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(r.status(),200);assert.match(r.headers()['cache-control']||'',/no-store/);const b=await r.json();assert.equal(b.ok,true);assert.equal(b.details.email,email);assert.notEqual(sha(String(b.details.gpPractice??'')),marker.gpHashes.gpPractice,'Other holder\'s unique synthetic GP marker must remain private');return b;};
 const before=await read();await identity(page,{site,api,email,holderId});const denied=await page.context().request.get(api+'/v1/hq/management/people/'+marker.holderId+'/gp-details',{headers:{Origin:'https://hq.shiftsometimber.co.uk','Cache-Control':'no-cache'}});assert([401,403].includes(denied.status()),'A member session must not grant an HQ view of another member');assert.match(denied.headers()['cache-control']||'',/no-store/);assert(!(await denied.text()).includes('Fictional release GP'));
 const after=await read();assert.deepEqual(after.details,before.details);assert.equal(after.revision,before.revision);
 return {source,synthetic:true,actualDistinctAccounts:true,ownGpUnchanged:true,firstHolderMarkerAbsent:true,memberSessionCannotReadHqGp:denied.status(),noStore:true,hqSignedInAcceptance:false,ordinarySignupAcceptance:false,status:'pass'};
}
