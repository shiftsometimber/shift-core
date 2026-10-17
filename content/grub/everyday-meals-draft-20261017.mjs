// Authoring only. This is never imported by the member serving catalogue.
// Exact independent review and a new immutable publication binding are required.
import {digest,recalculateNutrition} from '../../grub-expansion-repairs-v1.mjs';
const ingredient=(item,amount)=>({item,amount});
const coldStorage={chilled:'Cover and refrigerate promptly. Eat within 24 hours and follow any shorter ingredient use-by date. Keep chilled until eating.'};
const safety=['Check every bought ingredient label for allergens and use-by dates. These recipes do not guarantee allergy suitability.','Use clean hands, utensils and surfaces. Keep chilled ready-to-eat ingredients refrigerated until assembly.'];
const cookedStorage={chilled:'Eat immediately after cooking. These instructions do not cover storing or reheating the finished meal.'};
const bread=ingredient('wholemeal bread','80g'),mayo=ingredient('light mayonnaise','15g'),leaves=ingredient('salad leaves','20g');
const definitions=[
 {id:'chicken-salad',title:'Chicken salad',prep:5,cook:0,ingredients:[ingredient('cooked chicken breast','120g'),ingredient('salad leaves','60g'),ingredient('tomato','80g'),mayo],allergens:['egg','mustard'],method:['Use chilled, already-cooked chicken breast. Wash and dry salad leaves and tomato unless the packet says ready washed; slice the tomato.','Put the chicken and salad on a plate and add the measured mayonnaise. Eat now, or cover and refrigerate promptly as described below.']},
 {id:'chicken-salad-sandwich',title:'Chicken salad sandwich',prep:5,cook:0,ingredients:[ingredient('cooked chicken breast','100g'),bread,leaves,mayo],allergens:['gluten','egg','mustard'],method:['Use chilled, already-cooked chicken breast and two slices of bread weighing 80g in total. Wash and dry the leaves unless labelled ready washed.','Spread the measured mayonnaise on the bread, add the chicken and leaves, and close the sandwich. Serve any filling that will not fit alongside; all listed ingredients count in the portion.']},
 {id:'ham-sandwich',title:'Ham sandwich',prep:5,cook:0,ingredients:[ingredient('lean ham','60g'),bread,leaves,mayo],allergens:['gluten','egg','mustard'],method:['Use sliced ready-to-eat ham and two slices of bread weighing 80g in total. Wash and dry the leaves unless labelled ready washed.','Spread the measured mayonnaise on the bread, add the cold ham and leaves, and close the sandwich. There is no pan or warming step.']},
 {id:'tuna-sandwich',title:'Tuna sandwich',prep:5,cook:0,ingredients:[ingredient('tuna in spring water, drained','100g'),bread,leaves,mayo],allergens:['fish','gluten','egg','mustard'],method:['Use canned tuna in spring water. Drain, then weigh 100g and flake with a fork. Use two slices of bread weighing 80g in total; wash and dry the leaves unless labelled ready washed.','Mix the measured mayonnaise into the tuna and put it between the bread slices with the leaves. Serve any filling that will not fit alongside.']},
 {id:'ham-salad',title:'Ham salad',prep:5,cook:0,ingredients:[ingredient('lean ham','80g'),ingredient('salad leaves','60g'),ingredient('tomato','80g'),ingredient('wholemeal bread','40g'),mayo],allergens:['gluten','egg','mustard'],method:['Use chilled ready-to-eat ham. Wash and dry the leaves and tomato unless labelled ready washed; slice the tomato.','Put the ham, leaves and tomato on a plate, add the measured mayonnaise and serve with the bread. Eat now or keep chilled as described below.']},
 {id:'beans-on-toast',title:'Beans on toast',prep:2,cook:6,ingredients:[ingredient('baked beans','200g'),bread],allergens:['gluten'],method:['Heat the canned baked beans according to the packet instructions, stirring as directed, until steaming hot throughout. Use a microwave-safe bowl if microwaving.','Meanwhile toast two slices of wholemeal bread weighing 80g in total. Spoon the hot beans over the toast and eat immediately. Appliance and packet times govern; the total time is an estimate.']},
 {id:'scrambled-eggs-on-toast',title:'Scrambled eggs on toast',prep:3,cook:7,ingredients:[ingredient('large eggs','100g'),bread,ingredient('semi-skimmed milk','30ml'),ingredient('olive oil','3ml')],allergens:['egg','gluten','milk'],method:['Crack the eggs into a bowl and weigh 100g without shells, about two eggs; the edible gram weight governs. Beat in the measured milk. Wash hands and utensils after handling raw eggs.','Heat the measured oil in a non-stick pan over a low to medium heat. Add the eggs and stir gently until fully set throughout. Meanwhile toast two slices of bread weighing 80g in total.','Spoon the cooked eggs onto the toast and eat immediately. The total time is an estimate; fully set eggs govern doneness.']}
];
export function buildEverydayMealDrafts({foods,mappings,retainedGrams}){
 return definitions.map(row=>{
  const recipe={id:'everyday-'+row.id,servings:1,ingredients:row.ingredients};
  const calculation=recalculateNutrition(recipe,foods,mappings,retainedGrams);
  const data={meal_type:'lunch',servings:1,ingredients:row.ingredients,method:row.method,allergens:row.allergens,
   equipment:row.cook?(row.id.includes('eggs')?['hob','toaster','non-stick-pan','bowl','fork','kitchen-scales']:['hob-or-microwave','toaster','saucepan-or-microwave-safe-bowl','kitchen-scales']):['plate','knife','fork'],
   food_safety:safety,storage:row.cook?cookedStorage:coldStorage,prep_minutes:row.prep,cook_minutes:row.cook,total_minutes:row.prep+row.cook,timing_is_estimate:true,
   nutrition:{status:'calculated_draft',...calculation.nutrition,methodology:'CoFID 2021 ingredient-level weighted calculation; exact decimal accumulation; not an editorial approval'},
   ingredient_evidence:calculation.ingredient_evidence,food_format:row.id.includes('sandwich')?'sandwich':row.id.includes('salad')?'salad':'on-toast',
   tags:['everyday',row.cook?'simple-cooking':'cold-assembly']};
  const candidate={id:recipe.id,title:row.title,version:1,status:'draft',data,review:{status:'pending',author:'Codex',human_review_claimed:false,independent_review_claimed:false},
   publication_ready:false,required_review:'Independent ingredient identity, nutrition, preparation, allergens, storage and realistic portion/time review, followed by an exact immutable publication authority. No prior catalogue PASS or owner-publication instruction is inherited.'};
  return {...candidate,content_hash:digest(candidate)};
 });
}
export const EVERYDAY_DRAFT_SOURCES=[
 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid',
 'https://www.food.gov.uk/safety-hygiene/cooking-your-food',
 'https://www.food.gov.uk/safety-hygiene/chilling'
];
