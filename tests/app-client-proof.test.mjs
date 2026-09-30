import test from 'node:test';import assert from 'node:assert/strict';import {buildSync} from 'esbuild';import vm from 'node:vm';import {appClient} from '../preview/app-layout/presentation.mjs';import {assertAppClient} from '../release/app-client-proof.mjs';
test('compiled first-week serialization matches while genuine code or copy changes fail',()=>{
 const code=buildSync({entryPoints:['preview/app-layout/presentation.mjs'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const context={module:{exports:{}},exports:{}};vm.runInNewContext(code,context);const compiled=context.module.exports.appClient;
 assert.notEqual(compiled,appClient,'Fixture must expose actual bundler formatting change');assert.doesNotThrow(()=>assertAppClient(compiled,appClient));
 assert.throws(()=>assertAppClient(compiled.replace('Number(connected.lifeBack?.entries) > 0','Number(connected.lifeBack?.entries) > 100'),appClient),/function changed/);
 assert.throws(()=>assertAppClient(compiled.replace('latestFeedback=null','latestFeedback=true'),appClient),/script changed/);
 assert.throws(()=>assertAppClient(compiled.replace('Start with one meal.','Ignore all meals.'),appClient),/function changed/);
});
