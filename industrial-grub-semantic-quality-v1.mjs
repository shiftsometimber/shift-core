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

export function editorialSemanticIssues(recipe){
  const x=identity(recipe);if(!x)return[];
  const issues=[];
  if(PROPER_STYLE_BLOCKS[x.family]?.has(x.style))issues.push({code:'style_format_mismatch',detail:`${x.style} is not commissioned for ${x.family}`});
  if((x.family==='chilli'||x.family==='slow-cooker')&&x.protein==='salmon')issues.push({code:'protein_method_mismatch',detail:`salmon is not commissioned for ${x.family}`});
  if(['kebab','loaded-fries','pizza'].includes(x.family)&&x.protein==='salmon'&&['doner','nashville','katsu','tikka','salt-pepper'].includes(x.style))issues.push({code:'fakeaway_salmon_style_mismatch',detail:`${x.style} salmon ${x.family} needs a recipe-specific rebuild rather than cross-product approval`});
  if(x.family.startsWith('breakfast')&&x.style==='bean-loaded'&&x.protein==='beans')issues.push({code:'duplicate_primary_ingredient',detail:'bean-loaded beans duplicates baked beans as both protein and flavour component'});
  return issues;
}

export function semanticQualitySummary(recipes){
  const counts=new Map(),quarantined=[];
  for(const recipe of recipes||[]){const issues=editorialSemanticIssues(recipe);if(!issues.length)continue;quarantined.push({id:recipe.id,title:recipe.title,issues});for(const issue of issues)counts.set(issue.code,(counts.get(issue.code)||0)+1);}
  return{catalogue:(recipes||[]).length,editorial_quarantine:quarantined.length,editorial_ready:(recipes||[]).length-quarantined.length,issue_counts:Object.fromEntries([...counts].sort()),quarantined};
}
