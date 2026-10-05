import {build} from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {memberImageViewerRuntime} from '../shift-coach/member-image-viewer.mjs';
import {liveAppClient} from '../app-layout-live.mjs';
import {fitActiveEditAsset,withFitActiveEdit} from '../shift-coach/fit-active-edit.mjs';

test('shared viewer ships in the exact existing layout asset without altering its composer or controls',async()=>{
 const result=await withFitActiveEdit(new Request('https://shiftsometimber.co.uk/assets/my-timber-layout.mjs'),new Response(liveAppClient,{headers:{'Content-Type':'text/javascript'}}));
 const actual=await result.text();
 assert.equal(actual,fitActiveEditAsset(liveAppClient)+memberImageViewerRuntime);
 new Script(memberImageViewerRuntime);
 assert(!/fetch\(|localStorage|sessionStorage|\/v1\//.test(memberImageViewerRuntime),'Image viewing must not write member data or call APIs');
});

test('viewer asset preserves failure, homepage and non-GET response boundaries',async()=>{
 for(const [path,status,method]of[['/',200,'GET'],['/member/grub',200,'GET'],['/assets/my-timber-layout.mjs',503,'GET'],['/assets/my-timber-layout.mjs',200,'HEAD']]){
  const response=new Response('unchanged',{status});
  assert.equal(await withFitActiveEdit(new Request('https://shiftsometimber.co.uk'+path,{method}),response),response);
 }
});

// Regression: function.toString inside a keepNames bundle introduced an unbound
// __name helper into the browser script even though the unbundled DOM tests passed.
test('production keepNames bundling preserves the browser viewer exactly without server helpers',async()=>{
 const bundle=await build({entryPoints:['shift-coach/member-image-viewer.mjs'],bundle:true,format:'esm',keepNames:true,write:false});
 const compiled=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 assert.equal(compiled.memberImageViewerRuntime,memberImageViewerRuntime);
 assert.doesNotMatch(compiled.memberImageViewerRuntime,/\b__name\b/);
 new Script(compiled.memberImageViewerRuntime);
});
