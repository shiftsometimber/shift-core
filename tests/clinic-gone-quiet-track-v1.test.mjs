import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ask=fs.readFileSync('ask-timber-v1.js','utf8');
const member=fs.readFileSync('frontend/member/my-timber-preview.html','utf8');
const journey=fs.readFileSync('frontend/member/my-timber-v11.js','utf8');

test('Ask Timber carries the complete Clinic Gone Quiet ten-pack',()=>{
  for(const marker of [
    'Clinic not answering','Pen running out','Already stopped',
    'Missed dose while stranded','Subscription ended',
    'Maintenance behind a paywall','Appetite returning',
    'Food noise and shame','Symptoms while nobody answers',
    'Still wants a treatment route'
  ]) assert.match(ask,new RegExp(marker));
});

test('the track keeps medicine decisions clinical and treatment commerciality separate',()=>{
  for(const marker of ['cannot replace the prescriber','Do not invent a restart or taper','Never double up','separate choice','will not promise supply']) assert.match(ask,new RegExp(marker,'i'));
  assert.doesNotMatch(ask,/buy (?:Mounjaro|Wegovy) now/i);
});

test('member chrome and support plan expose the named track and all soft doors',()=>{
  assert.match(member,/CLINIC GONE QUIET \/ COMING OFF/);
  for(const marker of ['/articles/stopping-glp1','/member/grub','/member/fit','/mens-mental-health','Message Matt']) assert.match(journey,new RegExp(marker.replace(/[?]/g,'\\?'),'i'));
});
