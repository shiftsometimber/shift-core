// Uses only the two already authorised, normally signed-in commissioning holders.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {compiledTreatmentAssets} from '../../runtime/release/my-treatment-compiled-control.mjs';
function originalGpNativeContract(){
 const require=createRequire(import.meta.url),{execFileSync}=require('node:child_process'),{resolve}=require('node:path'),{fileURLToPath}=require('node:url');
 const policy=JSON.parse(readFileSync(new URL('./gp-h55-live-qa-policy-20261016.json',import.meta.url),'utf8')),row=policy.originalGpContract;
 assert.equal(row.source,'b6f9c0c36d4303e5d384fb2d62b58968b998aa64');assert.equal(row.path,'release/gp-directory-live-contract-20261015.mjs');
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../runtime');
 const native=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','-C',root,...args]);
 assert.equal(native('rev-parse',row.source+':'+row.path).toString().trim(),row.blob);
 const body=native('show',row.source+':'+row.path);
 assert.equal(createHash('sha256').update(body).digest('hex'),row.sha256,'Whole unchanged native original GP contract required');
 assert.equal(createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex'),row.blob);
 return body.toString('base64');
}
const {assertGpHolder,assertGpSave,assertGpRequest,assertDirectoryResult,gpView,GP_FIELDS,GP_SITE,GP_API}=await import('data:text/javascript;base64,'+originalGpNativeContract());

import {chooseNecessaryCookies} from '../../runtime/rendered-member-acceptance-support.mjs';

export function isPreventedGpBackground(url,method,{site,api}){
 const u=new URL(url);if(method==='DELETE')return u.pathname==='/v1/acquisition-attribution'&&[site,api].includes(u.origin);if(method!=='POST')return false;
 return u.pathname==='/v1/my-timber-pwa/status'&&[site,api].includes(u.origin)||u.pathname==='/cdn-cgi/rum'&&[site,'https://cloudflareinsights.com'].includes(u.origin);
}
export async function openNormalGpDisclosures(page){
 await chooseNecessaryCookies(page);const started=Date.now(),remaining=()=>{assert(Date.now()-started<30000,'Original Settings opening budget exceeded');return Math.max(1,30000-(Date.now()-started));};
 const form=page.locator('#memberDetailsForm[data-gp-directory-v2="true"]');await form.waitFor({state:'attached',timeout:remaining()});
 await page.waitForFunction(()=>document.querySelector('#memberDetailsForm')?.closest('main')?.getClientRects().length>0,null,{timeout:remaining()});
 for(const selector of ['#memberDetailsForm','#memberEmail','#memberGpSelectionMode']){
  const field=page.locator(selector);
  for(let attempt=0;attempt<8;attempt++){
   const closed=field.locator('xpath=ancestor::details[not(@open)]');if(!await closed.count())break;
   let opened=false;for(let i=0;i<await closed.count();i++){const summary=closed.nth(i).locator(':scope > summary');if(await summary.isVisible()){await summary.click({timeout:remaining()});opened=true;break;}}
   assert(opened,'Original GP control must have a normal visible disclosure summary: '+selector);
  }
 }
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

export function clinicalGpReuseState({status,assessmentAvailable,expectedInactive}){
 assert.equal(status,200,'Actual owned-account clinical context must authenticate successfully');assert.equal(typeof assessmentAvailable,'boolean');assert.equal(typeof expectedInactive,'boolean');
 if(expectedInactive){assert.equal(assessmentAvailable,false,'The retained clinical activation boundary must remain OFF');return'blocked_by_retained_clinical_activation';}
 assert.equal(assessmentAvailable,true,'Unexpected clinical unavailability remains a technical failure');return'run_original_positive_assertions';
}

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

export async function verifyGpDirectoryLive({page,site,api,email,dir,report,freshSession,runtimeSource,clinicalConnectionExpectedInactive=false,assessmentVariantId=null}){
 const source=runtimeSource===undefined?process.env.GITHUB_SHA:runtimeSource;assertGpHolder({site,api,email,source,report});assert.equal(typeof freshSession,'function');
 const row={requirement:'GP directory member flow',source,at:new Date().toISOString(),synthetic:true,realCustomerWrites:0,notificationsSent:0,urls:[site+'/member/settings'],checks:[],status:'running'};
 report.checks.push(row);
 let holderId=null,baseline=null,guardContext=null,guardPage=null,handler=null,interruptSave=false,interruptSearch=false,lastSave=null;
 const blocked=[],pageErrors=[],preventedBackground=[],stylesheetEvidence=captureGpLoadedStylesheets(page);
 const onPageError=e=>pageErrors.push(e.message);
 async function self(){holderId=await identity(page,{site,api,email,holderId});}
 async function read(path){await self();assertGpRequest({url:site+path,method:'GET'});const r=await page.context().request.get(site+path,{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(r.status(),200,path);assert.match(r.headers()['cache-control']||'',/no-store/);return r.json();}
 async function profile(){const value=await read('/v1/member/details');assert.equal(value.ok,true);return value;}
 async function assets(control){const out=[];for(const path of ASSETS){const r=await page.context().request.get(site+path,{headers:{'Cache-Control':'no-cache'},maxRedirects:0});assert.equal(r.status(),200);const text=await r.text();assert.equal(text,control.assets[path],'Exact compiled GP source is served: '+path);out.push({url:site+path,sha256:sha(text)});}return out;}
 async function install(){
  guardContext=page.context();guardPage=page;guardPage.on('pageerror',onPageError);handler=async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method();
   if(isPreventedGpBackground(req.url(),method,{site,api})){preventedBackground.push({origin:u.origin,path:u.pathname,method,disposition:'aborted_before_network',authority:'Unrelated analytics/PWA and cookie-attribution cleanup writes remain held'});await route.abort('blockedbyclient');return;}
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
  await openNormalGpDisclosures(page);
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
   await save({retry:true});await open();for(const [key,id]of Object.entries({gpPractice:'memberGpPractice',gpPostcode:'memberGpPostcode',gpCode:'memberGpCode',gpAddress:'memberGpAddress',gpSelectionMode:'memberGpSelectionMode'}))assert.equal(await page.locator('#'+id).inputValue(),selected[key]);
   await assertGpNoOverflow(page,{row,width,dir,stylesheetEvidence});
   await page.screenshot({path:join(dir,'gp-member-'+width+'.png'),fullPage:true});
   row.checks.push({width,normalSignedInUi:true,declaredSimulatedSaveInterruption:true,sameOperationRetry:true,searchAndExplicitSelection:true,noAutomaticSave:true,fullAddressSaved:true,reopenRetained:true,noHorizontalOverflow:true,...(width===390?{declaredSimulatedSearchAndSaveInterruption:true,sameOperationRetry:true}:{})});
  }
  const selectedDirectoryBeforeFreshLogin=await profile();
  assert.equal(selectedDirectoryBeforeFreshLogin.details.gpSelectionMode,'directory');
  await uninstall();page=await freshSession();await self();await install();
  const selectedDirectoryFreshStylesheets=captureGpLoadedStylesheets(page);
  try{
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:900});await open();
    assert.deepEqual((await profile()).details,selectedDirectoryBeforeFreshLogin.details,'The selected surgery and every other member detail must survive an actual fresh normal sign-in');
    for(const [key,id]of Object.entries({gpPractice:'memberGpPractice',gpPostcode:'memberGpPostcode',gpCode:'memberGpCode',gpAddress:'memberGpAddress',gpSelectionMode:'memberGpSelectionMode'}))assert.equal(await page.locator('#'+id).inputValue(),selectedDirectoryBeforeFreshLogin.details[key]);
    await assertGpNoOverflow(page,{row,width,dir,stylesheetEvidence:selectedDirectoryFreshStylesheets});
    await page.screenshot({path:join(dir,'gp-selected-surgery-fresh-login-'+width+'.png'),fullPage:true});
    row.checks.push({width,selectedSurgeryRetainedAfterFreshNormalSignIn:true,fullCorrectGpFieldsRetained:true,noHorizontalOverflow:true});
   }
  }finally{selectedDirectoryFreshStylesheets.dispose();}
  await page.locator('#memberGpSelectionMode').selectOption('no_gp');for(const id of ['memberGpPractice','memberGpPostcode','memberGpAddress','memberGpCode'])assert.equal(await page.locator('#'+id).inputValue(),'');await save();await open();assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),'no_gp');
  await page.locator('#memberDetailsForm').getByRole('button',{name:'Enter GP details manually',exact:true}).click();
  const markerText='Fictional release GP '+randomUUID();await page.locator('#memberGpPractice').fill(markerText);await page.locator('#memberGpAddress').fill('Fictional release acceptance only; no GP notification or registration.');await page.locator('#memberGpPostcode').fill('SK10 1AA');
  assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),'manual');assert.equal(await page.locator('#memberGpCode').inputValue(),'');const finalProfile=await save();
  const clinicalRow={requirement:'Original positive GP reuse in clinical assessment',status:'running',source,originalPositiveAssertionsExecuted:false,intakeSubmitted:false,paymentAttempted:false};report.checks.push(clinicalRow);
  const assessment=await page.context().newPage();assessment.on('pageerror',onPageError);try{
   const contextResponse=await assessment.request.get(api+'/v1/commerce/medicine-clinical-context',{headers:{Origin:site,'Cache-Control':'no-cache'}}),context=await contextResponse.json();
   const state=clinicalGpReuseState({status:contextResponse.status(),assessmentAvailable:context.assessmentAvailable,expectedInactive:clinicalConnectionExpectedInactive});
   clinicalRow.observed={authenticatedContextStatus:contextResponse.status(),assessmentAvailable:context.assessmentAvailable,expectedClinicalConnectionInactive:clinicalConnectionExpectedInactive};
   if(state==='run_original_positive_assertions')assert(Number.isSafeInteger(assessmentVariantId)&&assessmentVariantId>0,'An actual approved selected treatment variant is required; no stock or treatment-selection bypass');
   await assessment.goto(site+'/treatment-assessment'+(assessmentVariantId?'?variant='+encodeURIComponent(assessmentVariantId):''),{waitUntil:'domcontentloaded'});
   if(state==='blocked_by_retained_clinical_activation'){
    assert.equal(typeof context.emailVerified,'boolean');const accountMessage=context.emailVerified?'Signed in to My Timber. Check your saved contact details before submitting.':'Your account email must be verified before submission. No email has been requested by this page.';await assessment.locator('#accountStatus').filter({hasText:accountMessage}).waitFor({timeout:30000});assert.equal(await assessment.locator('#assessment').isVisible(),false);assert.equal(await assessment.locator('[name="gpContactConsent"]').isChecked(),false);assert.deepEqual((await profile()).details,finalProfile.details);
    clinicalRow.status='blocked';clinicalRow.requiredInput='Chosen prescriber approved questionnaire/API/identity/evidence/consent workflow, applicable clinical activation approval and an actually available permitted selected variant. Keep stock and sales controls intact.';clinicalRow.closedGateVerified=true;
   }else{

   const load=assessment.getByRole('button',{name:'Use GP details saved in My Timber',exact:true}),use=assessment.getByRole('button',{name:'Use these GP details',exact:true});await load.waitFor({timeout:30000});
   const unchanged=await assessment.locator('[name="gpPractice"]').inputValue();await load.click();await use.waitFor({timeout:15000});assert.equal(await assessment.locator('[name="gpPractice"]').inputValue(),unchanged);assert.equal(await assessment.locator('[name="gpContactConsent"]').isChecked(),false);
   await use.click();assert.equal(await assessment.locator('[name="gpPractice"]').inputValue(),markerText);assert.equal(await assessment.locator('[name="gpContactConsent"]').isChecked(),false);assert.deepEqual((await profile()).details,finalProfile.details);row.checks.push({savedAssessmentDetailsLoadedOnlyOnRequest:true,separateGpSharingConsentUnchecked:true,assessmentNeverSubmitted:true});
   clinicalRow.originalPositiveAssertionsExecuted=true;clinicalRow.status='pass';
   }
  }finally{await assessment.close();}
  await uninstall();page=await freshSession();await self();await install();await open();assert.deepEqual((await profile()).details,finalProfile.details);assert.equal(await page.locator('#memberGpPractice').inputValue(),markerText);row.checks.push({manualSaved:true,noGpSavedAndReopened:true,freshNormalSignIn:true});
  const anonymous=await page.context().browser().newContext();try{for(const path of ['/v1/member/details','/v1/member/details/gp-search?q=London']){const r=await anonymous.request.get(site+path);assert.equal(r.status(),401);assert.match(r.headers()['cache-control']||'',/no-store/);assert(!(await r.text()).includes(markerText));}}finally{await anonymous.close();}
  row.assetsAfter=await assets(control);assert.deepEqual(row.assetsAfter,row.assetsBefore);assert.deepEqual(blocked,[]);assert.deepEqual(pageErrors,[]);
  const marker={schema:'gp-existing-holder-isolation/v1',source,synthetic:true,holderId,gpHashes:Object.fromEntries(GP_FIELDS.map(k=>[k,sha(String(finalProfile.details[k]??''))])),at:new Date().toISOString()};
  const raw=JSON.stringify(marker,null,2)+'\n';writeFileSync(join(dir,'gp-isolation-marker.json'),raw);row.markerMetadataSha256=sha(raw);row.twoAccountIsolation='Requires the next existing desktop holder receipt';row.hqSignedInAcceptance=false;row.ordinarySignupAcceptance=false;row.servingIdentity='The release owner separately binds terminal production deployment; assets match this exact checked-out source before and after';row.scope='GP settings, persistence, denial and marker proof; clinical assessment positive case is separately reported';row.status='pass';return page;
 }catch(error){row.status='fail';row.error=String(error.message).replaceAll(email,'[synthetic]');throw error;}
 finally{stylesheetEvidence.dispose();await uninstall();row.finishedAt=new Date().toISOString();row.blockedRequests=blocked;row.preventedBackgroundWrites=preventedBackground;}
}

export async function verifyGpIsolationFromExistingHolder({page,site,api,email,runtimeSource}){
 const source=runtimeSource===undefined?process.env.GITHUB_SHA:runtimeSource;assertGpHolder({site,api,email,source,second:true});
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
