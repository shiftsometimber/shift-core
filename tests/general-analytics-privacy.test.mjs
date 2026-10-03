import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {recordProductEvent} from '../product-analytics-v1.js';

function fixture(t){
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 const DB={exec:async sql=>sqlite.exec(sql),prepare(sql){return{bind(...args){return{async run(){const r=sqlite.prepare(sql).run(...args);return{meta:{last_row_id:Number(r.lastInsertRowid)}};}};}};}};
 return{sqlite,env:{DB}};
}
const generalEvents=['registration_started','registration_completed','login_succeeded','onboarding_completed','today_viewed','today_action_opened','grub_plan_generated','grub_feedback','fit_plan_generated','fit_feedback','hydration_logged','progress_logged','progress_picture_saved','progress_picture_deleted','shift_ai_message','plan_viewed','error_presented','feature_completed','treatment_checkin','member_returned','daily_shift_rebuilt','daily_recovery_completed','daily_meal_accepted','daily_meal_swapped','daily_meal_rejected','daily_recommendation_feedback'];
test('every registered general event excludes fictional private text, nested values and metadata',async t=>{
 const{sqlite,env}=fixture(t),marker='FICTIONAL_PRIVATE_TEXT';
 for(const eventName of generalEvents){
  const r=await recordProductEvent(env,{userId:9,eventName,surface:marker,sessionId:marker,source:marker,properties:{note:marker,prompt:marker,email:marker,answers:[{value:marker}],mealId:marker,replacementId:marker,scenario:'rough_guts',gear:marker,path:marker,page:marker,date:marker,reason:marker,target:marker,feedback:marker,composer:marker,recording:marker,via:marker,enabled:{value:marker},memoryUsed:[marker],count:Infinity}});
  const row=sqlite.prepare('SELECT * FROM product_events WHERE id=?').get(r.id);
  assert.equal(row.event_name,eventName);assert.equal(row.user_id,9);
  assert.equal(row.surface,'unknown');assert.equal(row.session_id,null);assert.equal(row.source,'server');assert.deepEqual(JSON.parse(row.properties_json),{});
  assert.doesNotMatch(JSON.stringify(row),/FICTIONAL_PRIVATE_TEXT|rough_guts/);assert.equal(r.surface,'unknown');
 }
});
test('purpose-limited registration, plan and AI usage remains available for reporting',async t=>{
 const{sqlite,env}=fixture(t);
 for(const[eventName,properties]of [
  ['registration_completed',{path:'fast-v2'}],
  ['grub_plan_generated',{retainedPlan:true,composer:'v8',recording:'authenticated_request'}],
  ['shift_ai_message',{oneShiftBrain:true,memoryUsed:true,feedbackUsed:false,knowledgeSources:2}],
  ['daily_recommendation_feedback',{target:'today',feedback:'wrong_today',date:'2026-10-03'}]
 ]){
  const r=await recordProductEvent(env,{eventName,surface:'today',properties:{...properties,note:'FICTIONAL_PRIVATE'}});
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT properties_json FROM product_events WHERE id=?').get(r.id).properties_json),properties);
 }
});
test('allowed names cannot smuggle free text, nested values, inherited fields or invalid counters',async t=>{
 const{sqlite,env}=fixture(t);
 for(const properties of [
  {page:'today FICTIONAL_PRIVATE',count:101,enabled:'FICTIONAL_PRIVATE'},
  {page:{text:'today'},count:1.5,enabled:['FICTIONAL_PRIVATE']},
  Object.create({page:'today',count:1,enabled:true}),
  {page:['today'],count:NaN,enabled:null}
 ]){
  const r=await recordProductEvent(env,{eventName:'today_viewed',properties});
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT properties_json FROM product_events WHERE id=?').get(r.id).properties_json),{});
 }
 const r=await recordProductEvent(env,{eventName:'daily_meal_accepted',properties:{date:'2026-02-30',mealId:'FICTIONAL_PRIVATE'}});
 assert.deepEqual(JSON.parse(sqlite.prepare('SELECT properties_json FROM product_events WHERE id=?').get(r.id).properties_json),{});
});
