const PROPER_STYLE_BLOCKS={
  pasta:new Set(['curry-house','tikka','jalfrezi','balti','madras','teriyaki','hoisin','sweet-chilli']),
  roast:new Set(['curry-house','tikka','jalfrezi','balti','madras','teriyaki','hoisin','sweet-chilli']),
  pie:new Set(['teriyaki','hoisin','sweet-chilli']),
  chilli:new Set(['peppercorn','teriyaki','hoisin','sweet-chilli','lemon-herb']),
  curry:new Set(['peppercorn','teriyaki','hoisin','sweet-chilli']),
  'stir-fry':new Set(['peppercorn','bbq'])
};
const FAMILIES=['breakfast-buttie','breakfast-wrap','breakfast-hash','breakfast-toastie','sandwich','wrap','bagel','toastie','jacket-potato','meal-prep-bowl','curry','chilli','pasta','pie','traybake','stir-fry','roast','slow-cooker','burger','kebab','loaded-fries','pizza'].sort((a,b)=>b.length-a.length);
const STYLES=['curry-house','sweet-chilli','garlic-herb','salt-pepper','nashville','bean-loaded','hash-brown','peri-peri','lemon-herb','peppercorn','mediterranean','jalfrezi','teriyaki','weekend','hot-sauce','mustard','tomato','cheesy','mushroom','classic','dirty','buffalo','katsu','tikka','doner','mexican','loaded','smoky','club','caesar','greek','pickle','house','balti','madras','chilli','cajun','hoisin','harissa','bbq'].sort((a,b)=>b.length-a.length);

function identity(recipe){
  const id=String(recipe?.id||'');
  if(!id.startsWith('industrial-v3-'))return null;
  const rest=id.slice('industrial-v3-'.length);
  const family=FAMILIES.find(x=>rest.startsWith(`${x}-`));
  if(!family)return null;
  const afterFamily=rest.slice(family.length+1);
  const style=STYLES.find(x=>afterFamily.startsWith(`${x}-`));
  if(!style)return null;
  return{family,style,protein:afterFamily.slice(style.length+1)};
}

function ingredientKey(item){
  return String(item||'').toLowerCase()
    .replace(/\b(diced|sliced|chopped|halved|crushed|grated|peeled)\b/g,' ')
    .replace(/[^a-z0-9%]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function duplicateIngredientIssues(recipe){
  const seen=new Map(),duplicates=new Set();
  for(const row of recipe?.ingredients||[]){
    const key=ingredientKey(row?.item);if(!key)continue;
    if(seen.has(key))duplicates.add(key); else seen.set(key,row?.item);
  }
  return [...duplicates].sort().map(key=>({code:'duplicate_ingredient_line',detail:`${seen.get(key)||key} appears more than once as the same ingredient identity; combine/rebuild quantities before editorial approval`}));
}
function methodText(recipe){return (recipe?.method||[]).join(' ').toLowerCase().replace(/\s+/g,' ').trim()}
function salmonMethodHasSpecificRepair(recipe){
  const m=methodText(recipe);
  return /cook the salmon separately/.test(m)&&(/avoiding prolonged slow cooking/.test(m)||/cooked salmon (?:through|in|on).*\b(?:end|finish)/.test(m));
}
function salmonFakeawayHasSpecificRepair(recipe){
  const m=methodText(recipe);
  return /cook the salmon/.test(m)&&/meat-style fakeaway method/.test(m)&&/finishing flavour/.test(m);
}
function beanPrimaryHasSpecificRepair(recipe){
  if(/bean loaded beans/i.test(String(recipe?.title||'')))return false;
  const beans=(recipe?.ingredients||[]).filter(row=>/^(?:baked )?beans$/.test(ingredientKey(row?.item))||ingredientKey(row?.item)==='baked beans');
  return beans.length===1&&!duplicateIngredientIssues(recipe).some(i=>/beans/i.test(i.detail));
}
function slowCookerTitle(recipe){return /slow[- ]?cooker/i.test(String(recipe?.title||''))}
function delicateSlowCooker(recipe){return slowCookerTitle(recipe)&&/salmon|prawn|lentil/i.test(String(recipe?.title||''))}

export function editorialSemanticIssues(recipe){
  const issues=duplicateIngredientIssues(recipe);
  const x=identity(recipe);
  if(/\bthe filling\b/i.test(methodText(recipe)))issues.push({code:'generic_protein_placeholder',detail:'method contains unresolved generic protein placeholder'});
  if(delicateSlowCooker(recipe))issues.push({code:'slow_cooker_delicate_protein_mismatch',detail:'salmon, prawns or already-cooked lentils are not launch-approved for the generic all-day slow-cooker method'});
  if(!x)return issues;
  if(PROPER_STYLE_BLOCKS[x.family]?.has(x.style))issues.push({code:'style_format_mismatch',detail:`${x.style} is not commissioned for ${x.family}`});
  if(x.family==='slow-cooker'&&x.style==='lemon-herb')issues.push({code:'slow_cooker_low_liquid_mismatch',detail:'lemon-herb slow-cooker variants have only a small citrus/dressing quantity and are not approved as all-day wet-cook recipes'});
  if((x.family==='chilli'||x.family==='slow-cooker')&&x.protein==='salmon'&&!salmonMethodHasSpecificRepair(recipe))issues.push({code:'protein_method_mismatch',detail:`salmon is not commissioned for ${x.family} without an explicit separate-cook/end-finish method`});
  if(['kebab','loaded-fries','pizza'].includes(x.family)&&x.protein==='salmon'&&['doner','nashville','katsu','tikka','salt-pepper'].includes(x.style)&&!salmonFakeawayHasSpecificRepair(recipe))issues.push({code:'fakeaway_salmon_style_mismatch',detail:`${x.style} salmon ${x.family} needs a recipe-specific salmon method rather than cross-product approval`});
  if(x.family.startsWith('breakfast')&&x.style==='bean-loaded'&&x.protein==='beans'&&!beanPrimaryHasSpecificRepair(recipe))issues.push({code:'duplicate_primary_ingredient',detail:'bean-loaded beans duplicates baked beans as both protein and flavour component'});
  return issues;
}

export function semanticQualitySummary(recipes){
  const counts=new Map(),quarantined=[];
  for(const recipe of recipes||[]){const issues=editorialSemanticIssues(recipe);if(!issues.length)continue;quarantined.push({id:recipe.id,title:recipe.title,issues});for(const issue of issues)counts.set(issue.code,(counts.get(issue.code)||0)+1);}
  return{catalogue:(recipes||[]).length,editorial_quarantine:quarantined.length,editorial_ready:(recipes||[]).length-quarantined.length,issue_counts:Object.fromEntries([...counts].sort()),quarantined};
}
