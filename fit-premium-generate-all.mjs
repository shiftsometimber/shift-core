import fs from 'node:fs';
import path from 'node:path';

const contracts=JSON.parse(fs.readFileSync('content/fit/premium-v1-render-contracts.json','utf8'));
if(!Array.isArray(contracts)||contracts.length!==26)throw new Error(`expected 26 render contracts, got ${contracts?.length}`);
const out='assets/fit/premium';fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const poseHash=id=>[...id].reduce((n,c)=>n+c.charCodeAt(0),0)%72;
const states=['START','MOVE','FINISH'];
function panel(x,label,cue,h,index){
 const move=index===1;const cx=move?165-Math.floor(h/9):175,cy=move?90+Math.floor(h/10):88;
 const armA=move?-55+Math.floor(h/5):-58,armB=move?70-Math.floor(h/6):58;
 const legA=move?-65+Math.floor(h/5):-42,legB=move?72-Math.floor(h/7):47;
 return `<g transform="translate(${x} 118)"><rect width="350" height="270" rx="22" fill="#fffdf8"/><text x="24" y="35" fill="#173c29" font-family="Arial,sans-serif" font-size="16" font-weight="800">${label}</text><circle cx="${cx}" cy="${cy}" r="24" fill="#d7b08a" stroke="#173c29" stroke-width="4"/><path d="M${cx} ${cy+28}l${move?8:0} 80m0-55l${armA} ${move?34:20}m${move?8:0}-34l${armB} ${move?16:20}m-${move?8:0} 70l${legA} ${move?64:73}m${move?8:0}-64l${legB} ${move?61:73}" stroke="#173c29" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M${cx} ${cy+28}l${move?8:0} 80" stroke="#eef4e8" stroke-width="28" stroke-linecap="round"/><path d="M${cx} ${cy+28}l${move?8:0} 80" stroke="#173c29" stroke-width="4" stroke-linecap="round"/><text x="20" y="248" fill="#53624d" font-family="Arial,sans-serif" font-size="13">${esc(String(cue).slice(0,58))}</text></g>`;
}
function equipment(id){
 if(/chest-press|row|overhead-press|loaded-carry|triceps-extension|squat/.test(id))return '<g stroke="#c7eb16" stroke-width="7" fill="none"><rect x="564" y="205" width="42" height="20" rx="5"/><path d="M552 215h66"/></g>';
 if(/sit-to-stand|chair-balance-reach/.test(id))return '<g stroke="#8b9670" stroke-width="7" fill="none"><path d="M500 280h120v54M500 280v54M500 334h120"/></g>';
 if(id==='stationary-bike')return '<g stroke="#8b9670" stroke-width="7" fill="none"><circle cx="530" cy="302" r="35"/><circle cx="635" cy="302" r="35"/><path d="M530 302l50-55 28 55h-78l50-55h62"/></g>';
 if(id==='rowing-erg')return '<g stroke="#8b9670" stroke-width="7" fill="none"><path d="M480 325h190M545 325l38-60h55"/><circle cx="654" cy="255" r="16"/></g>';
 if(id==='lat-pulldown')return '<g stroke="#8b9670" stroke-width="7" fill="none"><path d="M490 165h180M580 165v75M530 200h100"/></g>';
 if(id==='step-up')return '<rect x="500" y="305" width="150" height="45" rx="8" fill="#8b9670"/>';
 if(id==='wall-slides')return '<rect x="690" y="145" width="10" height="210" fill="#8b9670"/>';
 return '';
}
for(const c of contracts){
 const h=poseHash(c.id);const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" role="img" aria-labelledby="title desc"><title id="title">${esc(c.name)} — START, MOVE, FINISH</title><desc id="desc">Three-state Shift Fit coaching sequence for ${esc(c.name)}. ${esc(c.instruction)}</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10261a"/><stop offset="1" stop-color="#244f38"/></linearGradient><filter id="shadow"><feDropShadow dy="7" stdDeviation="9" flood-opacity=".18"/></filter></defs><rect width="1200" height="420" rx="30" fill="url(#bg)"/><text x="38" y="48" fill="#c7eb16" font-family="Arial,sans-serif" font-size="17" font-weight="800">SHIFT FIT · ${esc(c.name.toUpperCase())}</text><text x="38" y="78" fill="#fff" font-family="Arial,sans-serif" font-size="16">${esc(c.instruction.slice(0,112))}</text><g filter="url(#shadow)">${panel(35,'START',c.start,h,0)}${panel(425,'MOVE',c.move,h,1)}${panel(815,'FINISH',c.finish,h,2)}</g>${equipment(c.id)}<path d="M393 250h26m365 0h26" stroke="#c7eb16" stroke-width="7" stroke-linecap="round"/><path d="M411 242l9 8-9 8M802 242l9 8-9 8" fill="none" stroke="#c7eb16" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 fs.writeFileSync(path.join(out,`${c.id}.svg`),svg);
}
const ledger={schema_version:2,contract:'Premium Shift-owned START -> MOVE -> FINISH coaching artwork generated directly from the canonical V1 render contracts. Technical QA is deterministic; domain/member-comprehension approval remains separate.',launch_total:26,production_batches:[{batch:1,status:'produced',canonical_movements:contracts.map(x=>x.id)}],produced_candidates:contracts.map(c=>({canonical_movement:c.id,display_name:c.name,asset:`assets/fit/premium/${c.id}.svg`,states:states,status:'produced_candidate',technical_qa:'pending',domain_acceptance:'pending'})),acceptance:{movement_match:true,three_distinct_states:states,movement_specific:true,member_comprehension:true,safety_cues_consistent_with_canonical_guidance:true,desktop_and_mobile_render:true,domain_approval_required:true},counts:{produced:26,technically_qa_passed:0,domain_accepted:0}};
fs.writeFileSync('content/fit/premium-visual-production-v1.json',JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({proof:'FIT_PREMIUM_GENERATION_V2',produced:contracts.length,assets:contracts.map(x=>x.id)},null,2));
