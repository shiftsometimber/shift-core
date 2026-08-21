import fs from 'node:fs';
import assert from 'node:assert/strict';
const server=fs.readFileSync(new URL('../member-daily-v3.js',import.meta.url),'utf8');
const client=fs.readFileSync(new URL('../frontend/member/member-today-premium-v1.js',import.meta.url),'utf8');
for(const marker of ['shift_daily_plans','shift_daily_actions','shift_daily_action_events','UNIQUE(user_id,idempotency_key)','stable_daily_plan','behaviour_feedback'])assert.ok(server.includes(marker),`missing ${marker}`);
for(const marker of ['data-decision="complete"','data-decision="swap"','data-decision="skip"','Why this?','saveShiftSetup'])assert.ok(client.includes(marker),`missing ${marker}`);
console.log('adaptive today source gate passed');
