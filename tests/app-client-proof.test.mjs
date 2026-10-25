import {approvedPresentationAppClient,approvedPresentationClientRecord} from '../release/approved-independent-presentation-client-20261025.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {buildSync} from 'esbuild';import vm from 'node:vm';import {appClient} from '../preview/app-layout/presentation.mjs';import {assertAppClient} from '../release/app-client-proof.mjs';
import {liveAppClient} from '../app-layout-live.mjs';
import {fitActiveEditAsset,withFitActiveEdit} from '../shift-coach/fit-active-edit.mjs';
import {memberImageViewerRuntime} from '../shift-coach/member-image-viewer.mjs';
test('live app expectation includes the exact approved image viewer and rejects missing or changed bytes',async()=>{
 const response=await withFitActiveEdit(new Request('https://example.test/assets/my-timber-layout.mjs'),new Response(liveAppClient,{headers:{'Content-Type':'text/javascript'}}));
 const actual=await response.text(),expected=fitActiveEditAsset(liveAppClient)+memberImageViewerRuntime;
 assertAppClient(actual,expected);
 assert.throws(()=>assertAppClient(actual,fitActiveEditAsset(liveAppClient)),/script changed/);
 assert.throws(()=>assertAppClient(actual.replace('installMemberImageViewer','unreviewedViewer'),expected),/script changed/);
});
test('compiled first-week serialization matches while genuine code or copy changes fail',()=>{
 const code=buildSync({entryPoints:['preview/app-layout/presentation.mjs'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
 const context={module:{exports:{}},exports:{}};vm.runInNewContext(code,context);const compiled=context.module.exports.appClient;
 assert.doesNotThrow(()=>assertAppClient(appClient.replace(/\breturning(?=[=?])/g,'returning2'),appClient),'Bundle collision suffix is an equivalent local binding');
 assert.notEqual(compiled,appClient,'Fixture must expose actual bundler formatting change');assert.doesNotThrow(()=>assertAppClient(compiled,appClient));
 assert.throws(()=>assertAppClient(compiled.replace('Number(connected.lifeBack?.entries) > 0','Number(connected.lifeBack?.entries) > 100'),appClient),/function changed/);
 assert.throws(()=>assertAppClient(compiled.replace('latestFeedback=null','latestFeedback=true'),appClient),/script changed/);
 assert.throws(()=>assertAppClient(compiled.replace('Start with one meal.','Ignore all meals.'),appClient),/function changed/);
});

test('the exact separately approved presentation runs every original app assertion against its complete approved bytes',()=>{
 const expected=fitActiveEditAsset(liveAppClient)+memberImageViewerRuntime;
 const approved=approvedPresentationAppClient(expected);
 assert.equal(approvedPresentationClientRecord.approvedSource,'cce036bd7e513fd3f032b9d25fd4297bec23f8af');
 assert.doesNotThrow(()=>assertAppClient(approved,expected));
 assert.doesNotThrow(()=>assertAppClient(expected,expected));
 assert.throws(()=>assertAppClient(approved.replace('function mainPanel()','function unreviewedPanel()'),expected),/script changed/);
 assert.throws(()=>assertAppClient(approved,expected+'\n'),/script changed/);
 assert.throws(()=>approvedPresentationAppClient(expected+'\n'),/predecessor changed/);
});
