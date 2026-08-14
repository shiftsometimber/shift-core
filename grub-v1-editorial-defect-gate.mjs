import {buildIndustrialCatalogue} from './industrial-catalogue-v14.js';

const recipes=buildIndustrialCatalogue().recipes;
const launch=/Proper Sandwich|Traybake|Slow[- ]Cooker|Protein Pot|Loaded Wrap|Breakfast Hash|Breakfast Buttie|Breakfast Wrap|Breakfast Toastie|Overnight Oats|Work Snack Box/i;
const target=recipes.filter(r=>launch.test(String(r.title||'')));
const failures=[];
const titles=new Map();
for(const r of target){
  const method=(r.method||[]).join(' ');
  const title=String(r.title||'');
  const ids=titles.get(title)||[];ids.push(r.id);titles.set(title,ids);
  if(/matrix found/i.test(method))failures.push({id:r.id,code:'implementation_language_leak'});
  if(/Cook the cooked .* cooked through/i.test(method))failures.push({id:r.id,code:'recooks_already_cooked_protein'});
  if(/Cook the boiled eggs until just set/i.test(method))failures.push({id:r.id,code:'recooks_boiled_eggs'});
  if(/Slow[- ]Cooker/i.test(title)&&!/LOW for 6–8 hours|HIGH for 3–4 hours/i.test(method))failures.push({id:r.id,code:'slow_cooker_not_humanised'});
  if(!r.provenance?.humanness_v1?.family)failures.push({id:r.id,code:'launch_family_missing_review_authority'});
}
for(const [title,ids] of titles)if(ids.length>1)failures.push({title,ids,code:'duplicate_launch_title'});
if(failures.length)throw new Error(`Grub V1 editorial defects remain: ${JSON.stringify(failures.slice(0,30))}`);
const slow=target.filter(r=>/Slow[- ]Cooker/i.test(r.title||''));
if(slow.length<70)throw new Error(`expected at least 70 Slow-Cooker descendants under humanness authority, got ${slow.length}`);
console.log(`PASS Grub V1 editorial defect gate: ${target.length} launch-family recipes; ${slow.length} Slow-Cooker descendants governed; zero implementation leaks, already-cooked recook instructions or duplicate launch titles.`);
