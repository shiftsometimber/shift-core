import test from 'node:test';import assert from 'node:assert/strict';
import {prescriberNoteDraft} from '../prescriber-note.mjs';
const date=v=>Number.isFinite(Date.parse(v))?new Date(v).toISOString().slice(0,10):'';
test('notes include dated readings and reported words without inferring a cause',()=>{
 const text=prescriberNoteDraft({goal:'Easier stairs',entries:[{at:'2026-10-18',win:'My jeans feel looser'}],memberSupport:{memories:[{at:'2026-10-14',text:'I logged constipation'}]}},{metrics:[{key:'weight',latest:99,series:[{on:'2026-10-14',value:95},{on:'2026-10-18',value:96}]}]},date);
 assert(text.includes('2026-10-14 — Weight: 95 kg'));assert(text.includes('2026-10-18 — Weight: 96 kg'));assert(text.includes('2026-10-18 — My jeans feel looser'));assert(text.includes('2026-10-14 — I logged constipation'));assert(!text.includes('99 kg'));assert(!/caused|because|normal blood|change.*dose/.test(text));
});
test('undated summaries do not become invented readings; unsupported measures omitted',()=>{
 const text=prescriberNoteDraft({},{metrics:[{key:'weight',latest:93},{key:'diagnosis',series:[{on:'2026-10-14',value:1}]}]},date);assert(!text.includes('93'));assert(text.includes('No dated entries'));assert(!text.includes('diagnosis'));
});
test('a large retained history stays within the editable note limit',()=>{
 const text=prescriberNoteDraft({entries:Array.from({length:1000},()=>({at:'2026-10-14',win:'a'.repeat(180)})),memberSupport:{memories:Array.from({length:1000},()=>({at:'2026-10-14',text:'b'.repeat(180)}))}},{metrics:[]},date);assert(text.length<=5000);assert(text.split(' — ').length<=11);
});
