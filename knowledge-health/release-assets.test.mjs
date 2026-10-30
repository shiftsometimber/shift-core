import test from 'node:test';
import assert from 'node:assert/strict';
import {assetHash,captureLiveAssetChecks} from './release-assets.mjs';
test('asset content addresses match the locked Wrangler SDK fixture',()=>{
 assert.equal(assetHash(Buffer.from('hello'),'example.js'),'46d49df6b69d8c4431d2d5f02ae3e4a9');
 assert.notEqual(assetHash(Buffer.from('hello'),'example.js'),assetHash(Buffer.from('hello'),'example.css'));
});
test('asset fingerprints use delivered bytes and exclude redirected or HTML login responses',async()=>{
 const checks=await captureLiveAssetChecks(['/style.css','/missing.js','/private.js'],async url=>{
  if(url.endsWith('/style.css'))return new Response('hello',{headers:{'content-type':'text/css'}});
  if(url.endsWith('/missing.js'))return new Response(null,{status:302,headers:{location:'/login'}});
  return new Response('<h1>Sign in</h1>',{headers:{'content-type':'text/html'}});
 });
 assert.equal(checks.length,1);assert.equal(checks[0].path,'/style.css');
 assert.equal(checks[0].sha256,'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});
