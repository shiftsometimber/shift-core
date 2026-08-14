import fs from 'node:fs';
import {FIT_CANONICAL_GUIDANCE} from './fit-canonical-guidance-v1.mjs';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

const AUTHORITY='matt-final-v1-2026-08-14';
const API_BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const decisionsFile=process.env.FIT_DECISIONS_FILE||'evidence/fit-v1-final-decisions-2026-08-14.json';
const outDir=process.env.FIT_PUBLICATION_DIR||'fit-publication-evidence';
const contracts=JSON.parse(fs.readFileSync('content/fit/premium-v1-render-contracts.json','utf8'));
const decisions=JSON.parse(fs.readFileSync(decisionsFile,'utf8'));
fs.mkdirSync(outDir,{recursive:true});
if(!Array.isArray(contracts)||contracts.length!==26)throw new Error(`expected 26 accepted render contracts, got ${contracts?.length}`);
if(decisions?.proof!=='FIT_V1_DOMAIN_MEMBER_ACCEPTANCE'||Number(decisions?.required_movements)!==26)throw new Error('final Fit decision authority invalid');
const rows=Array.isArray(decisions.decisions)?decisions.decisions:[];
if(rows.length!==26||rows.some(x=>String(x?.decision||'').toUpperCase()!=='PASS'))throw new Error('all 26 final Fit decisions must PASS together');
const accepted=new Set(rows.map(x=>String(x.canonical_movement||x.id||'')));
if(accepted.size!==26)throw new Error(`expected 26 unique accepted movements, got ${accepted.size}`);

const groups={
  'sit-to-stand':'legs','squat':'legs','reverse-lunge':'legs','calf-raise':'lower-leg','step-up':'legs',
  'hip-hinge':'hinge','glute-bridge':'hinge',
  'push-up':'push','chest-press':'push','overhead-press':'push','triceps-extension':'push',
  'row':'pull','lat-pulldown':'pull',
  'plank':'core','dead-bug':'core','loaded-carry':'carry',
  'walk':'cardio','stationary-bike':'cardio','rowing-erg':'cardio','low-impact-march':'cardio','shadow-boxing':'cardio',
  'chair-balance-reach':'balance',
  'hamstring-mobility':'mobility','hip-flexor-mobility':'mobility','thoracic-rotation':'mobility','wall-slides':'mobility'
};
const categories={cardio:'cardio',mobility:'mobility',balance:'balance'};
const machineOnly=new Set(['lat-pulldown','stationary-bike','rowing-erg']);
const outdoorOK=new Set(['walk','loaded-carry','low-impact-march','shadow-boxing']);
const dosage=(id,group)=>{
  if(id==='plank')return{sets:3,time_seconds:20,rest_seconds:30,member_note:'Hold only while the coached body position stays solid; stop earlier if form changes.'};
  if(group==='cardio')return{sets:1,reps:'5–10 minutes at a comfortable purposeful effort',rest_seconds:0,member_note:'Build duration gradually and stay within a conversational effort unless your plan says otherwise.'};
  if(group==='mobility')return{sets:2,reps:'5–8 slow controlled reps each side where applicable',rest_seconds:20,member_note:'Use a mild comfortable range; never force a stretch.'};
  if(group==='balance')return{sets:2,reps:'5 controlled reaches each side',rest_seconds:30,member_note:'Keep sturdy support within easy reach and stop if balance cannot be recovered comfortably.'};
  if(group==='carry')return{sets:3,reps:'20–30 seconds',rest_seconds:45,member_note:'Choose a load and route you can control without leaning or rushing.'};
  if(group==='core')return{sets:3,reps:'6–10 controlled reps each side where applicable',rest_seconds:30};
  return{sets:3,reps:'8–12 controlled reps',rest_seconds:60,member_note:'Use a load/range that keeps every rep smooth and pain-free.'};
};

const items=contracts.map(c=>{
  if(!accepted.has(c.id))throw new Error(`render contract not present in accepted decision set: ${c.id}`);
  const g=FIT_CANONICAL_GUIDANCE[c.id];if(!g)throw new Error(`canonical guidance missing: ${c.id}`);
  const movement_group=groups[c.id];if(!movement_group)throw new Error(`movement group missing: ${c.id}`);
  const locations=machineOnly.has(c.id)?['gym']:[...new Set(['home','gym','hotel',...(outdoorOK.has(c.id)?['outside']:[])])];
  const equipment=String(g.member_equipment||'None').split(/\s+or\s+|\//i).map(x=>x.trim().toLowerCase().replace(/\s+/g,'-')).filter(Boolean);
  const item={
    id:`final-v1-${c.id}`,
    contentType:'exercise',
    title:c.name,
    status:'published',
    data:{
      canonical_movement:c.id,
      movement_group,
      category:categories[movement_group]||'strength',
      minutes:movement_group==='cardio'?8:movement_group==='mobility'||movement_group==='balance'?5:6,
      equipment,
      locations,
      dosage:dosage(c.id,movement_group),
      instructions:[g.instructions[0],`START: ${c.start}`,`MOVE: ${c.move}`,`FINISH: ${c.finish}`],
      form_cues:g.form_cues||[],
      safety_cues:g.safety_cues||[],
      regressions:g.regression?.instruction?[g.regression.instruction]:[],
      progressions:g.progression?.instruction?[g.progression.instruction]:[],
      substitutions:[],
      limitations:{avoid:[],caution:[]},
      visual:{status:'approved',asset_ref:`${API_BASE}/fit-premium/${c.id}.svg`,alt_text:`${c.name}: accepted Shift Fit START, MOVE and FINISH coaching sequence.`},
      provenance:{authority:AUTHORITY,decision_source:'FIT_V1_DOMAIN_MEMBER_ACCEPTANCE',render_contract:'content/fit/premium-v1-render-contracts.json'}
    },
    review:{status:'approved',authority:AUTHORITY,decision_source:'FIT_V1_DOMAIN_MEMBER_ACCEPTANCE',canonical_movement:c.id}
  };
  assertPublishableStructuredContent(item);return item;
});
if(items.length!==26||new Set(items.map(x=>x.data.canonical_movement)).size!==26)throw new Error('Fit publication payload must contain exactly 26 unique accepted movements');
const summary={proof:'FIT_V1_PUBLISHABLE_CONTENT_V1',authority:AUTHORITY,acceptedMovements:26,publishableExercises:items.length,assetOrigin:API_BASE,groups:Object.fromEntries([...new Set(items.map(x=>x.data.movement_group))].map(g=>[g,items.filter(x=>x.data.movement_group===g).length])),publicationReady:true};
fs.writeFileSync(`${outDir}/fit-v1-publication-summary.json`,JSON.stringify(summary,null,2));
fs.writeFileSync(`${outDir}/fit-v1-publishable.json`,JSON.stringify({proof:'FIT_V1_PUBLISHABLE_CONTENT_V1',authority:AUTHORITY,items},null,2));
console.log(JSON.stringify(summary,null,2));
