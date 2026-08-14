import fs from 'node:fs';
import path from 'node:path';
import {movementFigure,movementGeometryVersion} from './fit-premium-movement-geometry-v3.mjs';
const contracts=JSON.parse(fs.readFileSync('content/fit/premium-v1-render-contracts.json','utf8'));
if(!Array.isArray(contracts)||contracts.length!==26)throw new Error(`expected 26 render contracts, got ${contracts?.length}`);
const out='assets/fit/premium';fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&apos;'}[c]));
const states=['START','MOVE','FINISH'],cues=c=>[c.start,c.move,c.finish];
function wrapWords(value,max=47,maxLines=3){
  const words=String(value||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length<=max||!line){line=next;continue}lines.push(line);line=word;}
  if(line)lines.push(line);
  if(lines.length>maxLines)throw new Error(`copy exceeds ${maxLines} lines at ${max} chars: ${value}`);
  return lines;
}
function textLines(lines,{x,y,dy=15}={}){return lines.map((line,i)=>`<tspan x="${x}" y="${y+i*dy}">${esc(line)}${i<lines.length-1?' ':''}</tspan>`).join('')}
function panel(x,c,i){
  const fig=movementFigure(c.id,i);if(!fig)throw new Error(`${c.id}: missing ${states[i]} geometry`);
  const cue=String(cues(c)[i]),lines=wrapWords(cue,47,3),startY=lines.length===1?257:lines.length===2?248:239;
  return `<g transform="translate(${x} 128)"><rect width="350" height="280" rx="22" fill="#fffdf8"/><text x="24" y="32" fill="#173c29" font-family="Arial,sans-serif" font-size="16" font-weight="800">${states[i]}</text>${fig}<text x="20" y="${startY}" fill="#53624d" font-family="Arial,sans-serif" font-size="12">${textLines(lines,{x:20,y:startY,dy:15})}</text></g>`;
}
for(const c of contracts){
  for(let i=0;i<3;i++)movementFigure(c.id,i);
  const instructionLines=wrapWords(c.instruction,116,2);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 440" role="img" aria-labelledby="title desc" data-geometry="${movementGeometryVersion}" data-movement="${esc(c.id)}"><title id="title">${esc(c.name)} — START, MOVE, FINISH</title><desc id="desc">Movement-specific three-state Shift Fit coaching sequence for ${esc(c.name)}. ${esc(c.instruction)}</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10261a"/><stop offset="1" stop-color="#244f38"/></linearGradient><filter id="shadow"><feDropShadow dy="7" stdDeviation="9" flood-opacity=".18"/></filter></defs><rect width="1200" height="440" rx="30" fill="url(#bg)"/><text x="38" y="48" fill="#c7eb16" font-family="Arial,sans-serif" font-size="17" font-weight="800">SHIFT FIT · ${esc(c.name.toUpperCase())}</text><text x="38" y="76" fill="#fff" font-family="Arial,sans-serif" font-size="15">${textLines(instructionLines,{x:38,y:76,dy:18})}</text><g filter="url(#shadow)">${panel(35,c,0)}${panel(425,c,1)}${panel(815,c,2)}</g><path d="M393 260h26m365 0h26" stroke="#c7eb16" stroke-width="7" stroke-linecap="round"/><path d="M411 252l9 8-9 8M802 252l9 8-9 8" fill="none" stroke="#c7eb16" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  fs.writeFileSync(path.join(out,`${c.id}.svg`),svg);
}
const ledger={schema_version:3,contract:'Premium Shift-owned START -> MOVE -> FINISH coaching artwork generated from explicit movement-specific body/equipment geometry. Technical QA is deterministic; domain/member-comprehension approval remains separate.',geometry_version:movementGeometryVersion,launch_total:26,production_batches:[{batch:2,status:'produced',canonical_movements:contracts.map(x=>x.id)}],produced_candidates:contracts.map(c=>({canonical_movement:c.id,display_name:c.name,asset:`assets/fit/premium/${c.id}.svg`,states,status:'produced_candidate',technical_qa:'pending',domain_acceptance:'pending',geometry:movementGeometryVersion})),acceptance:{movement_match:true,three_distinct_states:states,movement_specific:true,equipment_integrated:true,member_comprehension:true,safety_cues_consistent_with_canonical_guidance:true,desktop_and_mobile_render:true,domain_approval_required:true,full_cues_untruncated:true},counts:{produced:26,technically_qa_passed:0,domain_accepted:0}};
fs.writeFileSync('content/fit/premium-visual-production-v1.json',JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({proof:'FIT_PREMIUM_GENERATION_V3_MOVEMENT_SPECIFIC',geometry:movementGeometryVersion,produced:contracts.length,fullCueRendering:true},null,2));
