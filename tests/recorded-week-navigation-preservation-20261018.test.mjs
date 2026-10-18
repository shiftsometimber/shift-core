import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertExactNavigationPayload,assertActualNavigationFrame,ACTUAL_NAVIGATION_PATHS,ACTUAL_NAVIGATION_MAINTENANCE} from '../release/recorded-week-navigation-outer-frame-20261018.mjs';
const policy=JSON.parse(readFileSync(new URL('../release/recorded-week-navigation-outer-policy-20261018.json',import.meta.url)));
const git=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{maxBuffer:64e6});
test('the original two-file navigation payload is literal and restores the accepted source',()=>{
 assert.deepEqual(ACTUAL_NAVIGATION_PATHS,['frontend/member/member-progress-v1.js','member-experience/staging/verify-treatment-week-navigation.mjs']);
 for(const p of ACTUAL_NAVIGATION_PATHS){const value=git('show','HEAD:'+p),restored=assertExactNavigationPayload(p,value);if(restored===null)assert.equal(git('ls-tree',policy.record.base,'--',p).length,0);else assert(restored.equals(git('show',policy.record.base+':'+p)));}
});
test('an extra path cannot acquire navigation authority',()=>assert.throws(()=>assertExactNavigationPayload('worker-entry-v6.js',Buffer.from('x'))));
test('changed payload bytes, a stale preimage and executable modes are rejected',()=>{
 const p=ACTUAL_NAVIGATION_PATHS[0],value=git('show','HEAD:'+p);
 assert.throws(()=>assertExactNavigationPayload(p,Buffer.concat([value,Buffer.from('\n')])));
 assert.throws(()=>assertExactNavigationPayload(p,git('show',policy.record.base+':'+p)));
 assert.throws(()=>assertExactNavigationPayload(p,value,'100755'));
});
test('callers cannot forge an admitted native source frame',()=>assert.throws(()=>assertActualNavigationFrame({assertCurrent(){}})));
test('all original native guard and CSV bodies restore exactly beneath their hooks',()=>{
 for(const e of policy.maintenanceEntries.filter(x=>x.kind==='maintenance')){
  let value=git('show','HEAD:'+e.path);
  for(const h of [...e.hunks].reverse()){const a=Buffer.from(h.after,'base64'),b=Buffer.from(h.before,'base64'),i=value.indexOf(a);assert(i>=0&&value.indexOf(a,i+1)<0);value=Buffer.concat([value.subarray(0,i),b,value.subarray(i+a.length)]);}
  assert(value.equals(git('show',policy.record.base+':'+e.path)),e.path);
 }
 assert.equal(ACTUAL_NAVIGATION_MAINTENANCE.length,8);
});
