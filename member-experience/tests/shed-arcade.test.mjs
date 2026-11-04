import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from '../../health-passport/fixture.mjs';
import {arcadeGames,arcadeGameOfDay,arcadeSnapshot,mergeArcade} from '../shed-arcade-model.mjs';
import {arcadeRoutes} from '../shed-arcade-routes.mjs';
const request=(body,user=1)=>new Request('https://shiftsometimber.co.uk/v1/my-timber/arcade',{method:body?'POST':'GET',headers:{Cookie:'sst_session=test-only-member-'+user,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:body?JSON.stringify({expectedAccount:user,...body}):undefined});
test('all seven rotate on successive London dates, consistently within a day',()=>{const days=Array.from({length:7},(_,i)=>'2026-11-'+String(i+3).padStart(2,'0'));assert.equal(new Set(days.map(d=>arcadeGameOfDay(d).id)).size,7);assert.equal(arcadeSnapshot({},'2026-11-04T01:00:00Z').gameOfDay,arcadeSnapshot({},'2026-11-04T23:59:59Z').gameOfDay);assert.equal(arcadeGames.length,7);});
test('scores maximise, Saw Duel minimises positive times, and stars merge per level',()=>{
 let s=mergeArcade({}, {action:'best',game:'chop-shop',value:90});s=mergeArcade(s,{action:'best',game:'chop-shop',value:20});assert.equal(s.bests.mt_chop_best,90);
 s=mergeArcade(s,{action:'best',game:'saw-duel',value:14.2});s=mergeArcade(s,{action:'best',game:'saw-duel',value:12.1});s=mergeArcade(s,{action:'best',game:'saw-duel',value:15});assert.equal(s.bests.mt_saw_best,12.1);
 s=mergeArcade(s,{action:'best',game:'timber-lob',value:[3,1]});s=mergeArcade(s,{action:'best',game:'timber-lob',value:[1,3,2]});assert.deepEqual(s.bests.mt_timberlob_stars,[3,3,2,0,0,0,0]);assert.throws(()=>mergeArcade(s,{action:'best',game:'timber-lob',value:[99]}));
});
test('sound defaults off, nickname starts blank, and nudges cap at two per week',()=>{
 assert(arcadeSnapshot().muted);assert.equal(arcadeSnapshot().nickname,'');let s={};for(const on of ['03','04','05'])s=mergeArcade(s,{action:'nudge-seen'},'2026-11-'+on+'T12:00:00Z');assert.equal(s.nudges.length,2);s=mergeArcade(s,{action:'nudge-dismiss'},'2026-11-05T12:00:00Z');assert(arcadeSnapshot({shedArcade:s},'2026-11-05T18:00:00Z').nudge.dismissed);assert.throws(()=>mergeArcade(s,{action:'nickname',nickname:'email@example.com'}));
});
test('real SQL concurrent saves keep best, preserve health/pile/food and separate accounts without requiring health consent',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());const saved={lifeBack:{progress:{v7:{days:{own:{log:{id:'kept'}}}}}},v7NutritionDay:{proteinG:45},unrelated:'keep'};f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(saved));
 const replies=await Promise.all([20,100,40,70,10,90].map(value=>arcadeRoutes(request({action:'best',game:'chop-shop',value}),f.env)));assert(replies.every(r=>r.status===200));
 const own=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);assert.equal(own.shedArcade.bests.mt_chop_best,100);assert.deepEqual(own.lifeBack,saved.lifeBack);assert.deepEqual(own.v7NutritionDay,saved.v7NutritionDay);assert.equal(own.unrelated,'keep');
 const other=await(await arcadeRoutes(request(null,2),f.env)).json();assert.deepEqual(other.arcade.bests,{});
 assert.equal((await arcadeRoutes(request({action:'best',game:'chop-shop',value:999,expectedAccount:2}),f.env)).status,409);
 const forged=new Request(request({action:'sound',muted:false}),{headers:{Cookie:'sst_session=test-only-member-1',Origin:'https://elsewhere.invalid','Content-Type':'application/json'}});assert.equal((await arcadeRoutes(forged,f.env)).status,403);
});

import {erasureDatabase,withV7Privacy} from '../v7-privacy.mjs';
test('arcade export contains only owner; account erasure clears arcade atomically, health erasure keeps it',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({shedArcade:{bests:{mt_chop_best:42}},lifeBack:{private:'health'}}));
 const wrapped=withV7Privacy({fetch:async()=>Response.json({existingExport:true})});
 const exported=await(await wrapped.fetch(new Request('https://shiftsometimber.co.uk/v1/privacy/export',{method:'POST',headers:{Cookie:'sst_session=test-only-member-1'}}),f.env,{})).json();
 assert.equal(exported.myTimberV7.arcade.bests.mt_chop_best,42);assert(exported.existingExport);
 let DB=erasureDatabase(f.env.DB,1,new Set(),true);await DB.batch([DB.prepare("UPDATE member_state SET preferences=json_remove(preferences,'$.lifeBack') WHERE user_id=?").bind(1)]);
 assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).shedArcade.bests.mt_chop_best,42);
 DB=erasureDatabase(f.env.DB,1,new Set(),false);await DB.batch([DB.prepare("UPDATE users SET email=CASE WHEN id=? THEN email ELSE email END WHERE id=?").bind(1,1)]);
 assert(!JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).shedArcade);
});
