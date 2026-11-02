// Public projections of the existing governed catalogues. No member tables or
// personalisation are read, and no author/reviewer credentials are inferred.
export const slug = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110);
const strings = value => Array.isArray(value) ? value.map(v => typeof v === 'string' ? v : v?.text).filter(v => typeof v === 'string' && v.trim()) : [];
export const finite = value => value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
export function safeImage(value){
 try { const u = new URL(typeof value === 'object' ? value?.asset_ref || value?.url : value,'https://shiftsometimber.co.uk');
  return u.origin === 'https://shiftsometimber.co.uk' && /^\/(?:assets|images|fit-v3-images)\//.test(u.pathname) && !/\/member\//.test(u.pathname) ? u.href : null;
 } catch { return null; }
}
export function recipeProjection(row){
 const d=row.data||{}, n=d.nutrition||{};
 const ingredients=(d.ingredients||[]).map(v=>typeof v==='string'?v:[v.amount,v.item].filter(Boolean).join(' ')).filter(Boolean);
 const method=strings(d.method);
 if(!row.id || !row.title || !ingredients.length || !method.length || !finite(d.servings))return null;
 const nutrition=Object.fromEntries(['kcal','protein_g','carbohydrate_g','fat_g','fibre_g','saturates_g'].map(k=>[k,finite(n[k])]));
 return {id:row.id,title:row.title,ingredients,method,servings:finite(d.servings),mealType:d.meal_type||null,
  minutes:finite(d.total_minutes)??(((finite(d.prep_minutes)||0)+(finite(d.cook_minutes)||0))||null),
  prepMinutes:finite(d.prep_minutes),cookMinutes:finite(d.cook_minutes),nutrition,
  methodology:n.methodology||'Estimated nutrition; ingredients, brands and portions vary.',
  image:safeImage(d.image||d.visual),allergens:strings(d.allergens),safety:strings(d.food_safety),
  equipment:strings(d.equipment),storage:d.storage&&typeof d.storage==='object'?Object.values(d.storage).filter(v=>typeof v==='string'):[],
  timingNote:d.timing_note||null,sourceUpdatedAt:row.updated_at||null};
}
export function exerciseProjection(rows){
 const groups=new Map();
 for(const row of rows){
  const d=row.data||{},key=d.canonical_movement||row.id;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
 }
 return [...groups].map(([key,group])=>{
  const level=row=>row.data?.level||row.data?.intensity?.level||row.data?.selection_constraints?.minimum_level;
  const ordered=group.toSorted((a,b)=>(String(level(a))==='beginner'?-1:1)-(String(level(b))==='beginner'?-1:1)||a.id.localeCompare(b.id));
  const row=ordered.find(r=>strings(r.data?.instructions||r.data?.how_to||r.data?.how||r.data?.steps).length)||ordered[0],d=row.data||{};
  const steps=strings(d.instructions||d.how_to||d.how||d.steps);
  if(!steps.length)return null;
  const name=d.movement_name||d.name||key.replace(/[-_]/g,' ').replace(/^./,s=>s.toUpperCase());
  const doses=[...new Map(ordered.map(r=>{
   const x=r.data||{},dose=x.dose_text||x.dosage?.prescription_text||[x.sets?x.sets+' sets':null,x.reps?x.reps+' repetitions':null,x.minutes?x.minutes+' minutes':null].filter(Boolean).join(', ');
   const value={level:level(r)||null,dose:dose||null,equipment:strings(x.equipment||x.required_equipment||x.selection_constraints?.required_equipment)};
   return [JSON.stringify(value),value];
  })).values()].filter(x=>x.dose);
  return {id:key,title:name,steps,doses,image:safeImage(d.visual),imageAlt:d.visual?.alt_text||name,
   equipment:strings(d.equipment||d.required_equipment||d.selection_constraints?.required_equipment),
   safety:strings(d.safety_cues||d.safety||d.safety_notes||d.stop_rules||d.cautions),
   sourceUpdatedAt:ordered.map(r=>r.updated_at).filter(Boolean).sort().at(-1)||null,sourceVariants:group.length};
 }).filter(Boolean);
}
