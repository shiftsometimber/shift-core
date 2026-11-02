import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {repairWelcomeFooter,beforeSha256,digest,repairCss} from './welcome-footer-repair-20261102.mjs';
const before=readFileSync(new URL('./evidence/welcome-footer-css-before-20261102.css',import.meta.url),'utf8');
test('exact live input is retained byte for byte before the reviewed addition',()=>{
 assert.equal(digest(before),beforeSha256);
 const after=repairWelcomeFooter(before);
 assert.equal(after,before+'\n'+repairCss);
 assert.equal(after.slice(0,before.length),before);
});
test('changed live sources fail closed rather than overwrite another owner',()=>{
 for(const changed of [before+'\n',before.replace('#mtWelcome','#another-cover'),before.slice(1)]){
  assert.throws(()=>repairWelcomeFooter(changed),/Serving welcome CSS changed/);
 }
});
test('an already applied exact repair remains idempotent',()=>{
 const once=repairWelcomeFooter(before);
 assert.equal(repairWelcomeFooter(once),once);
 assert.throws(()=>repairWelcomeFooter(once+'\n'),/Serving welcome CSS changed/);
});
test('only the signed-out public cover footer has a new display declaration',()=>{
 assert.equal((repairCss.match(/display:/g)||[]).length,1);
 assert.match(repairCss,/data-member-session="signed-out"/);
 assert.match(repairCss,/:not\(\[data-app-panel="1"\]\)/);
 assert.match(repairCss,/:not\(\[data-mt-contained-screen\]\)/);
 assert.match(repairCss,/:has\(> #mtWelcome\) > footer#sst-footer-c/);
 assert.doesNotMatch(repairCss,/position:|padding:|visibility:|opacity:|content:/);
});

