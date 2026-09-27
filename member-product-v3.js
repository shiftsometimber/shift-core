import core from './worker.js';

const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const today=()=>new Date().toISOString().slice(0,10);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const j=(data,status=200,request)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders(request)}});

export async function memberProductV3Routes(request,env,ctx){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',m=request.method.toUpperCase();
  const supported=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/grub/conundrum','/v1/fit/plan','/v1/fit/replace','/v1/hydration/plan']);
  if(!supported.has(p))return null;
  if(m==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request)});
  if(m!=='POST')return j({ok:false,error:'method_not_allowed'},405,request);
  const a=await auth(request,env,ctx);if(a.response)return withCors(a.response,request);
  await ensurePlanSchema(env.DB);
  if(p==='/v1/grub/plan')return grubPlan(request,env,a.user.id);
  if(p==='/v1/grub/replace')return replaceMeal(request,env,a.user.id);
  if(p==='/v1/grub/conundrum')return conundrum(request,env,a.user.id);
  if(p==='/v1/fit/plan')return fitPlan(request,env,a.user.id);
  if(p==='/v1/fit/replace')return replaceExercise(request,env,a.user.id);
  if(p==='/v1/hydration/plan')return hydration(request,env,a.user.id);
  return null;
}

const M=(id,name,type,kcal,protein,fibre,minutes,ingredients,method,tags=[])=>({id,name,type,kcal,protein,fibre,minutes,ingredients,method,tags});
const MEALS=[
M('eggs-toast','Eggs on toast with chilli tomatoes','breakfast',430,28,7,10,['2 eggs','2 slices wholemeal bread','tomatoes','chilli flakes'],['Toast the bread.','Cook the eggs how you like them.','Warm tomatoes with chilli flakes, black pepper and a splash of water.','Pile it up and serve.'],['quick','vegetarian']),
M('mexican-eggs','Mexican scrambled eggs & salsa toast','breakfast',450,30,8,12,['2 eggs','wholemeal bread','tomatoes','spring onion','paprika','chilli'],['Scramble the eggs gently.','Mix chopped tomato with spring onion, paprika and chilli.','Serve on toast with salsa spooned over.'],['spicy','vegetarian']),
M('breakfast-wrap','Smoky breakfast wrap','breakfast',520,31,6,15,['eggs','wrap','lean bacon','tomato','smoked paprika'],['Cook bacon until done.','Scramble the eggs with paprika.','Add tomato, roll in the wrap and toast briefly.'],['wrap','smoky']),
M('yoghurt-biscoff','Biscoff protein yoghurt bowl','breakfast',410,35,5,3,['Greek yoghurt','protein powder','banana','Biscoff spread'],['Mix yoghurt and protein powder.','Top with banana and a measured spoon of Biscoff.'],['sweet','quick']),
M('berry-oats','Berry cheesecake overnight oats','breakfast',430,32,9,5,['oats','Greek yoghurt','berries','milk','vanilla'],['Mix everything in a tub.','Chill overnight.','Stir and eat cold or warm gently.'],['prep','sweet']),
M('beans-eggs','Spiced beans & eggs on toast','breakfast',500,31,13,12,['baked beans','eggs','wholemeal bread','smoked paprika','chilli sauce'],['Warm the beans with paprika.','Cook the eggs.','Serve over toast with chilli sauce.'],['high-fibre','spicy']),
M('chicken-club','Chicken club sandwich','lunch',560,45,8,8,['chicken','wholemeal bread','lettuce','tomato','light mayo'],['Mix sliced chicken with light mayo.','Layer with lettuce and tomato.','Toast the bread if you fancy.'],['quick']),
M('buffalo-wrap','Buffalo chicken wrap','lunch',540,46,7,10,['chicken','wrap','hot sauce','lettuce','Greek yoghurt'],['Mix hot sauce with yoghurt.','Coat hot chicken.','Add lettuce and roll into the wrap.'],['wrap','spicy']),
M('tuna-crunch','Tuna crunch jacket potato','lunch',590,43,10,15,['potato','tuna','sweetcorn','red onion','Greek yoghurt'],['Cook the potato until fluffy.','Mix tuna, sweetcorn, onion and yoghurt.','Split the potato and load it up.'],['high-protein']),
M('ham-cheese-omelette','Ham, cheddar & mustard omelette','lunch',520,40,4,10,['eggs','ham','cheddar','mustard'],['Beat eggs with pepper.','Add ham and cheddar as the eggs set.','Fold with a little mustard inside.'],['quick']),
M('pesto-chicken-pitta','Pesto chicken pitta','lunch',550,44,6,8,['chicken','wholemeal pitta','pesto','tomato','rocket'],['Warm the pitta.','Mix chicken with a measured spoon of pesto.','Stuff with tomato and rocket.'],['mediterranean']),
M('halloumi-chilli-wrap','Sweet chilli halloumi wrap','lunch',610,29,7,12,['halloumi','wrap','salad','sweet chilli sauce'],['Brown halloumi in a dry pan.','Add salad to the wrap.','Top with halloumi and sweet chilli sauce.'],['vegetarian','wrap']),
M('beef-chilli','Smoky beef chilli & rice','dinner',690,48,12,30,['lean beef mince','kidney beans','rice','tomatoes','smoked paprika','cumin','chilli'],['Brown the mince.','Add paprika, cumin and chilli.','Add tomatoes and beans and simmer.','Serve with rice.'],['spicy','batch']),
M('chicken-fajita','Sizzling chicken fajitas','dinner',650,49,9,25,['chicken','wraps','peppers','onion','paprika','cumin','lime'],['Slice chicken, peppers and onion.','Fry with paprika and cumin until cooked.','Finish with lime and pile into wraps.'],['wrap','spicy']),
M('peri-chicken','Peri-peri chicken, wedges & slaw','dinner',680,52,10,30,['chicken','potatoes','peri-peri sauce','cabbage','carrot','Greek yoghurt'],['Roast or air-fry potato wedges.','Cook chicken with peri-peri sauce.','Mix cabbage and carrot with yoghurt for slaw.'],['spicy','air-fryer']),
M('katsu-chicken','Fakeaway chicken katsu curry','dinner',710,47,8,35,['chicken','rice','breadcrumbs','curry powder','carrot','onion','stock'],['Coat chicken lightly in breadcrumbs and bake or air-fry.','Soften onion and carrot with curry powder.','Add stock and simmer, then blend.','Serve with rice.'],['fakeaway']),
M('teriyaki-beef','Sticky teriyaki beef noodles','dinner',700,45,8,20,['lean beef strips','noodles','soy sauce','honey','ginger','garlic','broccoli'],['Stir-fry beef.','Add broccoli, ginger and garlic.','Add soy and a little honey.','Toss through cooked noodles.'],['asian','quick']),
M('harissa-chicken','Harissa chicken couscous','dinner',660,48,10,25,['chicken','couscous','harissa','peppers','Greek yoghurt'],['Coat chicken with harissa and cook through.','Make couscous.','Roast or fry peppers.','Serve with a spoon of yoghurt.'],['spicy','mediterranean']),
M('garlic-chicken-pasta','Creamy garlic chicken pasta','dinner',690,50,7,25,['chicken','pasta','garlic','light cream cheese','spinach','parmesan'],['Cook pasta.','Brown chicken and garlic.','Stir in cream cheese with pasta water.','Add spinach and finish with parmesan.'],['comfort']),
M('taco-bowl','Loaded taco bowl','dinner',670,46,13,25,['lean beef mince','rice','black beans','corn','tomato','paprika','cumin','Greek yoghurt'],['Cook mince with paprika and cumin.','Build a bowl with rice, beans and corn.','Add tomato and yoghurt.'],['mexican']),
M('thai-chicken','Thai-style chicken basil rice','dinner',650,47,8,20,['chicken','rice','garlic','chilli','soy sauce','basil','green beans'],['Stir-fry chicken with garlic and chilli.','Add beans and soy.','Finish with basil and serve with rice.'],['asian','spicy']),
M('pizza-wrap','Crispy chicken pizza wraps','dinner',620,43,7,15,['wraps','chicken','tomato puree','mozzarella','oregano','chilli flakes'],['Spread tomato puree over wraps.','Add chicken, mozzarella, oregano and chilli.','Bake or air-fry until crisp.'],['fakeaway','wrap']),
M('sausage-traybake','Paprika sausage traybake','dinner',680,38,12,35,['sausages','potatoes','peppers','onion','paprika','garlic'],['Chop everything into chunks.','Toss with paprika, garlic and a little oil.','Roast until cooked and caramelised.'],['traybake']),
M('salmon-teriyaki','Teriyaki salmon rice bowl','dinner',690,42,8,25,['salmon','rice','soy sauce','honey','ginger','cucumber'],['Bake or pan-cook salmon.','Mix soy, honey and ginger.','Serve with rice and cucumber.'],['fish','asian']),
M('naan-pizza','Chicken tikka naan pizza','dinner',700,48,7,18,['naan','chicken','tikka paste','tomato puree','mozzarella','red onion'],['Mix chicken with tikka paste and cook.','Spread naan with tomato puree.','Top with chicken, onion and mozzarella; bake until bubbling.'],['fakeaway','indian']),
M('protein-yoghurt','Protein yoghurt, fruit & crunch','snack',240,24,5,2,['protein yoghurt','fruit','granola'],['Add fruit and a small handful of granola to yoghurt.'],['sweet']),
M('apple-cheese','Apple, cheddar & pickle','snack',220,10,4,2,['apple','cheddar','pickle'],['Slice apple and cheddar.','Add a little pickle.'],['savoury']),
M('choc-banana','Chocolate banana protein pot','snack',260,25,5,3,['Greek yoghurt','banana','cocoa powder','protein powder'],['Mix yoghurt, cocoa and protein powder.','Top with banana.'],['sweet']),
M('hummus-crunch','Hummus crunch box','snack',250,11,8,5,['hummus','carrot','cucumber','wholemeal pitta'],['Slice veg and pitta.','Dip into hummus.'],['vegetarian'])
];
const mealPublic=m=>({...m,recipe:{ingredients:m.ingredients,method:m.method,minutes:m.minutes}});

function mealMatchesPrefs(m,prefs){
  const p=String(prefs||'').toLowerCase();
  if(p.includes('no fish')||p.includes('hate fish')){if(m.tags.includes('fish')||/tuna|salmon/.test(m.name.toLowerCase()))return false;}
  if(p.includes('vegetarian')&&!m.tags.includes('vegetarian'))return false;
  return true;
}
async function grubPlan(request,env,uid){
  const b=await read(request),days=clamp(Number(b.days)||1,1,7),prefs=String(b.preferences||'');
  const calories=num(b.calories)||2000,protein=num(b.protein_g)||108;const planDays=[];const used=new Set();
  for(let d=0;d<days;d++){
    const meals=[];
    for(const type of ['breakfast','lunch','dinner','snack']){
      let pool=MEALS.filter(x=>x.type===type&&mealMatchesPrefs(x,prefs)&&!used.has(x.id));
      if(!pool.length)pool=MEALS.filter(x=>x.type===type&&mealMatchesPrefs(x,prefs));
      const m=pool[(d+type.length)%pool.length];used.add(m.id);meals.push(mealPublic(m));
    }
    const date=new Date(Date.now()+d*86400000).toISOString().slice(0,10);
    planDays.push({day:d+1,date,meals,totals:meals.reduce((a,m)=>({kcal:a.kcal+m.kcal,protein_g:a.protein_g+m.protein}),{kcal:0,protein_g:0})});
  }
  const plan={kind:'shift_grub_plan',days_requested:days,targets:{calories,protein_g:protein},preference_note:prefs||null,days:planDays,feedback_rule:'Yay keeps it. Nay can be used repeatedly to replace one meal at a time.'};
  await savePlan(env,uid,'grub',plan);return j({ok:true,plan},200,request);
}
async function replaceMeal(request,env,uid){
  const b=await read(request),type=String(b.type||''),exclude=new Set((b.exclude||[]).map(String)),prefs=String(b.preferences||'');
  let pool=MEALS.filter(x=>x.type===type&&!exclude.has(x.id)&&mealMatchesPrefs(x,prefs));
  if(!pool.length)pool=MEALS.filter(x=>x.type===type&&mealMatchesPrefs(x,prefs));
  if(!pool.length)return j({ok:false,error:'no_replacement_available'},409,request);
  const choice=mealPublic(pool[Math.floor(Math.random()*pool.length)]);return j({ok:true,meal:choice},200,request);
}

function norm(x){return String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function baseIngredient(x){return norm(x).replace(/^\d+(\.\d+)?\s*/,'').replace(/^(slices?|tbsp|tsp|g|kg|ml|l)\s+/,'');}
const ALIASES={bread:['bread','toast','roll','bun','bap','buttie'],tomato:['tomato','tomatoes'],wrap:['wrap','wraps','tortilla'],chicken:['chicken','chicken breast'],egg:['egg','eggs'],cheese:['cheese','cheddar','mozzarella'],potato:['potato','potatoes','jacket potato','hash browns','hash brown'],sausage:['sausage','sausages'],bacon:['bacon'],rice:['rice'],pasta:['pasta'],beans:['beans','baked beans','kidney beans','black beans']};
function hasIngredient(items,need){const n=baseIngredient(need);const key=Object.keys(ALIASES).find(k=>n.includes(k))||n;const wants=ALIASES[key]||[key];return items.some(i=>wants.some(w=>i.includes(w)||w.includes(i)));}
const CONUNDRUM=[
{name:'Bacon butty',ingredients:['bacon','bread'],kcal:430,protein:25,minutes:8,method:['Cook the bacon until done to your liking.','Put it between the bread. Add sauce only if you actually have it.']},
{name:'Sausage butty',ingredients:['sausages','bread'],kcal:510,protein:24,minutes:15,method:['Cook sausages through.','Slice and pile into bread.']},
{name:'Bacon & sausage butty',ingredients:['bacon','sausages','bread'],kcal:620,protein:35,minutes:18,method:['Cook bacon and sausages.','Pile both into the bread.']},
{name:'Loaded breakfast hash browns',ingredients:['bacon','sausages','hash browns'],kcal:650,protein:32,minutes:20,method:['Cook hash browns until crisp.','Cook bacon and sausages.','Chop and load over the hash browns.']},
{name:'Chicken & cheese wrap',ingredients:['chicken','wrap','cheese'],kcal:540,protein:43,minutes:8,method:['Warm the chicken.','Add chicken and cheese to the wrap.','Fold and toast until the cheese melts.']},
{name:'Cheesy egg wrap',ingredients:['egg','wrap','cheese'],kcal:480,protein:28,minutes:10,method:['Scramble the eggs.','Add eggs and cheese to the wrap.','Fold and toast.']},
{name:'Egg & bacon butty',ingredients:['egg','bacon','bread'],kcal:520,protein:31,minutes:12,method:['Cook bacon and egg.','Layer both in bread.']},
{name:'Cheesy beans on toast',ingredients:['beans','bread','cheese'],kcal:520,protein:25,minutes:10,method:['Toast the bread.','Heat beans.','Top toast with beans and cheese.']}
];
async function conundrum(request,env,uid){
  const b=await read(request),items=[...(b.fridge||[]),...(b.freezer||[]),...(b.cupboard||[]),...(b.items||[])].map(norm).filter(Boolean);
  if(!items.length)return j({ok:true,mode:'fridge_freezer_cupboard',top:[],message:'Tell Shift what you have and I’ll build ideas from those ingredients.'},200,request);
  const library=[...CONUNDRUM,...MEALS.map(m=>({name:m.name,ingredients:m.ingredients,kcal:m.kcal,protein:m.protein,minutes:m.minutes,method:m.method}))];
  const candidates=library.map(m=>{const matched=m.ingredients.filter(x=>hasIngredient(items,x)),missing=m.ingredients.filter(x=>!hasIngredient(items,x));return {...m,matched,missing,match_ratio:matched.length/m.ingredients.length};})
    .filter(x=>x.matched.length>=2&&x.match_ratio>=0.6).sort((a,b)=>a.missing.length-b.missing.length||b.match_ratio-a.match_ratio||b.protein-a.protein).slice(0,6);
  const top=candidates.map((x,i)=>({...x,id:`con-${i}-${norm(x.name).replace(/ /g,'-')}`,recipe:{ingredients:x.ingredients,method:x.method,minutes:x.minutes},missing_note:x.missing.length?`If you've also got: ${x.missing.join(', ')}`:'You already listed everything needed.'}));
  return j({ok:true,mode:'fridge_freezer_cupboard',top,message:top.length?'Here are the strongest ideas from what you actually listed. Extra ingredients are never silently invented.':'Nothing sensible matched strongly enough yet. Add a couple more things you genuinely have.'},200,request);
}

const E=(id,name,group,minutes,sets,reps,rest,notes,how,equipment='none',level='beginner')=>({id,name,group,minutes,sets,reps,rest_seconds:rest,notes,how,equipment,level});
const EXERCISES=[
E('march','March on the spot','warmup',4,1,null,0,'Raise the temperature without battering yourself.',['Stand tall.','March steadily, swinging your arms.','Build pace gradually.']),
E('mobility-flow','Shoulder, hip & ankle mobility','warmup',5,1,null,0,'Gentle joint prep.',['Roll shoulders slowly.','Circle hips through a comfortable range.','Circle each ankle and finish with easy squats to a chair.']),
E('chair-squat','Chair squat','legs',6,3,'8–12',60,'Sit back to a chair and stand again.',['Stand just in front of a sturdy chair.','Push hips back and bend knees until you lightly touch the chair.','Drive through your feet to stand tall.']),
E('split-squat','Supported split squat','legs',6,3,'8 each side',60,'Hold a wall or chair if balance is iffy.',['Take a staggered stance.','Drop the back knee gently toward the floor.','Push through the front foot to stand.']),
E('step-up','Low step-up','legs',6,3,'8 each side',45,'Use a stable low step.',['Place one whole foot on the step.','Drive up through that leg.','Step back down under control.']),
E('glute-bridge','Glute bridge','legs',5,3,'10–15',45,'Glutes and hips.',['Lie on your back with knees bent.','Squeeze glutes and lift hips.','Pause, then lower slowly.']),
E('wall-press','Wall or incline press-up','push',5,3,'8–12',60,'Use a wall, worktop or sturdy table.',['Hands slightly wider than shoulders.','Keep your body in a straight line.','Lower chest toward support, then press away.']),
E('floor-press','Dumbbell floor press','push',6,3,'8–12',60,'Chest and triceps with a stable floor position.',['Lie on your back with dumbbells by your chest.','Press them upward.','Lower until upper arms lightly touch the floor.'],'dumbbells'),
E('backpack-row','Backpack row','pull',6,3,'10–12',60,'A loaded backpack works fine.',['Hinge forward with a flat back.','Pull the bag toward lower ribs.','Lower slowly.'],'backpack'),
E('band-row','Resistance-band row','pull',6,3,'10–15',45,'Simple pulling work.',['Anchor the band securely.','Pull elbows back toward ribs.','Return slowly.'],'resistance band'),
E('shoulder-press','Seated dumbbell shoulder press','push',6,3,'8–12',60,'Sit tall and press overhead.',['Sit with feet planted.','Start dumbbells around shoulder height.','Press overhead without leaning back.'],'dumbbells'),
E('curl','Dumbbell curl','arms',5,3,'10–15',45,'Straightforward biceps work.',['Keep elbows by your sides.','Curl the weight up.','Lower slowly.'],'dumbbells'),
E('triceps','Band triceps press-down','arms',5,3,'10–15',45,'Elbows stay tucked.',['Anchor band above you.','Keep upper arms still.','Straighten elbows, then return slowly.'],'resistance band'),
E('dead-bug','Dead bug','core',5,3,'6–10 each side',45,'Slow core control — not a deceased insect.',['Lie on your back with hips and knees at about 90 degrees.','Brace gently.','Lower opposite arm and leg slowly, return, then swap.']),
E('bird-dog','Bird dog','core',5,3,'6–10 each side',45,'Core stability on hands and knees.',['Start on hands and knees.','Reach opposite arm and leg long.','Pause without twisting, then swap.']),
E('plank','Incline plank','core',4,3,'20–40 sec',40,'Use a bench or worktop to make it manageable.',['Place forearms or hands on the support.','Walk feet back.','Hold a straight line while breathing normally.']),
E('brisk-walk','Brisk walk','cardio',10,1,null,0,'Purposeful pace; still able to talk.',['Stand tall.','Walk briskly.','Shorten stride if joints complain.']),
E('jog-walk','Easy jog / walk intervals','cardio',12,4,'2 min jog + 1 min walk',0,'Easy intervals, not a race.',['Warm up walking.','Jog easily for two minutes.','Walk for one minute and repeat.']),
E('bike','Exercise bike','cardio',12,1,null,0,'Steady low-impact cardio.',['Set the saddle so the knee stays slightly bent at the bottom.','Pedal easily for two minutes.','Build to a steady moderate pace.'],'exercise bike'),
E('cooldown','Easy cooldown & breathing','cooldown',4,1,null,0,'Bring the effort back down.',['Walk slowly or march gently.','Relax shoulders.','Take slow comfortable breaths.'])
];
function eligibleExercises(group,prefs,exclude=new Set()){
  const p=String(prefs||'').toLowerCase();let xs=EXERCISES.filter(x=>x.group===group&&!exclude.has(x.id));
  if(p.includes('home'))xs=xs.filter(x=>x.equipment==='none'||x.equipment==='backpack'||x.equipment==='resistance band');
  if(p.includes('no equipment'))xs=xs.filter(x=>x.equipment==='none');
  if(p.includes('knee')||p.includes('joint'))xs=xs.filter(x=>!['split-squat','step-up','jog-walk'].includes(x.id));
  return xs;
}
function pick(group,prefs,used){const xs=eligibleExercises(group,prefs,used);const x=xs[0]||EXERCISES.find(e=>e.group===group);if(x)used.add(x.id);return x;}
function composeSession(day,minutes,prefs){
  const used=new Set(),blocks=[];let remaining=minutes;
  const add=(group,target)=>{const x=pick(group,prefs,used);if(!x||remaining<3)return;const mins=Math.min(target,x.minutes,remaining);blocks.push({...x,minutes:mins});remaining-=mins;};
  add('warmup',minutes<=15?3:5);
  if(minutes<=15){add('legs',5);add('push',4);add('core',3);}
  else if(minutes<=25){add('legs',6);add('push',5);add('pull',5);add('core',4);}
  else if(minutes<=40){add('legs',6);add('push',6);add('pull',6);add('legs',5);add('core',5);add('cardio',6);}
  else {add('legs',7);add('push',7);add('pull',7);add('legs',6);add('arms',5);add('core',6);add('cardio',8);}
  if(remaining>=4)add('cooldown',remaining);
  while(remaining>=3){const x=pick(day%2?'cardio':'core',prefs,used);if(!x)break;const mins=Math.min(x.minutes,remaining);blocks.push({...x,minutes:mins});remaining-=mins;}
  const total=blocks.reduce((n,x)=>n+x.minutes,0);
  return {day,title:`${total}-minute ${day%3===1?'full-body strength':day%3===2?'strength + cardio':'mixed movement'} session`,estimated_minutes:total,exercises:blocks,progression:'If the session feels comfortably manageable twice in a row, add a little resistance or 1–2 reps — not a random extra 20 minutes to one exercise.'};
}
async function fitPlan(request,env,uid){
  const b=await read(request),days=clamp(Number(b.days)||3,1,7),minutes=clamp(Number(b.minutes_per_day)||30,10,60),prefs=String(b.preferences||'');
  const sessions=Array.from({length:days},(_,i)=>composeSession(i+1,minutes,prefs));
  const plan={kind:'shift_fit_plan',days_requested:days,minutes_per_day:minutes,preference_note:prefs||null,step_target:7000,sessions,feedback_rule:'Yay keeps an exercise. Nay replaces that exercise with a comparable option and can be used repeatedly.',rule:'Start where you are. Pain, dizziness or unusual symptoms beat the plan — stop and seek appropriate advice.'};
  await savePlan(env,uid,'fit',plan);return j({ok:true,plan},200,request);
}
async function replaceExercise(request,env,uid){
  const b=await read(request),group=String(b.group||''),exclude=new Set((b.exclude||[]).map(String)),prefs=String(b.preferences||'');
  let pool=eligibleExercises(group,prefs,exclude);if(!pool.length)pool=EXERCISES.filter(x=>x.group===group);
  if(!pool.length)return j({ok:false,error:'no_replacement_available'},409,request);
  const x=pool[Math.floor(Math.random()*pool.length)];return j({ok:true,exercise:x},200,request);
}

async function hydration(request,env,uid){
  const b=await read(request),weightKg=num(b.weight_kg)||75,activity=num(b.activity_minutes)||0,heat=!!b.hot_weather;
  const guide=Math.round((Math.min(3500,Math.max(1800,weightKg*30))+Math.round(activity/30)*300+(heat?400:0))/100)*100;
  const portions=[['On waking',0.15],['With breakfast',0.15],['Mid-morning',0.12],['With lunch',0.18],['Mid-afternoon',0.12],['With dinner',0.16],['Evening',0.12]];
  let allocated=0;const schedule=portions.map((x,i)=>{let ml=i===portions.length-1?guide-allocated:Math.round(guide*x[1]/50)*50;allocated+=ml;return{when:x[0],ml};});
  const drinks=[
    {drink:'Water',counts:true,note:'Best default choice.'},{drink:'Tea / brew',counts:true,note:'Counts towards fluid intake.'},{drink:'Coffee',counts:true,note:'Counts; keep caffeine sensible.'},{drink:'Milk',counts:true,note:'Counts towards fluid intake.'},{drink:'Sugar-free squash',counts:true,note:'Counts if diluted normally.'},{drink:'Fruit juice',counts:true,note:'Counts as fluid, but keep portions modest because of free sugars.'},{drink:'Beer / alcohol',counts:false,note:'Do not use alcohol to meet the Shift hydration target.'}
  ];
  const plan={kind:'shift_hydration_plan',guide_ml:guide,guide_litres:+(guide/1000).toFixed(1),schedule,drinks,activity_extra_ml:Math.round(activity/30)*300,heat_extra_ml:heat?400:0,note:'General hydration guide only. Some heart, kidney and other conditions need individual fluid advice.'};
  await savePlan(env,uid,'hydration',plan);return j({ok:true,plan},200,request);
}

async function savePlan(env,uid,type,plan){await env.DB.prepare(`UPDATE shift_plans SET status='superseded' WHERE user_id=? AND plan_type=? AND status='active'`).bind(uid,type).run();await env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(uid,type,today(),'active',JSON.stringify(plan)).run();}
async function ensurePlanSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT NOT NULL,ends_on TEXT,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
async function read(r){try{return await r.json()}catch{return {}}}
function corsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ALLOWED_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
