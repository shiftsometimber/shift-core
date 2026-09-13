import test from 'node:test';
import assert from 'node:assert/strict';
import {addNewsroomReading,withNewsroomReading,NEWSROOM_READING} from '../radar-newsroom-discovery-v1.js';
const html='<html><head><title>Existing title</title></head><body><header>Approved header</header><main><h1>Existing heading</h1><p>Existing content</p></main><footer>Existing footer</footer></body></html>';
test('reading sections preserve the original page and are emitted only on the two selected routes',()=>{
  for(const path of Object.keys(NEWSROOM_READING)){
    const result=addNewsroomReading(html,path);
    assert.equal(result.replace(/<style data-newsroom-reading-style>[\s\S]*?<\/style>/,'').replace(/<section class="sst-news-reading"[\s\S]*?<\/section>/,''),html);
    assert.equal(addNewsroomReading(result,path),result);
    assert.equal((result.match(/<h1>/g)||[]).length,1);
    assert.equal((result.match(/class="sst-news-story"/g)||[]).length,3);
    assert.equal(addNewsroomReading(html,path+'.html'),result);
  }
  for(const path of ['/','/start-here','/programme','/shift-health/health-mot','/shift-newsroom','/member/dashboard']) assert.equal(addNewsroomReading(html,path),html);
});
test('response wrapper respects host, method, status and representation boundaries',async()=>{
  const response=()=>new Response(html,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'100'}});
  for(const [url,method] of [['https://hq.shiftsometimber.co.uk/shift-health','GET'],['https://shiftsometimber.co.uk/start-here','GET'],['https://shiftsometimber.co.uk/shift-health','HEAD']]){
    const original=response();assert.equal(await withNewsroomReading(original,new Request(url,{method})),original);
  }
  for(const original of [new Response('missing',{status:404}),new Response('{}',{headers:{'Content-Type':'application/json'}})]) assert.equal(await withNewsroomReading(original,new Request('https://shiftsometimber.co.uk/shift-health')),original);
  const result=await withNewsroomReading(response(),new Request('https://shiftsometimber.co.uk/shift-health'));
  assert.equal(result.headers.get('etag'),null);assert.equal(result.headers.get('content-length'),null);
  assert.match(await result.text(),/data-newsroom-reading/);
});
