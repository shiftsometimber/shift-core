import fs from 'node:fs';
import path from 'node:path';

const OUT=process.env.FIT_OPEN_CATALOGUE_DIR||'fit-open-catalogue-evidence';
const MINIMUM=2500;
const CURRENT_SHIFT=1326;
fs.mkdirSync(OUT,{recursive:true});

const tidy=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const key=value=>tidy(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const usable=x=>x.name&&x.instructions.length&&x.equipment.length;

async function json(url){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Catalogue/1.0'}});if(!r.ok)throw new Error(`${url} returned ${r.status}`);return r.json()}

async function exerciseDb(){
  const body=await json('https://oss.exercisedb.dev/api/v1/exercises?limit=2000&offset=0');
  const rows=Array.isArray(body)?body:body.data||body.exercises||[];
  return rows.map(x=>({source:'ExerciseDB OSS',source_id:String(x.exerciseId||x.id||''),name:tidy(x.name),instructions:(x.instructions||[]).map(tidy).filter(Boolean),equipment:[tidy(x.equipments?.[0]||x.equipment||'none')].filter(Boolean),body_parts:(x.bodyParts||[x.bodyPart]).map(tidy).filter(Boolean),media_url:/^https:\/\//.test(x.gifUrl||'')?x.gifUrl:null,licence:'provider free hosted tier; commercial terms require final legal check'}));
}

async function wger(){
  let next='https://wger.de/api/v2/exerciseinfo/?language=2&limit=100',rows=[];
  while(next&&rows.length<1200){const body=await json(next);rows.push(...(body.results||[]));next=body.next}
  return rows.map(x=>{const translation=(x.translations||[]).find(y=>Number(y.language)===2)||x.translations?.[0]||{};return{source:'wger',source_id:String(x.uuid||x.id||''),name:tidy(translation.name),instructions:[tidy(translation.description)].filter(Boolean),equipment:(x.equipment||[]).map(y=>tidy(y.name)).filter(Boolean),body_parts:(x.category?[tidy(x.category.name)]:[]),media_url:null,licence:'AGPL-3.0+ / record attribution retained'}});
}

const settled=await Promise.allSettled([exerciseDb(),wger()]);
const failures=settled.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason));
const external=settled.filter(x=>x.status==='fulfilled').flatMap(x=>x.value).filter(usable);
const unique=new Map();for(const row of external){const k=key(row.name);if(k&&!unique.has(k))unique.set(k,row)}
const candidates=[...unique.values()],projected=CURRENT_SHIFT+candidates.length;
const summary={proof:'FIT_OPEN_CATALOGUE_INGEST_V1',generated_at:new Date().toISOString(),minimum_required:MINIMUM,current_shift_approved:CURRENT_SHIFT,external_usable_unique:candidates.length,projected_before_cross_catalogue_deduplication:projected,sources:[...new Set(candidates.map(x=>x.source))],provider_failures:failures,publication_ready:false,reason:projected<MINIMUM?'insufficient unique candidates':'requires Shift safety, duplication, licensing and visual review before publication'};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'review-candidates.json'),JSON.stringify(candidates,null,2));
console.log(JSON.stringify(summary,null,2));
if(projected<MINIMUM)process.exitCode=2;
