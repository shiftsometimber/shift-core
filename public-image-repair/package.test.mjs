import {test} from 'node:test';
import assert from 'node:assert/strict';
import {repairPackage,verifyPackage,ENTRY} from './package.mjs';

const before = {main_module:'remaining-pages-20261101/entry.mjs', compatibility_date:'2026-08-09',bindings:[{name:'MEMBER_ASSETS',type:'assets'},{name:'DB',type:'d1'}], modules:[
  {name:'remaining-pages-20261101/entry.mjs',content_base64:Buffer.from('export default {};').toString('base64')},
  {name:'worker.js',content_base64:Buffer.from('original Core and articles').toString('base64')},
  {name:'quality-repair-20261101/restored-media.mjs',content_base64:Buffer.from('the seven recovered images').toString('base64')}
]};

test('native package preserves every serving module and links the same entry', () => {
  const result = repairPackage(before);
  assert.deepEqual(result.modules.slice(0,before.modules.length),before.modules);
  assert.equal(result.modules.length,before.modules.length + 3);
  assert.equal(result.main_module,ENTRY);
  const entry = Buffer.from(result.modules[before.modules.length].content_base64,'base64').toString();
  assert(entry.includes('export * from "../remaining-pages-20261101/entry.mjs";'));
  assert(verifyPackage(before,{...before,...result},result));
});

test('provider proof rejects changed or missing source modules, bindings, entry and replay', () => {
  const result = repairPackage(before), staged = {...before,...result};
  for (const mutate of [
    value => {value.modules[1].content_base64 = Buffer.from('article source changed').toString('base64');},
    value => {value.modules.pop();},
    value => {value.bindings.pop();},
    value => {value.main_module = 'worker.js';},
    value => {value.compatibility_date = '2026-10-01';}
  ]) {
    const changed=structuredClone(staged);mutate(changed);
    assert.throws(() => verifyPackage(before,changed,result));
  }
  assert.throws(() => repairPackage(staged),/already present/);
});
