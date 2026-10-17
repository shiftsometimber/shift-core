import {currentRuntimePreservationHistoricalView,verifyCurrentRuntimePreservation} from './current-runtime-preservation-20261016.mjs';
import {ciExecutionNativeReaderProvenance,verifyCiExecutionAllowance,ciExecutionHistoricalView,ciExecutionAuthenticatedRead,ciExecutionAuthenticatedContent,ciExecutionAuthenticatedDiff,ciExecutionAuthenticatedAncestor} from './ci-execution-scope-20261014.mjs';
import {freshDetachedSourceHead} from './fresh-food-source-head-20261016.mjs';
import assert from 'node:assert/strict';
import {execFileSync as repairNativeExecFileSync} from 'node:child_process';
import {assertGitTrackedSourceVisible,nativeGitSourceDifference,immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';
export const RELEASE_MACHINERY_REPAIR_BASE='685ede249cd20c4801d0a25227fed16d46860618';
export const RELEASE_MACHINERY_REPAIR_SOURCE="22cb217988021d5d3ddf2eff74ca012401ab955b";
export const RELEASE_MACHINERY_REPAIR_PATHS=Object.freeze([".github/workflows/cloudflare-production-promote.yml","release/app-index-freshness.mjs","release/app-scope.mjs","release/approved-runtime-composition.mjs","release/combined-original-gp-object-20261014.mjs","release/github-proof-get.mjs","release/growth-adopt-deployment.mjs","release/growth-scope.mjs","release/immutable-git-facts.mjs","release/public-index-preflight.mjs","release/verified-owned-rollback-current.mjs","release/verified-owned-rollback-policy-20261014.json","release/verified-owned-rollback.mjs","shift-coach/recover-cancelled-release.mjs","tests/app-index-freshness.test.mjs","tests/approved-runtime-composition.test.mjs","tests/combined-original-gp-object-completeness-20261014.test.mjs","tests/github-proof-get.test.mjs","tests/github-proof-reuse.test.mjs","tests/immutable-git-facts-20261014.test.mjs","tests/immutable-git-facts-current-state-20261014.test.mjs","tests/public-index-preflight.test.mjs","tests/rollback-stock-workflow.test.mjs","tests/verified-owned-rollback-current.test.mjs","tests/verified-owned-rollback.test.mjs"]);
export const RELEASE_MACHINERY_REPAIR_MAINTENANCE=Object.freeze(['release/release-machinery-repair-scope-20261014.mjs','tests/release-machinery-repair-composition.test.mjs','release/combined-finite-scope-20261014.mjs','release/approved-runtime-composition.mjs']);
export const RELEASE_MACHINERY_REPAIR_INVERSES=Object.freeze({"release/combined-finite-scope-20261014.mjs":[["import {ensureCombinedOriginalGpSource} from './combined-original-gp-object-20261014.mjs';\n","import {releaseMachineryRepairHistoricalView,releaseMachineryRepairAuthenticatedRead,releaseMachineryRepairLegacyRead,releaseMachineryRepairLegacyContent} from './release-machinery-repair-scope-20261014.mjs';\nimport {ensureCombinedOriginalGpSource} from './combined-original-gp-object-20261014.mjs';\n"],["}\nexport function verifyCombinedFinite(c,{head,read,blob=read,content,diff,ancestor}){\n","}\nexport function verifyCombinedFiniteOriginal(c,{head,read,blob=read,content,diff,ancestor}){\n"],["}\n","}\nexport function verifyCombinedFinite(c,options){\n const repair=releaseMachineryRepairHistoricalView();\n if(options.head!==repair.rawHead||repair.head===repair.rawHead)return verifyCombinedFiniteOriginal(c,options);\n const {head,read,blob=read,content,diff,ancestor}=options;\n const projectedDiff=(a,b)=>{\n  if(b!==head&&b!=='HEAD')return diff(a,b);\n  assert.deepEqual(diff(a,b),git('diff','--name-only',a,head).trim().split('\\n').filter(Boolean),'Unreviewed supplied release machinery source drift');\n  return diff(a,repair.head);\n };\n return verifyCombinedFiniteOriginal(c,{head:repair.head,read:releaseMachineryRepairAuthenticatedRead(read,repair),blob:releaseMachineryRepairAuthenticatedRead(blob,repair),content:releaseMachineryRepairLegacyContent(content,repair),diff:projectedDiff,ancestor});\n}\n"],["export function combinedFiniteHistoricalView(reader=null,{defaultReader=reader===null}={}){\n const rawHead=git('rev-parse','HEAD').trim(),content=(ref,path)=>rawContent(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>rawBlob(ref==='HEAD'?rawHead:ref,path),rawRead=defaultReader?blob:reader,current=JSON.parse(content(rawHead,manifest)),c=current.combinedFinite20261014;\n const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),ref,path);\n","export function combinedFiniteHistoricalView(reader=null,{defaultReader=reader===null}={}){\n const repair=releaseMachineryRepairHistoricalView(reader,{defaultReader});\n const rawHead=repair.head,content=(ref,path)=>repair.content(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>repair.blob(ref==='HEAD'?rawHead:ref,path),rawRead=repair.read,current=repair.record,c=current.combinedFinite20261014;\n const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),repair.affected(path)&&(ref==='HEAD'||ref===repair.rawHead)?repair.head:ref,path);\n"],[" const record=structuredClone(current);delete record.combinedFinite20261014;\n assert.equal(git('rev-parse','HEAD').trim(),rawHead,'Source HEAD changed during combined verification');\n return{rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};\n"," const record=structuredClone(current);delete record.combinedFinite20261014;\n assert.equal(git('rev-parse','HEAD').trim(),repair.rawHead,'Source HEAD changed during combined verification');\n return{rawHead:repair.rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};\n"],[" assert.equal(typeof reader,'function','A legacy comparison reader is required');\n"," assert.equal(typeof reader,'function','A legacy comparison reader is required');\n reader=releaseMachineryRepairLegacyRead(reader,releaseMachineryRepairHistoricalView());\n"],["\nimport {execFileSync} from 'node:child_process';\n","\nimport {immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';\n"],["const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort(),facts=new Map();\nfunction git(...args){\n const immutableRef=value=>/^[a-f0-9]{40}(?::|(?:\\^\\{(?:tree|commit)\\})?$)/.test(value||'');\n const fixed=(['show','rev-parse'].includes(args[0])&&immutableRef(args[1]))||(args[0]==='cat-file'&&args.length===3&&['-t','-e'].includes(args[1])&&/^[a-f0-9]{40}$/.test(args[2]))||(args[0]==='merge-base'&&args[1]==='--is-ancestor'&&args.length===4&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)))||(args[0]==='diff'&&args[1]==='--name-only'&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)));\n const key=JSON.stringify([process.cwd(),args]);if(!fixed)return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});\n if(!facts.has(key))facts.set(key,execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}));return facts.get(key);\n}\n","const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort();\nfunction git(...args){if(args[0]==='diff'&&!args.includes('--no-renames'))args.splice(1,0,'--no-renames');return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});}\n"]],"release/approved-runtime-composition.mjs":[["","import {RELEASE_MACHINERY_REPAIR_PATHS,RELEASE_MACHINERY_REPAIR_MAINTENANCE} from './release-machinery-repair-scope-20261014.mjs';\n"],["","\n// One exact authorised release-machinery repair; existing registrations remain unchanged.\nexport const RELEASE_MACHINERY_REPAIR_ADDITIONAL_PATHS=Object.freeze([...RELEASE_MACHINERY_REPAIR_PATHS,...RELEASE_MACHINERY_REPAIR_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of RELEASE_MACHINERY_REPAIR_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n"]]});
export const RELEASE_MACHINERY_REPAIR_KEY='releaseMachineryRepair20261014';
export const RELEASE_MACHINERY_REPAIR_MANIFEST='release/approved-runtime-composition.json';
export const RELEASE_MACHINERY_REPAIR_RECORD=Object.freeze({proof:'EXACT_BOUNDED_RELEASE_MACHINERY_REPAIR_20261014',base:RELEASE_MACHINERY_REPAIR_BASE,source:RELEASE_MACHINERY_REPAIR_SOURCE,paths:RELEASE_MACHINERY_REPAIR_PATHS,maintenancePaths:RELEASE_MACHINERY_REPAIR_MAINTENANCE,integrationIssue:1065,authority:{owner:'Matt',instruction:'Treat the accumulated release bottleneck as one bounded engineering repair.',recordedAt:'2026-10-14T19:43:44Z'},runtimeChanged:false,homepageChanged:false,privacyChanged:false,consentChanged:false,clinicalSafetyChanged:false,stockChanged:false,emailAuthority:false,spendingGranted:false,publicationAuthorityBroadened:false,rollbackAuthorityBroadened:false,genericAdoptionAllowed:false,originalAssertionsRemoved:false,timeAllowancesIncreased:false,unknownVersionsAccepted:false,alteredReceiptsAccepted:false,suppliedReadersCached:false});
export const RELEASE_MACHINERY_REPAIR_PROTECTED=Object.freeze(['frontend','public','my-timber-app','member-experience','medicines-watch','wrangler.jsonc','wrangler.coaching.jsonc','shift-coach/worker.mjs','worker-entry-v6.js','worker.js','release/ai-response-proof.mjs','release/shift-ai-live.mjs','privacy-health-erasure-route-v1.js','package.json','package-lock.json']);
export const RELEASE_MACHINERY_REPAIR_POLICY=Object.freeze({record:RELEASE_MACHINERY_REPAIR_RECORD,inverses:RELEASE_MACHINERY_REPAIR_INVERSES,protectedPaths:RELEASE_MACHINERY_REPAIR_PROTECTED});
const manifest=RELEASE_MACHINERY_REPAIR_MANIFEST,key=RELEASE_MACHINERY_REPAIR_KEY,sorted=a=>[...a].sort();
const nativeCiReadSources=new WeakMap();
function git(...args){return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});}
const nativeFactRef=r=>r==='HEAD'?(freshDetachedSourceHead()??r):r;
const rawBlob=(r,p)=>git('rev-parse',nativeFactRef(r)+':'+p).trim(),rawContent=(r,p)=>git('show',nativeFactRef(r)+':'+p),rawDiff=nativeGitSourceDifference,rawAncestor=(a,b)=>git('merge-base','--is-ancestor',a,b),currentHead=()=>freshDetachedSourceHead()??git('rev-parse','HEAD').trim();
// A hint may replace only two clean-success diff probes. Visibility and the
// original lazy working/staged assertions remain at every original call site.
const repairStatusExec=repairNativeExecFileSync;
const repairStatusEnvironment=process.env;
const repairStatusBuffer=Buffer,repairStatusIsBuffer=Buffer.isBuffer,repairStatusIsView=ArrayBuffer.isView;
const repairStatusLength=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length').get;
const repairStatusApply=Reflect.apply;
function freshRepairCleanStatus(){
 try{
  if(repairNativeExecFileSync!==repairStatusExec||process.env!==repairStatusEnvironment||Buffer!==repairStatusBuffer||Buffer.isBuffer!==repairStatusIsBuffer||ArrayBuffer.isView!==repairStatusIsView)return false;
  for(const name in process.env)if(name[0]==='G'&&name[1]==='I'&&name[2]==='T'&&name[3]==='_'&&name!=='GIT_PAGER')return false;
  const bytes=repairNativeExecFileSync('git',['--no-optional-locks','status','--porcelain=v2','-z','--branch','--untracked-files=no','--ignore-submodules=none'],{maxBuffer:32*1024*1024,stdio:'pipe'});
  // isBuffer alone accepts a Proxy around a Buffer. The native view and
  // captured typed-array length checks exclude proxies and Buffer-like objects.
  if(!repairStatusIsBuffer(bytes)||!repairStatusIsView(bytes)||repairStatusApply(repairStatusLength,bytes,[])!==79)return false;
  const first=[35,32,98,114,97,110,99,104,46,111,105,100,32],last=[35,32,98,114,97,110,99,104,46,104,101,97,100,32,40,100,101,116,97,99,104,101,100,41,0];
  for(let i=0;i<first.length;i++)if(bytes[i]!==first[i])return false;
  let nonzero=false;for(let i=13;i<53;i++){const n=bytes[i];if(!(n>=48&&n<=57||n>=97&&n<=102))return false;if(n!==48)nonzero=true;}
  if(!nonzero||bytes[53]!==0)return false;
  for(let i=0;i<last.length;i++)if(bytes[54+i]!==last[i])return false;
  return true;
 }catch{return false;}
}
function assertCleanSource(stage){
 assertGitTrackedSourceVisible(stage);
 if(!freshRepairCleanStatus()){
 assert.equal(git('diff','--name-only','HEAD','--').trim(),'','Release machinery source drift: Tracked repair source changed at '+stage);
 assert.equal(git('diff','--cached','--name-only','--').trim(),'','Release machinery source drift: Staged repair source changed at '+stage);
 }
}
function inverseMaintenance(path,value,pairs){
 assert(Array.isArray(pairs)&&pairs.length,'Exact maintenance inverse required: '+path);
 for(const pair of [...pairs].reverse()){
  assert(Array.isArray(pair)&&pair.length===2&&pair.every(x=>typeof x==='string')&&pair[1].length,'Invalid finite maintenance inverse: '+path);
  const [before,after]=pair;assert.equal(value.split(after).length,2,'One exact maintenance inverse required: '+path);value=value.replace(after,before);
 }return value;
}
// Pure facts verifier for deterministic adversarial tests. Production admission
// below always supplies its own real Git facts; caller readers cannot certify them.
export function verifyReleaseMachineryRepairFacts(policy,c,facts){
 const {record:expected,inverses,protectedPaths}=policy,{head,actualHead,read,readContent,readDiff,isAncestor,blob,content,diff,ancestor,headNow,cleanSource}=facts;
 assert.equal(typeof cleanSource,'function','Fresh source cleanliness check required');
 try{
 cleanSource('entry');
 assert(c,'Exact release machinery repair record required');const {maintenanceSource,...record}=c;
 assert.deepEqual(record,expected,'Only the exact bounded release machinery repair is authorised');
 assert.match(head,/^[a-f0-9]{40}$/);assert.equal(head,actualHead,'Actual source HEAD is required');assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 for(const ref of [c.base,c.source,maintenanceSource])assert(!/^0{40}$/.test(ref),'Frozen repair source pin is required');
 assert.equal(new Set(c.paths).size,c.paths.length,'Duplicate repair payload path');assert.equal(new Set(c.maintenancePaths).size,c.maintenancePaths.length,'Duplicate repair maintenance path');
 for(const p of [...c.paths,...c.maintenancePaths])assert(typeof p==='string'&&p.length&&!p.startsWith('/')&&!p.split('/').some(x=>x==='.'||x==='..')&&p!==manifest,'Literal finite repair paths required');
 for(const [a,b]of [[c.base,c.source],[c.source,maintenanceSource],[maintenanceSource,head],[c.base,head]]){
  assert.notEqual(ancestor(a,b),false,'Actual source ancestry is required');assert.notEqual(isAncestor(a,b),false,'Supplied source ancestry changed');
 }
 const boundaries=[[c.base,c.source,c.paths,'payload'],[c.source,maintenanceSource,c.maintenancePaths,'maintenance'],[maintenanceSource,head,[manifest],'final ledger'],[c.base,head,[...new Set([...c.paths,...c.maintenancePaths,manifest])],'complete source']];
 for(const [a,b,paths,label]of boundaries){assert.deepEqual(sorted(diff(a,b)),sorted(paths),'Unreviewed actual repair '+label+' boundary');assert.deepEqual(sorted(readDiff(a,b)),sorted(diff(a,b)),'Supplied repair diff changed: '+label);}
 for(const p of [...new Set([...c.paths,...c.maintenancePaths])]){
  const ref=c.maintenancePaths.includes(p)?maintenanceSource:c.source,expectedBlob=blob(ref,p);assert.equal(blob(head,p),expectedBlob,'Actual repair source drift: '+p);
  for(const r of ['HEAD',head])assert.equal(read(r,p),blob(head,p),'Fresh supplied repair source drift: '+p);
  assert.equal(read(ref,p),expectedBlob,'Supplied frozen repair source drift: '+p);
  assert.equal(readContent(head,p),content(head,p),'Supplied current repair content drift: '+p);
 }
 const actual=JSON.parse(content(head,manifest)),prior=JSON.parse(content(c.base,manifest));assert.deepEqual(actual[key],c,'Actual repair registration changed');delete actual[key];assert.deepEqual(actual,prior,'Every previous authority, receipt and failure record must remain exact');
 assert.equal(readContent(head,manifest),content(head,manifest),'Supplied current ledger drift');assert.equal(readContent('HEAD',manifest),content(head,manifest),'Supplied HEAD ledger drift');assert.equal(readContent(c.base,manifest),content(c.base,manifest),'Supplied prior ledger drift');
 assert.deepEqual(sorted(Object.keys(inverses)),sorted(['release/combined-finite-scope-20261014.mjs','release/approved-runtime-composition.mjs']),'Only the two exact finite maintenance hooks may modify existing files');
 for(const [p,pairs]of Object.entries(inverses))assert.equal(inverseMaintenance(p,content(head,p),pairs),content(c.source,p),'Every byte outside the exact maintenance hooks must remain: '+p);
 for(const p of protectedPaths){assert.equal(blob(head,p),blob(c.base,p),'Protected runtime, homepage, privacy or stock source drift: '+p);for(const r of ['HEAD',head])assert.equal(read(r,p),blob(head,p),'Supplied protected repair source drift: '+p);assert.equal(read(c.base,p),blob(c.base,p),'Supplied protected baseline drift: '+p);}
 return c;
 }finally{try{cleanSource('exit');}finally{assert.equal(headNow(),actualHead,'Release machinery source drift: Source HEAD changed during repair verification');}}
}
function verifyReleaseMachineryRepairOriginal(c,{head=currentHead(),read=rawBlob,readContent=rawContent,readDiff=rawDiff,isAncestor=rawAncestor}={},ci=null){
 const actualHead=ci?ci.head:currentHead();
 // Resolve only native defaults within the paired clean-source/HEAD boundary.
 // Supplied readers still receive literal HEAD freshly on every assertion.
 const frozenRead=read===rawBlob?(ref,path)=>rawBlob(ref==='HEAD'?actualHead:ref,path):read;
 const frozenContent=readContent===rawContent?(ref,path)=>rawContent(ref==='HEAD'?actualHead:ref,path):readContent;
 return verifyReleaseMachineryRepairFacts(RELEASE_MACHINERY_REPAIR_POLICY,c,{head,actualHead,read:frozenRead,readContent:frozenContent,readDiff,isAncestor,blob:ci?ci.blob:rawBlob,content:ci?ci.content:rawContent,diff:ci?ci.diff:rawDiff,ancestor:ci?ci.ancestor:rawAncestor,headNow:ci?()=>{ci.assertCurrent();return ci.head;}:currentHead,cleanSource:ci?()=>ci.assertCurrent():assertCleanSource});
}
function currentRef(view,ref){return ref==='HEAD'||ref===view.rawHead}
function authentic(value,ref,path,head){
 if(value===rawBlob(head,path)||value===rawContent(head,path))return true;
 const expected=rawContent(head,path),prefix='tree '+head+':'+path+'\n';
 return expected.startsWith(prefix)&&value===expected.replace(prefix,'tree '+ref+':'+path+'\n');
}
function releaseMachineryRepairHistoricalViewOriginal(reader=null,{defaultReader=reader===null}={},ci=null){
 const rawHead=ci?ci.head:currentHead(),record=ci?ci.record:JSON.parse(rawContent(rawHead,manifest)),c=record[key],sourceReader=ci?reader:defaultReader?rawBlob:reader;assert.equal(typeof sourceReader,'function','A source reader is required');
 if(!c)return{rawHead,head:rawHead,record,affected:()=>false,read:sourceReader,blob:rawBlob,content:rawContent,currentContent:rawContent,authentic:(v,r,p)=>authentic(v,r,p,rawHead)};
 assertCleanSource('projection entry');verifyReleaseMachineryRepairOriginal(c,{head:rawHead,...(ci?{read:ci.blob,readContent:ci.content,readDiff:ci.diff,isAncestor:ci.ancestor}:{})},ci);
 const paths=new Set([...c.paths,...c.maintenancePaths,manifest]),affected=p=>paths.has(p)||[...paths].some(x=>x.startsWith(p+'/')),view={rawHead,head:c.base,affected,currentContent:rawContent,authentic:(v,r,p)=>authentic(v,r,p,rawHead)};
 const map=(r,p)=>currentRef(view,r)&&affected(p)?c.base:r==='HEAD'?rawHead:r;
 const nativeProof=ci&&ciExecutionNativeReaderProvenance(sourceReader);if(nativeProof?.kind==='read'&&nativeProof.view===ci&&ci.head===rawHead)nativeCiReadSources.set(view,sourceReader);
 const read=releaseMachineryRepairAuthenticatedRead(sourceReader,view,{defaultReader});
 const prior=structuredClone(record);delete prior[key];assertCleanSource('projection exit');assert.equal(ci?(ci.assertCurrent(),ci.head):currentHead(),rawHead,'Release machinery source drift: Source HEAD changed during repair projection');
 return{...view,record:prior,read,blob:(r,p)=>rawBlob(map(r,p),p),content:(r,p)=>rawContent(map(r,p),p)};
}
// Authentication adapter is pure; its view must already have admitted actual
// source. Both current spellings are checked on every call, including directories.
export function releaseMachineryRepairAuthenticatedRead(reader,view,{defaultReader=false}={}){
 assert.equal(typeof reader,'function');if(view.rawHead===view.head)return reader;
 const nativeCiSource=nativeCiReadSources.get(view)===reader;
 return(r,p)=>{
  if(currentRef(view,r)&&view.affected(p)){
   if(!defaultReader&&!nativeCiSource){assert(view.authentic(reader('HEAD',p),'HEAD',p),'Release machinery source drift: Unauthentic supplied HEAD repair reader: '+p);assert(view.authentic(reader(view.rawHead,p),view.rawHead,p),'Release machinery source drift: Unauthentic supplied raw-alias repair reader: '+p);}
   return reader(view.head,p);
  }return reader(defaultReader&&r==='HEAD'?view.rawHead:r,p);
 };
}
// Compatibility only, after independent actual source admission. Every supplied
// callback stays fresh. Unequal current aliases remain visible to the original
// owning comparator; abstract readers keep their established comparison contract.
export function releaseMachineryRepairLegacyRead(reader,view=releaseMachineryRepairHistoricalView()){
 assert.equal(typeof reader,'function');if(view.rawHead===view.head)return reader;
 return(r,p)=>{
  if(currentRef(view,r)&&view.affected(p)){
   const a=reader('HEAD',p),b=reader(view.rawHead,p);
   if(a!==b&&!(view.authentic(a,'HEAD',p)&&view.authentic(b,view.rawHead,p)))return r==='HEAD'?a:b;
   return reader(view.head,p);
  }return reader(r,p);
 };
}
export function releaseMachineryRepairLegacyContent(reader,view=releaseMachineryRepairHistoricalView()){
 assert.equal(typeof reader,'function');if(view.rawHead===view.head)return reader;
 return(r,p)=>{
  if(!(currentRef(view,r)||r===view.head)||!view.affected(p))return reader(r,p);
  const a=reader('HEAD',p),b=reader(view.rawHead,p);
  // The old verifier calls its projected head. Inspect both original spellings
  // so a supplied ledger/content override cannot disappear through that alias.
  const value=!view.authentic(a,'HEAD',p)?a:!view.authentic(b,view.rawHead,p)?b:r==='HEAD'?a:b;
  if(p===manifest){try{const supplied=JSON.parse(value);delete supplied[key];return JSON.stringify(supplied);}catch{return value;}}
  return view.authentic(value,r==='HEAD'?'HEAD':view.rawHead,p)?reader(view.head,p):value;
 };
}

// The sole later layer is the independently admitted CI execution. Its literal
// base and full source are checked before an original machinery assertion runs.
export function verifyReleaseMachineryRepair(c,options={}){
 const week=currentRuntimePreservationHistoricalView();
 if(week.head!==week.rawHead){assert.equal(options.head??week.rawHead,week.rawHead,'Release machinery source drift: Actual raw week HEAD required');const current=JSON.parse(rawContent(week.rawHead,manifest)).currentRuntimePreservation20261016;verifyCurrentRuntimePreservation(current,{head:options.head??week.rawHead,read:options.read??rawBlob,readContent:options.readContent??rawContent,readDiff:options.readDiff??rawDiff,isAncestor:options.isAncestor??rawAncestor});}
 const ci=ciExecutionHistoricalView();
 if(ci.head===ci.rawHead)return verifyReleaseMachineryRepairOriginal(c,options);
 assert.equal(options.head??ci.rawHead,ci.rawHead,'Release machinery source drift: Actual raw ci HEAD required');
 if(ci.foodDiaryLondonDateContext)verifyCiExecutionAllowance(JSON.parse(rawContent(ci.rawHead,manifest)).ciExecutionAllowance20261014,{head:ci.rawHead,read:options.read??undefined,readContent:options.readContent??undefined,readDiff:options.readDiff??undefined,isAncestor:options.isAncestor??undefined});
 return verifyReleaseMachineryRepairOriginal(c,{head:ci.head,
  read:ciExecutionAuthenticatedRead(options.read==null||options.read===rawBlob?null:options.read,ci),
  readContent:ciExecutionAuthenticatedContent(options.readContent==null||options.readContent===rawContent?null:options.readContent,ci),
  readDiff:ciExecutionAuthenticatedDiff(options.readDiff??rawDiff,ci),
  isAncestor:ciExecutionAuthenticatedAncestor(options.isAncestor??rawAncestor,ci)},ci);
}
export function releaseMachineryRepairHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const ci=ciExecutionHistoricalView(reader===rawBlob?null:reader);
 if(ci.head===ci.rawHead)return releaseMachineryRepairHistoricalViewOriginal(reader,{defaultReader});
 const inner=releaseMachineryRepairHistoricalViewOriginal(ci.read,{defaultReader:false},ci);
 const ref=r=>r===ci.rawHead?'HEAD':r;
 return {...inner,rawHead:ci.rawHead,affected:p=>ci.affected(p)||inner.affected(p),
  read:(r,p)=>inner.read(ref(r),p),blob:(r,p)=>inner.blob(ref(r),p),content:(r,p)=>inner.content(ref(r),p),
  currentContent:rawContent,authentic:ci.authentic,ciExecutionContext:ci};
}
export function releaseMachineryRepairAuthenticatedContent(reader,view=releaseMachineryRepairHistoricalView()){
 if(!view.ciExecutionContext)return releaseMachineryRepairLegacyContent(reader,view);
 const ci=view.ciExecutionContext;
 const supplied=reader;reader=(r,p)=>{const value=supplied(r,p);assert(ci.nativeContentAuthentic(value,r,p),'CI-execution source drift: Supplied repair content changed at '+r+':'+p);return value;};
 return(r,p)=>{
  if((r==='HEAD'||r===view.rawHead||r===view.head)&&view.affected(p)){
   assert(ci.authentic(reader('HEAD',p),'HEAD',p),'Release machinery source drift: Unauthentic supplied HEAD content: '+p);
   assert(ci.authentic(reader(view.rawHead,p),view.rawHead,p),'Release machinery source drift: Unauthentic supplied raw-head content: '+p);
   const value=reader(view.head,p);assert.equal(value,rawContent(view.head,p),'Release machinery source drift: Supplied projected content changed: '+p);return value;
  }return reader(r,p);
 };
}
