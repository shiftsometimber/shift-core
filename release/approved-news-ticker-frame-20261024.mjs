import {reuseExactNativeProjection} from './scoped-native-projection-evidence.mjs';
import {immutableHistoryExecFileSync as immutableExecFileSync} from './immutable-git-facts.mjs';
import {freshDetachedSourceHead} from './fresh-food-source-head-20261016.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,readdirSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nativeNavigationFreshSourceChecker} from './recorded-week-navigation-outer-frame-20261018.mjs';
import inverse from './approved-news-ticker-maintenance-20261024.json' with {type:'json'};
const fixed={"proof":"EXACT_APPROVED_NEWS_TICKER_CANONICAL_20261025","base":"301edf43d35c31d9fa0829e67bf183650419fc19","payload":"950770aefa05110e5a51c25775989017981ae80d","approvedPayload":"686abf6a867808bf3a95620b43c8f6ab319df305","paths":["public-navigation-policy.mjs","radar-integration-v1.js","radar-published-ticker-v1.js","tests/public-ticker-motion.test.mjs","tests/radar-published-ticker-catchup.test.mjs","tests/fixtures/radar-catchup-public-edition-20261019.json"],"maintenancePaths":["release/approved-news-ticker-frame-20261024.mjs","release/approved-news-ticker-maintenance-20261024.json","release/website-editorial-scope-20261018.mjs","release/approved-runtime-composition.mjs","tests/website-editorial-scope-20261018.test.mjs","tests/approved-news-ticker-frame-20261024.test.mjs","release/health-vision-scope-20261021.mjs","release/testosterone-scope-20261021.mjs","tests/health-vision-scope-20261021.test.mjs","tests/testosterone-release-scope.test.mjs","release/member-recording-repair-20261024.mjs"],"scope":{"publicCopyApproval":"Matt20October exact MW-CATCHUP-19OCT-v1 and retained routine factual authority","publicCopySha256":"cbafd7ef28dc65628a2e7a5c8092b8550138a9a802b9e2768281cdae8259fb60","completePublicationSnapshotRequired":true,"pendingSourceChangesExcluded":true,"firstActualPublicationPreserved":true,"currentWireClaim":false,"clinicalApprovalGranted":false,"notificationAuthorityGranted":false,"medicineCatalogueChanged":false,"pausedLinkRepairIncluded":false,"homepageMainContentChanged":false},"retainedPrivateProposal":"8661d5a974149040af1815f4b42eed8e945e402b","retainedPrivateLedgerSha256":"aad92e5768c2afe424854ae72e24bc241e2bffbcfacfd51af1bacf0af9caf59e"},KEY='approvedNewsTicker20261024',LEDGER='release/approved-runtime-composition.json';
const MODIFIED_PATHS=["release/website-editorial-scope-20261018.mjs", "release/approved-runtime-composition.mjs", "tests/website-editorial-scope-20261018.test.mjs", "release/health-vision-scope-20261021.mjs", "release/testosterone-scope-20261021.mjs", "tests/health-vision-scope-20261021.test.mjs", "tests/testosterone-release-scope.test.mjs", "release/member-recording-repair-20261024.mjs"];
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
 if(active){
  active.assertCurrent();const expected=privateFrameStorage.get(active),before=storageSignature();
  if(expected!==null&&expected!==undefined&&before===expected){active.assertCurrent();if(storageSignature()===before)return active;}
 }
 const storageBefore=storageSignature(),rawHead=actual(),record=JSON.parse(text(rawHead,LEDGER)),c=record[KEY];if(!c)return null;
 const fresh=freshChecker(rawHead),{maintenanceSource,...scope}=c;
 assert.deepEqual(scope,fixed,'Only the exact canonical approvedTicker scope is admitted');assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 const all=[...fixed.paths,...fixed.maintenancePaths];assert.equal(new Set(all).size,all.length);
 for(const[a,b,ps]of[[fixed.base,fixed.payload,fixed.paths],[fixed.payload,maintenanceSource,fixed.maintenancePaths],[maintenanceSource,rawHead,[LEDGER]]]){
  ancestor(a,b);assert.deepEqual(sorted(diff(a,b)),sorted(ps),'Exact canonical approvedTicker native increment required');
 }
 ancestor(fixed.retainedPrivateProposal,fixed.payload); // reconciled merge must retain private evidence ancestry
 assert.equal(sha(bytes(fixed.retainedPrivateProposal,LEDGER)),fixed.retainedPrivateLedgerSha256,'Every earlier private proposal receipt remains immutable');
 assert.equal(text(maintenanceSource,LEDGER),text(fixed.base,LEDGER),'Every actual production ledger byte must precede ticker registration');
 const modeMaps=new Map();
 for(const[ref,list]of[[rawHead,[...all,LEDGER]],[fixed.payload,fixed.paths],[fixed.approvedPayload,fixed.paths],[maintenanceSource,fixed.maintenancePaths],[fixed.base,[...Object.keys(inverse.modified),LEDGER]]]){
  const rows=execFileSync('/usr/bin/git',['--no-replace-objects','ls-tree','-z',ref,'--',...list],{encoding:'utf8',maxBuffer:64e6}).split('\0');assert.equal(rows.pop(),'');const map=new Map();
  for(const row of rows){const m=/^(100644) blob ([a-f0-9]{40})\t(.+)$/.exec(row);assert(m&&list.includes(m[3])&&!map.has(m[3]),'Exact unique regular native mode row required');map.set(m[3],m[2]);}
  assert.deepEqual(sorted([...map.keys()]),sorted(list),'Every original native source mode remains required');modeMaps.set(ref,map);
 }
 const facts={blob:(r,p)=>{const value=modeMaps.get(r)?.get(p);assert(value,'Exact native immutable path required');return value},content:(r,p)=>{const value=text(r,p);assert.equal(oid(r,p),modeMaps.get(r)?.get(p),'Native source identity changed');return value}};
 assert.deepEqual(sorted(diff(fixed.base,rawHead)),sorted([...all,LEDGER]),'Unrelated approvedTicker source change');
 for(const p of all){
  const source=fixed.paths.includes(p)?fixed.payload:maintenanceSource;
  assert.equal(facts.blob(rawHead,p),facts.blob(source,p),'Exact reviewed approvedTicker blob required: '+p);
  if(fixed.paths.includes(p))assert.equal(facts.blob(source,p),facts.blob(fixed.approvedPayload,p),'Every exact approved runtime payload byte remains required');
  assert(readFileSync(p).equals(Buffer.from(facts.content(rawHead,p))),'Current approvedTicker working bytes changed');
 }
 assert.deepEqual(sorted(Object.keys(inverse.modified)),sorted(MODIFIED_PATHS),'Every original guard/test whole before-image remains required');
 for(const[p,row]of Object.entries(inverse.modified)){
  assert(Buffer.from(row.before,'base64').equals(Buffer.from(facts.content(fixed.base,p))),'Whole original guard/test source must restore: '+p);
  assert.equal(sha(Buffer.from(facts.content(rawHead,p))),row.afterSha256,'Exact finite maintenance source required: '+p);
 }
 for(const p of fixed.maintenancePaths.filter(p=>!Object.hasOwn(inverse.modified,p)))assert.equal(git('ls-tree',fixed.base,'--',p),'','New maintenance source must be additive');
 const prior=JSON.parse(text(fixed.base,LEDGER)),retained=structuredClone(record);delete retained[KEY];assert.deepEqual(retained,prior,'Every prior approval, failure and receipt must remain exact');
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
 if(path==='release/member-recording-repair-20261024.mjs'||![...fixed.paths,...fixed.maintenancePaths].includes(path)||typeof value!=='string')return value;
 const raw=actual();if(requestedHead&&requestedHead!==raw)return value;
 let pin;try{pin=oid(raw,path);}catch{return value;}const identifier=value===pin,body=!identifier&&value===text(raw,path);if(!identifier&&!body)return value;
 const f=approvedNewsTickerOuterFrame();if(!f)return value;f.assertCurrent();let prior;try{prior=identifier?oid(f.base,path):text(f.base,path);}catch{return value;}f.assertCurrent();return prior;
}

function makeTickerFrame(rawHead,base,all,fresh,storageBefore){
 function assertCurrent(){
  // The original native checker binds expected HEAD at construction and rechecks
  // HEAD/ref/index/config/environment and working source on every boundary.
  // Avoid a second Git HEAD subprocess for the same unchanged identity assertion.
  fresh();
 }
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

