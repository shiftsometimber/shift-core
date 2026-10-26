import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [beforePath,afterPath]=process.argv.slice(2);assert(beforePath&&afterPath);
const before=fs.readFileSync(beforePath,'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
function section(text,name){const start=text.indexOf('// '+name+'\n');assert(start>=0);const end=text.indexOf('\n// ',start+4);return {start,end:end<0?text.length:end,body:text.slice(start,end<0?text.length:end)};}
let after=before;
const route=section(after,'member-experience/life-back-routes.mjs');
assert(!route.body.includes('"entry-note"'));
const anchor='  } else if (input.action === "shift-status") {';
assert.equal(route.body.split(anchor).length,2);
const addition='  } else if (input.action === "entry-note") {\n    if (input.revision !== next.revision) fail6("Your history changed. Reload before correcting your words.", 409);\n    const entry = next.entries.find((e) => e.id === input.entryId);\n    if (!entry) fail6("This saved entry is no longer available.", 404);\n    if (typeof input.note !== "string" || input.note.trim().length > 180) fail6("Keep your words under 180 characters.");\n    entry.win = input.note.trim();\n    entry.correctedAt = at;\n';
after=after.slice(0,route.start)+route.body.replace(anchor,addition+anchor)+after.slice(route.end);
const journey=section(after,'member-experience/journey-context.mjs');
assert(!journey.body.includes('rememberedWords:'));
const key='goal: state.goal, entries: state.entries.length';assert.equal(journey.body.split(key).length,2);
const memory='rememberedWords: (() => { const e = [...state.entries].reverse().find((e) => e.win); return e ? { entryId: e.id, text: e.win, at: e.at, correctedAt: e.correctedAt || null } : null; })(), revision: progress?.revision || 0, ';
after=after.slice(0,journey.start)+journey.body.replace(key,memory+key)+after.slice(journey.end);
let reversed=after;
for(const name of ['member-experience/journey-context.mjs','member-experience/life-back-routes.mjs']){
 const old=section(before,name),fresh=section(reversed,name);
 reversed=reversed.slice(0,fresh.start)+old.body+reversed.slice(fresh.end);
}
assert.equal(reversed,before,'Every byte outside the two approved sections must be unchanged');
fs.writeFileSync(afterPath,after);
fs.writeFileSync(afterPath+'.proof.json',JSON.stringify({beforeSHA256:sha(before),afterSHA256:sha(after),changedSections:['member-experience/life-back-routes.mjs','member-experience/journey-context.mjs'],allOtherBytesIdentical:true},null,2));
console.log('Prepared only correction operation and own remembered words; existing programme preserved.');
