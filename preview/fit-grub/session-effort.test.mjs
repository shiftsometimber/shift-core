import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {adjustPreviewExercise} from './session-effort.mjs';
import {createFitPreview} from './session-builder.js';
import {guidanceRecords} from './guidance.mjs';
const {records}=guidanceRecords(JSON.parse(fs.readFileSync('preview/fit-grub/v3/approval.json')));
const profile={location:'home',minutes_per_day:20,equipment:['No equipment','Chair'],goal:'general fitness',limitations:'none',notes:''};

test('effort adjusts real home-session reps/time/rest without changing movements, kit or source',()=>{
 const api=createFitPreview(records),plan=api.build(profile),before=JSON.stringify(plan);
 const march=plan.sessions[0].exercises.find(x=>x.canonical_movement==='low-impact-march');
 const sit=plan.sessions[0].exercises.find(x=>x.canonical_movement==='sit-to-stand');
 assert.match(adjustPreviewExercise(march,'easier').dose_text,/time seconds: 240\nrest seconds: 90/);
 assert.match(adjustPreviewExercise(march,'harder').dose_text,/time seconds: 360\nrest seconds: 60/);
 assert.match(adjustPreviewExercise(sit,'easier').dose_text,/reps: 6\nrest seconds: 90/);
 assert.match(adjustPreviewExercise(sit,'harder').dose_text,/reps: 10\nrest seconds: 60/);
 for(const x of plan.sessions[0].exercises)for(const mode of ['easier','harder','planned']){
  const adjusted=adjustPreviewExercise(x,mode);assert.equal(adjusted.id,x.id);assert.deepEqual(adjusted.equipment,x.equipment);assert.deepEqual(adjusted.safety_cues,x.safety_cues);
  assert.deepEqual(adjustPreviewExercise(x,'planned'),x);
 }
 assert.equal(JSON.stringify(plan),before);
});

test('swapped movement uses its own image identity and fresh source dose at the selected effort',()=>{
 const api=createFitPreview(records),plan=api.build(profile),list=plan.sessions[0].exercises;
 const original=list.find(x=>x.canonical_movement==='low-impact-march');
 const replacement=api.replace({...profile,current_id:original.id,group:original.group,exclude:list.map(x=>x.id)}).exercise;
 assert.equal(replacement.canonical_movement,'walk');
 for(const mode of ['easier','harder'])assert.equal(adjustPreviewExercise(replacement,mode).canonical_movement,'walk');
 assert.equal(api.build({...profile,limitations:'knee pain'}).held,true);
});

test('unsupported effort resets to source; authored repetition ranges remain ordered',()=>{
 const x={dose_text:'2 sets × 6–8 reps; 75s rest.',how:['2 sets × 6–8 reps; 75s rest. Keep breathing.']};
 assert.equal(adjustPreviewExercise(x,'harder').dose_text,'2 sets × 7–10 reps; 60s rest.');
 assert.equal(adjustPreviewExercise(x,'easier').dose_text,'2 sets × 5–6 reps; 90s rest.');
 assert.deepEqual(adjustPreviewExercise(x,'unknown'),x);
 assert.equal(adjustPreviewExercise({dose_text:'2 bouts × 10s; 15s rest between bouts.'},'harder').dose_text,'2 bouts × 12s; 15s rest between bouts.');
});
