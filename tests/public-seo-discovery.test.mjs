import test from 'node:test';import assert from 'node:assert/strict';
import {INDEXNOW_KEY,INDEXNOW_PATH,discoveryRoute,repairDiscoveryTxt,withDiscoverySeo} from '../public-seo-discovery.mjs';
const origin='https://shiftsometimber.co.uk';
test('IndexNow key endpoint has exact UTF-8 key, GET/HEAD parity and fixed origin/path/method',async()=>{
 assert.match(INDEXNOW_KEY,/^[a-zA-Z0-9-]{8,128}$/);
 const get=discoveryRoute(new Request(origin+INDEXNOW_PATH)),head=discoveryRoute(new Request(origin+INDEXNOW_PATH,{method:'HEAD'}));
 assert.equal(await get.text(),INDEXNOW_KEY);assert.equal(await head.text(),'');assert.equal(get.headers.get('Content-Length'),head.headers.get('Content-Length'));assert.equal(get.headers.get('Content-Type'),'text/plain; charset=utf-8');
 for(const url of [origin+'/other.txt','https://other.example'+INDEXNOW_PATH,origin+'/member'+INDEXNOW_PATH])assert.equal(discoveryRoute(new Request(url)),null);
 assert.equal(discoveryRoute(new Request(origin+INDEXNOW_PATH,{method:'POST'})),null);
});
test('discovery file removes exactly the closed order-route line and retains every other byte',()=>{
 for(const newline of ['\n','\r\n']){
  const before=['# SHIFT','- '+origin+'/treatment-centre','- '+origin+'/treatment-order','- '+origin+'/clinical-governance','Do not use private member routes.'].join(newline)+newline;
  const after=before.replace('- '+origin+'/treatment-order'+newline,'');
  assert.equal(repairDiscoveryTxt(before),after);assert.equal(repairDiscoveryTxt(after),after);
 }
 for(const text of ['Some prose mentions '+origin+'/treatment-order','- https://other.example/treatment-order\n','- '+origin+'/treatment-ordering\n'])assert.equal(repairDiscoveryTxt(text),text);
});
test('response wrapper cannot change home, Start Here, private pages, errors or other response types',async()=>{
 for(const [path,method,status,type,host] of [['/','GET',200,'text/html',origin],['/start-here','GET',200,'text/html',origin],['/member/dashboard','GET',200,'text/html',origin],['/llms.txt','HEAD',200,'text/plain',origin],['/llms.txt','GET',403,'text/plain',origin],['/llms.txt','GET',200,'text/html',origin],['/llms.txt','GET',200,'text/plain','https://other.example']]){
  const r=new Response('same',{status,headers:{'Content-Type':type}});assert.equal(await withDiscoverySeo(r,new Request(host+path,{method})),r);
 }
 const r=await withDiscoverySeo(new Response('- '+origin+'/treatment-order\n',{headers:{'Content-Type':'text/plain','ETag':'old'}}),new Request(origin+'/llms.txt'));assert.equal(await r.text(),'');assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('X-Shift-Discovery-SEO'),'2026-10-06');
});
