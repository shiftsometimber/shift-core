import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {enrichGrubRecipes} from '../member-experience/grub-search.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const source=JSON.parse(fs.readFileSync(process.env.GRUB_CATALOGUE_REVIEW_INPUT,'utf8'));
const records=enrichGrubRecipes(source.authority.rows);
const core=[
 'everyday-chicken-salad-sandwich','everyday-tuna-sandwich','everyday-chicken-salad','everyday-ham-sandwich','everyday-ham-salad','everyday-beans-on-toast','everyday-scrambled-eggs-on-toast',
 'industrial-breakfast-egg-toast-apple-cinnamon-0','industrial-breakfast-egg-toast-banana-cocoa-1',
 'industrial-breakfast-protein-oats-apple-cinnamon-0','industrial-breakfast-protein-oats-banana-cocoa-1','industrial-breakfast-protein-oats-berry-vanilla-2',
 'industrial-breakfast-yoghurt-pot-apple-cinnamon-0','industrial-breakfast-yoghurt-pot-banana-cocoa-1','industrial-breakfast-yoghurt-pot-berry-vanilla-2',
 'industrial-lunch-chicken-wholemeal-wrap','industrial-lunch-tuna-wholemeal-wrap','industrial-lunch-bean-pitta','industrial-lunch-tuna-pitta',
 'industrial-lunch-chickpea-grain-salad'
];
const cooking=[
 'industrial-breakfast-overnight-oats-apple-cinnamon-0','industrial-breakfast-overnight-oats-banana-cocoa-1',
 'industrial-lunch-chicken-pasta-pot','industrial-lunch-tuna-pasta-pot','industrial-lunch-tuna-jacket-potato','industrial-lunch-bean-jacket-potato',
 'industrial-dinner-chicken-curry','industrial-dinner-lentil-curry','industrial-dinner-chicken-stir-fry','industrial-dinner-tofu-stir-fry',
 'industrial-dinner-chicken-pasta-bake','industrial-dinner-salmon-pasta-bake'
];
const selected=new Set([...core,...cooking]);
for(const id of selected)if(!records.some(r=>r.id===id))throw Error('Missing exact selected recipe: '+id);
const decisions=records.map(r=>{
 const d=r.data,format=d.food_format||'legacy',text=d.ingredients.map(i=>i.item).join(' '),method=d.method.join('\n');
 const retained=selected.has(r.id),pizza=format==='pizza',tray=/traybake/i.test(r.title),chilli=/chilli/i.test(r.title)&&!/\bchilli\b/i.test(text);
 const concerns=[];
 if(pizza&&!/cheese|cheddar|mozzarella/i.test(text))concerns.push('Pizza has no cheese in its actual ingredients; it is not a Margherita, pepperoni or ham-and-pineapple recipe.');
 if(/\b(Nashville|Buffalo|Dirty|Fully Loaded|Weekend Big Feed)\b/i.test(r.title))concerns.push('Novelty/marketing variant is not an earned everyday UK default.');
 if(tray&&/pan|fry/i.test(method)&&!(d.equipment||[]).some(e=>/pan|hob/.test(e)))concerns.push('Method uses a pan/hob missing from the equipment list.');
 if(chilli)concerns.push('Actual ingredients contain no chilli; paprika alone does not develop a chilli recipe.');
 if(d.equipment?.includes('none')&&/\bknife|chop|halve|crush|bowl|container|pack/i.test(method))concerns.push('Equipment says none despite preparation or serving equipment being needed.');
 if(/overnight/i.test(r.title)&&Number(d.total_minutes)<360)concerns.push('Soaking/elapsed time must be represented; prep time is not ready-to-eat time.');
 if(!retained&&!concerns.length)concerns.push('Withdraw this exact flavour/protein descendant from new discovery: it has not earned a distinct practical dish in the UK core. No new suitability or taste approval is asserted.');
 const index=core.indexOf(r.id),long=cooking.includes(r.id);
 return {id:r.id,publication_id:r.publication_id||r.id,title:r.title,decision:retained?'retain':pizza?'replace':concerns.some(s=>/missing|Equipment|no chilli/.test(s))?'correct':'withdraw',
  discovery_eligible:retained,tier:retained?(long?'cooking':'core'):'saved-only',rank:retained?(index>=0?index:100+cooking.indexOf(r.id)):10000,
  content_sha256:hash({title:r.title,data:r.data,review:r.review}),ingredient_sha256:hash(d.ingredients),method_sha256:hash(d.method),
  evidence:{ingredients:d.ingredients,method:d.method,equipment:d.equipment,servings:d.servings,prep_minutes:d.prep_minutes,cook_minutes:d.cook_minutes,total_minutes:d.total_minutes,storage:d.storage,food_safety:d.food_safety,allergens:d.allergens,nutrition:d.nutrition},
  findings:concerns,reason:retained?(long?'Recognisable dish retained as an optional cooking choice with its existing elapsed time.':'Recognisable, straightforward existing meal retained without changing its ingredients, quantities or method.'):concerns.join(' '),
  assessment:{kind:retained?'AI editorial reading of exact ingredients/method and retained prior publication evidence':'conservative discovery withdrawal after per-row ingredient/method screening',human_review_claimed:false,physical_cooking_trial_claimed:false,authoring_approval:false},
  image_policy:'suppress_until_dish_and_portion_checked'
 };
});
const byId=new Map(decisions.map(r=>[r.id,r]));
const raw=[...source.raw,...source.authority.rows.filter(r=>r.id.startsWith('everyday-'))];
const published=raw.map(r=>{
 const d=byId.get(r.id),revised=source.authority.rows.find(x=>x.id===r.id&&x.publication_id),alias=source.authority.rows.find(x=>x.publication_id===r.id);
 return {id:r.id,title:r.title,data_sha256:hash(r.data),review_sha256:hash(r.review),decision:revised?'replace':alias?'retain':d?.decision||'withdraw',
  discovery_eligible:alias?byId.get(alias.id)?.discovery_eligible===true:d?.discovery_eligible===true,
  current_reference_id:alias?.id||r.id,reason:revised?'Existing governed revision supersedes this published original; original bytes and history remain.':alias?'Current governed successor. Original reference ID is preserved.':d?.reason||'Published row is outside the current governed serving authority; keep it out of discovery.',
  human_review_claimed:false,physical_cooking_trial_claimed:false};
});
const evidence={proof:'GRUB_UK_CATALOGUE_EDITORIAL_DECISIONS_20261017',at:new Date().toISOString(),source:source.source,scope:'published food only; no member records',basis:'Existing exact public snapshot plus the accepted seven-row source publication; original serving authority authenticates content. Current core is an explicitly bounded interim selection, not a declaration that missing classics are published.',complete_decision_coverage:true,individual_culinary_approval_for_withdrawn:false,human_review_claimed:false,physical_cooking_trial_claimed:false,source_counts:{published:published.length,governed:decisions.length},published_recipes:published,current_recipes:decisions,new_core_drafts:'content/grub/uk-core-drafts-20261017.json',publication_status:'New/changed dishes held for independent and human second-person review. Discovery correction does not confer recipe publication authority.'};
fs.writeFileSync('evidence/grub-expansion-closeout-2026-09-16/uk-editorial-decisions-20261017.json',JSON.stringify(evidence,null,2)+'\n');
const manifest={proof:'GRUB_UK_DISCOVERY_20261017',source:source.source,evidence_sha256:hash(evidence),status:'pending_editorial_publication',rows:decisions.map(({id,decision,discovery_eligible,tier,rank,reason,image_policy})=>({id,decision,eligible:discovery_eligible,tier,rank,reason,image_policy,content_sha256:hash({title:source.authority.rows.find(r=>r.id===id).title,data:source.authority.rows.find(r=>r.id===id).data,review:source.authority.rows.find(r=>r.id===id).review})}))};
fs.writeFileSync('member-experience/grub-discovery-manifest-20261017.mjs','// Discovery decisions only. Never deletes, edits or republishes recipe content.\nexport const GRUB_DISCOVERY_MANIFEST='+JSON.stringify(manifest)+';\n');
console.log(JSON.stringify({decisions:published.length,current:decisions.length,retained:decisions.filter(r=>r.discovery_eligible).length,dispositions:decisions.reduce((a,r)=>(a[r.decision]=(a[r.decision]||0)+1,a),{}),humanReview:false,physicalTrials:false}));
