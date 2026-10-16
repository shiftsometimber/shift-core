import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {RELEASE_MACHINERY_REPAIR_RECORD,RELEASE_MACHINERY_REPAIR_MAINTENANCE,RELEASE_MACHINERY_REPAIR_MANIFEST,RELEASE_MACHINERY_REPAIR_KEY,verifyReleaseMachineryRepairFacts,verifyReleaseMachineryRepair,releaseMachineryRepairHistoricalView,releaseMachineryRepairAuthenticatedRead,releaseMachineryRepairLegacyRead,releaseMachineryRepairLegacyContent} from '../release/release-machinery-repair-scope-20261014.mjs';
const base='a'.repeat(40),source='b'.repeat(40),maintenance='c'.repeat(40),head='d'.repeat(40),manifest=RELEASE_MACHINERY_REPAIR_MANIFEST,key=RELEASE_MACHINERY_REPAIR_KEY,payload='release/pipeline-control.mjs',combined='release/combined-finite-scope-20261014.mjs',composition='release/approved-runtime-composition.mjs';
const hash=value=>createHash('sha1').update(value).digest('hex');
function fixture(){
 const paths=[payload],maintenancePaths=[...RELEASE_MACHINERY_REPAIR_MAINTENANCE],expected={...structuredClone(RELEASE_MACHINERY_REPAIR_RECORD),base,source,paths,maintenancePaths},c={...expected,maintenanceSource:maintenance};
 const oldRecord={accepted:{proof:'Earlier exact approved proof',source:'e'.repeat(40),failures:[12,13],held:true},another:{clinicalModelEnabled:false}};
 const initial=new Map([[manifest,JSON.stringify(oldRecord)],[payload,'old pipeline'],[combined,'original combined guard'],[composition,'original runtime guard'],['wrangler.jsonc','unchanged flags'],['public','unchanged homepage tree'],['privacy-health-erasure-route-v1.js','unchanged privacy']]);
 const payloadTree=new Map(initial);payloadTree.set(payload,'repaired pipeline');
 const maintenanceTree=new Map(payloadTree);maintenanceTree.set(maintenancePaths[0],'new finite source guard');maintenanceTree.set(maintenancePaths[1],'new finite source tests');maintenanceTree.set(combined,'import repair;\noriginal combined guard');maintenanceTree.set(composition,'original runtime guard\nregister repair paths;');
 const finalTree=new Map(maintenanceTree);finalTree.set(manifest,JSON.stringify({...oldRecord,[key]:c}));
 const trees=new Map([[base,initial],[source,payloadTree],[maintenance,maintenanceTree],[head,finalTree]]),resolve=r=>r==='HEAD'?head:r;
 const content=(r,p)=>{const value=trees.get(resolve(r))?.get(p);assert.notEqual(value,undefined,'Missing fixture source '+r+':'+p);return value;},blob=(r,p)=>hash(content(r,p));
 const diff=(a,b)=>[...new Set([...trees.get(resolve(a)).keys(),...trees.get(resolve(b)).keys()])].filter(p=>trees.get(resolve(a)).get(p)!==trees.get(resolve(b)).get(p));
 const ancestor=(a,b)=>{const order=[base,source,maintenance,head];assert(order.indexOf(a)>=0&&order.indexOf(b)>=order.indexOf(a),'Not actual ancestry');};
 const policy={record:expected,inverses:{[combined]:[['','import repair;\n']],[composition]:[['','\nregister repair paths;']]},protectedPaths:['wrangler.jsonc','public','privacy-health-erasure-route-v1.js']};
 const facts={head,actualHead:head,read:blob,readContent:content,readDiff:diff,isAncestor:ancestor,blob,content,diff,ancestor,headNow:()=>head,cleanSource:()=>{}};
 const affected=p=>[...paths,...maintenancePaths,manifest].some(x=>x===p||x.startsWith(p+'/'));
 const view={rawHead:head,head:base,affected,currentContent:content,authentic:(value,r,p)=>value===blob(head,p)||value===content(head,p)};
 return{c,policy,facts,trees,content,blob,diff,view};
}
test('one exact repair admits the actual raw source, exact finite hooks and unchanged previous ledger',()=>{const f=fixture();assert.equal(verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts),f.c);});
for(const field of ['runtimeChanged','homepageChanged','privacyChanged','consentChanged','clinicalSafetyChanged','stockChanged','emailAuthority','spendingGranted','publicationAuthorityBroadened','rollbackAuthorityBroadened','genericAdoptionAllowed','originalAssertionsRemoved','timeAllowancesIncreased','unknownVersionsAccepted','alteredReceiptsAccepted','suppliedReadersCached'])test('repair cannot broaden '+field,()=>{const f=fixture();assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,{...f.c,[field]:true},f.facts),/exact bounded/);});
test('source pins, payload and maintenance path order and unexpected registration fields reject',()=>{
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{paths:[payload,'worker-entry-v6.js']},{maintenancePaths:[...RELEASE_MACHINERY_REPAIR_MAINTENANCE].reverse()},{unexpectedApproval:true}]){const f=fixture();assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,{...f.c,...patch},f.facts));}
});
test('unknown raw HEAD, broken ancestry and additional final paths reject',()=>{
 for(const mutate of [f=>f.facts.head='f'.repeat(40),f=>f.facts.ancestor=()=>false,f=>f.trees.get(head).set('unapproved-runtime.js','outside repair')]){const f=fixture();mutate(f);assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts));}
});
test('an unchanged-looking supplied reader cannot conceal altered actual payload or runtime',()=>{
 for(const p of [payload,'wrangler.jsonc','public','privacy-health-erasure-route-v1.js']){const f=fixture();const old=f.blob(head,p);f.trees.get(head).set(p,'unapproved actual bytes');f.facts.read=(r,path)=>path===p?old:f.blob(r,path);assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts));}
});
test('all prior ledger entries and newly recorded authority remain exact',()=>{
 for(const mutate of [r=>r.accepted.failures.pop(),r=>r.accepted.held=false,r=>r.another.clinicalModelEnabled=true,r=>r[key].proof='altered proof']){const f=fixture(),record=JSON.parse(f.content(head,manifest));mutate(record);f.trees.get(head).set(manifest,JSON.stringify(record));assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts));}
});
test('the two maintenance inverses cannot remove assertions or hide extra edits',()=>{
 const f=fixture();f.trees.get(maintenance).set(combined,'import repair;\noriginal combined guard\nremoved old assertion');f.trees.get(head).set(combined,f.content(maintenance,combined));assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts),/Every byte/);
});
test('supplied HEAD-only and both-alias source drift reject, with no callback caching',()=>{
 const f=fixture();let poisoned=false,calls=0;f.facts.read=(r,p)=>{calls++;return poisoned&&p===payload&&(r==='HEAD'||r===head)?'fabricated':f.blob(r,p);};
 verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts);const before=calls;poisoned=true;assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts),/Fresh supplied/);assert(calls>before);
 const g=fixture();g.facts.read=(r,p)=>r==='HEAD'&&p===payload?'HEAD-only drift':g.blob(r,p);assert.throws(()=>verifyReleaseMachineryRepairFacts(g.policy,g.c,g.facts),/Fresh supplied/);
});
test('a supplied diff or source-head change cannot be hidden by authentic immutable facts',()=>{
 const f=fixture();f.facts.readDiff=(a,b)=>a===maintenance?[manifest,'foreign']:f.diff(a,b);assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts),/Supplied repair diff/);
 const g=fixture();g.facts.headNow=()=>'f'.repeat(40);assert.throws(()=>verifyReleaseMachineryRepairFacts(g.policy,g.c,g.facts),/HEAD changed/);
});
test('source cleanliness is checked at entry and after a supplied reader mutation',()=>{
 const f=fixture();f.facts.cleanSource=()=>assert.fail('dirty at entry');assert.throws(()=>verifyReleaseMachineryRepairFacts(f.policy,f.c,f.facts),/dirty at entry/);
 const g=fixture();let dirty=false,checks=[];g.facts.cleanSource=stage=>{checks.push(stage);assert.equal(dirty,false,'source changed during verification');};g.facts.read=(r,p)=>{dirty=true;return g.blob(r,p);};
 assert.throws(()=>verifyReleaseMachineryRepairFacts(g.policy,g.c,g.facts),/source changed during verification/);assert.deepEqual(checks,['entry','exit']);
});
test('strict projection authenticates both spellings on every call and changes only admitted paths',()=>{
 const f=fixture(),read=releaseMachineryRepairAuthenticatedRead(f.blob,f.view);assert.equal(read('HEAD',payload),f.blob(base,payload));assert.equal(read(head,payload),f.blob(base,payload));assert.equal(read('HEAD','wrangler.jsonc'),f.blob(head,'wrangler.jsonc'));assert.equal(read(source,payload),f.blob(source,payload));
 let poisoned=false,calls=0;const supplied=(r,p)=>{calls++;return poisoned&&(r==='HEAD'||r===head)&&p===payload?'forged both aliases':f.blob(r,p);},fresh=releaseMachineryRepairAuthenticatedRead(supplied,f.view);fresh('HEAD',payload);const before=calls;poisoned=true;assert.throws(()=>fresh('HEAD',payload),/Unauthentic supplied HEAD/);assert(calls>before);
});
test('strict directory projection rejects two identical fabricated directory listings',()=>{
 const f=fixture(),view={...f.view,authentic:(value,r,p)=>value==='authentic '+r+':'+p},bad=(r,p)=>(r==='HEAD'||r===head)&&p==='release'?'tree forged\nidentical forged entry':r+':'+p;
 assert.throws(()=>releaseMachineryRepairAuthenticatedRead(bad,view)('HEAD','release'),/Unauthentic/);
});
test('legacy compatibility preserves abstract readers and exposes original owner overrides',()=>{
 const f=fixture(),same=(r,p)=>(r==='HEAD'||r===head)?'same':r===base?'older':r+':'+p;
 assert.equal(releaseMachineryRepairLegacyRead(same,f.view)('HEAD',payload),'older');
 assert.equal(releaseMachineryRepairLegacyRead((r,p)=>r,f.view)('HEAD',payload),'HEAD');
 const changed=(r,p)=>r==='HEAD'&&p===payload?'owning comparator override':f.blob(r,p);assert.equal(releaseMachineryRepairLegacyRead(changed,f.view)('HEAD',payload),'owning comparator override');
});
test('supplied current ledger overrides survive removal of only the new repair key',()=>{
 const f=fixture(),altered=JSON.parse(f.content(head,manifest));altered.accepted.held=false;const read=(r,p)=>r==='HEAD'&&p===manifest?JSON.stringify(altered):f.content(r,p);
 const projected=JSON.parse(releaseMachineryRepairLegacyContent(read,f.view)('HEAD',manifest));assert(!projected[key]);assert.equal(projected.accepted.held,false);assert.deepEqual(projected.accepted.failures,[12,13]);
 const mutated=(r,p)=>r==='HEAD'&&p===payload?'unapproved supplied content':f.content(r,p);assert.equal(releaseMachineryRepairLegacyContent(mutated,f.view)('HEAD',payload),'unapproved supplied content');
 assert.equal(releaseMachineryRepairLegacyContent(f.content,f.view)('HEAD',payload),f.content(base,payload));
});
test('projected old-verifier head preserves HEAD-only and raw-alias prior-ledger overrides',()=>{
 for(const override of ['HEAD',head]){
  const f=fixture(),altered=JSON.parse(f.content(head,manifest));altered.accepted.held=false;
  const supplied=(r,p)=>r===override&&p===manifest?JSON.stringify(altered):f.content(r,p),projected=JSON.parse(releaseMachineryRepairLegacyContent(supplied,f.view)(base,manifest));
  assert.equal(projected.accepted.held,false);assert(!projected[key]);
 }
});
test('actual default historical view admits a registered repair or leaves the accepted source unchanged',()=>{
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}),actualHead=git('rev-parse','HEAD').trim(),record=JSON.parse(git('show',actualHead+':'+manifest)),view=releaseMachineryRepairHistoricalView();assert.equal(view.rawHead,actualHead);
 if(record[key]){
  assert.equal(view.head,record[key].base);assert(!view.record[key]);verifyReleaseMachineryRepair(record[key],{head:actualHead});
  const real=(r,p)=>git('rev-parse',r+':'+p).trim(),supplied=releaseMachineryRepairHistoricalView(real,{defaultReader:false});assert.equal(supplied.read('HEAD','release'),real(record[key].base,'release'));
  for(const both of [false,true]){const forged=(r,p)=>p==='release'&&(r==='HEAD'||both&&r===actualHead)?'tree forged\nidentical fabricated directory listing':real(r,p),strict=releaseMachineryRepairHistoricalView(forged,{defaultReader:false});assert.throws(()=>strict.read('HEAD','release'),/Unauthentic supplied/);}
 }else{assert.equal(view.head,actualHead);assert.deepEqual(view.record,record);}
});

test('actual custom readers retain fresh literal HEAD calls after successful default admission',()=>{
 const raw=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 const current=JSON.parse(execFileSync('git',['show','HEAD:'+manifest],{encoding:'utf8'}))[key];if(!current)return;
 let visits=0,changed=false;const supplied=(ref,path)=>{if(ref==='HEAD'){visits++;if(changed&&path===current.paths[0])return'changed';}return raw(ref,path);};
 verifyReleaseMachineryRepair(current,{read:supplied});assert(visits>0,'Supplied reader must receive literal HEAD, rather than a cached result');
 changed=true;assert.throws(()=>verifyReleaseMachineryRepair(current,{read:supplied}),/source drift/);
});

test('unaffected supplied HEAD and raw-alias overrides remain visible to the original owning comparator',()=>{
 const f=fixture();for(const path of ['wrangler.jsonc','public'])for(const ref of ['HEAD',head]){
  const seen=[];const supplied=(r,p)=>{seen.push([r,p]);return r===ref&&p===path?'bad supplied content':f.content(r,p);};
  const wrapped=releaseMachineryRepairAuthenticatedRead(supplied,f.view,{defaultReader:false});
  assert.equal(wrapped(ref,path),'bad supplied content');assert.deepEqual(seen,[[ref,path]]);
 }
});

async function currentCombinedAdmission(){
 const {verifyCombinedFinite}=await import('../release/combined-finite-scope-20261014.mjs');
 const native=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64e6}).trim();
 const rawHead=native('rev-parse','HEAD'),c=JSON.parse(native('show',rawHead+':'+manifest)).combinedFinite20261014;
 const content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6});
 const blob=(ref,path)=>native('rev-parse',ref+':'+path);
 return {verifyCombinedFinite,c,rawHead,options:{head:rawHead,read:blob,blob,content,diff:(a,b)=>native('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>native('merge-base','--is-ancestor',a,b)}};
}
test('actual direct combined admission rejects paired HEAD/raw-head fabricated workflow and other current read values',async()=>{
 const f=await currentCombinedAdmission();
 for(const path of ['.github/workflows/cloudflare-production-promote.yml',composition,combined]){
  const forged=(ref,p)=>p===path&&(ref==='HEAD'||ref===f.rawHead)?'identical fabricated current source':f.options.read(ref,p);
  assert.throws(()=>f.verifyCombinedFinite(f.c,{...f.options,read:forged}),/Unauthentic supplied HEAD|source drift/);
 }
});
test('actual direct combined admission rejects paired HEAD/raw-head fabricated blob values independently of read',async()=>{
 const f=await currentCombinedAdmission();
 for(const path of ['.github/workflows/cloudflare-production-promote.yml',composition,combined]){
  const forged=(ref,p)=>p===path&&(ref==='HEAD'||ref===f.rawHead)?'identical fabricated current blob':f.options.blob(ref,p);
  assert.throws(()=>f.verifyCombinedFinite(f.c,{...f.options,blob:forged}),/Unauthentic supplied HEAD|source drift/);
 }
});
test('actual direct combined admission accepts genuine native blob and content readers',async()=>{
 const f=await currentCombinedAdmission();assert.equal(f.verifyCombinedFinite(f.c,f.options),f.c);
 assert.equal(f.verifyCombinedFinite(f.c,{...f.options,read:f.options.content}),f.c);
});
test('current reader poisoning after a successful admission rejects while abstract comparison remains unchanged',async()=>{
 const f=await currentCombinedAdmission();let poisoned=false;
 const read=(ref,path)=>poisoned&&(ref==='HEAD'||ref===f.rawHead)&&path===composition?'identical newly forged source':f.options.read(ref,path);
 assert.equal(f.verifyCombinedFinite(f.c,{...f.options,read}),f.c);poisoned=true;
 assert.throws(()=>f.verifyCombinedFinite(f.c,{...f.options,read}),/Unauthentic supplied HEAD|source drift/);
 const abstract=fixture(),same=(ref,path)=>ref==='HEAD'||ref===head?'same abstract value':ref===base?'original abstract value':ref+':'+path;
 assert.equal(releaseMachineryRepairLegacyRead(same,abstract.view)('HEAD',payload),'original abstract value');
 assert.throws(()=>releaseMachineryRepairAuthenticatedRead(same,abstract.view)('HEAD',payload),/Unauthentic supplied HEAD/);
});
