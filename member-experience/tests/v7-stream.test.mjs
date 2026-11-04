import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';import {nativeDocument} from '../v7-native.mjs';
function setup(t){const f=fixture({seed:false});f.env.DB.batch=async statements=>Promise.all(statements.map(s=>s.all()));f.db.exec(fs.readFileSync(new URL('../v7-crew-schema.sql',import.meta.url),'utf8'));t.after(()=>f.close());f.db.exec(fs.readFileSync(new URL('../v7-food-schema.sql',import.meta.url),'utf8'));f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)");f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({lifeBack:{progress:{revision:0,goal:'Private synthetic goal',v7:{days:{},milestones:{}}}}}));return f;}
test('public frame streams before identity completes; private data waits for verified account',async t=>{
 const f=setup(t),prepare=f.env.DB.prepare.bind(f.env.DB);let release;const gate=new Promise(r=>{release=r});let first=true;
 f.env.DB.prepare=sql=>{const statement=prepare(sql),read=statement.first.bind(statement);statement.first=async()=>{if(first){first=false;await gate;}return read();};return statement;};
 const response=await nativeDocument(new Request('https://shiftsometimber.co.uk/member/dashboard',{headers:{Cookie:'sst_session=test-only-member-1'}}),f.env);
 const reader=response.body.getReader(),decoder=new TextDecoder();let html=decoder.decode((await reader.read()).value);
 assert(html.includes('id="mtShopChrome"'));assert(!html.includes('Private synthetic goal'));assert(!html.includes('id="mtNativeInitial"'));assert.match(response.headers.get('Cache-Control'),/no-store, private/);
 release();for(;;){const next=await reader.read();if(next.done)break;html+=decoder.decode(next.value);}
 const initial=JSON.parse(html.match(/<script id="mtNativeInitial"[^>]*>([\s\S]*?)<\/script>/)[1]);assert.equal(initial.accountId,1);assert.equal(initial.v7.goal,'Private synthetic goal');assert.equal((html.match(/id="mtShopChrome"/g)||[]).length,1);
});
test('signed-out stream contains no private snapshot and does not masquerade as a member',async t=>{
 const f=setup(t),response=await nativeDocument(new Request('https://shiftsometimber.co.uk/member/dashboard',{headers:{Cookie:'sst_session=invalid'}}),f.env),html=await response.text();
 assert(!html.includes('Private synthetic goal'));const initial=JSON.parse(html.match(/<script id="mtNativeInitial"[^>]*>([\s\S]*?)<\/script>/)[1]);assert.deepEqual(initial,{signedOut:true});
});
