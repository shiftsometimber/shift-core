import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {penDayInternals} from '../pen-day-v1.js';

const api=fs.readFileSync(new URL('../pen-day-v1.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../frontend/member/member-pen-day-v1.js',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');

test('Pen Day accepts only the three non-clinical states and three feelings',()=>{
 assert.deepEqual([...penDayInternals.STATUSES],['done','not_today','paused_off']);
 assert.deepEqual([...penDayInternals.FEELS],['fine','rough','want_door']);
 assert.equal(penDayInternals.cleanNote('x'.repeat(400)).length,280);
});

test('Pen Day persists per member and date without dosing fields',()=>{
 assert.match(api,/UNIQUE\(user_id,local_date\)/);
 assert.match(api,/WHERE user_id=\? AND local_date=\?/);
 assert.doesNotMatch(api,/\b(?:mg|units|batch|injection_site|prescribed_schedule)\b/i);
});

test('rough and paused states open the existing support doors',()=>{
 for(const route of ['/member/ask-timber.html','/articles/stopping-glp1','/contact?type=Clinic%20Gone%20Quiet','/mens-mental-health'])assert.match(ui,new RegExp(route.replaceAll('/','\\/').replace('?','\\?')));
 assert.match(ui,/NHS 111/);assert.match(ui,/call 999/);
 assert.doesNotMatch(ui,/name=["'](?:dose|mg|units)/i);
});

test('Worker serves the member asset and mounts the authenticated route',()=>{
 assert.match(worker,/\['\/member-pen-day-v1\.js','application\/javascript; charset=utf-8'\]/);
 assert.match(worker,/penDayRoutes\(request,env\)/);
});
