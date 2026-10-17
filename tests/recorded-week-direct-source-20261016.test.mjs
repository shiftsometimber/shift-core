import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {chmodSync,readFileSync,writeFileSync,existsSync,mkdirSync,unlinkSync,statSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {resolve,dirname} from 'node:path';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {syncBuiltinESMExports} from 'node:module';
import {verifyRecordedWeekDirect} from '../release/recorded-week-direct-scope-20261016.mjs';
const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects',...args],{encoding:'utf8'});
const head=()=>git('rev-parse','HEAD').trim();
const blob=(r,p)=>git('rev-parse',r+':'+p).trim();
const content=(r,p)=>git('show',r+':'+p);
const diff=(a,b)=>git('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',a,b,'--').trim().split('\n').filter(Boolean);
const ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b);
const record=()=>JSON.parse(content(head(),'release/approved-runtime-composition.json')).myTimberRecordedWeekActivation20261014;
const route='member-experience/treatment-week-route.mjs';
function unchanged(){assert.equal(git('status','--porcelain','--untracked-files=no').trim(),'');}
test('direct factual week proves actual current increment and preserves completed GP baseline, consent and held clinical boundaries',()=>{
 const c=record();assert.equal(verifyRecordedWeekDirect(c),c);assert.equal(c.scope,'recorded_facts_only');assert.equal(c.weekEnabled,true);assert.equal(c.externalReviewRequired,false);
 for(const k of ['clinicalModelEnabled','medicationLevelsIncluded','symptomPredictionIncluded','clinicalApprovalClaimed','emailAuthority','paidModelEnabled','stockChanged','homepageChanged'])assert.equal(c[k],false);
 const previous=JSON.parse(content(c.base,'release/approved-runtime-composition.json'));const current=JSON.parse(content(head(),'release/approved-runtime-composition.json'));delete current.myTimberRecordedWeekActivation20261014;assert.deepEqual(current,previous);assert.equal(previous.gpDirectoryActivation20261015.flagsEnabled,true);unchanged();
});
test('direct factual week accepts and invokes every honest supplied native callback at literal and HEAD aliases',()=>{
 const c=record(),raw=head(),seen={read:[],content:[],diff:[],ancestor:[]};assert.equal(verifyRecordedWeekDirect(c,{head:raw,read:(r,p)=>{seen.read.push([r,p]);return blob(r,p);},readContent:(r,p)=>{seen.content.push([r,p]);return content(r,p);},readDiff:(a,b)=>{seen.diff.push([a,b]);return diff(a,b);},isAncestor:(a,b)=>{seen.ancestor.push([a,b]);return ancestor(a,b);}}),c);
 for(const k of ['read','content'])for(const ref of ['HEAD',raw,c.base,c.source,c.maintenanceSource])assert(seen[k].some(([r])=>r===ref),k+' literal/alias callback '+ref);
 for(const k of ['diff','ancestor']){assert(seen[k].some(([a])=>a==='HEAD'));assert(seen[k].some(([,b])=>b==='HEAD'));}unchanged();
});
test('direct factual week defaults only undefined and rejects every explicit null API selector',()=>{
 const c=record();assert.equal(verifyRecordedWeekDirect(c,{head:undefined,read:undefined,readContent:undefined,readDiff:undefined,isAncestor:undefined}),c);
 for(const key of ['head','read','readContent','readDiff','isAncestor'])assert.throws(()=>verifyRecordedWeekDirect(c,{[key]:null}));assert.throws(()=>verifyRecordedWeekDirect(c,null));
});
test('direct factual week rejects changed authority, completed baseline and held-boundary records',()=>{
 const c=record();for(const key of ['weekEnabled','externalReviewRequired','clinicalModelEnabled','emailAuthority'])assert.throws(()=>verifyRecordedWeekDirect({...c,[key]:!c[key]}));
 assert.throws(()=>verifyRecordedWeekDirect({...c,authority:{...c.authority,emailAuthority:true}}));assert.throws(()=>verifyRecordedWeekDirect({...c,acceptedBaseline:{...c.acceptedBaseline,source:'0'.repeat(40)}}));
});
test('direct factual week authenticates supplied HEAD alias and actual literal raw source',()=>{
 const c=record();for(const selected of ['HEAD',head()]){let called=0;assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{if(r===selected){called++;return '0'.repeat(40);}return blob(r,p);}}));assert(called>0);}
});
test('direct factual week authenticates supplied bytes, both diff endpoints and positive and negative ancestry',()=>{
 const c=record();let contents=0,boundaries=0,positives=0,negatives=0;
 assert.throws(()=>verifyRecordedWeekDirect(c,{readContent:(r,p)=>{contents++;return content(r,p)+'altered';}}));
 for(const endpoint of [0,1]){let poisoned=false;assert.throws(()=>verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{boundaries++;const actual=diff(a,b);if([a,b][endpoint]==='HEAD'){poisoned=true;return [...actual,'unregistered'];}return actual;}}));assert(poisoned,'Both HEAD alias endpoints must be independently authenticated');}
 assert.throws(()=>verifyRecordedWeekDirect(c,{isAncestor:(a,b)=>{positives++;ancestor(a,b);return false;}}));
 assert.throws(()=>verifyRecordedWeekDirect(c,{isAncestor:(a,b)=>{negatives++;return true;}}));assert(contents&&boundaries&&positives&&negatives);
});
test('direct factual week accepts native ignored-stream negative ancestry without accepting forged diagnostics',()=>{
 const c=record();for(const stdio of ['ignore',['ignore','pipe','ignore'],['ignore','ignore','pipe']]){let calls=0;assert.equal(verifyRecordedWeekDirect(c,{isAncestor:(a,b)=>{calls++;return execFileSync('/usr/bin/git',['--no-replace-objects','merge-base','--is-ancestor',a,b],{stdio});}}),c);assert(calls>0);}
 let negative=false;assert.throws(()=>verifyRecordedWeekDirect(c,{isAncestor:(a,b)=>{try{return ancestor(a,b);}catch(error){negative=true;throw Object.assign(new Error('unrelated diagnostic'),{status:1,signal:null,stdout:'unrelated',stderr:'',output:[null,'unrelated','']});}}}));assert(negative);
});
test('direct factual week propagates unexpected falsy callback throws with exact identity',()=>{
 const c=record();for(const raised of [null,false,undefined]){let didThrow=false,caught;try{verifyRecordedWeekDirect(c,{isAncestor:()=>{throw raised;}});}catch(error){didThrow=true;caught=error;}assert(didThrow);assert.equal(caught,raised);}
});
test('direct factual week rechecks actual raw HEAD after supplied callbacks',()=>{
 const symbolic=spawnSync('/usr/bin/git',['symbolic-ref','-q','HEAD'],{encoding:'utf8'});assert.equal(symbolic.status,1,'This owned HEAD mutation fixture requires the intended detached checkout');assert.equal(symbolic.stdout,'');const original=head(),c=record();let moved=false;try{assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!moved){moved=true;git('update-ref','--no-deref','HEAD',c.base);}return value;}}));assert(moved);}finally{git('update-ref','--no-deref','HEAD',original);}assert.equal(head(),original);unchanged();
});
test('direct factual week rejects callback substitution of assertion and native ESM builtins',()=>{
 const c=record(),before=readFileSync(route);
 for(const key of ['equal','deepEqual','match']){
  const original=assert[key];let raised,reached=false;
  try{verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{const actual=diff(a,b);reached=true;assert[key]=()=>{};writeFileSync(route,Buffer.concat([before,Buffer.from('\n// owned assertion-substitution negative\n')]));return actual;}});}catch(error){raised=error;}finally{assert[key]=original;writeFileSync(route,before);}
  assert(reached);assert.match(raised?.message||'',/native builtin substitution refused/);unchanged();
 }
 for(const[module,key]of[[childProcess,'execFileSync'],[childProcess,'spawnSync'],[fs,'existsSync'],[fs,'lstatSync'],[fs,'readFileSync'],[fs,'realpathSync'],[path,'resolve'],[crypto,'createHash'],[crypto.Hash.prototype,'update'],[crypto.Hash.prototype,'digest'],[Array.prototype,'filter'],[Number,'isSafeInteger'],[Set.prototype,'has'],[Object,'is']]){
  const original=module[key];let raised,reached=false;
  try{verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{const actual=diff(a,b);reached=true;module[key]=function(...args){return Reflect.apply(original,this,args);};syncBuiltinESMExports();return actual;}});}catch(error){raised=error;}finally{module[key]=original;syncBuiltinESMExports();}
  assert(reached);assert.match(raised?.message||'',/native builtin substitution refused/);unchanged();
 }
 const originalCwd=process.cwd,cwd=process.cwd();let raised,reached=false;
 try{verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{const actual=diff(a,b);reached=true;process.chdir('/tmp');process.cwd=()=>cwd;return actual;}});}catch(error){raised=error;}finally{process.cwd=originalCwd;process.chdir(cwd);}
 assert(reached);assert.match(raised?.message||'',/native builtin substitution refused/);unchanged();
 const commitBytes=execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','commit',c.base]),originalDigest=crypto.Hash.prototype.digest;let restore=null,poisonReached=false,poisonError;
 try{verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{const actual=diff(a,b);poisonReached=true;restore=ownedLooseObjectPoison(c.base,'commit',commitBytes);const forged=execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','commit',c.base]);const forgedDigest=crypto.createHash('sha1').update(Buffer.from('commit '+forged.length+'\0')).update(forged).digest('hex');crypto.Hash.prototype.digest=function(...args){const value=Reflect.apply(originalDigest,this,args);return value===forgedDigest?c.base:value;};return actual;}});}catch(error){poisonError=error;}finally{crypto.Hash.prototype.digest=originalDigest;restore?.();}
 assert(poisonReached);assert.match(poisonError?.message||'',/native builtin substitution refused/);unchanged();
 const equalDescriptor=Object.getOwnPropertyDescriptor(assert,'equal');let accessorInvoked=false,accessorError,accessorReached=false;
 try{verifyRecordedWeekDirect(c,{readDiff:(a,b)=>{const actual=diff(a,b);accessorReached=true;Object.defineProperty(assert,'equal',{configurable:true,enumerable:equalDescriptor.enumerable,get(){accessorInvoked=true;writeFileSync(route,Buffer.concat([before,Buffer.from('\n// owned builtin accessor negative\n')]));return equalDescriptor.value;}});return actual;}});}catch(error){accessorError=error;}finally{Object.defineProperty(assert,'equal',equalDescriptor);writeFileSync(route,before);}
 assert(accessorReached);assert.equal(accessorInvoked,false);assert.match(accessorError?.message||'',/native builtin substitution refused/);unchanged();
});
test('direct factual week rejects late input registration mutation after ledger validation',()=>{
 const c=record(),maintenance=c.maintenanceSource;let reached=false;
 assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!reached&&r===maintenance&&p==='tests'){reached=true;c.clinicalModelEnabled=true;c.maintenanceSource='0'.repeat(40);}return value;}}),/supplied registration changed after callbacks/);
 assert(reached);unchanged();
 const getterRecord=record(),getterMaintenance=getterRecord.maintenanceSource,before=readFileSync(route);let accessorReached=false,getterInvoked=false;
 try{assert.throws(()=>verifyRecordedWeekDirect(getterRecord,{read:(r,p)=>{const value=blob(r,p);if(!accessorReached&&r===getterMaintenance&&p==='tests'){accessorReached=true;Object.defineProperty(getterRecord,'clinicalModelEnabled',{configurable:true,enumerable:true,get(){getterInvoked=true;writeFileSync(route,Buffer.concat([before,Buffer.from('\n// owned late getter negative\n')]));return false;}});}return value;}}),/data-only registration accessor refused/);}finally{writeFileSync(route,before);}
 assert(accessorReached);assert.equal(getterInvoked,false);unchanged();
});
test('direct factual week refuses hidden assume-unchanged and skip-worktree tracked files',()=>{
 const c=record();for(const flag of ['assume-unchanged','skip-worktree']){try{git('update-index','--'+flag,'--',route);assert.throws(()=>verifyRecordedWeekDirect(c));}finally{git('update-index','--no-'+flag,'--',route);}}unchanged();
});
test('direct factual week refuses altered working bytes and executable working source',()=>{
 const c=record(),before=readFileSync(route);try{writeFileSync(route,Buffer.concat([before,Buffer.from('\n// owned negative fixture\n')]));assert.throws(()=>verifyRecordedWeekDirect(c));}finally{writeFileSync(route,before);chmodSync(route,0o644);}try{chmodSync(route,0o755);assert.throws(()=>verifyRecordedWeekDirect(c));}finally{chmodSync(route,0o644);}unchanged();
});
test('direct factual week refuses injected Git selectors and a changed repository working directory',()=>{
 const c=record(),cwd=process.cwd(),key='GIT_INDEX_FILE',before=process.env[key];try{process.env[key]='/tmp/unregistered-recorded-week-index';assert.throws(()=>verifyRecordedWeekDirect(c));}finally{if(before===undefined)delete process.env[key];else process.env[key]=before;}try{process.chdir('/tmp');assert.throws(()=>verifyRecordedWeekDirect(c));}finally{process.chdir(cwd);}unchanged();
});
function ownedLooseObjectPoison(oid,type,bytes){
 const file=resolve('.git','objects',oid.slice(0,2),oid.slice(2)),prior=existsSync(file)?readFileSync(file):null,priorMode=prior===null?null:statSync(file).mode&0o777;mkdirSync(dirname(file),{recursive:true});const restore=()=>{if(prior===null){if(existsSync(file))unlinkSync(file);}else{chmodSync(file,0o644);writeFileSync(file,prior);chmodSync(file,priorMode);}};const replacement=Buffer.concat([bytes,Buffer.from(type==='blob'?'\n// owned loose-object negative\n':type==='commit'?'\nOwned source-integrity negative fixture.\n':'')]);if(type==='tree'){assert(replacement.length>5);replacement[0]=replacement[0]===0x31?0x30:0x31;}assert.notDeepEqual(replacement,bytes,'Owned integrity negative must actually alter object bytes');try{if(prior!==null)chmodSync(file,0o644);writeFileSync(file,deflateSync(Buffer.concat([Buffer.from(type+' '+replacement.length+'\0'),replacement])));}catch(error){restore();throw error;}return restore;
}
test('direct factual week rehashes loose leaf bytes after an actual supplied callback',()=>{
 const c=record();let restore=null,reached=false;try{assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!reached&&r==='HEAD'&&p===route){reached=true;restore=ownedLooseObjectPoison(value,'blob',Buffer.from(content(r,p)));}return value;}}),/native object framing changed/);assert(reached);}finally{restore?.();}unchanged();
});
test('direct factual week rehashes raw root-tree bytes at fresh callback boundaries',()=>{
 const c=record(),tree=git('rev-parse','HEAD^{tree}').trim(),bytes=execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','tree',tree]);let restore=null,reached=false;try{assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!reached){reached=true;restore=ownedLooseObjectPoison(tree,'tree',bytes);}return value;}}),/native object framing changed/);assert(reached);}finally{restore?.();}unchanged();
});
test('direct factual week reauthenticates unrelated protected GP leaf after the last supplied callbacks',()=>{
 const c=record(),path='gp-directory/client.mjs',oid=blob(head(),path),bytes=Buffer.from(content(head(),path));let restore=null,reached=false;try{assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!reached&&r===c.maintenanceSource&&p==='tests'){reached=true;restore=ownedLooseObjectPoison(oid,'blob',bytes);}return value;}}),/native object framing changed/);assert(reached);}finally{restore?.();}unchanged();
});
test('direct factual week reauthenticates accepted historical commit after the last supplied callbacks',()=>{
 const c=record(),bytes=execFileSync('/usr/bin/git',['--no-replace-objects','cat-file','commit',c.base]);let restore=null,reached=false;try{assert.throws(()=>verifyRecordedWeekDirect(c,{read:(r,p)=>{const value=blob(r,p);if(!reached&&r===c.maintenanceSource&&p==='tests'){reached=true;restore=ownedLooseObjectPoison(c.base,'commit',bytes);}return value;}}),/native object framing changed/);assert(reached);}finally{restore?.();}unchanged();
});
test('direct factual week keeps exact current GP ON and documentary whole-source inverses',()=>{
 const c=record();for(const p of ['wrangler.jsonc','wrangler.coaching.jsonc']){const before=content(c.base,p),after=content(head(),p);assert.equal([...after.matchAll(/"MY_TIMBER_WEEK_VIEW_ENABLED"\s*:\s*"true"/g)].length,1);assert.equal([...after.matchAll(/"MEMBER_GP_DIRECTORY_V2_ENABLED"\s*:\s*"true"/g)].length,1);const line=after.split('\n').find(l=>l.includes('"MY_TIMBER_WEEK_VIEW_ENABLED"'))+'\n';assert.equal(after.replace(line,''),before);}for(const p of ['docs/my-timber-progress-journey-20261012.md','docs/my-timber-treatment-week-20261013.md']){assert.notEqual(blob(head(),p),blob(c.base,p));assert(content(head(),p).includes(content(c.base,p).split('\n')[0]));}assert.equal(blob(head(),'wrangler.hq-management.jsonc'),blob(c.base,'wrangler.hq-management.jsonc'));unchanged();
});
