import {websiteEditorialCompletionHistoricalView,websiteEditorialCompletionOriginalSource} from '../release/website-editorial-scope-20261018.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {RECORDED_WEEK_BROWSER_REPAIR_PATHS,assertRecordedWeekBrowserRepair} from '../release/recorded-week-browser-repair-20261017.mjs';
const runtime='b6f9c0c36d4303e5d384fb2d62b58968b998aa64',base='86be02bdd33b6002fed7c74a5cd66df9d273ef5d';
const g=(...a)=>execFileSync('/usr/bin/git',['--no-replace-objects',...a],{encoding:'utf8',maxBuffer:64e6});
const original=path=>g('show',runtime+':'+path);
const actual=path=>{
 const bytes=readFileSync(path,'utf8');
 if(path!=='wrangler.jsonc')return bytes;
 const view=websiteEditorialCompletionHistoricalView();
 return view?websiteEditorialCompletionOriginalSource(path,bytes,view):bytes;
};
test('only the exact bounded browser file is registered and the path list is immutable',()=>{
 assert.deepEqual(RECORDED_WEEK_BROWSER_REPAIR_PATHS,['member-experience/treatment-week-client.mjs']);
 assert(Object.isFrozen(RECORDED_WEEK_BROWSER_REPAIR_PATHS));assert.throws(()=>RECORDED_WEEK_BROWSER_REPAIR_PATHS.push('worker.js'));
});
test('the exact correction restores its complete delivered original, not selected snippets',()=>{
 for(const path of RECORDED_WEEK_BROWSER_REPAIR_PATHS){const proof=assertRecordedWeekBrowserRepair(path,actual(path),original(path));assert(Object.isFrozen(proof));assert.equal(proof.beforeBlob,g('rev-parse',runtime+':'+path).trim());assert.match(proof.afterBlob,/^[a-f0-9]{40}$/);}
});
test('unknown paths cannot receive a source exception',()=>{
 for(const path of ['wrangler.jsonc','worker-entry-v6.js','member-experience/treatment-week-route.mjs','__proto__','constructor'])assert.throws(()=>assertRecordedWeekBrowserRepair(path,'',''));
});
test('the uncorrected old browser source cannot masquerade as the repaired source',()=>{
 for(const path of RECORDED_WEEK_BROWSER_REPAIR_PATHS)assert.throws(()=>assertRecordedWeekBrowserRepair(path,original(path),original(path)));
});
test('changed historical originals reject before any projection',()=>{
 for(const path of RECORDED_WEEK_BROWSER_REPAIR_PATHS)assert.throws(()=>assertRecordedWeekBrowserRepair(path,actual(path),original(path)+'\n// changed original'));
});
test('changed corrected content, missing bytes and duplicated content reject',()=>{
 for(const path of RECORDED_WEEK_BROWSER_REPAIR_PATHS)for(const bad of [actual(path)+'\n',actual(path).slice(1),actual(path)+actual(path)])assert.throws(()=>assertRecordedWeekBrowserRepair(path,bad,original(path)));
});
test('non-string data cannot supply a browser repair proof',()=>{
 for(const path of RECORDED_WEEK_BROWSER_REPAIR_PATHS)for(const bad of [null,{},Buffer.from(actual(path))])assert.throws(()=>assertRecordedWeekBrowserRepair(path,bad,original(path)));
});
test('all original live assertions, source tests, workflow commands and configuration are unchanged',()=>{
 for(const path of ['release/recorded-week-live-20261014.mjs','tests/recorded-week-live-20261014.test.mjs','tests/recorded-week-direct-source-20261016.test.mjs','tests/recorded-week-direct-owned-release-20261016.test.mjs','.github/workflows/factual-recorded-week-direct-release-20261016.yml','.github/workflows/rendered-member-production-acceptance.yml','wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc'])assert.equal(actual(path),g('show',base+':'+path),path);
});
