import test from 'node:test';
import assert from 'node:assert/strict';
import {assetHash} from './release-assets.mjs';
test('asset content addresses match the locked Wrangler SDK fixture',()=>{
 assert.equal(assetHash(Buffer.from('hello'),'example.js'),'46d49df6b69d8c4431d2d5f02ae3e4a9');
 assert.notEqual(assetHash(Buffer.from('hello'),'example.js'),assetHash(Buffer.from('hello'),'example.css'));
});
