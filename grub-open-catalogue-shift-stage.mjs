import fs from 'node:fs';
import path from 'node:path';

const INPUT=process.env.GRUB_OPEN_CATALOGUE_INPUT||'grub-open-catalogue-evidence/review-candidates.json';
const OUT=process.env.GRUB_SHIFT_STAGE_DIR||'grub-open-catalogue-stage';
const REQUIRED=Number(process.env.GRUB_SHIFT_REQUIRED||1702);
const CURRENT=Number(process.env.GRUB_SHIFT_CURRENT||798);
const existingFiles=['content/grub/batch-01.json','content/grub/batch-02.json','content/grub/batch-03.json','content/grub/batch-04.json'];

const tidy=value=>String(value||'').replace(/\s+/g,' ').trim();
const key=value=>tidy(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const text=row=>`${row.name} ${row.category} ${(row.ingredients||[]).join(' ')}`.toLowerCase();
const contains=(value,terms)=>terms.some(term=>value.includes(term));

const FAKEAWAY=['burger','pizza','kebab','tikka','masala','curry','biryani','chow mein','fried rice','taco','burrito','quesadilla','fajita','gyros','shawarma','wrap','wings','nugget','fish and chips','fish & chips','takeaway'];
const HEALTHY=['salad','soup','grill','baked','roast','vegetable','bean','lentil','chickpea','chicken','turkey','fish','salmon','tuna','prawn','tofu','wholemeal','oat','yoghurt','yogurt','fruit','stew'];
const HOLD=['cocktail','liqueur','wine','beer','ale','cake','frosting','icing','candy','sweet','confection','deep-fried'];

function existingKeys(){
  const keys=new Set();
  for(const file of existingFiles){
    if(!fs.existsSync(file))continue;
    for(const row of JSON.parse(fs.readFileSync(file,'utf8')))keys.add(key(row.title||row.name));
  }
  return keys;
}

function assess(row,known){
  const haystack=text(row),nameKey=key(row.name);
  const reasons=[];
  if(!row.source_url)reasons.push('missing_source_url');
  if(row.licence!=='CC BY-SA 4.0')reasons.push('unapproved_licence');
  if((row.ingredients||[]).length<3)reasons.push('thin_ingredients');
  if((row.instructions||[]).length<2)reasons.push('thin_method');
  if(known.has(nameKey))reasons.push('existing_shift_title');
  if(contains(haystack,HOLD))reasons.push('outside_healthy_food_priority');
  const lane=contains(haystack,FAKEAWAY)?'fakeaway':contains(haystack,HEALTHY)?'healthy_everyday':'healthy_review';
  const completeness=Math.min(20,(row.ingredients||[]).length)+Math.min(15,(row.instructions||[]).length*2);
  const score=(lane==='fakeaway'?60:lane==='healthy_everyday'?40:20)+completeness-(reasons.length*100);
  return{row,lane,reasons,score};
}

const candidates=JSON.parse(fs.readFileSync(INPUT,'utf8'));
const known=existingKeys();
const assessed=candidates.map(row=>assess(row,known));
const eligible=assessed.filter(item=>item.reasons.length===0).sort((a,b)=>b.score-a.score||a.row.name.localeCompare(b.row.name));
if(eligible.length<REQUIRED)throw new Error(`Only ${eligible.length} eligible open recipes for ${REQUIRED} required`);

const selected=eligible.slice(0,REQUIRED).map(({row,lane,score},index)=>({
  stage_id:`open-wikibooks-${String(index+1).padStart(4,'0')}-${row.source_id}`,
  status:'draft',
  lane,
  priority_score:score,
  source:{
    name:'Wikibooks Cookbook',
    title:row.name,
    url:row.source_url,
    licence:'CC BY-SA 4.0',
    attribution_required:true,
    adapted:false
  },
  original:{
    title:row.name,
    servings:row.servings||null,
    time:row.time||null,
    category:row.category||null,
    ingredients:row.ingredients,
    method:row.instructions
  },
  shift_adaptation:{
    title:null,
    ingredients:null,
    method:null,
    editorial_brief:lane==='fakeaway'
      ? 'Turn this into a recognisable lighter fakeaway without pretending it is the takeaway original.'
      : 'Make this practical, healthy and bloke-readable while preserving the underlying recipe.',
    voice_rules:['plain UK English','short direct steps','no diet-culture fluff','no invented ingredients or claims'],
    blockers:['cross_catalogue_ingredient_deduplication','uk_measurement_normalisation','shift_editorial_adaptation','meal_type_classification','allergen_review','food_safety_review','cofid_nutrition_validation','independent_human_review']
  },
  publication_ready:false
}));

const byLane=Object.fromEntries(['fakeaway','healthy_everyday','healthy_review'].map(lane=>[lane,selected.filter(row=>row.lane===lane).length]));
const rejected=assessed.filter(item=>item.reasons.length).map(({row,reasons})=>({source_id:row.source_id,title:row.name,reasons}));
const summary={
  proof:'GRUB_OPEN_CATALOGUE_SHIFT_STAGE_V1',
  generated_at:new Date().toISOString(),
  current_live_approved:CURRENT,
  expansion_required:REQUIRED,
  selected: selected.length,
  projected_live_after_approval:CURRENT+selected.length,
  lanes:byLane,
  eligible_before_selection:eligible.length,
  rejected_or_held:rejected.length,
  source:'Wikibooks Cookbook',
  licence:'CC BY-SA 4.0',
  publication_ready:0,
  rule:'No candidate can publish until every Shift adaptation blocker is cleared.'
};

fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'shift-review-queue.json'),JSON.stringify(selected,null,2));
fs.writeFileSync(path.join(OUT,'held-candidates.json'),JSON.stringify(rejected,null,2));
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
