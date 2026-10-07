import test from 'node:test';
import assert from 'node:assert/strict';
import {metricsRecord,validateMetricsConnection,verifyMetricsConnection,METRICS_BASE,METRICS_PAYLOAD_PATHS,METRICS_MAINTENANCE_PATHS,METRICS_PATHS,metricsChangedPath,metricsPreflightPath} from '../release/metrics-connection-scope.mjs';
test('metrics adoption binds the exact runtime delta and preserves unrelated boundaries',()=>{
 const receipt=metricsRecord();assert.ok(receipt);assert.equal(validateMetricsConnection(receipt).base,METRICS_BASE);
 const result=verifyMetricsConnection();assert.equal(result.publicCopyChanged,false);assert.equal(result.thirdPartyCollectionChanged,false);
});
test('extra paths, changed consent and third-party collection cannot be authorised through the receipt',()=>{
 for(const mutate of [c=>c.payloadPaths.push('worker-entry-v6.js'),c=>c.maintenancePaths.push('.github/workflows/cloudflare-production-promote.yml'),c=>c.consentChanged=true,c=>c.thirdPartyCollectionChanged=true,c=>c.publicCopyChanged=true,c=>c.base='0'.repeat(40),c=>c.authority.scope='anything']){
  const c=structuredClone(metricsRecord());mutate(c);assert.throws(()=>validateMetricsConnection(c));
 }
 assert.equal(METRICS_PATHS.has('public-seo-growth-data.mjs'),false);assert.equal(METRICS_PAYLOAD_PATHS.length,3);assert.equal(METRICS_MAINTENANCE_PATHS.length,19);
});
test('source comparison rejects a modified runtime payload after the verified source commit',()=>{
 const c=metricsRecord();const read=(ref,p)=>ref==='HEAD'&&p==='acquisition-activation/model.mjs'?'tampered':ref===c.payloadSource&&p==='acquisition-activation/model.mjs'?'approved':'same';
 assert.throws(()=>verifyMetricsConnection(c,read),/Metrics payload source drift/);
});

test('historical added verifier and current modified verifier both require exact pinned bytes',()=>{
 for(const path of ['release/seo-growth-scope.mjs','release/book-voice-scope.mjs'])for(const status of ['A','M'])assert.equal(metricsChangedPath(status,path),true);
 for(const path of ['release/seo-growth-scope.mjs','release/book-voice-scope.mjs'])for(const status of ['D','R','T'])assert.throws(()=>metricsChangedPath(status,path));
 assert.equal(metricsChangedPath('M','unlisted.mjs'),false);
});

test('production preflight recognises only the independently pinned metrics files',()=>{
 assert.equal(metricsPreflightPath('acquisition-activation/ai-referrals.test.mjs'),true);
 assert.equal(metricsPreflightPath('release/app-preflight.mjs'),true);
 for(const p of ['worker-entry-v6.js','wrangler.jsonc','public-seo-growth-data.mjs','unlisted.mjs'])assert.equal(metricsPreflightPath(p),false);
 const c=metricsRecord(),read=(ref,p)=>ref==='HEAD'&&p==='release/app-preflight.mjs'?'tampered':p;
 assert.throws(()=>verifyMetricsConnection(c,read),/Metrics maintenance source drift/);
});

import {bootstrap} from '../activation-measurement/assets.mjs';
import {previousMetricsBootstrap,preserveExactMetricsBootstrap} from '../release/metrics-inline-preservation.mjs';
test('inline comparison accepts only exact prior and candidate scripts and preserves all surrounding bytes',()=>{
 const tag=s=>'<script data-shift-inline-bootstrap>'+s+'</script>';
 const old='<h1>Protected public wording</h1>'+tag(previousMetricsBootstrap)+'<footer>Existing footer</footer>';
 const current='<h1>Protected public wording</h1>'+tag(bootstrap)+'<footer>Existing footer</footer>';
 assert.equal(preserveExactMetricsBootstrap(old),current);
 assert.equal(preserveExactMetricsBootstrap(current),current);
 assert.equal(preserveExactMetricsBootstrap('<h1>Unchanged</h1>'),'<h1>Unchanged</h1>');
 for(const html of [tag(bootstrap+'alert(1);'),tag(previousMetricsBootstrap+' '),tag(bootstrap)+tag(bootstrap),tag(previousMetricsBootstrap)+tag(bootstrap),tag(bootstrap).replace('data-shift-inline-bootstrap','data-shift-inline-bootstrap other')])assert.throws(()=>preserveExactMetricsBootstrap(html));
});

import {validateBookVoice} from '../release/book-voice-scope.mjs';
import {execFileSync} from 'node:child_process';
test('Book Voice accepts exact independently verified measurement maintenance and rejects tampering',()=>{
 const read=(ref,p)=>execFileSync('git',['show',ref+':'+p],{encoding:'utf8'});
 validateBookVoice(read);
 assert.throws(()=>verifyMetricsConnection(metricsRecord(),(ref,p)=>ref==='HEAD'&&p==='member-experience/public-preservation.mjs'?'tampered':read(ref,p)),/Metrics maintenance source drift/);
});

import '../release/live-request-retry.test.mjs';

import {validateGrowthSource} from '../release/growth-scope.mjs';
test('growth verification checks exact maintenance before comparing historical approvals',()=>{
 validateGrowthSource();
 assert.throws(()=>verifyMetricsConnection(metricsRecord(),(ref,p)=>ref==='HEAD'&&p==='release/growth-public-live.cjs'?'tampered':p),/Metrics maintenance source drift/);
});
