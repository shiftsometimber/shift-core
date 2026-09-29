import test from 'node:test';import assert from 'node:assert/strict';
import {normaliseDeviceHealthReading} from '../device-health-sync.mjs';
const now=Date.parse('2026-09-29T12:00:00Z');
const good=(type,value,id='abc')=>normaliseDeviceHealthReading({type,value,observedAt:'2026-09-29T11:00:00Z',sourceRecordId:id},now);
test('accepts supported health readings and canonical units',()=>{
 assert.deepEqual(good('systolic_mmhg',128),{type:'systolic_mmhg',value:128,unit:'mmHg',observedAt:'2026-09-29T11:00:00.000Z',sourceRecordId:'abc'});
 assert.equal(good('weight_kg',92.4).unit,'kg');assert.equal(good('oxygen_saturation_pct',97).unit,'%');assert.equal(good('steps',7842).unit,'count');
});
test('rejects unknown, implausible, future, stale and unkeyed readings',()=>{
 assert.equal(good('blood_glucose',5.2),null);assert.equal(good('systolic_mmhg',400),null);
 assert.equal(normaliseDeviceHealthReading({type:'weight_kg',value:90,observedAt:'2026-09-29T13:00:00Z',sourceRecordId:'x'},now),null);
 assert.equal(normaliseDeviceHealthReading({type:'weight_kg',value:90,observedAt:'2026-08-01T00:00:00Z',sourceRecordId:'x'},now),null);
 assert.equal(normaliseDeviceHealthReading({type:'weight_kg',value:90,observedAt:'2026-09-29T11:00:00Z',sourceRecordId:''},now),null);
});
test('source IDs are bounded before server-side hashing',()=>{assert.equal(good('heart_rate_bpm',70,'x'.repeat(241)),null)});
