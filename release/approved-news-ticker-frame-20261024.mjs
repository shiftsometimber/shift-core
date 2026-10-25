import {reuseExactNativeProjection} from './scoped-native-projection-evidence.mjs';
import {immutableHistoryExecFileSync as immutableExecFileSync} from './immutable-git-facts.mjs';
import {freshDetachedSourceHead} from './fresh-food-source-head-20261016.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,readdirSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nativeNavigationFreshSourceChecker} from './recorded-week-navigation-outer-frame-20261018.mjs';
import inverse from './approved-news-ticker-maintenance-20261024.json' with {type:'json'};
const fixed={"record":{"proof":"EXACT_APPROVED_NEWS_TICKER_20261024","base":"16a2446bdf537c6bd65e85acef067d31f00c7a08","payload":"686abf6a867808bf3a95620b43c8f6ab319df305","paths":["public-navigation-policy.mjs","radar-integration-v1.js","radar-published-ticker-v1.js","tests/public-ticker-motion.test.mjs","tests/radar-published-ticker-catchup.test.mjs","tests/fixtures/radar-catchup-public-edition-20261019.json"],"maintenancePaths":["release/approved-news-ticker-frame-20261024.mjs","release/approved-news-ticker-maintenance-20261024.json","release/website-editorial-scope-20261018.mjs","release/approved-runtime-composition.mjs","tests/website-editorial-scope-20261018.test.mjs","tests/approved-news-ticker-frame-20261024.test.mjs","release/health-vision-scope-20261021.mjs","release/testosterone-scope-20261021.mjs","tests/health-vision-scope-20261021.test.mjs","tests/testosterone-release-scope.test.mjs","release/member-recording-repair-20261024.mjs"],"scope":{"publicCopyApproval":"Matt20October exact MW-CATCHUP-19OCT-v1 and retained routine factual authority","publicCopySha256":"cbafd7ef28dc65628a2e7a5c8092b8550138a9a802b9e2768281cdae8259fb60","completePublicationSnapshotRequired":true,"pendingSourceChangesExcluded":true,"firstActualPublicationPreserved":true,"currentWireClaim":false,"clinicalApprovalGranted":false,"notificationAuthorityGranted":false,"medicineCatalogueChanged":false,"pausedLinkRepairIncluded":false,"homepageMainContentChanged":false},"repairBase":"07850862f8d4cf56a4d73473c6320a33c64b624e","repairPaths":["release/approved-news-ticker-frame-20261024.mjs","tests/approved-news-ticker-frame-20261024.test.mjs"]}}.record,KEY='approvedNewsTicker20261024',LEDGER='release/approved-runtime-composition.json';
const sorted=x=>[...x].sort(),sha=x=>createHash('sha256').update(x).digest('hex');
const git=(...args)=>(args.length===2&&['show','rev-parse'].includes(args[0])&&/^[a-f0-9]{40}:/.test(args[1])?immutableExecFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}):execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6})).trimEnd();
const actual=()=>freshDetachedSourceHead()??git('rev-parse','HEAD');
const oid=(r,p)=>git('rev-parse',(r==='HEAD'?actual():r)+':'+p);
const objectKinds=new Map(),nativeChecks=new Map();
function bytes(r,p){
 const ref=r==='HEAD'?actual():r,id=oid(ref,p);let kind=objectKinds.get(id);
 if(!kind){kind=git('cat-file','-t',id);assert(['blob','tree'].includes(kind));objectKinds.set(id,kind)}
 const raw=kind==='blob'?immutableExecFileSync('git',['show',ref+':'+p],{maxBuffer:64e6}):execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','tree',id],{maxBuffer:64e6});
 assert.equal(createHash('sha1').update(kind+' '+raw.length+'\0').update(raw).digest('hex'),id,'Native immutable object bytes changed');
 return kind==='blob'?raw:execFileSync('/usr/bin/git',['--no-replace-objects','show',ref+':'+p],{maxBuffer:64e6});
}
function freshChecker(rawHead){
 // Reuse checked native metadata descriptors, never a source approval or verdict.
 // The retained checker rereads HEAD/index/config/context and executes fresh
 // native working-source checks at every construction and reader boundary.
 // The exact native index bytes identify a descriptor generation, not a source
 // approval. A newly constructed admission after a restored edit must obtain a
 // new native descriptor; existing readers remain bound to their old snapshot.
 const key=process.cwd()+'\0'+rawHead+'\0'+sha(readFileSync(git('rev-parse','--git-path','index')));let fresh=nativeChecks.get(key);
 if(!fresh){
  const native=nativeNavigationFreshSourceChecker(rawHead);
  // A failed reader remains bound to its original descriptor. Only a later,
  // independently constructed admission may snapshot the restored native state.
  // Every invocation below still executes the original fresh native checker.
  fresh=()=>{try{return native()}catch(error){if(nativeChecks.get(key)===fresh)nativeChecks.delete(key);throw error}};
  nativeChecks.set(key,fresh);
 }
 fresh();return fresh;
}
const text=(r,p)=>bytes(r,p).toString('utf8');
const diff=(a,b)=>git('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const ancestor=(a,b)=>{git('merge-base','--is-ancestor',a,b);return true};
const frames=new WeakSet();let active=null;
// A retained frame is never a cached source verdict. Ordinary Git storage and
// every ref are inventoried before/after the original native source check.
// Unknown storage, symlinks, races or any namespace change use the full constructor.
const privateFrameStorage=new WeakMap();
function storageSignature(){
 try{
  const root=process.cwd()+'/.git',rows=[];let count=0;
  const stamp=s=>[s.dev,s.ino,s.mode,s.nlink,s.uid,s.gid,s.size,s.mtimeNs,s.ctimeNs].map(String);
  function walk(path,relative,refs,depth=0){
   if(depth>32||++count>200000)throw Error('Unsupported native Git storage inventory');
   const st=lstatSync(path,{bigint:true,throwIfNoEntry:false});
   if(!st){rows.push([relative,'absent']);return;}
   if(st.isSymbolicLink()||realpathSync(path)!==path)throw Error('Ordinary native Git storage required');
   if(st.isDirectory()){
    const names=readdirSync(path).sort();rows.push([relative,'directory',stamp(st),names]);
    for(const name of names){if(!name||name==='.'||name==='..'||name.includes('/')||name.includes('\0'))throw Error('Native storage name required');walk(path+'/'+name,relative+'/'+name,refs,depth+1);}
   }else if(st.isFile()){
    if(refs&&st.size>1048576n)throw Error('Bounded native ref required');
    rows.push([relative,'file',stamp(st),refs?sha(readFileSync(path)):null]);
   }else throw Error('Unsupported native Git storage entry');
  }
  walk(root+'/objects','objects',false);walk(root+'/refs','refs',true);
  return sha(Buffer.from(JSON.stringify(rows)));
 }catch{return null;}
}

export const APPROVED_NEWS_TICKER_PATHS=Object.freeze(fixed.paths);
export const APPROVED_NEWS_TICKER_MAINTENANCE=Object.freeze(fixed.maintenancePaths);
export const approvedTickerPredecessorHead=()=>active?.base??null;
export const approvedTickerActualHead=()=>active?.rawHead??null;
const tickerNativeProjectionOwner=Object.freeze({});
export function approvedNewsTickerOuterFrame(){return reuseExactNativeProjection(tickerNativeProjectionOwner,constructApprovedNewsTickerOuterFrame);}
function constructApprovedNewsTickerOuterFrame(){
 // Reuse only inside this private synchronous callback with the complete
 // object/ref namespace unchanged on both sides of fresh native source checks.
 if(active){
  active.assertCurrent();const expected=privateFrameStorage.get(active),before=storageSignature();
  if(expected!==null&&expected!==undefined&&before===expected){
   active.assertCurrent();if(storageSignature()===before)return active;
  }
 }
 const storageBefore=storageSignature();
  const rawHead=actual(),record=JSON.parse(text(rawHead,LEDGER));
  if(record[INTEGRATION_KEY])return integratedTickerOuterFrame(rawHead,record,storageBefore);
  const c=record[KEY];if(!c)return null;
 const fresh=freshChecker(rawHead);
 const {maintenanceSource,repairSource,...scope}=c;assert.deepEqual(scope,fixed,'Only the exact finite approvedTicker scope is admitted');
 assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 assert.match(repairSource,/^[a-f0-9]{40}$/);
 const previousRegistration='9071379f77c376a45ce2b774302442ee789b8a0d',previousRepair='51f6e6d177dfd5acf0ab0a964686d8688e133a40';
 assert.deepEqual(JSON.parse(text(previousRegistration,LEDGER))[KEY],{...fixed,maintenanceSource,repairSource:previousRepair},'Every preceding namespace-repair registration field remains exact');
 assert.equal(text(repairSource,LEDGER),text(previousRegistration,LEDGER),'The complete preceding ledger must remain present before the message-only repair is registered');

 const {repairBase,repairPaths,...originalFixed}=fixed;
 assert.deepEqual(JSON.parse(text(repairBase,LEDGER))[KEY],{...originalFixed,maintenanceSource},'Every original ticker registration field must remain exact');

 for(const[a,b,ps]of[[fixed.base,fixed.payload,fixed.paths],[fixed.payload,maintenanceSource,fixed.maintenancePaths],[maintenanceSource,fixed.repairBase,[LEDGER]],[fixed.repairBase,previousRepair,fixed.repairPaths],[previousRepair,previousRegistration,[LEDGER]],[previousRegistration,repairSource,fixed.repairPaths],[repairSource,rawHead,[LEDGER]]]){
  ancestor(a,b);assert.deepEqual(sorted(diff(a,b)),sorted(ps),'Exact approvedTicker native increment required');
 }
 const all=[...fixed.paths,...fixed.maintenancePaths];
 assert.equal(new Set(all).size,all.length);
 const modeMaps=new Map();
 for(const[ref,list]of[[rawHead,[...all,LEDGER]],[fixed.payload,fixed.paths],[maintenanceSource,fixed.maintenancePaths],[repairSource,fixed.repairPaths],[fixed.base,[...Object.keys(inverse.modified),LEDGER]]]){
  const rows=execFileSync('/usr/bin/git',['--no-replace-objects','ls-tree','-z',ref,'--',...list],{encoding:'utf8',maxBuffer:64e6}).split('\0');assert.equal(rows.pop(),'');const map=new Map();
  for(const row of rows){const m=/^(100644) blob ([a-f0-9]{40})\t(.+)$/.exec(row);assert(m&&list.includes(m[3])&&!map.has(m[3]),'Exact unique regular native mode row required');map.set(m[3],m[2])}
  assert.deepEqual(sorted([...map.keys()]),sorted(list),'Every original native source mode remains required');modeMaps.set(ref,map);
 }
 const facts={blob:(r,p)=>{const value=modeMaps.get(r)?.get(p);assert(value,'Exact native immutable path required');return value},content:(r,p)=>{const value=text(r,p);assert.equal(oid(r,p),modeMaps.get(r)?.get(p),'Native source identity changed');return value},mode:(r,p)=>{assert(modeMaps.get(r)?.has(p));return '100644'}};
 assert.deepEqual(sorted(diff(fixed.base,rawHead)),sorted([...all,LEDGER]),'Unrelated approvedTicker source change');
 for(const p of all){
  const source=fixed.paths.includes(p)?fixed.payload:fixed.repairPaths.includes(p)?repairSource:maintenanceSource;
  assert.equal(facts.blob(rawHead,p),facts.blob(source,p),'Exact reviewed approvedTicker blob required: '+p);
  assert.equal(facts.mode(rawHead,p),'100644','Original regular source mode required');
  assert(readFileSync(p).equals(Buffer.from(facts.content(rawHead,p))),'Current approvedTicker working bytes changed');
 }
 assert.deepEqual(sorted(Object.keys(inverse.modified)),sorted(['release/website-editorial-scope-20261018.mjs','release/approved-runtime-composition.mjs','tests/website-editorial-scope-20261018.test.mjs','release/health-vision-scope-20261021.mjs','release/testosterone-scope-20261021.mjs','tests/health-vision-scope-20261021.test.mjs','tests/testosterone-release-scope.test.mjs','release/member-recording-repair-20261024.mjs']));
 for(const[p,row]of Object.entries(inverse.modified)){
  const before=Buffer.from(row.before,'base64');
  assert(before.equals(Buffer.from(facts.content(fixed.base,p))),'Whole original guard/test source must restore: '+p);
  assert.equal(sha(Buffer.from(facts.content(rawHead,p))),row.afterSha256,'Exact finite maintenance source required: '+p);
 }
 for(const p of fixed.maintenancePaths.filter(p=>!Object.hasOwn(inverse.modified,p)))assert.equal(git('ls-tree',fixed.base,'--',p),'','New maintenance source must be additive');
 const prior=JSON.parse(text(fixed.base,LEDGER)),retained=structuredClone(record);delete retained[KEY];
 assert.deepEqual(retained,prior,'Every prior approval, failure and receipt must remain exact');
  return makeTickerFrame(rawHead,fixed.base,all,fresh,storageBefore);
}
export function withApprovedTickerPredecessor(frame,callback){
 assert(frames.has(frame),'Independent finite approvedTicker admission required');frame.assertCurrent();
 const previous=active;active=frame;
 try{const value=callback();assert(!value||typeof value.then!=='function','Historical source projection must remain synchronous');return value}
 finally{active=previous;frame.assertCurrent()}
}
export function approvedTickerPredecessorLedger(){
 const frame=approvedNewsTickerOuterFrame();return frame?JSON.parse(frame.currentContent(frame.base,LEDGER)):JSON.parse(text(actual(),LEDGER));
}

// Restore only the exact original whole-ledger fixture after full current native admission.
export function approvedTickerOriginalLedger(value){const f=approvedNewsTickerOuterFrame();if(!f)return value;f.assertCurrent();assert.equal(value,text(f.rawHead,LEDGER).trimEnd(),'Exact current ledger fixture required');return text(f.base,LEDGER).trimEnd();}
export function approvedTickerOriginalFixtureHead(){const f=approvedNewsTickerOuterFrame();if(!f)return actual();f.assertCurrent();return f.base;}

export function approvedTickerOriginalWorkingBytes(path,value){assert(active,'Independent current ticker qualification required');active.assertCurrent();const raw=Buffer.from(text(active.rawHead,path));assert(Buffer.from(value).equals(raw),'Exact current ticker working bytes required');const prior=Buffer.from(text(active.base,path));active.assertCurrent();return prior;}

// Project only genuine changed current values after the complete independent native addendum.
// Foreign heads/values and the actual member-registration module keep their original path.
export function approvedTickerComparisonValue(path,value,requestedHead){
 if(path==='release/member-recording-repair-20261024.mjs'||![...fixed.paths,...fixed.maintenancePaths,...INTEGRATION_REPAIR_PATHS,...WATCH_OWNER_EXTENSION_PATHS].includes(path)||typeof value!=='string')return value;
 const raw=actual();if(requestedHead&&requestedHead!==raw)return value;
 let pin;try{pin=oid(raw,path);}catch{return value;}const identifier=value===pin,body=!identifier&&value===text(raw,path);if(!identifier&&!body)return value;
 const f=approvedNewsTickerOuterFrame();if(!f)return value;f.assertCurrent();let prior;try{prior=identifier?oid(f.base,path):text(f.base,path);}catch{return value;}f.assertCurrent();return prior;
}

function makeTickerFrame(rawHead,base,all,fresh,storageBefore){
 function assertCurrent(){assert.equal(actual(),rawHead,'ApprovedTicker native HEAD moved');fresh();}
 function authentic(v,r,p,kind='read'){
  const ref=r==='HEAD'?rawHead:r,body=text(ref,p),id=oid(ref,p);
  if(v===body||kind==='read'&&v===id)return true;
  const prefix='tree '+ref+':'+p+'\n';return body.startsWith(prefix)&&v===body.replace(prefix,'tree '+r+':'+p+'\n');
 }
 function project(kind,source){return(r,p)=>{
  assertCurrent();try{
   const get=ref=>{if(!source)return kind==='read'?oid(ref,p):text(ref,p);const v=source(ref,p);assert(authentic(v,ref,p,kind),'Approved ticker source drift: unauthentic supplied approvedTicker source: '+ref+':'+p);return v};
   if(r==='HEAD'||r===rawHead||r===base){if(source){get('HEAD');get(rawHead)}return get(base)}
   return get(r);
  }finally{assertCurrent()}
 }}
 function binary(kind,source){return(a,b)=>{
  assertCurrent();try{
   const raw=r=>r==='HEAD'?rawHead:r,map=r=>r==='HEAD'||r===rawHead||r===base?base:r;
   const get=(x,y)=>{const v=kind==='diff'?diff(raw(x),raw(y)):ancestor(raw(x),raw(y));if(source){const supplied=source(x,y);if(kind==='diff')assert.deepEqual(sorted(supplied),sorted(v),'Supplied approvedTicker native diff changed');else assert.notEqual(supplied,false,'Supplied approvedTicker native ancestry changed')}return v};
   if(source&&(b==='HEAD'||b===rawHead||b===base)){get(a,'HEAD');get(a,rawHead)}
   return get(map(a),map(b));
  }finally{assertCurrent()}
 }}
 const frame={nativeSource:true,rawHead,base:base,assertCurrent,authentic,affected:p=>[...all,LEDGER].some(q=>q===p||q.startsWith(p+'/')),
  currentContent:(r,p)=>text(r==='HEAD'?rawHead:r,p),
  originalContent:(p,value)=>{assertCurrent();assert.equal(value,text(rawHead,p),'Exact current approvedTicker fixture bytes required');return text(base,p)},
  projectRead:s=>project('read',s),projectContent:s=>project('content',s),projectDiff:s=>binary('diff',s),projectAncestor:s=>binary('ancestor',s)};
 const storageAfter=storageSignature();privateFrameStorage.set(frame,storageBefore!==null&&storageAfter===storageBefore?storageAfter:null);
 frames.add(frame);assertCurrent();return Object.freeze(frame);
}

const INTEGRATION_KEY='approvedNewsTickerIntegration20261025';
const INTEGRATION_BASE='55af81540a004cdeedd24eb98c96441d2421b582';
const ORIGINAL_TICKER_HEAD='f3cee7c576d46f4f10981d4c64035deb7608ee03';
const originalIntegrationFixed={proof:'EXACT_APPROVED_NEWS_TICKER_CURRENT_MAIN_20261025',base:INTEGRATION_BASE,previousTicker:ORIGINAL_TICKER_HEAD,paths:fixed.paths,maintenancePaths:fixed.maintenancePaths,scope:fixed.scope};
const INTEGRATION_REPAIR_BASE='e5dae537630afc2a7c4a24bc8ba3512c1fd7ecb5',INTEGRATION_REPAIR_PATHS=["release/approved-news-ticker-frame-20261024.mjs", "tests/approved-news-ticker-frame-20261024.test.mjs", "release/approved-news-ticker-maintenance-20261024.json", "medicines-watch/scheduler.test.mjs"];
const previousIntegrationFixed={...originalIntegrationFixed,repairBase:INTEGRATION_REPAIR_BASE,repairPaths:INTEGRATION_REPAIR_PATHS};
const POST_REPAIR_BASE='e8487e269490d16508f9ba8e60116cb993452c17',POST_REPAIR_PATHS=["release/approved-news-ticker-frame-20261024.mjs", "release/website-editorial-scope-20261018.mjs", "tests/approved-news-ticker-frame-20261024.test.mjs", "release/approved-news-ticker-maintenance-20261024.json"];
const beforeWatchOwnerFixed={...previousIntegrationFixed,postRepairBase:POST_REPAIR_BASE,postRepairPaths:POST_REPAIR_PATHS};
const WATCH_OWNER_BASE='c14ab674cb68c1ce9799a594583a44a870581409',WATCH_OWNER_EXTENSION_PATHS=["release/approved-news-ticker-frame-20261024.mjs", "release/watch-registry-wave-scope.mjs", "tests/approved-news-ticker-frame-20261024.test.mjs", "release/approved-news-ticker-maintenance-20261024.json"];
const beforeFixtureFixed={...beforeWatchOwnerFixed,watchOwnerBase:WATCH_OWNER_BASE,watchOwnerPaths:WATCH_OWNER_EXTENSION_PATHS};
const FIXTURE_BASE='f3fab37561a9167eba0e7df8a38489bd9263bc2a',FIXTURE_PATCH_PATHS=["release/approved-news-ticker-frame-20261024.mjs", "release/website-editorial-scope-20261018.mjs", "tests/approved-news-ticker-frame-20261024.test.mjs", "release/approved-news-ticker-maintenance-20261024.json"];
const EDITORIAL_FIXTURE_PATHS=Object.freeze([".github/workflows/cloudflare-production-promote.yml", "scheduled-knowledge-v1.js", "wrangler.jsonc", "release/accepted-uk-grub-preservation-20261017.mjs", "release/current-runtime-preservation-20261016.mjs", "worker-entry-v6.js", "fit-expansion-authority-v1.mjs", "g2-011-progress-story-production.mjs", "member-experience/tests/weight-import-mapping-ui.test.mjs", "release/approved-runtime-composition.mjs", "release/seo-audit-scope-20261016.mjs", "tests/seo-audit-scope-20261016.test.mjs"]);
const integrationFixed={...beforeFixtureFixed,fixtureBase:FIXTURE_BASE,fixturePaths:FIXTURE_PATCH_PATHS};
function integratedTickerOuterFrame(rawHead,record,storageBefore){
 const c=record[INTEGRATION_KEY],{maintenanceSource,repairSource,postRepairSource,watchOwnerSource,fixtureSource,...scope}=c;
 assert.deepEqual(scope,integrationFixed,'Only the exact current-main ticker composition is admitted');assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 assert.match(repairSource,/^[a-f0-9]{40}$/);assert.deepEqual(JSON.parse(text(INTEGRATION_REPAIR_BASE,LEDGER))[INTEGRATION_KEY],{...originalIntegrationFixed,maintenanceSource},'Every previous integration field must remain exact');assert.equal(text(repairSource,LEDGER),text(INTEGRATION_REPAIR_BASE,LEDGER),'Every complete prior ledger byte must precede bounded repair');
 assert.match(postRepairSource,/^[a-f0-9]{40}$/);assert.deepEqual(JSON.parse(text(POST_REPAIR_BASE,LEDGER))[INTEGRATION_KEY],{...previousIntegrationFixed,maintenanceSource,repairSource},'Every preceding scheduler/integration field remains exact');assert.equal(text(postRepairSource,LEDGER),text(POST_REPAIR_BASE,LEDGER),'Every preceding whole ledger byte must be retained before boundary repair');
 assert.match(watchOwnerSource,/^[a-f0-9]{40}$/);assert.deepEqual(JSON.parse(text(WATCH_OWNER_BASE,LEDGER))[INTEGRATION_KEY],{...beforeWatchOwnerFixed,maintenanceSource,repairSource,postRepairSource},'Every preceding qualified boundary-repair field must remain exact');assert.equal(text(watchOwnerSource,LEDGER),text(WATCH_OWNER_BASE,LEDGER),'Every preceding complete ledger byte must precede Watch owner repair');
 assert.match(fixtureSource,/^[a-f0-9]{40}$/);assert.deepEqual(JSON.parse(text(FIXTURE_BASE,LEDGER))[INTEGRATION_KEY],{...beforeFixtureFixed,maintenanceSource,repairSource,postRepairSource,watchOwnerSource},'Every preceding tested Watch ownership field remains exact');assert.equal(text(fixtureSource,LEDGER),text(FIXTURE_BASE,LEDGER),'Every previous complete ledger byte must precede fixture coverage repair');
 const fresh=freshChecker(rawHead),original=JSON.parse(text(ORIGINAL_TICKER_HEAD,LEDGER)),oc=original[KEY];
 assert.deepEqual(oc,{...fixed,maintenanceSource:'37c392ac3695ca95bc0d9e75b3c996d8b6126e20',repairSource:'819081b9b5350f5ab13b7f612cd3cdbc081aedf1'},'Original reviewed ticker registration must remain exact');
 const retained=structuredClone(record);delete retained[INTEGRATION_KEY];assert.deepEqual(retained,original,'Every earlier ledger receipt must remain unchanged');
 assert.equal(text(INTEGRATION_BASE,LEDGER),text(fixed.base,LEDGER),'Current main must preserve every earlier non-ticker ledger byte');
 const oldChain=[[fixed.base,fixed.payload,fixed.paths],[fixed.payload,oc.maintenanceSource,fixed.maintenancePaths],[oc.maintenanceSource,fixed.repairBase,[LEDGER]],[fixed.repairBase,'51f6e6d177dfd5acf0ab0a964686d8688e133a40',fixed.repairPaths],['51f6e6d177dfd5acf0ab0a964686d8688e133a40','9071379f77c376a45ce2b774302442ee789b8a0d',[LEDGER]],['9071379f77c376a45ce2b774302442ee789b8a0d',oc.repairSource,fixed.repairPaths],[oc.repairSource,ORIGINAL_TICKER_HEAD,[LEDGER]]];
 for(const[a,b,ps]of oldChain){ancestor(a,b);assert.deepEqual(sorted(diff(a,b)),sorted(ps),'Every original ticker native increment remains required');}
 const originalAll=[...fixed.paths,...fixed.maintenancePaths],all=[...originalAll,'medicines-watch/scheduler.test.mjs','release/watch-registry-wave-scope.mjs'];
 for(const p of originalAll){
  const source=fixed.paths.includes(p)?fixed.payload:fixed.repairPaths.includes(p)?oc.repairSource:oc.maintenanceSource;
  assert.equal(oid(ORIGINAL_TICKER_HEAD,p),oid(source,p),'Original ticker source pin changed: '+p);
 }
 for(const[p,row]of Object.entries(inverse.modified)){
  assert(Buffer.from(row.before,'base64').equals(bytes(fixed.base,p)),'Every original whole guard/test before-image remains exact: '+p);
  assert.equal(sha(bytes(ORIGINAL_TICKER_HEAD,p)),row.afterSha256,'Original finite maintenance bytes changed: '+p);
 }
 ancestor(ORIGINAL_TICKER_HEAD,maintenanceSource);ancestor(INTEGRATION_BASE,maintenanceSource);ancestor(maintenanceSource,rawHead);
 assert.deepEqual(sorted(diff(INTEGRATION_BASE,maintenanceSource)),sorted([...originalAll,LEDGER]),'Exact current-main ticker source boundary required');
 assert.deepEqual(diff(maintenanceSource,INTEGRATION_REPAIR_BASE),[LEDGER],'Original exact integration registration remains required');ancestor(INTEGRATION_REPAIR_BASE,repairSource);assert.deepEqual(sorted(diff(INTEGRATION_REPAIR_BASE,repairSource)),sorted(INTEGRATION_REPAIR_PATHS),'Exact native scheduler/projection repair boundary required');ancestor(repairSource,POST_REPAIR_BASE);assert.deepEqual(diff(repairSource,POST_REPAIR_BASE),[LEDGER],'Original exact scheduler repair registration remains required');ancestor(POST_REPAIR_BASE,postRepairSource);assert.deepEqual(sorted(diff(POST_REPAIR_BASE,postRepairSource)),sorted(POST_REPAIR_PATHS),'Exact scheduler-pin and historical-fixture boundary repair required');ancestor(postRepairSource,WATCH_OWNER_BASE);assert.deepEqual(diff(postRepairSource,WATCH_OWNER_BASE),[LEDGER],'Original exact boundary registration remains required');ancestor(WATCH_OWNER_BASE,watchOwnerSource);assert.deepEqual(sorted(diff(WATCH_OWNER_BASE,watchOwnerSource)),sorted(WATCH_OWNER_EXTENSION_PATHS),'Exact Watch source ownership repair boundary required');ancestor(watchOwnerSource,FIXTURE_BASE);assert.deepEqual(diff(watchOwnerSource,FIXTURE_BASE),[LEDGER],'Original exact Watch source ownership registration remains required');ancestor(FIXTURE_BASE,fixtureSource);assert.deepEqual(sorted(diff(FIXTURE_BASE,fixtureSource)),sorted(FIXTURE_PATCH_PATHS),'Exact original fixture coverage repair boundary required');ancestor(fixtureSource,rawHead);assert.deepEqual(diff(fixtureSource,rawHead),[LEDGER],'Only the exact fixture repair registration may follow source');
 assert.equal(text(maintenanceSource,LEDGER),text(ORIGINAL_TICKER_HEAD,LEDGER),'Every previous complete ledger byte must precede integration');
 for(const p of all){
  const source=fixed.paths.includes(p)?fixed.payload:FIXTURE_PATCH_PATHS.includes(p)?fixtureSource:WATCH_OWNER_EXTENSION_PATHS.includes(p)?watchOwnerSource:POST_REPAIR_PATHS.includes(p)?postRepairSource:INTEGRATION_REPAIR_PATHS.includes(p)?repairSource:maintenanceSource;
  assert.equal(oid(rawHead,p),oid(source,p),'Exact integrated ticker source drift: '+p);
  assert(readFileSync(p).equals(bytes(rawHead,p)),'Integrated ticker working source drift: '+p);
 }
 for(const ref of [ORIGINAL_TICKER_HEAD,rawHead])for(const p of [...all,LEDGER])assert(git('ls-tree',ref,'--',p).startsWith('100644 blob '),'Every original regular source mode remains required: '+p);
 assert.deepEqual(sorted(Object.keys(inverse.integration.modified)),sorted(Object.keys(inverse.modified)),'The same bounded original guard/test set must be retained');
 for(const[p,row]of Object.entries(inverse.integration.modified)){
  assert(Buffer.from(row.before,'base64').equals(bytes(INTEGRATION_BASE,p)),'Whole current-main guard/test before-image required: '+p);
  assert.equal(sha(bytes(POST_REPAIR_BASE,p)),row.afterSha256,'Exact independently reviewed preceding integration source required: '+p);
 }
 for(const p of fixed.maintenancePaths.filter(p=>!Object.hasOwn(inverse.integration.modified,p)))assert.equal(git('ls-tree',INTEGRATION_BASE,'--',p),'','New integration maintenance source must be additive');
 for(const[p,row]of Object.entries(inverse.integration.postRepair.modified)){
  assert.equal(oid(POST_REPAIR_BASE,p),row.beforeBlob,'Exact whole original fixture adapter required');let restored=text(FIXTURE_BASE,p);assert.equal(sha(bytes(WATCH_OWNER_BASE,p)),row.afterSha256,'Exact preceding bounded fixture adapter required');for(const[a,b]of [...row.inverse].reverse()){assert(b&&restored.split(b).length===2,'Every literal fixture boundary inverse must remain exact');restored=restored.replace(b,()=>a)}assert.equal(restored,text(POST_REPAIR_BASE,p),'Every original fixture-adapter assertion byte must restore');
 }
 for(const[p,row]of Object.entries(inverse.integration.watchOwner.modified)){assert.equal(oid(WATCH_OWNER_BASE,p),row.beforeBlob,'Exact original Watch ownership source required');let restored=text(rawHead,p);assert.equal(sha(Buffer.from(restored)),row.afterSha256,'Exact reviewed Watch ownership adapter required');for(const[a,b]of [...row.inverse].reverse()){assert(b&&restored.split(b).length===2,'Exact Watch ownership inverse required');restored=restored.replace(b,()=>a)}assert.equal(restored,text(WATCH_OWNER_BASE,p),'Every earlier Watch path, owner, review and timeout assertion must restore');}
 for(const[p,row]of Object.entries(inverse.integration.fixtureCoverage.modified)){assert.equal(oid(FIXTURE_BASE,p),row.beforeBlob,'Exact original fixture adapter source required');let restored=text(rawHead,p);assert.equal(sha(Buffer.from(restored)),row.afterSha256,'Exact complete earlier-source fixture adapter required');for(const[a,b]of [...row.inverse].reverse()){assert(b&&restored.split(b).length===2,'Exact original fixture coverage inverse required');restored=restored.replace(b,()=>a)}assert.equal(restored,text(FIXTURE_BASE,p),'Every original actual-caller and historical-fixture assertion byte must restore');}
 const testRepair=inverse.integration.testRepair;assert.equal(testRepair.path,'medicines-watch/scheduler.test.mjs');assert(Buffer.from(testRepair.before,'base64').equals(bytes(INTEGRATION_BASE,testRepair.path)),'Every original scheduler assertion before-image remains exact');assert.equal(sha(bytes(rawHead,testRepair.path)),testRepair.afterSha256,'Exact bounded scheduler test repair required');
 return makeTickerFrame(rawHead,INTEGRATION_BASE,all,fresh,storageBefore);
}

// Preserve the actual caller-byte assertion first. Only the native admitted
// current-main workflow may supply the exact original editorial after-image to
// its unchanged whole-file inverse. No production workflow byte is changed.
export function approvedTickerEditorialFixture(path,value,requestedHead){
 if(!EDITORIAL_FIXTURE_PATHS.includes(path)||!active)return value;
 active.assertCurrent();assert.equal(active.base,INTEGRATION_BASE,'Exact current-main editorial fixture context required');
 assert.equal(requestedHead,active.base,'Exact native inner fixture head required');
 assert.equal(value,text(active.base,path),'Actual qualified current fixture bytes must remain exact');
 const snapshot='a78f893a30d41e4542dfd53c08dcdb77f88090e4';
 ancestor(snapshot,active.base);assert(git('ls-tree',snapshot,'--',path).startsWith('100644 blob '),'Original regular editorial fixture source required');
 const result=text(snapshot,path);active.assertCurrent();return result;
}

export function approvedTickerWatchSource(path){
 if(path!=='medicines-watch/scheduler.test.mjs')return null;
 const f=approvedNewsTickerOuterFrame();if(!f)return null;f.assertCurrent();
 const c=JSON.parse(text(f.rawHead,LEDGER))[INTEGRATION_KEY],source=c?.repairSource;
 assert.equal(source,'5a90301133438322c442ea87eb8c4676bc3569d6','Only the exact independently tested scheduler repair source is admitted');
 assert.equal(oid(f.rawHead,path),oid(source,path),'Actual current scheduler test must match its complete reviewed source');f.assertCurrent();return source;
}
