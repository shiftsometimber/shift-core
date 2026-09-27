import fs from 'node:fs';
import path from 'node:path';
const fail=m=>{throw new Error(m)};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exercises=fs.readdirSync('content/fit').filter(x=>/^batch-\d+\.json$/.test(x)).sort().flatMap(x=>read(path.join('content/fit',x)));
const ids=new Set(exercises.map(x=>x.id));
const manifest=read('content/fit/visual-assets-v1.json');
if(manifest.schema_version!==1)fail('Fit visual manifest schema v1 required');
for(const asset of manifest.assets||[]){
  const file=String(asset.asset_ref||'').split('#')[0];if(!file||!fs.existsSync(file))fail(`${asset.concept_id}: visual asset file missing`);
  if(!['authored_pending_member_qa','member_qa_approved','approved','rejected'].includes(asset.status))fail(`${asset.concept_id}: invalid visual status`);
  if(asset.structured_exercise_id&&!ids.has(asset.structured_exercise_id))fail(`${asset.concept_id}: bound exercise is not in structured catalogue`);
  const commissioned=asset.status==='member_qa_approved'||asset.status==='approved';
  if(commissioned&&!asset.structured_exercise_id)fail(`${asset.concept_id}: commissioned visual must bind exact structured exercise`);
  if(asset.status==='member_qa_approved'){
    if(!asset.qa?.reviewer||!asset.qa?.reviewed_at)fail(`${asset.concept_id}: member-QA approval requires reviewer and reviewed_at`);
    const checks=new Set(asset.qa?.checks||[]);for(const required of ['movement_match','instructions_match','alt_text','member_comprehension'])if(!checks.has(required))fail(`${asset.concept_id}: member-QA approval missing ${required}`);
  }
}
const authored=(manifest.assets||[]).length,bound=(manifest.assets||[]).filter(x=>x.structured_exercise_id).length,approved=(manifest.assets||[]).filter(x=>x.status==='member_qa_approved'||x.status==='approved').length;
console.log(JSON.stringify({structuredExercises:exercises.length,authoredVisualConcepts:authored,exactExerciseBindings:bound,memberQaApproved:approved,productionEligible:approved},null,2));
console.log(`PASS M12 Fit visual accounting: ${authored} authored concepts / ${bound} exact catalogue bindings / ${approved} member-QA approved; commissioned assets require exact binding plus recorded movement/instruction/alt-text/member-comprehension QA`);
