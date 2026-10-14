import assert from 'node:assert/strict';
import {immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';
export const RELEASE_MACHINERY_REPAIR_BASE='685ede249cd20c4801d0a25227fed16d46860618';
export const RELEASE_MACHINERY_REPAIR_SOURCE="0d21a2e6cf8b8cddf854c95b094fa43bf13dae0d";
export const RELEASE_MACHINERY_REPAIR_PATHS=Object.freeze([".github/workflows/cloudflare-production-promote.yml","release/app-index-freshness.mjs","release/app-scope.mjs","release/approved-runtime-composition.mjs","release/combined-original-gp-object-20261014.mjs","release/github-proof-get.mjs","release/growth-adopt-deployment.mjs","release/growth-scope.mjs","release/immutable-git-facts.mjs","release/public-index-preflight.mjs","release/verified-owned-rollback-current.mjs","release/verified-owned-rollback-policy-20261014.json","release/verified-owned-rollback.mjs","shift-coach/recover-cancelled-release.mjs","tests/app-index-freshness.test.mjs","tests/approved-runtime-composition.test.mjs","tests/combined-original-gp-object-completeness-20261014.test.mjs","tests/github-proof-get.test.mjs","tests/github-proof-reuse.test.mjs","tests/immutable-git-facts-20261014.test.mjs","tests/immutable-git-facts-current-state-20261014.test.mjs","tests/public-index-preflight.test.mjs","tests/rollback-stock-workflow.test.mjs","tests/verified-owned-rollback-current.test.mjs","tests/verified-owned-rollback.test.mjs"]);
export const RELEASE_MACHINERY_REPAIR_MAINTENANCE=Object.freeze(['release/release-machinery-repair-scope-20261014.mjs','tests/release-machinery-repair-composition.test.mjs','release/combined-finite-scope-20261014.mjs','release/approved-runtime-composition.mjs']);
export const RELEASE_MACHINERY_REPAIR_INVERSES=Object.freeze({"release/combined-finite-scope-20261014.mjs":[["import {ensureCombinedOriginalGpSource} from './combined-original-gp-object-20261014.mjs';\n","import {releaseMachineryRepairHistoricalView,releaseMachineryRepairAuthenticatedRead,releaseMachineryRepairLegacyRead,releaseMachineryRepairLegacyContent} from './release-machinery-repair-scope-20261014.mjs';\nimport {ensureCombinedOriginalGpSource} from './combined-original-gp-object-20261014.mjs';\n"],["}\nexport function verifyCombinedFinite(c,{head,read,blob=read,content,diff,ancestor}){\n","}\nexport function verifyCombinedFiniteOriginal(c,{head,read,blob=read,content,diff,ancestor}){\n"],["}\n","}\nexport function verifyCombinedFinite(c,options){\n const repair=releaseMachineryRepairHistoricalView();\n if(options.head!==repair.rawHead||repair.head===repair.rawHead)return verifyCombinedFiniteOriginal(c,options);\n const {head,read,blob=read,content,diff,ancestor}=options;\n const projectedDiff=(a,b)=>{\n  if(b!==head&&b!=='HEAD')return diff(a,b);\n  assert.deepEqual(diff(a,b),git('diff','--name-only',a,head).trim().split('\\n').filter(Boolean),'Unreviewed supplied release machinery source drift');\n  return diff(a,repair.head);\n };\n return verifyCombinedFiniteOriginal(c,{head:repair.head,read:releaseMachineryRepairAuthenticatedRead(read,repair),blob:releaseMachineryRepairAuthenticatedRead(blob,repair),content:releaseMachineryRepairLegacyContent(content,repair),diff:projectedDiff,ancestor});\n}\n"],["export function combinedFiniteHistoricalView(reader=null,{defaultReader=reader===null}={}){\n const rawHead=git('rev-parse','HEAD').trim(),content=(ref,path)=>rawContent(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>rawBlob(ref==='HEAD'?rawHead:ref,path),rawRead=defaultReader?blob:reader,current=JSON.parse(content(rawHead,manifest)),c=current.combinedFinite20261014;\n const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),ref,path);\n","export function combinedFiniteHistoricalView(reader=null,{defaultReader=reader===null}={}){\n const repair=releaseMachineryRepairHistoricalView(reader,{defaultReader});\n const rawHead=repair.head,content=(ref,path)=>repair.content(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>repair.blob(ref==='HEAD'?rawHead:ref,path),rawRead=repair.read,current=repair.record,c=current.combinedFinite20261014;\n const normal=(ref,path)=>exactCombinedDirectoryDisplay(rawRead(ref,path),repair.affected(path)&&(ref==='HEAD'||ref===repair.rawHead)?repair.head:ref,path);\n"],[" const record=structuredClone(current);delete record.combinedFinite20261014;\n assert.equal(git('rev-parse','HEAD').trim(),rawHead,'Source HEAD changed during combined verification');\n return{rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};\n"," const record=structuredClone(current);delete record.combinedFinite20261014;\n assert.equal(git('rev-parse','HEAD').trim(),repair.rawHead,'Source HEAD changed during combined verification');\n return{rawHead:repair.rawHead,head:c.base,record,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};\n"],[" assert.equal(typeof reader,'function','A legacy comparison reader is required');\n"," assert.equal(typeof reader,'function','A legacy comparison reader is required');\n reader=releaseMachineryRepairLegacyRead(reader,releaseMachineryRepairHistoricalView());\n"],["\nimport {execFileSync} from 'node:child_process';\n","\nimport {immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';\n"],["const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort(),facts=new Map();\nfunction git(...args){\n const immutableRef=value=>/^[a-f0-9]{40}(?::|(?:\\^\\{(?:tree|commit)\\})?$)/.test(value||'');\n const fixed=(['show','rev-parse'].includes(args[0])&&immutableRef(args[1]))||(args[0]==='cat-file'&&args.length===3&&['-t','-e'].includes(args[1])&&/^[a-f0-9]{40}$/.test(args[2]))||(args[0]==='merge-base'&&args[1]==='--is-ancestor'&&args.length===4&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)))||(args[0]==='diff'&&args[1]==='--name-only'&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)));\n const key=JSON.stringify([process.cwd(),args]);if(!fixed)return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});\n if(!facts.has(key))facts.set(key,execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}));return facts.get(key);\n}\n","const manifest='release/approved-runtime-composition.json',sort=a=>[...a].sort();\nfunction git(...args){return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});}\n"]],"release/approved-runtime-composition.mjs":[["","import {RELEASE_MACHINERY_REPAIR_PATHS,RELEASE_MACHINERY_REPAIR_MAINTENANCE} from './release-machinery-repair-scope-20261014.mjs';\n"],["","\n// One exact authorised release-machinery repair; existing registrations remain unchanged.\nexport const RELEASE_MACHINERY_REPAIR_ADDITIONAL_PATHS=Object.freeze([...RELEASE_MACHINERY_REPAIR_PATHS,...RELEASE_MACHINERY_REPAIR_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of RELEASE_MACHINERY_REPAIR_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n"]]});
export const RELEASE_MACHINERY_REPAIR_KEY='releaseMachineryRepair20261014';
export const RELEASE_MACHINERY_REPAIR_MANIFEST='release/approved-runtime-composition.json';
export const RELEASE_MACHINERY_REPAIR_RECORD=Object.freeze({proof:'EXACT_BOUNDED_RELEASE_MACHINERY_REPAIR_20261014',base:RELEASE_MACHINERY_REPAIR_BASE,source:RELEASE_MACHINERY_REPAIR_SOURCE,paths:RELEASE_MACHINERY_REPAIR_PATHS,maintenancePaths:RELEASE_MACHINERY_REPAIR_MAINTENANCE,integrationIssue:1065,authority:{owner:'Matt',instruction:'Treat the accumulated release bottleneck as one bounded engineering repair.',recordedAt:'2026-10-14T19:43:44Z'},runtimeChanged:false,homepageChanged:false,privacyChanged:false,consentChanged:false,clinicalSafetyChanged:false,stockChanged:false,emailAuthority:false,spendingGranted:false,publicationAuthorityBroadened:false,rollbackAuthorityBroadened:false,genericAdoptionAllowed:false,originalAssertionsRemoved:false,timeAllowancesIncreased:false,unknownVersionsAccepted:false,alteredReceiptsAccepted:false,suppliedReadersCached:false});
export const RELEASE_MACHINERY_REPAIR_PROTECTED=Object.freeze(['frontend','public','my-timber-app','member-experience','medicines-watch','wrangler.jsonc','wrangler.coaching.jsonc','shift-coach/worker.mjs','worker-entry-v6.js','worker.js','release/ai-response-proof.mjs','release/shift-ai-live.mjs','privacy-health-erasure-route-v1.js','package.json','package-lock.json']);
export const RELEASE_MACHINERY_REPAIR_POLICY=Object.freeze({record:RELEASE_MACHINERY_REPAIR_RECORD,inverses:RELEASE_MACHINERY_REPAIR_INVERSES,protectedPaths:RELEASE_MACHINERY_REPAIR_PROTECTED});
const manifest=RELEASE_MACHINERY_REPAIR_MANIFEST,key=RELEASE_MACHINERY_REPAIR_KEY,sorted=a=>[...a].sort();
function git(...args){return execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6});}
const rawBlob=(r,p)=>git('rev-parse',r+':'+p).trim(),rawContent=(r,p)=>git('show',r+':'+p),rawDiff=(a,b)=>git('diff','--name-only',a,b).trim().split('\n').filter(Boolean),rawAncestor=(a,b)=>git('merge-base','--is-ancestor',a,b),currentHead=()=>git('rev-parse','HEAD').trim();
function assertCleanSource(stage){
 assert.equal(git('diff','--name-only','HEAD','--').trim(),'','Release machinery source drift: Tracked repair source changed at '+stage);
 assert.equal(git('diff','--cached','--name-only','--').trim(),'','Release machinery source drift: Staged repair source changed at '+stage);
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
export function verifyReleaseMachineryRepair(c,{head=currentHead(),read=rawBlob,readContent=rawContent,readDiff=rawDiff,isAncestor=rawAncestor}={}){
 const actualHead=currentHead();
 // Resolve only native defaults within the paired clean-source/HEAD boundary.
 // Supplied readers still receive literal HEAD freshly on every assertion.
 const frozenRead=read===rawBlob?(ref,path)=>rawBlob(ref==='HEAD'?actualHead:ref,path):read;
 const frozenContent=readContent===rawContent?(ref,path)=>rawContent(ref==='HEAD'?actualHead:ref,path):readContent;
 return verifyReleaseMachineryRepairFacts(RELEASE_MACHINERY_REPAIR_POLICY,c,{head,actualHead,read:frozenRead,readContent:frozenContent,readDiff,isAncestor,blob:rawBlob,content:rawContent,diff:rawDiff,ancestor:rawAncestor,headNow:currentHead,cleanSource:assertCleanSource});
}
function currentRef(view,ref){return ref==='HEAD'||ref===view.rawHead}
function authentic(value,ref,path,head){
 if(value===rawBlob(head,path)||value===rawContent(head,path))return true;
 const expected=rawContent(head,path),prefix='tree '+head+':'+path+'\n';
 return expected.startsWith(prefix)&&value===expected.replace(prefix,'tree '+ref+':'+path+'\n');
}
export function releaseMachineryRepairHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const rawHead=currentHead(),record=JSON.parse(rawContent(rawHead,manifest)),c=record[key],sourceReader=defaultReader?rawBlob:reader;assert.equal(typeof sourceReader,'function','A source reader is required');
 if(!c)return{rawHead,head:rawHead,record,affected:()=>false,read:sourceReader,blob:rawBlob,content:rawContent,currentContent:rawContent,authentic:(v,r,p)=>authentic(v,r,p,rawHead)};
 assertCleanSource('projection entry');verifyReleaseMachineryRepair(c,{head:rawHead});
 const paths=new Set([...c.paths,...c.maintenancePaths,manifest]),affected=p=>paths.has(p)||[...paths].some(x=>x.startsWith(p+'/')),view={rawHead,head:c.base,affected,currentContent:rawContent,authentic:(v,r,p)=>authentic(v,r,p,rawHead)};
 const map=(r,p)=>currentRef(view,r)&&affected(p)?c.base:r==='HEAD'?rawHead:r;
 const read=releaseMachineryRepairAuthenticatedRead(sourceReader,view,{defaultReader});
 const prior=structuredClone(record);delete prior[key];assertCleanSource('projection exit');assert.equal(currentHead(),rawHead,'Release machinery source drift: Source HEAD changed during repair projection');
 return{...view,record:prior,read,blob:(r,p)=>rawBlob(map(r,p),p),content:(r,p)=>rawContent(map(r,p),p)};
}
// Authentication adapter is pure; its view must already have admitted actual
// source. Both current spellings are checked on every call, including directories.
export function releaseMachineryRepairAuthenticatedRead(reader,view,{defaultReader=false}={}){
 assert.equal(typeof reader,'function');if(view.rawHead===view.head)return reader;
 return(r,p)=>{
  if(currentRef(view,r)&&view.affected(p)){
   if(!defaultReader){assert(view.authentic(reader('HEAD',p),'HEAD',p),'Release machinery source drift: Unauthentic supplied HEAD repair reader: '+p);assert(view.authentic(reader(view.rawHead,p),view.rawHead,p),'Release machinery source drift: Unauthentic supplied raw-alias repair reader: '+p);}
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
