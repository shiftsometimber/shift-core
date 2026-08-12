import {buildIndustrialCatalogue} from './industrial-catalogue-v2.js';
const c=buildIndustrialCatalogue(),recipes=c.recipes,exercises=c.exercises;
const GRUB_HORIZONS=[7,14,30,60,90,180,365],FIT_WEEKS=[4,8,12,26,52];
const GRUB_PERSONAS=[
 {id:'general',allow:()=>true},
 {id:'no-fish',allow:r=>!/(tuna|salmon|prawn)/i.test(`${r.title} ${r.ingredients.map(x=>x.item).join(' ')}`)},
 {id:'no-egg',allow:r=>!r.allergens?.includes('egg')&&!/egg/i.test(r.title)},
 {id:'workday-fast',allow:r=>Number(r.prep_minutes||0)+Number(r.cook_minutes||0)<=30}
];
const FIT_PERSONAS=[
 {id:'home-basic',location:'home',equipment:new Set(['none','bodyweight','chair','wall','band','dumbbells','support','step'])},
 {id:'gym-full',location:'gym',equipment:new Set(['none','bodyweight','chair','wall','band','dumbbells','support','step','full-gym','cable','exercise-bike','cross-trainer','treadmill'])},
 {id:'hotel',location:'hotel',equipment:new Set(['none','bodyweight','chair','wall','band','dumbbells','support'])},
 {id:'knee-cautious',location:'home',equipment:new Set(['none','bodyweight','chair','wall','band','dumbbells','support']),avoid:/knee/i}
];
function proteinKey(r){const t=`${r.title} ${r.ingredients.map(x=>x.item).join(' ')}`.toLowerCase();for(const k of ['chicken','turkey','tuna','salmon','egg','bean','chickpea','tofu','beef','pork','prawn','lentil','yoghurt','cottage cheese'])if(t.includes(k))return k;return'other'}
function formatKey(r){return String(r.id).replace(/^industrial-(?:breakfast|lunch|dinner|snack)-/,'').split('-').slice(0,-1).join('-')||r.meal_type}
function cycle(pool,count){const out=[];for(let i=0;i<count;i++)out.push(pool[i%pool.length]);return out}
function streakMax(items,keyFn){let max=0,cur=0,last=null;for(const x of items){const k=keyFn(x);cur=k===last?cur+1:1;last=k;max=Math.max(max,cur)}return max}
function repeats(items,keyFn){const seen=new Set;let n=0;for(const x of items){const k=keyFn(x);if(seen.has(k))n++;else seen.add(k)}return n}
function grubRun(persona,days){const slots=['breakfast','lunch','dinner','snack'];const sequence=[];const perMeal={};for(const meal of slots){const pool=recipes.filter(r=>r.meal_type===meal&&persona.allow(r));if(!pool.length)throw new Error(`${persona.id}/${meal}: empty pool`);const used=cycle(pool,days);perMeal[meal]={pool:pool.length,exactRepeats:repeats(used,x=>x.id),unique:new Set(used.map(x=>x.id)).size,firstRepeatDay:days>pool.length?pool.length+1:null};for(let i=0;i<days;i++)sequence.push(used[i])}return{persona:persona.id,days,slots:days*4,perMeal,exactRepeats:repeats(sequence,x=>x.id),proteinRepeats:repeats(sequence,proteinKey),formatRepeats:repeats(sequence,formatKey),maxConsecutiveProtein:streakMax(sequence,proteinKey),gapSignals:Object.entries(perMeal).filter(([,x])=>x.firstRepeatDay&&x.firstRepeatDay<=Math.min(days,30)).map(([meal,x])=>({type:'grub_depth',meal,pool:x.pool,firstRepeatDay:x.firstRepeatDay}))}}
function fitAllowed(x,p){if(!(x.locations||[]).includes(p.location))return false;if(p.avoid&&(x.limitations?.avoid||[]).some(v=>p.avoid.test(v)))return false;const req=x.equipment||[];return !req.length||req.some(e=>p.equipment.has(String(e).toLowerCase())||String(e).toLowerCase()==='none')}
function fitRun(p,weeks,{sessionsPerWeek=3,slotsPerSession=5}={}){const pool=exercises.filter(x=>fitAllowed(x,p));if(pool.length<slotsPerSession)throw new Error(`${p.id}: insufficient Fit pool ${pool.length}`);const total=weeks*sessionsPerWeek*slotsPerSession,used=cycle(pool,total),sessions=[];for(let i=0;i<used.length;i+=slotsPerSession)sessions.push(used.slice(i,i+slotsPerSession));const familySequence=used.map(x=>x.movement_group);const sessionFingerprints=sessions.map(s=>s.map(x=>x.canonical_movement).sort().join('|'));return{persona:p.id,weeks,sessions:sessions.length,exerciseSlots:total,pool:pool.length,uniqueExercises:new Set(used.map(x=>x.id)).size,canonicalMovements:new Set(used.map(x=>x.canonical_movement)).size,movementGroups:new Set(familySequence).size,exactRepeats:repeats(used,x=>x.id),familyRepeats:repeats(used,x=>x.movement_group),sessionSimilarityRepeats:repeats(sessionFingerprints,x=>x),maxConsecutiveFamily:streakMax(used,x=>x.movement_group),gapSignals:pool<52?[{type:'fit_depth',persona:p.id,pool,targetHint:52}]:[]}}
const grub=GRUB_PERSONAS.flatMap(p=>GRUB_HORIZONS.map(d=>grubRun(p,d)));const fit=FIT_PERSONAS.flatMap(p=>FIT_WEEKS.map(w=>fitRun(p,w)));
const gaps=[...grub.flatMap(x=>x.gapSignals),...fit.flatMap(x=>x.gapSignals)];
const out={catalogue:{grub:recipes.length,fit:exercises.length},grub:{horizons:GRUB_HORIZONS,personas:GRUB_PERSONAS.map(x=>x.id),runs:grub},fit:{weeks:FIT_WEEKS,personas:FIT_PERSONAS.map(x=>x.id),runs:fit},factoryDemand:gaps,rule:'Capacity-only: authored/quarantined objects expose future breadth holes but do not count as commissioned production inventory.'};
console.log(JSON.stringify(out,null,2));
if(grub.length!==28||fit.length!==20)throw new Error('long-horizon simulation matrix incomplete');
if(!grub.every(x=>x.slots===x.days*4))throw new Error('Grub slot accounting drift');
if(!fit.every(x=>x.sessions===x.weeks*3))throw new Error('Fit session accounting drift');
console.log(`PASS industrial long-horizon simulation: ${grub.length} Grub persona/horizon runs through 365 days + ${fit.length} Fit persona/horizon runs through 52 weeks; ${gaps.length} catalogue-demand signals emitted.`);
