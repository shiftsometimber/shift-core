import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {recordProductEvent} from '../product-analytics-v1.js';

function fixture(t){
  const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
  const DB={
    exec:async sql=>sqlite.exec(sql),
    prepare(sql){
      return{bind(...args){
        return{async run(){
          const result=sqlite.prepare(sql).run(...args);
          return{meta:{last_row_id:Number(result.lastInsertRowid)}};
        }};
      }};
    }
  };
  return{sqlite,env:{DB}};
}
const events=['my_timber_today_viewed','my_timber_meal_saved','my_timber_move_saved','my_timber_checkin_saved','my_timber_treatment_action'];
const privateProperties={
  date:'2026-09-16',mealSaved:true,moveSaved:false,
  guts:'PRIVATE_GUTS',energy:'PRIVATE_ENERGY',mood:'PRIVATE_MOOD',symptom:'PRIVATE_SYMPTOM',
  choice:'PRIVATE_TREATMENT_CHOICE',need:'PRIVATE_HELP_NEED',meal:'PRIVATE_MEAL_FREE_TEXT',
  activity:'PRIVATE_ACTIVITY',minutes:10,note:'PRIVATE_NOTE',source:'PRIVATE_SOURCE',
  arbitrary:'PRIVATE_ARBITRARY',number:123,boolean:true,
  nested:{note:'PRIVATE_NESTED_NOTE'},array:['PRIVATE_ARRAY',{note:'PRIVATE_NESTED_ARRAY'}]
};
for(const eventName of events)test(`${eventName} inserts usage while withholding clinical and arbitrary properties`,async t=>{
  const{sqlite,env}=fixture(t);
  const event=await recordProductEvent(env,{userId:7,eventName,surface:'my_timber_today',source:'server',properties:privateProperties});
  assert.ok(event.id>0);
  const row=sqlite.prepare('SELECT * FROM product_events WHERE id=?').get(event.id);
  assert.equal(row.event_name,eventName);assert.equal(row.user_id,7);assert.equal(row.source,'server');
  assert.deepEqual(JSON.parse(row.properties_json),eventName==='my_timber_today_viewed'?{date:'2026-09-16',mealSaved:true,moveSaved:false}:{date:'2026-09-16'});
  assert.doesNotMatch(row.properties_json,/PRIVATE_|minutes|arbitrary|nested|array/);
});
test('allowlisted property names cannot carry nested values or disguised free text',async t=>{
  const{sqlite,env}=fixture(t);
  const payloads=[
    {date:{text:'PRIVATE_DATE'},mealSaved:{note:'PRIVATE_BOOLEAN'},moveSaved:['PRIVATE_ARRAY']},
    {date:'2026-09-16 PRIVATE_SUFFIX',mealSaved:'PRIVATE_STRING',moveSaved:1},
    {date:'2026-02-30',mealSaved:null,moveSaved:null},
    Object.assign(Object.create({date:'2026-09-16',mealSaved:true}),{anything:{note:'PRIVATE_INHERITED'}}),
    ['PRIVATE_ARRAY'],null
  ];
  for(const properties of payloads){
    const event=await recordProductEvent(env,{eventName:'my_timber_today_viewed',properties});
    assert.deepEqual(JSON.parse(sqlite.prepare('SELECT properties_json FROM product_events WHERE id=?').get(event.id).properties_json),{});
  }
});
test('new event permission is limited to the five existing names',async t=>{
  const{sqlite,env}=fixture(t);
  for(const eventName of ['my_timber_symptom_details','my_timber_arbitrary','my_timber_today_viewed_extra'])await assert.rejects(recordProductEvent(env,{eventName,properties:privateProperties}),/unsupported event/);
  assert.equal(sqlite.prepare("SELECT count(*) count FROM sqlite_master WHERE name='product_events'").get().count,0,'rejected events do not create or write analytics tables');
});
test('existing event sanitisation stays unchanged',async t=>{
  const{sqlite,env}=fixture(t);
  const event=await recordProductEvent(env,{eventName:'today_viewed',properties:{page:'today',count:2,enabled:true,email:'PRIVATE_EMAIL',note:{nested:'PRIVATE_NESTED'}}});
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT properties_json FROM product_events WHERE id=?').get(event.id).properties_json),{page:'today',count:2,enabled:true});
});
