import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {assertPublishableStructuredContent} from './structured-content-v1.js';
import {buildIndustrialCatalogue} from './industrial-catalogue-v14.js';
import {applyFitCanonicalGuidance} from './fit-canonical-guidance-v1.mjs';

const human=read('evidence/matt-v1-final-content-acceptance-2026-08-14.json');
const grubDecisions=read('evidence/grub-v1-final-decisions-2026-08-14.json');
const fitDecisions=read('evidence/fit-v1-final-decisions-2026-08-14.json');
const fitLedger=read('content/fit/premium-visual-production-v1.json');
const grubPayloadPath=process.env.GRUB_PUBLISHABLE_FILE||process.argv[2]||'final-v1-publication-evidence/grub/grub-v1-publishable.json';
const outDir=process.env.FINAL_V1_PUBLICATION_DIR||'final-v1-publication-evidence';
fs.mkdirSync(outDir,{recursive:true});

need(human?.proof==='MATT_V1_FINAL_AUTHORITATIVE_HUMAN_ACCEPTANCE_2026_08_14','final human acceptance authority missing');
need(human?.grub?.decision==='PASS'&&human?.fit?.decision==='PASS','both final human decisions must PASS');
need(Array.isArray(grubDecisions?.decisions)&&grubDecisions.decisions.length===8&&grubDecisions.decisions.every(x=>x.decision==='PASS'),'exactly 8 accepted Grub decisions required');
need(Array.isArray(fitDecisions?.decisions)&&fitDecisions.decisions.length===26&&fitDecisions.decisions.every(x=>x.decision==='PASS'),'exactly 26 accepted Fit decisions required');

const grubPayload=read(grubPayloadPath);
need(grubPayload?.proof==='M11_V1_PUBLISHABLE_CONTENT_V1','Grub publishable payload proof invalid');
need(grubPayload?.source_summary?.requiredRecipes===798&&grubPayload?.source_summary?.requiredTemplateDecisions===8,'Grub publication authority drifted');
need(Array.isArray(grubPayload?.items)&&grubPayload.items.length===798,'exactly 798 Grub publication items required');

const finalMarker={accepted:true,reviewer:'Matt',accepted_at:human.accepted_at,proof:human.proof};
const grubItems=grubPayload.items.map(item=>{
  const data={...item.data,provenance:{...(item.data?.provenance||{}),final_v1_acceptance:{...finalMarker,review_run:human.grub.review_run,artifact_id:human.grub.artifact_id,artifact_sha256:human.grub.artifact_sha256}},canonical_review:{...(item.data?.canonical_review||{}),accepted:true,decision_source:'M11_SECOND_PERSON_DECISIONS'}};
  const review={...(item.review||{}),status:'approved',reviewer:'Matt',reviewed_at:human.accepted_at,final_v1:true};
  const out={...item,status:'published',data,review};assertPublishableStructuredContent(out);return out;
});
need(new Set(grubItems.map(x=>x.id)).size===798,'Grub publication ids are not unique');

const acceptedFit=new Set(fitDecisions.decisions.map(x=>String(x.movement_id)));
const fitVisuals=new Map((fitLedger?.produced_candidates||[]).map(x=>[String(x.canonical_movement),x]));
need(fitLedger?.geometry_version==='v3'&&fitLedger?.counts?.produced===26&&fitLedger?.counts?.technically_qa_passed===26,'Fit v3 technical authority is not 26/26');
need([...acceptedFit].every(id=>fitVisuals.has(id)),'accepted Fit movement missing produced v3 visual');

const fitSource=buildIndustrialCatalogue().exercises.filter(x=>acceptedFit.has(String(x.canonical_movement)));
need(fitSource.length===1326,`expected 1,326 accepted Fit descendants, got ${fitSource.length}`);
const perCanonical=new Map();for(const x of fitSource)perCanonical.set(x.canonical_movement,(perCanonical.get(x.canonical_movement)||0)+1);
need([...acceptedFit].every(id=>perCanonical.get(id)===51),`each accepted Fit movement must bind exactly 51 descendants: ${JSON.stringify(Object.fromEntries(perCanonical))}`);

const fitItems=fitSource.map(source=>{
  const canonical=String(source.canonical_movement),visual=fitVisuals.get(canonical),guided=applyFitCanonicalGuidance({...source,name:source.title});
  const regression=guided?.regression?.instruction?[guided.regression.instruction]:Array.isArray(source.regressions)?source.regressions:[];
  const progression=guided?.progression?.instruction?[guided.progression.instruction]:Array.isArray(source.progressions)?source.progressions:[];
  const data={...source,
    minutes:estimateMinutes(source),
    serving_groups:SERVING_GROUPS[canonical]||[String(source.movement_group||'')],
    equipment:normaliseEquipment(source.equipment),
    instructions:guided.instructions||source.instructions||[],
    form_cues:[...(guided.form_cues||[]),...(guided.safety_cues||[])],
    safety_cues:guided.safety_cues||source.safety_cues||[],
    regressions:regression,
    progressions:progression,
    visual:{status:'approved',asset_ref:visual.asset,alt_text:guided?.visual?.alt_text||`${visual.display_name}: START, MOVE and FINISH coaching sequence.`,geometry:'v3',canonical_movement:canonical},
    canonical_review:{scope:'canonical_movement',canonical_movement:canonical,accepted:true,decision_source:'FIT_V1_DOMAIN_MEMBER_ACCEPTANCE'},
    provenance:{...(source.provenance||{}),final_v1_acceptance:{...finalMarker,review_run:human.fit.review_run,artifact_id:human.fit.artifact_id,artifact_sha256:human.fit.artifact_sha256,canonical_movement:canonical}}
  };
  const review={status:'approved',scope:'canonical_movement',canonical_movement:canonical,decision_source:'FIT_V1_DOMAIN_MEMBER_ACCEPTANCE',reviewer:'Matt',reviewed_at:human.accepted_at,final_v1:true};
  const out={id:source.id,contentType:'exercise',title:source.title,version:1,status:'published',data,review};assertPublishableStructuredContent(out);return out;
});
need(new Set(fitItems.map(x=>x.id)).size===1326,'Fit publication ids are not unique');
need(!fitItems.some(x=>grubItems.some(r=>r.id===x.id)),'cross-product publication id collision');

const all=[...grubItems,...fitItems];
const sql=sqlFor(all);
const sqlPath=path.join(outDir,'final-v1-production-publication.sql');fs.writeFileSync(sqlPath,sql);
localVerify(sql,grubItems,fitItems);

const byMeal=Object.fromEntries(['breakfast','lunch','dinner','snack'].map(t=>[t,grubItems.filter(x=>x.data?.meal_type===t).length]));
const summary={proof:'FINAL_V1_PRODUCTION_PUBLICATION_READY_V1',status:'PASS',humanAuthority:{proof:human.proof,reviewer:human.reviewer,accepted_at:human.accepted_at},grub:{published:grubItems.length,decisions:8,byMeal},fit:{published:fitItems.length,canonicalDecisions:26,perCanonical:Object.fromEntries([...perCanonical].sort())},totalPublished:all.length,publicationLayer:'existing structured_content',partialPublicationAllowed:false,productionPass:false,next:'apply SQL to production D1 only after current main is explicitly deployed, then prove authenticated member serving'};
fs.writeFileSync(path.join(outDir,'final-v1-production-publication-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
console.log('PASS Final V1 publication readiness: exact human-accepted 798 Grub + 1,326 Fit descendants validate against the existing structured_content publication contract. No audit PASS is inferred until production D1 publication and authenticated serving proof succeed.');

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function need(ok,msg){if(!ok)throw new Error(msg)}
function estimateMinutes(x){const d=x?.dosage||{},sets=Math.max(1,Number(d.sets)||1),rest=Math.max(0,Number(d.rest_seconds)||0);let sec;if(Number(d.time_seconds)>0)sec=sets*Number(d.time_seconds)+Math.max(0,sets-1)*rest;else sec=sets*45+Math.max(0,sets-1)*rest;return Math.max(3,Math.min(15,Math.round(sec/60)))}
function normaliseEquipment(v){const xs=(Array.isArray(v)?v:[v]).filter(Boolean).map(x=>String(x).toLowerCase());const out=[];for(const x of xs){if(['bodyweight','none'].includes(x))out.push('none');else if(x==='dumbbell')out.push('dumbbell','dumbbells');else if(x==='band')out.push('band','resistance band');else if(x==='cable')out.push('cable','full gym');else if(x==='bike')out.push('stationary bike','full gym');else if(x==='rowing-erg')out.push('rowing erg','full gym');else out.push(x)}return [...new Set(out.length?out:['none'])]}
function q(v){return `'${String(v).replaceAll("'","''")}'`}
function sqlFor(items){const rows=items.map(x=>`INSERT INTO structured_content(id,content_type,title,version,status,data_json,review_json,updated_at) VALUES(${q(x.id)},${q(x.contentType)},${q(x.title)},1,'published',${q(JSON.stringify(x.data))},${q(JSON.stringify(x.review))},CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,version=structured_content.version+1,status='published',data_json=excluded.data_json,review_json=excluded.review_json,updated_at=CURRENT_TIMESTAMP;`).join('\n');return `BEGIN;\nCREATE TABLE IF NOT EXISTS structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',data_json TEXT NOT NULL,review_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);\nCREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status);\n${rows}\nCOMMIT;\n`}
function localVerify(sql,grub,fit){const db=new DatabaseSync(':memory:');db.exec(sql);const rows=db.prepare("SELECT id,content_type,status,data_json,review_json FROM structured_content WHERE status='published'").all();need(rows.length===2124,`local publication row count ${rows.length}`);let g=0,f=0;for(const row of rows){const d=JSON.parse(row.data_json),r=JSON.parse(row.review_json);need(d?.provenance?.final_v1_acceptance?.accepted===true,`row lacks final acceptance provenance: ${row.id}`);need(r?.status==='approved'&&r?.final_v1===true,`row lacks final approved review: ${row.id}`);if(row.content_type==='recipe')g++;else if(row.content_type==='exercise')f++;}need(g===grub.length&&f===fit.length,`local publication partition ${g}/${f}`)}

const SERVING_GROUPS={
  'calf-raise':['legs','warmup'],'chair-balance-reach':['warmup','core'],'dead-bug':['core'],'chest-press':['push'],'glute-bridge':['core','legs'],'squat':['legs'],'hamstring-mobility':['warmup','core'],'hip-flexor-mobility':['warmup','core'],'hip-hinge':['legs','core'],'lat-pulldown':['pull'],'loaded-carry':['core','pull'],'low-impact-march':['warmup','cardio'],'row':['pull'],'overhead-press':['push'],'plank':['core'],'push-up':['push'],'reverse-lunge':['legs'],'rowing-erg':['cardio','pull'],'shadow-boxing':['cardio','warmup'],'sit-to-stand':['legs'],'stationary-bike':['cardio'],'step-up':['legs','cardio'],'thoracic-rotation':['warmup','core'],'triceps-extension':['push'],'walk':['cardio','warmup'],'wall-slides':['warmup','push']
};