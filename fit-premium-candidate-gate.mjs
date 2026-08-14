import fs from 'node:fs';

const ledger=JSON.parse(fs.readFileSync('content/fit/premium-visual-production-v1.json','utf8'));
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(ledger.launch_total===26,'launch total must remain 26');
need(Number(ledger?.counts?.produced)>=1,'at least one produced candidate required');
const rows=Array.isArray(ledger.produced_candidates)?ledger.produced_candidates:[];
need(rows.length===Number(ledger?.counts?.produced),'produced candidate ledger/count mismatch');
const genericCue=/stable safe setup|controlled intended path|controlled return\/end/i;
for(const row of rows){
  const file=String(row.asset||'');
  need(file.startsWith('assets/fit/premium/')&&file.endsWith('.svg'),`${row.canonical_movement}: invalid premium asset path`);
  if(!fs.existsSync(file)){fail.push(`${row.canonical_movement}: asset missing`);continue}
  const s=fs.readFileSync(file,'utf8');
  need(/^<svg[\s>]/.test(s),`${row.canonical_movement}: not an SVG document`);
  need(/viewBox="0 0 \d+ \d+"/.test(s),`${row.canonical_movement}: missing stable viewBox`);
  need(/role="img"/.test(s),`${row.canonical_movement}: missing image role`);
  need(/<title\b[^>]*>[^<]+<\/title>/.test(s),`${row.canonical_movement}: missing accessible title`);
  need(/<desc\b[^>]*>[^<]+<\/desc>/.test(s),`${row.canonical_movement}: missing accessible description`);
  for(const state of ['START','MOVE','FINISH'])need(new RegExp(`>${state}<`,'i').test(s),`${row.canonical_movement}: missing ${state} state label`);
  need(!genericCue.test(s),`${row.canonical_movement}: generic START/MOVE/FINISH coaching placeholder leaked into premium candidate`);
  need(!/<script\b/i.test(s),`${row.canonical_movement}: scripts forbidden`);
  need(!/\b(?:href|src)=["']https?:/i.test(s),`${row.canonical_movement}: external assets forbidden`);
  need(s.length>=1500,`${row.canonical_movement}: candidate too thin to count as explanatory artwork`);
  need(Array.isArray(row.states)&&row.states.join('|')==='START|MOVE|FINISH',`${row.canonical_movement}: state ledger mismatch`);
}
if(fail.length){console.error(JSON.stringify({proof:'FIT_PREMIUM_CANDIDATE_TECHNICAL_QA_V1',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'FIT_PREMIUM_CANDIDATE_TECHNICAL_QA_V1',status:'PASS',produced:rows.length,technicalCandidates:rows.map(x=>x.canonical_movement),criterion:'Self-contained movement-bound accessible START -> MOVE -> FINISH premium candidates with movement-specific state cues only. Domain/anatomical/member-comprehension approval remains separate.'},null,2));
