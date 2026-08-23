const MODES=new Set(['working_late','feeling_rough','guts_playing_up','absolutely_knackered','eating_out','going_to_pub','takeaway','missed_lunch','no_time_to_train','plans_cancelled','chaos']);

const quickMeals=[
  {key:'eggs-toast',label:'Eggs on toast',minutes:8,proteinG:24},
  {key:'chicken-wrap',label:'Chicken salad wrap',minutes:7,proteinG:34},
  {key:'yoghurt-banana',label:'Greek yoghurt, banana and oats',minutes:3,proteinG:25}
];

function baseRebuildDay(mode,context={}){
  if(!MODES.has(mode))return null;
  const savedMeal=context.savedMeal||null,savedMove=context.savedMove||null,rejected=new Set(context.rejectedMealKeys||[]);
  const meal=quickMeals.find(item=>!rejected.has(item.key))||quickMeals[0];
  const common={mode,changed:true,original:{meal:savedMeal,movement:savedMove},message:'No drama. The plan changed; the day did not fail.'};
  if(mode==='working_late')return {...common,headline:'Evening rebuilt.',reason:'You are working late, so cooking time and movement have been reduced and water has moved earlier.',now:{domain:'hydration',action:'Grab a drink',detail:'Have roughly 400 ml now rather than catching up before bed.'},next:{domain:'food',action:savedMeal?.minutes<=10?savedMeal.label:meal.label,detail:`About ${savedMeal?.minutes<=10?savedMeal.minutes:meal.minutes} minutes. Quick, familiar and protein-led.`},later:{domain:'movement',action:'Ten-minute reset',detail:'A short walk or home session. If the day runs later again, deliberate rest is valid.'},removed:['Long workout','Slow-cook dinner','Low-value check-ins']};
  if(mode==='guts_playing_up'||mode==='feeling_rough')return {...common,headline:'The next few hours are gentler.',reason:'Food, movement and fluids have been reduced to practical non-clinical support.',now:{domain:'hydration',action:'Sip, do not neck it',detail:'Small regular drinks are easier than catching up at once.'},next:{domain:'food',action:'Smaller plain meal',detail:'Eggs on toast, simple chicken and rice, or yoghurt and banana if tolerated.'},later:{domain:'support',action:'Recheck how you feel',detail:'Persistent or severe symptoms, red flags, or being unable to keep fluids down need clinical advice.'},removed:['Hard training','Large meal','Optimisation tasks'],safety:{clinicalBoundary:true,urgentIf:['severe or worsening symptoms','unable to keep fluids down','signs of dehydration','urgent red flags in approved guidance']}};
  if(mode==='absolutely_knackered')return {...common,headline:'The bar is lower tonight.',reason:'Low energy means the smallest useful actions beat an abandoned perfect plan.',now:{domain:'hydration',action:'One drink now',detail:'That is enough for the first move.'},next:{domain:'food',action:meal.label,detail:`${meal.minutes} minutes and no project required.`},later:{domain:'movement',action:'Six-minute reset or rest',detail:'Choose the easy reset only if it helps.'},removed:['Full workout','Meal prep','Anything guilt-driven']};
  if(mode==='missed_lunch')return {...common,headline:'Missed lunch recovered.',reason:'The plan fills the immediate gap without turning dinner into a free-for-all.',now:{domain:'food',action:'Protein-led bridge',detail:'Greek yoghurt and banana, eggs on toast, or a chicken wrap.'},next:{domain:'hydration',action:'Have a drink with it',detail:'Steady the afternoon rather than chasing a target.'},later:{domain:'food',action:'Keep the planned dinner',detail:'Do not punish the missed meal or double dinner.'},removed:['Compensatory restriction']};
  if(mode==='no_time_to_train')return {...common,headline:'Training resized.',reason:'Available time changed, so movement has been reduced rather than marked as failed.',now:{domain:'movement',action:'Ten minutes or deliberate rest',detail:'Walk, simple home circuit, or consciously leave it.'},next:{domain:'food',action:savedMeal?.label||meal.label,detail:'Dinner stays practical.'},later:{domain:'recovery',action:'Protect sleep',detail:'Do not move a full workout into bedtime.'},removed:['Original workout']};
  if(mode==='going_to_pub')return {...common,headline:'Pub plan, without the sermon.',reason:'Food and hydration are moved around the social plan rather than pretending it is not happening.',now:{domain:'food',action:'Eat before or choose food there',detail:'Protein-led and familiar beats arriving starving.'},next:{domain:'hydration',action:'Water before heading out',detail:'Start hydrated; do not rely on catching up later.'},later:{domain:'movement',action:'Nothing to prove tonight',detail:'Tomorrow adapts from what actually happened.'},removed:['Late workout','Moralising']};
  if(mode==='takeaway')return {...common,headline:'Takeaway fitted in.',reason:'You chose a takeaway, so the rest of the evening has been simplified rather than written off.',now:{domain:'food',action:'Choose the takeaway you actually want',detail:'Use a protein-led main as the anchor; no punishment maths.'},next:{domain:'hydration',action:'Have a drink while you wait',detail:'Move water earlier instead of chasing it at bedtime.'},later:{domain:'movement',action:'Optional ten-minute walk',detail:'Only if it helps you feel better—never to earn the meal.'},removed:['Original dinner','Compensation workout','Guilt']};
  if(mode==='eating_out')return {...common,headline:'Eating out fitted in.',reason:'The day adapts around the meal rather than making the restaurant a test.',now:{domain:'food',action:'Keep earlier food normal',detail:'Do not arrive ravenous.'},next:{domain:'food',action:'Pick what you will enjoy',detail:'A protein-led main is useful; perfection is not required.'},later:{domain:'hydration',action:'Drink normally',detail:'No compensation plan afterwards.'},removed:['Calorie theatre','Punishment workout']};
  if(mode==='plans_cancelled')return {...common,headline:'The gap is yours again.',reason:'Cancelled plans created time; Shift offers one useful option without filling every minute.',now:{domain:'choice',action:'Choose: reset, food prep, or proper downtime',detail:'Only one.'},next:{domain:'food',action:savedMeal?.label||meal.label,detail:'Keep dinner easy.'},later:{domain:'movement',action:'Optional short walk',detail:'Useful if it clears your head.'},removed:['Busywork']};
  return {...common,headline:'Your next three hours are sorted.',reason:'Chaos Mode removes low-value tasks and gives you one move now, then two quiet follow-ons.',now:{domain:'hydration',action:'Grab a drink',detail:'Start with the thing requiring least thought.'},next:{domain:'food',action:savedMeal?.label||meal.label,detail:'Quickest suitable option.'},later:{domain:'movement',action:'Ten minutes or rest',detail:'Decide when you get there.'},removed:['Everything that can wait']};
}

const ALTERNATIVES={
  quickest:{label:'Quickest',meal:{action:'Eggs on toast',detail:'About 8 minutes. Familiar, warm and protein-led.'},movement:{action:'Six-minute reset',detail:'The shortest useful movement option.'},hydration:{action:'Grab a drink now',detail:'No target-chasing required.'}},
  cheapest:{label:'Cheapest',meal:{action:'Tuna jacket potato',detail:'A low-cost proper meal using ordinary UK cupboard food.'},movement:{action:'Ten-minute walk',detail:'Free, simple and available from the front door.'},hydration:{action:'Tap water now',detail:'Useful and costs nothing.'}},
  highest_protein:{label:'Highest protein',meal:{action:'Chicken rice bowl',detail:'A straightforward higher-protein option without making dinner enormous.'},movement:{action:'Ten-minute strength reset',detail:'Short muscle-protection focus.'},hydration:{action:'Water alongside the meal',detail:'Spread fluids rather than necking them late.'}},
  family_friendly:{label:'Family-friendly',meal:{action:'Chicken fajita tray',detail:'One meal for the household; everyone builds their own plate.'},movement:{action:'Ten-minute family walk',detail:'Movement that does not require disappearing to the gym.'},hydration:{action:'Drinks on the table',detail:'Make the useful thing automatic.'}},
  fakeaway:{label:'Fakeaway',meal:{action:'Quick chicken kebab bowl',detail:'Takeaway feel, ordinary ingredients and about 15 minutes.'},movement:{action:'Ten-minute reset while it cooks',detail:'Optional and already fitted into the wait.'},hydration:{action:'Cold drink while cooking',detail:'Water moved forward.'}},
  takeaway:{label:'Takeaway',meal:{action:'Protein-led takeaway main',detail:'Choose what you want; use the main as the anchor and stop when satisfied.'},movement:{action:'Optional short walk',detail:'Not compensation—only if useful.'},hydration:{action:'Have a drink while ordering',detail:'Water before the food arrives.'}}
};

export function rebuildDay(mode,context={}){
  const rebuilt=baseRebuildDay(mode,context);if(!rebuilt)return null;
  const rejected=new Set((context.rejectedActions||[]).map(value=>String(value).trim().toLowerCase()));
  const foodItem=[rebuilt.now,rebuilt.next,rebuilt.later].find(item=>item?.domain==='food');
  if(!foodItem||!rejected.has(String(foodItem.action||'').trim().toLowerCase()))return rebuilt;
  const fallbackKey=['quickest','family_friendly','cheapest','highest_protein'].find(key=>!rejected.has(ALTERNATIVES[key].meal.action.toLowerCase()));
  if(!fallbackKey)return rebuilt;
  const adjusted=applyRebuildAlternative(rebuilt,fallbackKey);adjusted.learningStatement=`You previously ruled out ${foodItem.action}, so Shift replaced it automatically.`;return adjusted;
}

export function applyRebuildAlternative(rebuild,key){
  const choice=ALTERNATIVES[key];if(!rebuild||!choice)return null;
  const next={...rebuild,alternative:{key,label:choice.label},message:`${choice.label} option applied. The rest of the day moved with it.`};
  next.next={domain:'food',...choice.meal};
  if(rebuild.now?.domain==='hydration')next.now={domain:'hydration',...choice.hydration};
  next.later={domain:'movement',...choice.movement};
  next.reason=`You chose ${choice.label.toLowerCase()}, so food, movement and hydration were recalculated together—not swapped in isolation.`;
  return next;
}

export const myTimberAlternativeKeys=Object.freeze(Object.keys(ALTERNATIVES));

export const myTimberRebuildModes=Object.freeze([...MODES]);
