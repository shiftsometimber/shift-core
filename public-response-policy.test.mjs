import test from 'node:test';
import assert from 'node:assert/strict';
import {withPublicResponsePolicy} from './public-response-policy.mjs';

const html=()=>new Response('<!doctype html><title>Public</title>',{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});

test('public work-with-us receives the standard public response policy',()=>{
 const response=withPublicResponsePolicy(html(),new Request('https://shiftsometimber.co.uk/work-with-us'));
 for(const name of ['content-security-policy','strict-transport-security','x-frame-options'])assert.ok(response.headers.get(name),name);
});

test('private work routes remain outside the public response policy',()=>{
 for(const path of ['/work','/work/queue','/work.private']){
  const response=withPublicResponsePolicy(html(),new Request('https://shiftsometimber.co.uk'+path));
  assert.equal(response.headers.get('content-security-policy'),null,path);
 }
});

test('shift-health blood tests receives the standard public response policy',()=>{
 const response=withPublicResponsePolicy(html(),new Request('https://shiftsometimber.co.uk/shift-health/blood-tests'));
 for(const name of ['content-security-policy','strict-transport-security','x-frame-options'])assert.ok(response.headers.get(name),name);
});
