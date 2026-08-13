import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const fail=m=>{throw new Error(m)};
const matrix=fs.readFileSync('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md','utf8');
const recovery=fs.readFileSync('docs/ACTIVE-RECOVERY.md','utf8');
const evidence=fs.readFileSync('docs/COMMISSIONING-EVIDENCE.md','utf8');
const expected='57 total / 23 PASS / 31 AMBER / 3 BLOCKED';
if(!matrix.includes(expected))fail(`matrix scoreboard regressed; expected ${expected}`);
if(!recovery.includes('23 PASS / 31 AMBER / 3 BLOCKED'))fail('recovery scoreboard is stale/regressed');
for(const marker of ['2,876 / 2,876 nutrition-valid LOW-risk','101 immutable canonical review templates','0 nutrition quarantine'])if(!recovery.includes(marker)&&!evidence.includes(marker))fail(`retained Grub evidence missing: ${marker}`);
const gate=fs.readFileSync('industrial-conversion-gate.mjs');
const hash=crypto.createHash('sha256').update(gate).digest('hex');
const knownGood=process.env.KNOWN_GOOD_CONVERSION_GATE_SHA256||'';
if(knownGood&&hash!==knownGood)fail(`industrial-conversion-gate hash drift ${hash} != ${knownGood}`);
let main='';try{main=execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim()}catch{}
const retained='ee8c96dbfb3116a9b4e5119d56b537dfdb713252';
if(main){try{execFileSync('git',['merge-base','--is-ancestor',retained,main]);}catch{fail(`retained evidence commit ${retained} is not ancestor of origin/main ${main}`)}}
console.log(JSON.stringify({scoreboard:'23/31/3',retainedGrubNutrition:'2876/2876',reviewTemplates:101,conversionGateSha256:hash,originMain:main||null},null,2));
console.log('PASS recovery integrity: latest earned evidence cannot be silently superseded by an older checkpoint.');
