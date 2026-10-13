import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../frontend/member/api-adapter-v33d.js',import.meta.url),'utf8');
function fixture({rows=[{id:1,consent_type:'my_shift_health_tracking',granted:1}],preferences={},ensure=true}={}){
  const calls=[],window={SST_API_BASE:'https://api.example.invalid'};
  if(ensure!==undefined)window.SST_HEALTH_CONSENT={ensure:async()=>{calls.push({choice:ensure});return ensure;}};
  let state={rows,preferences,photoStatus:200};
  const fetch=async(url,options={})=>{
    const path=new URL(url).pathname;
    calls.push({path,method:options.method||'GET',options});
    if(path==='/v1/consents')return Response.json({consents:state.rows});
    if(path==='/v1/member-state')return Response.json({state:{preferences:state.preferences}});
    if(path==='/v1/shift/progress-photo')return Response.json(state.photoStatus===200?{photos:[],ok:true}:{error:'health_consent_required',message:'Tracking was withdrawn.'},{status:state.photoStatus});
    throw Error('Unexpected request '+path);
  };
  vm.runInNewContext(source,{window,fetch,Response,Headers,FormData,AbortController,setTimeout,clearTimeout,Date,console});
  return {api:window.SST_API,window,state,calls};
}
const photos=h=>h.calls.filter(c=>c.path==='/v1/shift/progress-photo');
test('missing or withdrawn optional consent prevents background photo reads without offering consent',async()=>{
  for(const rows of [[],[{id:1,consent_type:'my_shift_health_tracking',granted:0}],[{id:1,consent_type:'my_shift_health_tracking',granted:1},{id:2,consent_type:'my_shift_health_tracking',granted:0}]]){
    const h=fixture({rows});await assert.rejects(h.api.listProgressPhotos(),e=>e.status===409&&e.code==='health_consent_required');
    assert.equal(photos(h).length,0);assert.equal(h.calls.some(c=>'choice'in c),false);assert(h.calls.every(c=>c.method==='GET'));
  }
});
test('newest explicit choice wins independently of response order and unrelated consents',async()=>{
  const h=fixture({rows:[{id:8,consent_type:'marketing',granted:0},{id:7,consent_type:'my_shift_health_tracking',granted:1},{id:2,consent_type:'my_shift_health_tracking',granted:0}]});
  await h.api.listProgressPhotos();assert.equal(photos(h).length,1);
  for(const c of h.calls){assert.equal(c.options.credentials,'include');assert.equal(c.options.cache,'no-store');}
});
test('paused tracking blocks photo reads and does not mutate the saved preference',async()=>{
  const preferences={myJourney:{setup:{paused:true}}},h=fixture({preferences});
  await assert.rejects(h.api.listProgressPhotos(),e=>e.code==='health_consent_required');assert.equal(photos(h).length,0);assert.equal(preferences.myJourney.setup.paused,true);
});
test('unknown or malformed consent/settings cannot be treated as permission',async()=>{
  for(const patch of [{rows:{}},{rows:[{consent_type:'my_shift_health_tracking',granted:1}]},{preferences:null},{preferences:'{broken'},{preferences:[]}]){
    const h=fixture(patch);await assert.rejects(h.api.listProgressPhotos(),e=>e.code==='health_consent_unavailable');assert.equal(photos(h).length,0);
  }
});
test('declining the existing save dialog or its absence never posts a photo or grants consent',async()=>{
  for(const ensure of [false,undefined]){
    const h=fixture({ensure:false});if(ensure===undefined)delete h.window.SST_HEALTH_CONSENT;
    await assert.rejects(h.api.saveProgressPhoto(new Blob(['synthetic'])),e=>e.code==='health_consent_required');assert.equal(photos(h).length,0);assert.equal(h.calls.some(c=>c.method==='POST'),false);
  }
});
test('explicit save choice still requires a fresh persisted grant; dialog result alone is insufficient',async()=>{
  const h=fixture({rows:[]});await assert.rejects(h.api.saveProgressPhoto(new Blob(['synthetic'])),e=>e.code==='health_consent_required');assert.equal(photos(h).length,0);
  assert.equal(h.calls[0].choice,true);assert.equal(h.calls.some(c=>c.path==='/v1/consents'&&c.method==='POST'),false);
});
test('a permitted save retains the original image/form contract and performs no image generation',async()=>{
  const h=fixture();await h.api.saveProgressPhoto(new Blob(['synthetic'],{type:'image/png'}),{weightKg:93.2,waistCm:111,operationId:'test-operation'});
  const p=photos(h);assert.equal(p.length,1);assert.equal(p[0].method,'POST');assert.equal(p[0].options.body.get('consent'),'true');assert.equal(p[0].options.body.get('weightKg'),'93.2');assert.equal(p[0].options.body.get('operationId'),'test-operation');assert.equal(h.calls.some(c=>c.path?.includes('visualise')),false);
});
test('later withdrawal and an account change are re-read rather than inherited from a previous grant',async()=>{
  const h=fixture();await h.api.listProgressPhotos();h.state.rows=[{id:2,consent_type:'my_shift_health_tracking',granted:0}];
  await assert.rejects(h.api.listProgressPhotos(),e=>e.code==='health_consent_required');h.state.rows=[];
  await assert.rejects(h.api.listProgressPhotos(),e=>e.code==='health_consent_required');assert.equal(photos(h).length,1);
});
test('the server still rejects a withdrawal racing a successful preflight',async()=>{
  const h=fixture();h.state.photoStatus=409;await assert.rejects(h.api.listProgressPhotos(),e=>e.status===409&&e.message==='Tracking was withdrawn.');assert.equal(photos(h).length,1);
});
test('owned deletion after withdrawal bypasses the read gate and preserves the server-owned deletion route',async()=>{
  const h=fixture({rows:[]});await assert.rejects(h.api.deleteProgressPhoto(7),/Unexpected request/);
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/v1/shift/progress-photo/7');assert.equal(h.calls[0].method,'DELETE');
});
