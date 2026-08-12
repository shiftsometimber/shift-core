import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';
const c=buildIndustrialCatalogue();
const xs=(c.exercises||[]).filter(x=>String(x.id).startsWith('industrial-v3-fit-'));
const groups=new Map();for(const x of xs){const k=x.canonical_movement;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
const failures=[];const approved=[];let protocolPass=0;
for(const [family,items] of groups){
  const exemplar=items[0];const issue=[];
  if(items.length!==51)issue.push(`expected 51 protocol/ability variants, found ${items.length}`);
  if(!family)issue.push('missing canonical movement identity');
  if(!exemplar?.instructions||exemplar.instructions.length<4)issue.push('thin canonical instructions');
  if(!exemplar?.form_cues||exemplar.form_cues.length<2)issue.push('thin form cues');
  if(!exemplar?.safety_cues||exemplar.safety_cues.length<2)issue.push('thin safety cues');
  if(!Array.isArray(exemplar?.equipment)||!exemplar.equipment.length)issue.push('missing equipment contract');
  const fingerprints=new Set(items.map(x=>JSON.stringify({movement:x.canonical_movement,equipment:x.equipment,instructions:x.instructions,form:x.form_cues,safety:x.safety_cues})));
  if(fingerprints.size!==1)issue.push(`canonical movement content drift across variants (${fingerprints.size} fingerprints)`);
  for(const x of items){
    const p=x.protocol||{};const duration=Number(p.duration_minutes||x.duration_minutes||0);const work=Number(p.work_seconds||0),rest=Number(p.rest_seconds||0),reps=Number(p.reps||0),sets=Number(p.sets||0);
    const hasPrescription=duration>0||work>0||reps>0||sets>0;
    if(!hasPrescription)issue.push(`invalid protocol prescription ${x.id}`); else protocolPass++;
    if(work<0||rest<0||reps<0||sets<0)issue.push(`negative protocol value ${x.id}`);
  }
  if(issue.length)failures.push({family,issues:[...new Set(issue)]});else approved.push({family,objects:items.length,equipment:exemplar.equipment,category:exemplar.category||null});
}
const inheritedObjects=approved.reduce((n,x)=>n+x.objects,0);
console.log(JSON.stringify({canonicalFamilies:groups.size,technicalCanonicalQaPass:approved.length,technicalCanonicalQaFail:failures.length,inheritedObjects,protocolObjectsChecked:xs.length,protocolChecksPassed:protocolPass,approvedFamilies:approved,exceptions:failures},null,2));
if(groups.size!==44)throw new Error(`expected 44 canonical families, got ${groups.size}`);
if(approved.length!==44)throw new Error(`${failures.length} canonical families failed technical QA`);
if(inheritedObjects!==2244)throw new Error(`expected 2244 inherited objects, got ${inheritedObjects}`);
console.log('PASS Fit canonical-family technical QA: 44/44 families and 2,244 inherited protocol objects structurally consistent. Movement-accuracy/member-domain visual judgement remains a distinct approval gate.');