// Existing growth commissioning holder only. No identity creation or mail path.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {memberReady,memberReload,withdrawOptionalHealthTracking,chooseOptionalHealthTracking} from '../../runtime/rendered-member-acceptance-support.mjs';
import {compiledTreatmentAssets} from '../../runtime/release/my-treatment-compiled-control.mjs';

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

export async function readGpOverflowGeometry(page){
 const evidence=await page.evaluate(()=>{
  const assertionScrollWidth=document.documentElement.scrollWidth,assertionInnerWidth=innerWidth;
  const assertion={scrollWidth:assertionScrollWidth,innerWidth:assertionInnerWidth,noHorizontalOverflow:assertionScrollWidth<=assertionInnerWidth+1};
  const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const box=e=>{const c=getComputedStyle(e);return{tag:e.tagName,id:e.id,class:typeof e.className==='string'?e.className:'',rect:rect(e),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,css:{width:c.width,minWidth:c.minWidth,maxWidth:c.maxWidth,fontFamily:c.fontFamily,fontSize:c.fontSize,gridTemplateColumns:c.gridTemplateColumns,flexWrap:c.flexWrap,boxSizing:c.boxSizing,overflowX:c.overflowX,position:c.position,transform:c.transform,padding:c.padding,margin:c.margin,whiteSpace:c.whiteSpace,overflowWrap:c.overflowWrap}};};
  const failure=assertion.noHorizontalOverflow?null:(()=>{
   const properties=['display','position','width','minWidth','maxWidth','height','left','right','top','bottom','inset','margin','padding','transform','translate','scale','zoom','overflowX','overflowY','whiteSpace','contain','contentVisibility','clip','clipPath','boxSizing'];
   const layout=c=>Object.fromEntries(properties.map(k=>[k,/(?:url\s*\(|https?:\/\/)/i.test(c[k]||'')?'[reference]':c[k]]));
   const suspects=[document.documentElement,document.head,document.body,...document.head.children,...document.querySelectorAll('body *')].filter((e,i,a)=>e&&a.indexOf(e)===i).filter(e=>e===document.documentElement||e===document.head||e===document.body||e.parentElement===document.head||e.getClientRects().length&&(()=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||e.scrollWidth>e.clientWidth+1;})()).slice(0,100);
   const allDomElements=[...document.querySelectorAll('*')],allDomWideBoxes=[],allDomGeneratedPseudos=[],allDomSubjects=[];
   for(const[e,index]of allDomElements.map((e,index)=>[e,index])){
    const r=rect(e),c=getComputedStyle(e),visible=e.getClientRects().length>0;
    if(visible&&(e.clientWidth>assertionInnerWidth+1||e.offsetWidth>assertionInnerWidth+1||r.width>assertionInnerWidth+1||r.left< -1||r.right>assertionInnerWidth+1)){allDomSubjects.push(e);allDomWideBoxes.push({tag:e.tagName,index,rect:r,clientWidth:e.clientWidth,offsetWidth:e.offsetWidth,scrollWidth:e.scrollWidth,layout:layout(c)});}
    for(const pseudo of['::before','::after']){const p=getComputedStyle(e,pseudo);if(p.content==='none'||p.content==='normal')continue;allDomSubjects.push(e);allDomGeneratedPseudos.push({tag:e.tagName,index,pseudo,ownerRect:r,ownerClientWidth:e.clientWidth,ownerOffsetWidth:e.offsetWidth,layout:layout(p)});}
   }
   const additionalSubjects=[...new Set(allDomSubjects)],allDomMatchedLayoutRules=[];
   const rules=[],privateSelectors=[];
   const visit=(list,path)=>{for(const rule of list){if(rule.cssRules){try{visit(rule.cssRules,path);}catch{}}if(!rule.selectorText||!rule.style)continue;for(const e of suspects){let matches=false;try{matches=rule.selectorText.split(',').some(s=>e.matches(s.trim().replace(/::?(before|after)\b/g,'')));}catch{}if(matches){privateSelectors.push(rule.selectorText);rules.push({path,selectorIndex:privateSelectors.length-1,layout:layout(rule.style)});break;}}for(const e of additionalSubjects){let matches=false;try{matches=rule.selectorText.split(',').some(s=>e.matches(s.trim().replace(/::?(before|after)\b/g,'')));}catch{}if(matches){privateSelectors.push(rule.selectorText);allDomMatchedLayoutRules.push({path,selectorIndex:privateSelectors.length-1,layout:layout(rule.style)});break;}}}};
   for(const sheet of document.styleSheets){let path='inline';if(sheet.href){try{const u=new URL(sheet.href);path=u.origin==='https://shiftsometimber.co.uk'&&/^\/assets\/[A-Za-z0-9_./-]+$/.test(u.pathname)?u.origin+u.pathname:'unlisted-sheet';}catch{path='unavailable';}}try{visit(sheet.cssRules,path);}catch{rules.push({path,cssRulesReadable:false});}}
   return{allDomElementCount:allDomElements.length,allDomWideBoxes,allDomGeneratedPseudos,allDomMatchedLayoutRules,boxes:suspects.map((e,index)=>({tag:e.tagName,index,rect:rect(e),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,layout:layout(getComputedStyle(e)),pseudo:['::before','::after'].map(pseudo=>{const c=getComputedStyle(e,pseudo);return{pseudo,generated:c.content!=='none'&&c.content!=='normal',layout:layout(c)};})})),matchedLayoutRules:rules,privateHashInputs:{selectors:privateSelectors,html:(document.doctype?new XMLSerializer().serializeToString(document.doctype):'')+document.documentElement.outerHTML,inlineStyles:[...document.querySelectorAll('style')].map(e=>e.textContent)}};
  })();
  return{...(failure?{failureOnly:failure}:{}),assertion,stylesheets:[...document.querySelectorAll('link[rel=stylesheet]')].map(e=>{const u=new URL(e.href,location.href);return{origin:u.origin,path:u.pathname,loaded:!!e.sheet,disabled:e.disabled};}),at:new Date().toISOString(),viewport:{innerWidth,innerHeight,devicePixelRatio,visualViewport:window.visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null},userAgent:navigator.userAgent,fontsStatus:document.fonts?.status,platform:navigator.platform,root:box(document.documentElement),body:box(document.body),overflowing:[...document.querySelectorAll('body *')].filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.right>innerWidth+1||e.scrollWidth>e.clientWidth+1;}).map(e=>({...box(e),ancestors:[e.parentElement,e.parentElement?.parentElement].filter(Boolean).map(box)})).sort((a,b)=>b.rect.right-a.rect.right).slice(0,100)};
 });
 if(evidence.failureOnly){const privateInputs=evidence.failureOnly.privateHashInputs;delete evidence.failureOnly.privateHashInputs;const hashed=body=>({sha256:createHash('sha256').update(body).digest('hex'),bytes:Buffer.byteLength(body)});evidence.failureOnly.documentHtml=hashed(privateInputs.html);evidence.failureOnly.inlineStyles=privateInputs.inlineStyles.map(hashed);for(const rule of [...evidence.failureOnly.matchedLayoutRules,...evidence.failureOnly.allDomMatchedLayoutRules])if(Number.isInteger(rule.selectorIndex)){rule.selectorSha256=hashed(privateInputs.selectors[rule.selectorIndex]).sha256;delete rule.selectorIndex;}}
 return evidence;
}
export async function readGpFailureCdpGeometry(page){
 const session=await page.context().newCDPSession(page);
 try{
  const viewport=await page.evaluate(()=>({innerWidth,innerHeight}));
  const properties=['display','position','width','min-width','max-width','transform','translate','scale','zoom','overflow-x','overflow-y'];
  const snapshot=await session.send('DOMSnapshot.captureSnapshot',{computedStyles:properties,includeDOMRects:true,includePaintOrder:true});
  const tag=value=>/^(?:#text|#document|#document-fragment|[A-Za-z][A-Za-z0-9:-]{0,80})$/.test(value||'')?value:'[node]';
  const layout=values=>Object.fromEntries(properties.map((key,index)=>{const value=snapshot.strings[values?.[index]]||'';return[key,/(?:url\s*\(|https?:\/\/)/i.test(value)?'[reference]':value];}));
  const rect=value=>Array.isArray(value)&&value.length===4&&value.every(Number.isFinite)?value:null;
  const outliers=[];
  for(const[documentIndex,document]of snapshot.documents.entries()){
   const nodes=document.nodes,boxes=document.layout;
   const rare=(data,index)=>{const at=data?.index?.indexOf(index)??-1;return at<0?null:snapshot.strings[data.value[at]];};
   for(let layoutIndex=0;layoutIndex<boxes.nodeIndex.length;layoutIndex++){
    const nodeIndex=boxes.nodeIndex[layoutIndex],bounds=rect(boxes.bounds[layoutIndex]),offsetRect=rect(boxes.offsetRects?.[layoutIndex]),clientRect=rect(boxes.clientRects?.[layoutIndex]),scrollRect=rect(boxes.scrollRects?.[layoutIndex]);
    if(![bounds,offsetRect,clientRect,scrollRect].some(r=>r&&(r[0]< -1||r[0]+r[2]>viewport.innerWidth+1||r[2]>viewport.innerWidth+1)))continue;
    const ancestors=[];let parent=nodes.parentIndex[nodeIndex];
    for(let depth=0;depth<8&&Number.isInteger(parent)&&parent>=0;depth++){const shadow=rare(nodes.shadowRootType,parent);ancestors.push({nodeIndex:parent,tag:tag(snapshot.strings[nodes.nodeName[parent]]),...(shadow&&['open','closed','user-agent'].includes(shadow)?{shadowRootType:shadow}:{})});parent=nodes.parentIndex[parent];}
    const pseudo=rare(nodes.pseudoType,nodeIndex),shadow=rare(nodes.shadowRootType,nodeIndex);
    outliers.push({documentIndex,nodeIndex,tag:tag(snapshot.strings[nodes.nodeName[nodeIndex]]),nodeType:nodes.nodeType[nodeIndex],bounds,offsetRect,clientRect,scrollRect,layout:layout(boxes.styles[layoutIndex]),ancestors,...(pseudo&&['before','after','marker','backdrop','first-line','first-letter'].includes(pseudo)?{pseudoType:pseudo}:{}),...(shadow&&['open','closed','user-agent'].includes(shadow)?{shadowRootType:shadow}:{})});
   }
  }
  return{at:new Date().toISOString(),timing:'After the original atomic assertion and original failure screenshot',viewport,documentCount:snapshot.documents.length,layoutNodeCount:snapshot.documents.reduce((sum,document)=>sum+document.layout.nodeIndex.length,0),outliers};
 }finally{await session.detach().catch(()=>{});}
}



export function captureGpLoadedStylesheets(page){
 const pending=[],records=[];
 const listener=response=>{
  const request=response.request();const u=new URL(response.url()),kind=request.resourceType();if(request.method()!=='GET'||!(kind==='stylesheet'||kind==='document'&&/^\/member\/settings(?:\.html)?\/?$/.test(u.pathname)))return;
  const row={origin:u.origin==='https://shiftsometimber.co.uk'?u.origin:'[unlisted]',path:u.origin==='https://shiftsometimber.co.uk'&&/^(?:\/assets\/[A-Za-z0-9_./-]+|\/member\/settings(?:\.html)?\/?)$/.test(u.pathname)?u.pathname:'[unlisted]',urlSha256:createHash('sha256').update(response.url()).digest('hex'),status:response.status(),resourceType:kind,bodyPending:true};records.push(row);
  pending.push(response.body().then(bytes=>Object.assign(row,{sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,bodyPending:false})).catch(()=>{row.bodyUnavailable=true;}));
 };
 page.on('response',listener);
 return{snapshot:async()=>{return records.map(row=>({...row}));},dispose:()=>page.off('response',listener)};
}

export async function assertGpNoOverflow(page,{row,width,dir,stylesheetEvidence}){
 // First check occurs immediately, as before. Later frames add coverage; no
 // failing frame is waited away, no tolerance is widened and no layout changes.
 for(let frame=0;frame<10;frame++){
  const geometry=await readGpOverflowGeometry(page);
  try{assert(geometry.assertion.noHorizontalOverflow);}catch(error){
   (row.layoutDiagnostics??=[]).push({width,frame,...geometry});
   const path=join(dir,'gp-overflow-failure-'+width+'.png');try{await page.screenshot({path,fullPage:true});row.overflowFailureScreenshot=path;}catch(screenshotError){row.overflowScreenshotError=String(screenshotError.message);}if(stylesheetEvidence){try{row.loadedStylesheetBytes=await stylesheetEvidence.snapshot();}catch{row.loadedStylesheetEvidenceUnavailable=true;}}try{geometry.failureOnly.cdpLayout=await readGpFailureCdpGeometry(page);}catch{geometry.failureOnly.cdpLayoutUnavailable=true;}throw error;
  }
  if(frame<9)await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
 }
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
 const source='0e4a765e7a360d705e2424264e0bcfcc1d6652be';
 assertRecordedWeekHolder({site,api,email,source,report});
 assert.equal(typeof freshSession,'function','Reuse the original authorised fresh-session flow');
 const row={requirement:'factual recorded treatment weeks',at:new Date().toISOString(),source,synthetic:true,realCustomerWrites:0,urls:[site+'/member/dashboard#visualise',site+ROOT+'/week?sources=treatment'],checks:[],status:'running'};
 report.checks.push(row);
 let holderId=null,ownedTreatmentId=null,routeHandler=null,routeContext=null,compiled=null,interruptNextNote=false;
 const blocked=[],failures=[],savedNotes=[];
 const mountObservedPage=page,mountObservations=[];
 const retainMountObservation=row=>{if(mountObservations.length<20)mountObservations.push(row);};
 const observeMountResponse=async response=>{try{
  const u=new URL(response.url());if(![site,api].includes(u.origin))return;
  if(u.pathname===ROOT+'/insights')retainMountObservation(recordedWeekMountObservation({status:response.status(),body:await response.json()}));
  else if(u.pathname==='/assets/member-experience/treatment-week.mjs'){
   const bytes=await response.body(),mime=(response.headers()['content-type']||'').split(';')[0];
   retainMountObservation({kind:'week_module',httpStatus:response.status(),mime:['text/javascript','application/javascript','text/html'].includes(mime)?mime:'other',bytes:bytes.length,sha256:sha(bytes)});
  }
 }catch{retainMountObservation({kind:'observation_unavailable'});}};
 const observeMountError=error=>{const message=String(error?.message||'');retainMountObservation({kind:'page_error',name:['Error','TypeError','SyntaxError','ReferenceError','EvalError','SecurityError'].includes(error?.name)?error.name:'other',classification:/content.security.policy|refused.*script|unsafe.eval/i.test(message)?'csp':/import|module/i.test(message)?'module':'other',messageSha256:sha(message)});};
 const observeMountConsole=message=>{try{const text=message.text();if(message.type()==='error'&&/content.security.policy|refused.*(?:script|evaluate)|unsafe.eval/i.test(text))retainMountObservation({kind:'console_csp',messageSha256:sha(text)});}catch{}};
 mountObservedPage.on('response',observeMountResponse);mountObservedPage.on('pageerror',observeMountError);mountObservedPage.on('console',observeMountConsole);
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
 }catch(error){row.status='fail';row.error=String(error.message).replaceAll(email,'[synthetic]');try{const geometry=await readGpOverflowGeometry(page);row.retainedFailureGeometry=geometry;row.retainedFailureGeometryTiming='Observation after original diary assertion failed; not original atomic failure geometry';}catch{row.retainedFailureGeometryUnavailable=true;}
  row.mountFailureObservations=mountObservations;
  try{row.mountFailureState=await readRecordedWeekMountFailureState(page);}catch{row.mountFailureStateUnavailable=true;}
  throw error;}
 finally{mountObservedPage.off('response',observeMountResponse);mountObservedPage.off('pageerror',observeMountError);mountObservedPage.off('console',observeMountConsole);await removeGuard();row.finishedAt=new Date().toISOString();row.blockedRequests=blocked;}
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
 const source='0e4a765e7a360d705e2424264e0bcfcc1d6652be';assert.match(source||'',/^[a-f0-9]{40}$/);
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

export function recordedWeekMountObservation({status,body}={}){
 const allowed=['available','not_enabled','tracking_off','paused'];
 return{kind:'insights',httpStatus:Number.isInteger(status)&&status>=100&&status<=599?status:null,weekViewAvailable:body?.weekViewAvailable===true,patternsStatus:allowed.includes(body?.patterns?.status)?body.patterns.status:'other',observationsArray:Array.isArray(body?.patterns?.observations),contextDaysArray:Array.isArray(body?.patterns?.contextDays)};
}
export async function readRecordedWeekMountFailureState(page){
 return page.evaluate(()=>{
  const panel=document.querySelector('.shift-pattern-panel'),result=panel?.querySelector('[data-pattern-result]'),value=result?.textContent||'';
  const known=[['checking','Checking your saved records'],['module_load_failed','The optional week view could not load'],['tracking_off','Optional health tracking is off or paused'],['not_available','This optional pattern view is not available yet'],['records_unavailable','The records could not be checked'],['signed_out','Please sign in again'],['insufficient_records','There are not enough comparable recorded days']];
  return{documentHidden:document.hidden,patternPanels:document.querySelectorAll('.shift-pattern-panel').length,panelConnected:!!panel?.isConnected,sourceCheckboxes:panel?.querySelectorAll('input[type=checkbox]').length||0,showContextButtons:panel?.querySelectorAll('[data-pattern-show]').length||0,patternResultExists:!!result,weekNodes:document.querySelectorAll('.shift-treatment-week').length,weekSummaries:document.querySelectorAll('.shift-treatment-week summary').length,progressChartControls:panel?.querySelectorAll('[data-chart-metric]').length||0,knownResult:known.find(([,text])=>value.includes(text))?.[0]||'other_or_empty'};
 });
}
