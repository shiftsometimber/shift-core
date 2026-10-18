import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeSeoBlobBatch} from './seo-native-immutable-facts-20261016.mjs';
import {verifiedOwnedRuntime} from '../shift-coach/cancelled-release-recovery.mjs';

const policy=JSON.parse(readFileSync(new URL('./recorded-week-navigation-outer-policy-20261018.json',import.meta.url),'utf8'));
const LEDGER='release/approved-runtime-composition.json',KEY='recordedWeekNavigation20261018';
const BASE='0e4a765e7a360d705e2424264e0bcfcc1d6652be',PAYLOAD='0d0a1c80a6e461dd641b7a95d3c46e8758d0ebeb';
const fixedPaths=Object.freeze(['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
const fixedMaintenance=Object.freeze(['release/accepted-uk-grub-preservation-20261017.mjs','release/approved-runtime-composition.mjs','release/combined-finite-scope-20261014.mjs','release/current-runtime-preservation-20261016.mjs','release/recorded-week-navigation-outer-frame-20261018.mjs','release/recorded-week-navigation-outer-policy-20261018.json','tests/recorded-week-navigation-preservation-20261018.test.mjs','member-experience/tests/weight-import-mapping-ui.test.mjs']);
const MAINTENANCE_DECLARATION_SHA256='eb6089f8cfef0f631e1c910a5e5e4e0da88babd83e6ad72d2a7a0c9374dbab42';
const native=[execFileSync,readFileSync,lstatSync,realpathSync,createHash,process.cwd];
const frames=new WeakSet(),oid=/^[a-f0-9]{40}$/,sorted=a=>[...a].sort(),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{maxBuffer:64e6});
const text=(...args)=>git(...args).toString('utf8').trimEnd();
const head=()=>text('rev-parse','HEAD');
const path=p=>{assert(typeof p==='string'&&/^[A-Za-z0-9_.\/-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(s=>!s||s==='.'||s==='..'),'Exact recorded-week navigation path required');return p;};
function data(v,seen=new Set()){
 if(v===null||['string','boolean','number'].includes(typeof v))return v;
 assert(v&&typeof v==='object'&&!seen.has(v));assert([Object.prototype,Array.prototype,null].includes(Object.getPrototypeOf(v)));
 seen.add(v);const out=Array.isArray(v)?[]:{};
 for(const[k,d]of Object.entries(Object.getOwnPropertyDescriptors(v))){if(Array.isArray(v)&&k==='length')continue;assert(Object.hasOwn(d,'value')&&!d.get&&!d.set);out[k]=data(d.value,seen);}
 seen.delete(v);return out;
}
function clean(expected){
 assert.deepEqual([execFileSync,readFileSync,lstatSync,realpathSync,createHash,process.cwd],native,'Native navigation source functions changed');
 assert(!Object.keys(process.env).some(k=>/^GIT_/.test(k)&&k!=='GIT_PAGER'),'Git source selectors are forbidden');
 const root=process.cwd(),dir=resolve(root,'.git');assert.equal(realpathSync(root),root);assert.equal(realpathSync(dir),dir);assert(lstatSync(dir).isDirectory()&&!lstatSync(dir).isSymbolicLink());
 for(const p of ['commondir','gitdir','info/grafts','objects/info/alternates','shallow'])assert(!existsSync(resolve(dir,p)),'Ordinary complete native source required: '+p);
 assert.equal(text('rev-parse','--show-toplevel'),root);assert.equal(text('rev-parse','--git-common-dir'),'.git');assert.equal(text('for-each-ref','--format=%(refname)','refs/replace'),'');
 assert.equal(text('diff','--no-renames','--name-only','HEAD','--'),'');assert.equal(text('diff','--no-renames','--cached','--name-only','--'),'');
 for(const row of git('ls-files','-v','-z').toString('utf8').split('\0').filter(Boolean))assert(row.startsWith('H '),'Hidden/sparse/assume-unchanged source is forbidden');
 const h=head();assert(oid.test(h));if(expected)assert.equal(h,expected,'Actual navigation HEAD moved');return h;
}
function object(ref,p){assert(oid.test(ref));path(p);const id=text('rev-parse',ref+':'+p);assert(oid.test(id));return id;}
function bytes(ref,p){
 const id=object(ref,p),kind=text('cat-file','-t',id);
 if(kind==='blob'){const batch=execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','--batch'],{input:id+'\n',maxBuffer:64e6});return decodeSeoBlobBatch(batch,[id]).get(id);}
 assert.equal(kind,'tree');const b=git('cat-file','tree',id);assert.equal(createHash('sha1').update('tree '+b.length+'\0').update(b).digest('hex'),id);return git('show',ref+':'+p);
}
const content=(r,p)=>bytes(r,p).toString('utf8');
const diff=(a,b)=>text('diff','--no-renames','--name-only',a,b).split('\n').filter(Boolean);
const ancestor=(a,b)=>{git('merge-base','--is-ancestor',a,b);return true;};
function mode(ref,p){const row=text('ls-tree',ref,'--',path(p));const m=/^(100644|100755) blob ([a-f0-9]{40})\t/.exec(row);assert(m,'Exact regular-file source required: '+p);return m[1];}
function inverse(p,value,entry){
 if(entry.kind==='maintenance-add')return null;
 if(entry.kind==='add'){assert(value.equals(Buffer.from(entry.after,'base64')));assert.equal(sha(value),entry.afterSha256);return null;}
 let out=value;
 for(const h of [...entry.hunks].reverse()){
  const before=Buffer.from(h.before,'base64'),after=Buffer.from(h.after,'base64');assert(before.length&&after.length);
  const s=out.indexOf(after);assert(s>=0&&out.indexOf(after,s+1)<0,'Unique whole navigation inverse required: '+p);
  out=Buffer.concat([out.subarray(0,s),before,out.subarray(s+after.length)]);
 }
 return out;
}
export function assertExactNavigationPayload(p,value,fileMode='100644'){
 assert(fixedPaths.includes(p),'Only the original two navigation paths are admitted');assert.equal(fileMode,'100644');
 assert(Buffer.isBuffer(value));const e=policy.payloadEntries.find(x=>x.path===p);assert(e);assert.equal(sha(value),e.afterSha256,'Exact frozen navigation payload required');
 return inverse(p,value,e);
}
function receipt(){
 const a=data(policy.acceptedProduction);assert.equal(a.source,BASE);assert.equal(a.tree,policy.record.baseTree);
 const decoded=Object.fromEntries(['run','job','active','receipt','logs'].map(k=>[k,Buffer.from(a[k],'base64')]));
 for(const[k,v]of Object.entries(decoded))assert.equal(sha(v),a.sha256[k],'Original normal production evidence changed: '+k);
 const run=JSON.parse(decoded.run),job=JSON.parse(decoded.job),active=JSON.parse(decoded.active),owned=JSON.parse(decoded.receipt);
 assert.equal(run.head_sha,BASE);assert.equal(run.head_branch,'main');assert.equal(run.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');assert.equal(job.name,'promote');
 const ownedLines=decoded.logs.toString('utf8').split('\n').flatMap(line=>{const i=line.indexOf('{"kind":"owned_runtime_deployment"');if(i<0)return[];try{return[JSON.parse(line.slice(i))]}catch{return[]}});
 assert.equal(ownedLines.filter(x=>JSON.stringify(x)===JSON.stringify(owned)).length,1);assert.equal(verifiedOwnedRuntime(active,run,job,owned),true);return owned;
}
function prove(rawHead){
 const record=JSON.parse(content(rawHead,LEDGER)),c=record[KEY];if(!c)return null;
 const{maintenanceSource,...fixed}=data(c);assert.deepEqual(fixed,policy.record);assert.equal(c.base,BASE);assert.equal(c.payload,PAYLOAD);assert.deepEqual(c.paths,fixedPaths);
 assert.deepEqual(c.maintenancePaths,fixedMaintenance);assert.equal(sha(Buffer.from(JSON.stringify(policy.maintenanceEntries))),MAINTENANCE_DECLARATION_SHA256,'Only the exact original guard hooks are admitted');
 for(const r of[c.base,c.payload,maintenanceSource]){assert(oid.test(r));ancestor(r,rawHead);}assert.equal(text('rev-parse',c.base+'^{tree}'),c.baseTree);assert.equal(text('rev-parse',c.payload+'^{tree}'),c.payloadTree);receipt();
 for(const[a,b,paths]of[[c.base,c.payload,c.paths],[c.payload,maintenanceSource,c.maintenancePaths],[maintenanceSource,rawHead,[LEDGER]]]){ancestor(a,b);assert.deepEqual(sorted(diff(a,b)),sorted(paths),'Exact two-path navigation/maintenance/ledger boundary required');}
 assert.deepEqual(sorted(diff(c.base,rawHead)),sorted([...new Set([...c.paths,...c.maintenancePaths,LEDGER])]),'Every unrelated source path must remain exact');
 for(const p of c.paths){
  assert.equal(mode(rawHead,p),'100644');assert.equal(object(rawHead,p),object(c.payload,p));const value=bytes(rawHead,p),restored=assertExactNavigationPayload(p,value);
  assert(readFileSync(resolve(process.cwd(),p)).equals(value),'Fresh navigation working bytes changed');
  if(restored===null)assert.equal(text('ls-tree',c.base,'--',p),'');else assert(restored.equals(bytes(c.base,p)),'Whole original navigation source must restore');
 }
 for(const p of c.maintenancePaths){
  assert.equal(mode(rawHead,p),'100644');assert.equal(object(rawHead,p),object(maintenanceSource,p));const value=bytes(rawHead,p);assert(readFileSync(resolve(process.cwd(),p)).equals(value),'Fresh maintenance working bytes changed');
  const entry=policy.maintenanceEntries.find(x=>x.path===p);assert(entry);const restored=inverse(p,value,entry);
  if(restored===null)assert.equal(text('ls-tree',c.base,'--',p),'');else assert(restored.equals(bytes(c.base,p)),'Every original Core assertion must restore byte for byte: '+p);
 }
 delete record[KEY];assert.deepEqual(record,JSON.parse(content(c.base,LEDGER)),'Every prior approval, failure, receipt and record must remain exact');
 for(const p of ['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc','package.json','package-lock.json','.github/workflows/cloudflare-production-promote.yml','worker-entry-v6.js','shift-coach/worker.mjs','member-experience/treatment-week-client.mjs','my-timber-app','public'])assert.equal(object(rawHead,p),object(c.base,p),'Protected navigation boundary changed: '+p);
 clean(rawHead);return c;
}
export function actualNavigationOuterFrame(){
 const rawHead=clean(),env=JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),cwd=process.cwd(),c=prove(rawHead);if(!c)return null;
 const assertCurrent=()=>{assert.equal(process.cwd(),cwd);assert.equal(JSON.stringify(Object.keys(process.env).sort().map(k=>[k,process.env[k]])),env);clean(rawHead);};
 const finish=()=>{assertCurrent();assert.deepEqual(prove(rawHead),c);};
 const map=r=>r==='HEAD'||r===rawHead?c.base:r,current=r=>r==='HEAD'||r===rawHead||r===c.base;
 const native=(kind,r,p)=>kind==='read'?object(r==='HEAD'?rawHead:r,p):content(r==='HEAD'?rawHead:r,p);
 const auth=(value,r,p,kind='read')=>{const ref=r==='HEAD'?rawHead:r,expected=native(kind,r,p);if(value===expected||kind==='read'&&value===native('content',r,p))return true;const prefix='tree '+ref+':'+p+'\n',shown=kind==='content'?expected:native('content',r,p);return shown.startsWith(prefix)&&value===shown.replace(prefix,'tree '+r+':'+p+'\n');};
 function projected(kind,source){return(r,p)=>{assertCurrent();try{if(source){const obtain=ref=>{const v=source(ref,p);assert(auth(v,ref,p,kind),'Supplied navigation source changed');return v;};if(current(r)){obtain('HEAD');obtain(rawHead);return obtain(c.base);}return obtain(r);}return kind==='read'?object(map(r),p):content(map(r),p);}finally{assertCurrent();}};}
 function binary(kind,source){return(a,b)=>{assertCurrent();try{const obtain=(x,y)=>{const v=kind==='diff'?diff(x==='HEAD'?rawHead:x,y==='HEAD'?rawHead:y):ancestor(x==='HEAD'?rawHead:x,y==='HEAD'?rawHead:y);if(source){const supplied=data(source(x,y));if(kind==='diff')assert.deepEqual(sorted(supplied),sorted(v));else assert.notEqual(supplied,false);}return v;};if(source&&current(b)){obtain(a,'HEAD');obtain(a,rawHead);}return obtain(map(a),map(b));}finally{assertCurrent();}};}
 const frame={rawHead,head:c.base,record:JSON.parse(content(c.base,LEDGER)),assertCurrent,assertCurrentHead:assertCurrent,finish,affected:p=>[...c.paths,...c.maintenancePaths,LEDGER].some(q=>q===p||q.startsWith(p+'/')),currentContent:(r,p)=>content(r==='HEAD'?rawHead:r,p),nativeAuthentic:(v,r,p)=>auth(v,r,p,'read')||auth(v,r,p,'content'),nativeContentAuthentic:(v,r,p)=>auth(v,r,p,'content'),authentic:(v,r,p)=>auth(v,r,p,'read')||auth(v,r,p,'content'),read:projected('read',null),blob:projected('read',null),content:projected('content',null),diff:binary('diff',null),ancestor:binary('ancestor',null),projectRead:r=>projected('read',r),projectContent:r=>projected('content',r),projectDiff:r=>binary('diff',r),projectAncestor:r=>binary('ancestor',r)};
 frames.add(frame);assertCurrent();return Object.freeze(frame);
}
export function assertActualNavigationFrame(frame){assert(frames.has(frame));frame.assertCurrent();return frame;}
export const ACTUAL_NAVIGATION_PATHS=Object.freeze(policy.record.paths);
export const ACTUAL_NAVIGATION_MAINTENANCE=Object.freeze(policy.record.maintenancePaths);
export function assertNavigationOuterChainContext(repair){const navigation=actualNavigationOuterFrame();if(!navigation)return;try{assert.equal(repair.rawHead,navigation.rawHead);assert(repair.ciExecutionContext);assert.equal(repair.ciExecutionContext.rawHead,navigation.rawHead);}finally{navigation.finish();}}
export function actualNavigationChangedPath(status,p){const navigation=actualNavigationOuterFrame();assert(navigation);try{assert([...ACTUAL_NAVIGATION_PATHS,...ACTUAL_NAVIGATION_MAINTENANCE].includes(p));const row=text('ls-tree',navigation.head,'--',path(p));if(row)assert(/^100644 blob [a-f0-9]{40}\t/.test(row));assert.equal(status,row?'M':'A');return true;}finally{navigation.finish();}}
