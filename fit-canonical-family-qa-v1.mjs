import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';
const c=buildIndustrialCatalogue();
const xs=(c.exercises||[]).filter(x=>String(x.id).startsWith('industrial-v3-fit-'));
const groups=new Map();for(const x of xs){const k=x.canonical_movement;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
const failures=[];const approved=[];let protocolPass=0,visualBindings=0;
for(const [family,items] of groups){
  const exemplar=items[0];const issue=[];
  if(items.length!==51)issue.push(`expected 51 protocol/ability variants, found ${items.length}`);
  if(!family)issue.push('missing canonical movement identity');
  const equipmentFingerprints=new Set(items.map(x=>JSON.stringify(x.equipment||[])));
  if(equipmentFingerprints.size!==1)issue.push(`equipment drift (${equipmentFingerprints.size})`);
  for(const x of items){
    if(!Array.isArray(x.instructions)||x.instructions.length<4)issue.push(`thin instructions ${x.id}`);
    if(!Array.isArray(x.form_cues)||x.form_cues.length<2)issue.push(`thin form cues ${x.id}`);
    if(!Array.isArray(x.safety_cues)||x.safety_cues.length<2)issue.push(`thin safety cues ${x.id}`);
    if(!Array.isArray(x.equipment)||!x.equipment.length)issue.push(`missing equipment ${x.id}`);
    if(x.canonical_movement!==family)issue.push(`movement binding drift ${x.id}`);else visualBindings++;
    const d=x.dosage||{};const vals=[d.sets,d.reps,d.time_seconds,d.rest_seconds,d.rounds,d.minutes].map(Number).filter(Number.isFinite);
    const hasPrescription=vals.some(v=>v>0);
    if(!hasPrescription)issue.push(`invalid dosage ${x.id}`);else protocolPass++;
    if(vals.some(v=>v<0))issue.push(`negative dosage ${x.id}`);
    if(x.visual?.status!=='pending')issue.push(`unexpected visual state ${x.id}:${x.visual?.status}`);
  }
  if(issue.length)failures.push({family,issues:[...new Set(issue)].slice(0,25)});else approved.push({family,objects:items.length,equipment:exemplar.equipment,movement_group:exemplar.movement_group||null});
}
const inheritedObjects=approved.reduce((n,x)=>n+x.objects,0);
console.log(JSON.stringify({canonicalFamilies:groups.size,technicalCanonicalQaPass:approved.length,technicalCanonicalQaFail:failures.length,inheritedObjects,canonicalVisualBindingsChecked:visualBindings,protocolObjectsChecked:xs.length,protocolChecksPassed:protocolPass,approvedFamilies:approved,exceptions:failures},null,2));
if(groups.size!==44)throw new Error(`expected 44 canonical families, got ${groups.size}`);
if(approved.length!==44)throw new Error(`${failures.length} canonical families failed technical QA`);
if(inheritedObjects!==2244||protocolPass!==2244||visualBindings!==2244)throw new Error(`incomplete inherited validation ${inheritedObjects}/${protocolPass}/${visualBindings}`);
console.log('PASS Fit canonical-family technical QA: 44/44 families, 2,244 stable canonical bindings and 2,244 deterministic dosage variants pass. Movement-accuracy/member-domain visual judgement remains a distinct approval gate.');