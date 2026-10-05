import {memberImageViewerRuntime} from './member-image-viewer.mjs';
import{test}from'node:test';import assert from'node:assert/strict';
import{liveAppClient}from'../app-layout-live.mjs';
import{fitActiveEditAsset,originalFitActiveEditAsset,withFitActiveEdit}from'./fit-active-edit.mjs';
test('exact original approved client survives round trip and unrelated composer drift is refused',()=>{
 const after=fitActiveEditAsset(liveAppClient);assert.equal(originalFitActiveEditAsset(after),liveAppClient);
 assert.throws(()=>fitActiveEditAsset(liveAppClient.replace('const wrap=(node,title)','const wrap=(element,title)')));
 assert.throws(()=>fitActiveEditAsset(after));
});
test('only the existing successful GET member-layout asset changes; other routes and failures pass through',async()=>{
 const response=()=>new Response(liveAppClient,{headers:{'Content-Type':'text/javascript','Content-Length':String(liveAppClient.length),ETag:'old','X-Test':'preserved'}});
 const r=await withFitActiveEdit(new Request('https://shiftsometimber.co.uk/assets/my-timber-layout.mjs'),response());assert.equal(await r.text(),fitActiveEditAsset(liveAppClient)+memberImageViewerRuntime);assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);assert.equal(r.headers.get('X-Test'),'preserved');
 for(const [path,status,method]of[['/',200,'GET'],['/member/fit',200,'GET'],['/assets/my-timber-layout.mjs',500,'GET'],['/assets/my-timber-layout.mjs',200,'HEAD']]){const before=new Response('original',{status});assert.equal(await withFitActiveEdit(new Request('https://shiftsometimber.co.uk'+path,{method}),before),before);}
});
