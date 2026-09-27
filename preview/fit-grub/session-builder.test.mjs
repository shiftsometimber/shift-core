import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {guidanceRecords} from './guidance.mjs';
import {createFitPreview} from './session-builder.js';
import assets from './assets.js';
const pack=JSON.parse(fs.readFileSync('preview/fit-grub/v3/approval.json'));
const {records}=guidanceRecords(pack);
const base={location:'home',minutes_per_day:20,equipment:['No equipment','Chair'],goal:'general fitness and healthy weight support',limitations:'none',notes:''};

test('all 300 written guides join exactly to 2688 asset mappings and retain release holds',()=>{
  assert.equal(records.length,300);
  assert.equal(records.reduce((n,r)=>n+r.variants.length,0),2688);
  assert.equal(records.filter(r=>r.status==='approved').length,300);
  for(const r of records){assert.ok(r.purpose.benefit&&r.purpose.weightLoss);for(const v of r.variants){assert.ok(v.instructions&&v.dose);assert.match(v.releaseStatus,/Hold/);}}
  const summary=JSON.parse(assets['/fit-guidance-summary.json'].body);
  assert.equal(summary.sourceSha256,'2461d65b76efac19ef718359331cd9eb5612e21c3212dae4424526cbf7bb4817');
});

test('125 session combinations respect setting, complete equipment requirements and beginner source protocols',()=>{
  const cases=[['home',['No equipment']],['home',['Chair','No equipment']],['home',['Mat','Dumbbells']],['outside',['No equipment']],['gym',['Full gym']]];
  let count=0;
  for(const [location,equipment] of cases)for(const minutes_per_day of [10,20,30,45,60])for(const goal of ['general fitness','strength','cardiovascular stamina','mobility balance','returning after a break']){
    const api=createFitPreview(records),p=api.build({...base,location,equipment,minutes_per_day,goal});
    count++;if(location==='outside'&&goal==='mobility balance'){assert.equal(p.held,true);assert.deepEqual(p.sessions,[]);continue;}assert.equal(p.held,undefined);assert.equal(p.timing_kind,'time_budget');
    const s=p.sessions[0];assert.equal(s.requested_minutes,minutes_per_day);assert.ok(s.exercises.length);
    assert.equal(new Set(s.exercises.map(x=>x.canonical_movement)).size,s.exercises.length);
    for(const x of s.exercises){const r=records.find(r=>r.id===x.canonical_movement);assert.equal(r.status,'approved');assert.equal(r.variants[0].difficulty,'beginner');assert.equal(x.dose_text,r.variants[0].dose);assert.equal(x.how[0],r.setup);assert.equal(x.minutes,undefined);assert.ok(x.equipment.every(e=>equipment.includes(e)||(location==='gym'&&equipment.includes('Full gym'))));if(location==='outside')assert.ok(r.location.includes('outside'));}
  }
  assert.equal(count,125);
});

test('restrictions and unknown notes hold the session; explicit no-floor preference excludes floor transfers',()=>{
  const api=createFitPreview(records);
  for(const limitations of ['knee pain','no running','recent surgery','dizziness'])assert.equal(api.build({...base,limitations}).held,true);
  for(const notes of ['old shoulder injury','avoid kneeling','beginner with heart concerns'])assert.equal(api.build({...base,notes}).held,true);
  const p=api.build({...base,equipment:['Full gym'],location:'gym',notes:'no floor exercises'});
  assert.ok(p.sessions[0].exercises.every(x=>records.find(r=>r.id===x.canonical_movement).floorAccess==='No floor transfer'));
  assert.equal(api.build({...base,minutes_per_day:-1}).held,true);
});

test('swaps use another canonical movement, preserve role and equipment, and fail without weakening constraints',()=>{
  const api=createFitPreview(records),p=api.build(base),all=p.sessions[0].exercises;
  let replaced=0;
  for(const old of all){try{const {exercise:x}=api.replace({...base,current_id:old.id,exclude:all.map(x=>x.id),group:old.group});assert.equal(x.group,old.group);assert.ok(!all.some(e=>e.canonical_movement===x.canonical_movement));api.feedback(old.id,'nay');assert.ok(!api.build(base).sessions[0].exercises.some(x=>x.canonical_movement===old.canonical_movement));replaced++;}catch(e){assert.match(e.message,/No different movement/);}}
  assert.ok(replaced>0);
  const bare=createFitPreview(records).build({...base,equipment:['Mat','Dumbbells']});assert.ok(!bare.sessions[0].exercises.some(x=>x.canonical_movement==='chest-press'));
  assert.deepEqual(api.requirements(records.find(r=>r.id==='dumbbell-flat-bench-press')),['Dumbbells','Full gym']);
});

test('built preview has a functioning composer and no fake live Progress success',async()=>{
  const body=assets['/member/fit'].body;
  const mocks={console,structuredClone,localStorage:{getItem(){return null},setItem(){}},document:{querySelector(){return {checked:false,textContent:''}}}};mocks.window=mocks;
  vm.createContext(mocks);vm.runInContext(assets['/fit-session-builder.js'].body,mocks);
  const inline=body.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(inline,mocks);
  const result=await mocks.SST_API.generateFit(base);assert.ok(result.plan.sessions[0].exercises.length>1);
  const js=assets['/member-fit-programme-v1.js'].body;
  assert.doesNotMatch(js,/Shift has logged the session in Progress/);assert.match(js,/Minutes actually completed/);assert.match(js,/minutes>Number\(session.dataset.minutes\)/);
  assert.match(js,/\$\('#sfResults'\).innerHTML='';currentPlan=null/);
  new vm.Script(js);new vm.Script(assets['/fit-v3.js'].body);
});
