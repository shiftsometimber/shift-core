import {buildIndustrialCatalogue as buildV3} from './industrial-catalogue-v3.js';
const NOW='2026-08-12',slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const STYLES=[
 ['classic','Classic','1g','cinnamon'],
 ['berry','Berry','80g','mixed berries'],
 ['apple','Apple','80g','diced apple'],
 ['banana','Banana','80g','sliced banana'],
 ['chocolate','Chocolate','5g','unsweetened cocoa'],
 ['peanut','Peanut','15g','peanut butter'],
 ['coffee','Coffee','1g','instant espresso'],
 ['lemon','Lemon','1g','lemon zest'],
 ['orange','Orange','1g','orange zest'],
 ['caramel','Caramel-Style','2ml','caramel flavouring'],
 ['cherry','Cherry','80g','cherries'],
 ['mango','Mango','80g','mango'],
 ['pineapple','Pineapple','80g','pineapple'],
 ['biscoff-style','Biscuit-Style','20g','crushed wholegrain biscuit'],
 ['cheesecake-style','Cheesecake-Style','30g','light cream cheese'],
 ['crunch','Crunch','15g','pumpkin seeds'],
 ['weekend-treat','Weekend Treat','15g','dark chocolate chips']
];
const BASES=[['greek-yoghurt','0% Greek yoghurt','200g',['milk']],['cottage-cheese','low-fat cottage cheese','180g',['milk']],['overnight-oats','rolled oats','55g',['gluten']],['protein-pudding','high-protein yoghurt','200g',['milk']],['fruit-crunch','apple','180g',[]],['savory-box','boiled eggs','2',['egg']]];
const FAMILIES=[['protein-pot','snack','Protein Pot',['quick','protein-focused']],['dessert-pot','snack','Dessert Pot',['dessert','treat']],['work-snack-box','snack','Work Snack Box',['work','packed-snack']],['big-feed-dessert','snack','Big Feed Dessert',['treat','weekend']]];
const ing=(amount,item,allergens=[])=>allergens.length?{amount,item,allergens}:{amount,item};
function snacks(){const out=[];for(const [fid,meal,label,tags] of FAMILIES)for(const [sid,slabel,flavourAmount,flavour] of STYLES)for(const [bid,base,amount,allergens] of BASES){const title=`Shift ${slabel} ${bid.replaceAll('-',' ')} ${label}`.replace(/\b\w/g,c=>c.toUpperCase());out.push({schema_version:1,id:slug(`industrial-v4-${fid}-${sid}-${bid}`),title,meal_type:meal,cuisine:'shift-treats',food_format:fid,main_protein:bid,servings:1,prep_minutes:5,cook_minutes:0,difficulty:'easy',ingredients:[ing(amount,base,allergens),ing(flavourAmount,flavour,/cheese/.test(flavour)?['milk']:[]),ing('25g','mixed berries'),ing('15g','rolled oats',['gluten']),ing('10g','pumpkin seeds')],method:['Measure the ingredients rather than eating from the packet.','Prepare the fruit or flavour component and keep chilled ingredients cold.','Combine the measured ingredients in a bowl or lidded pot.','Eat immediately or refrigerate until needed; treat versions are still food, not a moral event.'],equipment:['none'],allergens:[...new Set([...allergens,'gluten'])],substitutions:[{from:base,to:'a comparable high-protein or plant-based base',note:'Keep the portion comparable and re-check allergens.'}],storage:{chilled:'Cover and refrigerate; use within 24 hours unless an ingredient label is stricter.',freezer:'Not generally recommended for assembled pots.',reheat:'Not applicable.'},batch_cook:false,food_safety:['Keep dairy and egg ingredients refrigerated until needed.','Use clean utensils and follow ingredient use-by dates.'],tags:[...tags,'snack',sid,bid],taxonomy:{meal_type:'snack',cuisine:'shift-treats',food_format:fid,main_protein:bid,cooking_method:'no-cook',prep_band:'quick',family_size:'single',budget:'standard',fakeaway_treat:tags.includes('treat'),protein_focus:true},relationships:{related_tags:['snack',fid,sid,bid],brain_facets:[`meal:snack`,`format:${fid}`,`base:${bid}`,`style:${sid}`]},nutrition:{status:'pending_validation',methodology:'ingredient_level_calculation_required',kcal:null,protein_g:null,carbohydrate_g:null,fat_g:null,fibre_g:null},provenance:{source:'Shift industrial structured authoring',version:'industrial-v4',authored_at:NOW},review:{status:'draft',blockers:['nutrition_validation','second_person_content_review']}})}return out}
export function buildIndustrialCatalogue(){const c=buildV3(),extra=snacks(),recipes=[...c.recipes,...extra];return{...c,recipes,metrics:{...c.metrics,industrialV4SnackObjects:extra.length,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}}}
