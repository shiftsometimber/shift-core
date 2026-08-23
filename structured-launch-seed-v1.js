import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';

const REVIEW={status:'approved',reviewed_at:'2026-08-12',reviewer:'shift-independent-commissioning-review',review_scope:'instructions safety metadata nutrition/visual publication readiness',note:'Commissioning-floor approval for structured-runtime proof. Premium presentation remains separately commissioned.'};

const ITEMS=[
  {
    id:'lighter-beef-cottage-pie',contentType:'recipe',title:'Lighter beef cottage pie',version:1,status:'published',review:REVIEW,
    data:{
      schema_version:1,meal_type:'dinner',servings:4,prep_minutes:15,cook_minutes:40,
      ingredients:[
        {amount:'500g',item:'5% beef mince'},{amount:'700g',item:'potatoes, peeled and chopped'},{amount:'200g',item:'carrots, diced'},{amount:'150g',item:'onion, diced'},{amount:'150g',item:'frozen peas'},{amount:'400g tin',item:'chopped tomatoes'},{amount:'1 tbsp / 15ml',item:'Worcestershire sauce',allergens:['check-pack']},{amount:'100ml',item:'semi-skimmed milk',allergens:['milk']},{amount:'1 tsp / 5ml',item:'olive oil'}
      ],
      method:['Heat the oven to 200°C/180°C fan and boil the potatoes until tender, about 15 minutes.','Meanwhile heat the oil in a large pan, cook the onion and carrot for 5 minutes, then add the beef and brown thoroughly.','Stir in tomatoes and Worcestershire sauce and simmer for 10 minutes; add the peas for the final 2 minutes.','Drain the potatoes, mash with the milk and spoon over the beef mixture in an ovenproof dish.','Bake for 20 minutes until bubbling and lightly coloured on top.'],
      equipment:['oven','hob','saucepan','frying-pan','ovenproof-dish'],tags:['family','batch','freezer-friendly'],allergens:['milk','check-pack'],
      substitutions:[{from:'5% beef mince',to:'5% turkey mince',note:'Cook thoroughly and season to taste.'},{from:'semi-skimmed milk',to:'unsweetened fortified plant drink',note:'Choose an option suitable for your dietary needs.'}],
      storage:{chilled:'Cool promptly, cover and refrigerate for up to 2 days.',freeze:'Freeze cooled individual portions in suitable containers.',reheat:'Defrost safely if frozen and reheat until steaming hot throughout; only reheat once.'},
      food_safety:['Cook minced beef thoroughly before assembling the pie.','Cool leftovers promptly and avoid repeated reheating.'],
      nutrition:{status:'validated',kcal:406.7,protein_g:35.3,carbohydrate_g:51.2,fat_g:7.6,fibre_g:9.1,methodology:'CoFID 2021 ingredient-level weighted calculation',dataset:'McCance and Widdowson Composition of Foods Integrated Dataset',dataset_version:'CoFID 2021',source_url:'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid',precision_note:'Ingredient-level estimate, not laboratory analysis; branded ingredients, cooking yield and drained weights can vary.'},
      provenance:{authoring_source:'content/grub/batch-02.json',nutrition_evidence:'content/grub/nutrition-validations-v1.json',commissioned_at:'2026-08-12'}
    }
  },
  {
    id:'dumbbell-goblet-squat',contentType:'exercise',title:'Dumbbell goblet squat',version:1,status:'published',review:REVIEW,
    data:{movement_group:'legs',category:'strength',minutes:6,equipment:['dumbbell'],locations:['home','gym','hotel'],dosage:{sets:3,reps:'8–12',rest_seconds:60},instructions:['Hold one dumbbell vertically close to your chest.','Stand with feet around shoulder-width apart and brace gently.','Sit your hips down and back while keeping your whole foot planted.','Stand up by pushing the floor away and finish tall without leaning back.'],form_cues:['Keep knees tracking in the same direction as toes.','Use a comfortable depth; quality beats depth.'],regressions:['Use a lighter dumbbell.','Squat to a chair as a depth target.'],progressions:['Add a small amount of weight once all reps are controlled.','Pause for one second at the bottom.'],substitutions:['Chair squat','Supported sit-to-stand'],limitations:{avoid:['acute-knee-pain'],caution:['poor-balance']},visual:{status:'approved',asset_ref:'assets/fit/shift-fit-batch2.svg#goblet-squat',alt_text:'Line illustration of a member holding a dumbbell at the chest while lowering into a goblet squat.',qa_note:'Commissioning review matched visual concept to authored movement and accompanying instructions.'},provenance:{authoring_source:'content/fit/batch-01.json',visual_source:'assets/fit/shift-fit-batch2.svg',commissioned_at:'2026-08-12'}}
  },
  {
    id:'dumbbell-floor-press',contentType:'exercise',title:'Dumbbell floor press',version:1,status:'published',review:REVIEW,
    data:{movement_group:'push',category:'strength',minutes:6,equipment:['dumbbells'],locations:['home','gym','hotel'],dosage:{sets:3,reps:'8–12',rest_seconds:60},instructions:['Lie on your back with knees bent and one dumbbell in each hand.','Hold upper arms at roughly 45 degrees from your body.','Press the dumbbells up until your arms are straight without locking hard.','Lower under control until your upper arms lightly touch the floor.'],form_cues:['Keep wrists stacked over elbows.','Keep ribs relaxed rather than arching hard.'],regressions:['Use lighter dumbbells.','Use a wall press-up if getting to the floor is unsuitable.'],progressions:['Increase weight gradually.','Add one or two reps per set before adding load.'],substitutions:['Wall press-up','Kitchen-counter press-up'],limitations:{avoid:['acute-shoulder-pain'],caution:['difficulty-getting-from-floor']},visual:{status:'approved',asset_ref:'assets/fit/shift-fit-batch2.svg#floor-press',alt_text:'Line illustration of a member lying on the floor and pressing two dumbbells vertically above the chest.',qa_note:'Commissioning review matched visual concept to authored movement and accompanying instructions.'},provenance:{authoring_source:'content/fit/batch-01.json',visual_source:'assets/fit/shift-fit-batch2.svg',commissioned_at:'2026-08-12'}}
  },
  {
    id:'bird-dog',contentType:'exercise',title:'Bird dog',version:1,status:'published',review:REVIEW,
    data:{movement_group:'core',category:'strength',minutes:5,equipment:['mat'],locations:['home','gym','hotel'],dosage:{sets:3,reps:'6–10 each side',rest_seconds:30},instructions:['Start on all fours with hands below shoulders and knees below hips.','Brace gently, then reach one arm forward and the opposite leg back without shifting your trunk.','Pause briefly while keeping your hips level.','Return under control and repeat on the other side.'],form_cues:['Reach long rather than lifting the hand or foot as high as possible.','Keep your lower back quiet and hips facing the floor.'],regressions:['Move only one arm at a time.','Move only one leg at a time.'],progressions:['Pause for three seconds in the extended position.','Perform with a slower controlled tempo.'],substitutions:['Dead bug','Glute bridge'],limitations:{avoid:['acute-wrist-pain'],caution:['knee-floor-contact-pain']},visual:{status:'approved',asset_ref:'assets/fit/shift-fit-batch2.svg#bird-dog',alt_text:'Line illustration of a member on all fours extending one arm and the opposite leg for a bird dog.',qa_note:'Commissioning review matched visual concept to authored movement and accompanying instructions.'},provenance:{authoring_source:'content/fit/batch-02.json',visual_source:'assets/fit/shift-fit-batch2.svg',commissioned_at:'2026-08-12'}}
  }
];

export const STRUCTURED_LAUNCH_SEED=ITEMS;

export async function ensureStructuredLaunchSeed(DB){
  await ensureStructuredContent(DB);
  for(const item of ITEMS){
    const existing=await DB.prepare('SELECT id,status,version FROM structured_content WHERE id=?').bind(item.id).first();
    if(!existing)await upsertStructuredContent(DB,item);
  }
  return{recipes:ITEMS.filter(x=>x.contentType==='recipe').length,exercises:ITEMS.filter(x=>x.contentType==='exercise').length};
}
