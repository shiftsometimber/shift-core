import test from 'node:test';
import assert from 'node:assert/strict';
import {hqCommerceContentRoutes} from '../hq-commerce-content-v1.js';
import {env,DB,cookies} from '../hq-management-acceptance.mjs';

const path='/v1/hq/site-content',owner={Cookie:cookies.owner,Origin:'https://hq.shiftsometimber.co.uk'};
const request=(action)=>new Request('https://api.shiftsometimber.co.uk'+path+(action?'/9001':''),{method:action?'PATCH':'GET',headers:{...owner,...(action?{'Content-Type':'application/json'}:{})},body:action?JSON.stringify({action,text:'TEST proposed wording'}):undefined});
const binding=fetch=>({idFromName:name=>name,get:()=>({fetch:(input,init)=>fetch(new Request(input,init))})});
const call=(action,delivery)=>hqCommerceContentRoutes(request(action),{...env,SITE_CONTENT_STATE:delivery},{});
// The native authenticated handler creates only its retained in-memory schema.
assert.equal((await call()).status,200);
function seed(){
  DB.sqlite.exec("DELETE FROM site_content_versions;DELETE FROM site_content_overrides;DELETE FROM hq_audit WHERE action LIKE 'site_content.%';");
  DB.sqlite.prepare("INSERT INTO site_content_overrides(id,page_path,content_key,css_selector,label,draft_text,published_text,status,version) VALUES(9001,'/test','TEST_WEBSITE_DELIVERY','h1','TEST website field','TEST draft wording','TEST published wording','draft',4)").run();
}
const snapshot=()=>({content:DB.sqlite.prepare('SELECT * FROM site_content_overrides ORDER BY id').all(),versions:DB.sqlite.prepare('SELECT * FROM site_content_versions ORDER BY id').all(),audit:DB.sqlite.prepare("SELECT * FROM hq_audit WHERE action LIKE 'site_content.%' ORDER BY id").all()});

test('Missing website delivery binding rejects publish and rollback before content, history, audit or schema writes',async()=>{
  seed();const before=snapshot(),original=DB.prepare.bind(DB),writes=[];
  DB.prepare=sql=>{if(/^\s*(CREATE|INSERT|UPDATE|DELETE)\b/i.test(sql)&&/site_content_|commerce_discount_codes/i.test(sql))writes.push(sql);return original(sql);};
  try{
    for(const action of ['publish','rollback','pause']){
      const response=await call(action),body=await response.json();
      assert.equal(response.status,503,action);assert.equal(body.ok,false);assert.equal(body.error,'content_delivery_not_configured');
      assert.equal(body.deliveryState.status,'unavailable');assert.match(body.deliveryState.reason,/not configured/);assert.ok(body.deliveryState.owner);
      assert.deepEqual(snapshot(),before,action);assert.equal(body.rolledBack,undefined);
    }
    assert.deepEqual(writes,[],'Denied action performed a retained-content write');
  }finally{DB.prepare=original;}
});

test('Missing or failed delivery reads keep draft rows and explicitly report unavailable, rather than available empty delivery',async()=>{
  seed();
  for(const delivery of [undefined,binding(async()=>Response.json({ok:false,error:'TEST read failure'},{status:503})),binding(async()=>{throw Error('TEST unavailable');})]){
    const response=await call(undefined,delivery),body=await response.json();
    assert.equal(response.status,200);assert.equal(body.content.length,1);assert.equal(body.content[0].draft_text,'TEST draft wording');
    assert.equal(body.deliveryState.status,'unavailable');assert.ok(body.deliveryState.reason);assert.ok(body.deliveryState.owner);assert.equal(body.deliveryOverrides,null);
  }
});

test('A malformed delivery read cannot establish readiness',async()=>{
  seed();const response=await call(undefined,binding(async()=>Response.json({ok:true}))),body=await response.json();
  assert.equal(body.deliveryState.status,'unavailable');assert.equal(body.deliveryOverrides,null);
});

test('A valid bound read-all establishes delivery readiness and retains the authoritative override',async()=>{
  seed();const override={content_key:'TEST_WEBSITE_DELIVERY',page_path:'/test',published_text:'TEST delivered wording',version:5};
  const response=await call(undefined,binding(async()=>Response.json({ok:true,overrides:[override]}))),body=await response.json();
  assert.equal(response.status,200);assert.deepEqual(body.deliveryState,{status:'ready',reason:null,owner:'Website delivery owner / engineering'});
  assert.deepEqual(body.deliveryOverrides,[override]);assert.equal(body.content[0].published_text,override.published_text);assert.equal(body.content[0].version,5);
});

test('A bound publish or rollback delivery failure never returns a committed success or success audit',async()=>{
  for(const action of ['publish','rollback']){
    seed();const calls=[],delivery=binding(async request=>{calls.push(new URL(request.url).pathname);return Response.json({ok:false,error:'TEST delivery rejected'},{status:503});});
    const response=await call(action,delivery),body=await response.json();
    assert.equal(response.status,503,action);assert.equal(body.ok,false);assert.equal(body.error,'content_delivery_not_committed');
    assert.equal(body.deliveryState.status,'unavailable');assert.equal(body.status,undefined);assert.equal(body.rolledBack,undefined);
    assert.deepEqual(calls,[action==='publish'?'/publish':'/pause']);assert.equal(snapshot().audit.length,0);
  }
});

test('Proof-copy cleanup cannot be waived when its delivery pause fails',async()=>{
  seed();DB.sqlite.prepare("UPDATE site_content_overrides SET page_path='/about',published_text='controlled HQ publish test',status='published' WHERE id=9001").run();
  const before=snapshot(),delivery=binding(async request=>new URL(request.url).pathname==='/read-all'?Response.json({ok:true,overrides:[{content_key:'TEST_WEBSITE_DELIVERY',page_path:'/about',published_text:'controlled HQ publish test',version:4}]}):Response.json({ok:false,error:'TEST pause failure'},{status:503}));
  const response=await call(undefined,delivery),body=await response.json();
  assert.equal(body.deliveryState.status,'unavailable');assert.match(body.deliveryState.reason,/cleanup/);assert.equal(body.deliveryOverrides,null);assert.deepEqual(snapshot(),before);
});
