import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyGpDirectoryActivation,gpDirectoryActivationHistoricalView,gpActivationAuthenticatedRead,gpActivationAuthenticatedContent,gpActivationAuthenticatedDiff,gpActivationAuthenticatedAncestor,gpActivationReaderProvenance} from '../release/gp-directory-activation-direct-20261016.mjs';
import {verifyGpMemberCodeDirect} from '../release/gp-member-code-direct-scope-20261016.mjs';
import {GP_ACTIVATION_PATHS,disableGpDirectoryConfiguration,GP_ACTIVATION_AUTHORITY,GP_ACTIVATION_ORIGINAL_BLOBS} from '../release/gp-directory-activation-contract-20261015.mjs';
import {originalDirectGpActivationBridge} from '../release/gp-directory-activation-direct-source-20261016.mjs';

const git=(...args)=>execFileSync('/usr/bin/git',['--no-replace-objects','--no-optional-locks',...args],{encoding:'utf8',maxBuffer:64e6});
const head=git('rev-parse','HEAD').trim();
const content=(ref,path)=>git('show',ref+':'+path);
const blob=(ref,path)=>git('rev-parse',ref+':'+path).trim();
const diff=(a,b)=>git('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',a,b).trim().split('\n').filter(Boolean);
const ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b);
const ledger=JSON.parse(content(head,'release/approved-runtime-composition.json'));
const c=ledger.gpDirectoryActivation20261015;
const gp=ledger.gpMemberCode20261014;

test('actual ON head retains the exact complete direct GP OFF proof with no W prerequisite',()=>{
 assert.equal(verifyGpDirectoryActivation(c),c);
 assert.equal(verifyGpMemberCodeDirect(gp),gp);
 const v=gpDirectoryActivationHistoricalView();
 assert.equal(v.rawHead,head);assert.equal(v.head,c.base);
 assert.deepEqual(v.record,JSON.parse(content(c.base,'release/approved-runtime-composition.json')));
 assert.equal(v.record.gpMemberCode20261014.fullGp11Complete,true);
 assert.equal(v.record.gpMemberCode20261014.foundationClosureComplete,true);
 assert.equal(v.record.gpMemberCode20261014.factualWeekRequired,false);
});
test('exact three approved flags inverse every unrelated configuration byte',()=>{
 assert.equal(content(head,'wrangler.jsonc'),content(head,'wrangler.coaching.jsonc'));
 for(const path of GP_ACTIVATION_PATHS)assert.equal(disableGpDirectoryConfiguration(path,content(head,path)),content(c.base,path));
 for(const[path,pins]of Object.entries(GP_ACTIVATION_ORIGINAL_BLOBS)){
  assert.equal(blob(GP_ACTIVATION_AUTHORITY.originalSource,path),pins.after);
  assert.equal(blob(GP_ACTIVATION_AUTHORITY.originalSource+'^',path),pins.before);
 }
});
test('every complete direct guard assertion is retained as the immutable OFF witness',()=>{
 const p='release/gp-member-code-direct-scope-20261016.mjs';
 assert.equal(originalDirectGpActivationBridge(content(head,p)),content(c.base,p));
 assert.equal(content(head,'release/gp-member-code-direct-before-activation-20261016.mjs'),content(c.base,p));
});
test('accepted source, provider, data, email, rollback and reimport authority cannot broaden',()=>{
 for(const changed of [{...c,base:'f'.repeat(40)},{...c,emailAuthority:true},{...c,genericAdoptionAllowed:true},{...c,productionDataWrites:1},{...c,reimport:true},{...c,rollbackAuthorityBroadened:true},{...c,predecessor:{...c.predecessor,source:'e'.repeat(40)}}])assert.throws(()=>verifyGpDirectoryActivation(changed));
});
for(const path of ['release','wrangler.jsonc','wrangler.hq-management.jsonc'])test('invented equal actual aliases cannot hide at '+path,()=>{
 const v=gpDirectoryActivationHistoricalView();
 assert.throws(()=>gpActivationAuthenticatedRead((r,p)=>(r==='HEAD'||r===head)&&p===path?'invented identical raw source':blob(r,p),v)('HEAD',path),/Unauthentic supplied source/);
});
test('native callbacks remain authenticated after mutable poison',()=>{
 const v=gpDirectoryActivationHistoricalView();let poisoned=false;
 const read=gpActivationAuthenticatedRead((ref,path)=>poisoned&&ref===c.base?'invented G':blob(ref,path),v);
 read('HEAD','wrangler.jsonc');poisoned=true;
 assert.throws(()=>read('HEAD','wrangler.jsonc'),/Unauthentic supplied source/);
 assert.throws(()=>gpActivationAuthenticatedContent((r,p)=>r===c.base?'forged G':content(r,p),v)('HEAD','wrangler.jsonc'),/Unauthentic supplied content/);
 assert.throws(()=>gpActivationAuthenticatedDiff((a,b)=>b===c.base?[]:diff(a,b),v)(gp.base,'HEAD'),/Supplied diff/);
 assert.throws(()=>gpActivationAuthenticatedAncestor((a,b)=>b===c.base?false:ancestor(a,b),v)(gp.base,'HEAD'),/Supplied ancestry/);
 assert.equal(gpActivationReaderProvenance(v.read).view,v);
 assert.equal(gpActivationReaderProvenance(()=>{}),null);
 assert.throws(()=>gpActivationAuthenticatedRead(blob,{...v})('HEAD','wrangler.jsonc'),/Independently admitted/);
});
test('defaultReader cannot waive an actual supplied callback',()=>{
 const v=gpDirectoryActivationHistoricalView((r,p)=>r==='HEAD'?'forged despite defaultReader':blob(r,p),{defaultReader:true});
 assert.throws(()=>v.read('HEAD','release'),/Unauthentic supplied source/);
});
test('literal fourth-head and native fixed-HEAD authenticity retain actual references',()=>{
 const v=gpDirectoryActivationHistoricalView();
 for(const ref of [c.base,gp.base])for(const path of ['wrangler.jsonc','release']){
  assert.equal(v.authentic(blob(ref,path),'HEAD',path,ref),true);
  assert.equal(v.authentic(content(ref,path),'HEAD',path,ref),true);
  assert.equal(v.authentic('forged equal prior source','HEAD',path,ref),false);
  assert.equal(v.nativeAuthentic(blob(ref,path),ref,path),true);
 }
 assert.equal(v.authentic(blob(c.base,'wrangler.jsonc'),'HEAD','wrangler.jsonc'),false);
 assert.equal(v.nativeAuthentic(blob(c.base,'wrangler.jsonc'),'HEAD','wrangler.jsonc'),false);
 assert.equal(v.authentic(blob(head,'wrangler.jsonc'),'HEAD','wrangler.jsonc',c.base),false);
});
test('direct public wrapper requires actual raw ON head, rejecting projected/null',()=>{
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{head:c.base}),/actual raw activated HEAD/);
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{head:null}),/actual raw activated HEAD/);
});
for(const name of ['read','readContent','readDiff','isAncestor'])test('direct public wrapper preserves explicit-null callback rejection: '+name,()=>{
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{[name]:null}),/must remain a function/);
});
test('full direct proof still rejects independently forged reader/content/diff/ancestry',()=>{
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{read:()=> 'forged same source'}),/Unauthentic supplied source/);
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{readContent:()=> 'forged same content'}),/Unauthentic supplied content/);
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{readDiff:()=> []}),/Supplied diff/);
 assert.throws(()=>verifyGpMemberCodeDirect(gp,{isAncestor:()=> false}),/Supplied ancestry/);
});
