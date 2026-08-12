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
  if(!['authored_pending_member_qa','approved','rejected'].includes(asset.status))fail(`${asset.concept_id}: invalid visual status`);
  if(asset.structured_exercise_id&&!ids.has(asset.structured_exercise_id))fail(`${asset.concept_id}: bound exercise is not in structured catalogue`);
  if(asset.status==='approved'&&!asset.structured_exercise_id)fail(`${asset.concept_id}: approved visual must bind exact structured exercise`);
}
const authored=(manifest.assets||[]).length,bound=(manifest.assets||[]).filter(x=>x.structured_exercise_id).length,approved=(manifest.assets||[]).filter(x=>x.status==='approved').length;
console.log(JSON.stringify({structuredExercises:exercises.length,authoredVisualConcepts:authored,exactExerciseBindings:bound,memberQaApproved:approved,productionEligible:approved},null,2));
console.log(`PASS M12 Fit visual accounting: ${authored} authored concepts / ${bound} exact catalogue bindings / ${approved} member-QA approved; no authored asset is falsely counted as commissioned`);
