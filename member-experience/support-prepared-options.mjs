import {loadGrubCatalogue} from './grub-routes.mjs';
import {usableCatalogue,emptyGrub,shoppingForWeek,mealFamily} from './grub-workspace.mjs';
import {recommendationFor,grubMemberContext} from './grub-intelligence.mjs';
import {allOffers} from './support-records.mjs';
const toText=v=>typeof v==='string'?v:v?.text||v?.instruction||'';
function unavailable(a,message,href){a.awaitingChoice=true;a.practical={...a.practical,pending:true,name:message,time:'Review your saved choices',items:[],steps:[],fallback:'Use your existing agreed plan if you have one.',href,label:'Review my saved choices'};a.detail=message;a.href=href;a.label='Review my saved choices';a.reason=message;}
export function prepareFoodFromRecords(prefs,s,recipes,previous,input={}){
 const a=s.nextShift;if(!a?.practical||a.kind!=='food')return;
 const state=structuredClone(prefs.grubV2||emptyGrub()),context=grubMemberContext(prefs);
 // A late-finish offer must fit the difficult moment even if no saved time cap
 // exists yet. Existing tighter preferences are preserved.
 if(a.practical.key==='beans')context.maxMinutes=Math.min(context.maxMinutes||Infinity,10);
 const rejected=new Set(allOffers(s).filter(o=>(o.reviews||[]).some(r=>['not-fit','not-helped'].includes(r.outcome))).map(o=>o.practical?.recipeId).filter(Boolean));
 const rejectedFormats=new Set(allOffers(s).filter(o=>(o.reviews||[]).some(r=>r.outcome==='not-fit'&&r.reason==='idea')).map(o=>recipes.find(r=>r.id===o.practical?.recipeId)).filter(Boolean).map(mealFamily));
 let pool=recipes.filter(r=>!rejected.has(r.id)&&!rejectedFormats.has(mealFamily(r)));
 const prior=recipes.find(r=>r.id===previous?.nextShift?.practical?.recipeId);
 if(a.practical.key==='assembly'&&prior){
  pool=pool.filter(r=>r.cook_minutes===0&&Number.isFinite(r.minutes)&&Number.isFinite(prior.minutes)&&(r.minutes<prior.minutes||r.minutes<=prior.minutes&&r.ingredients.length<prior.ingredients.length));
  if(!pool.length){
   a.kind='support';a.title='No extra cooking job tonight.';a.detail='Keep your familiar fallback';a.practical={key:'pause',kind:'support',memoryId:a.practical.memoryId,title:a.title,name:a.detail,time:'You can leave the new idea for now',items:[],steps:['Use a familiar meal already available that suits your needs.','Leave the new meal idea for another day. There is nothing to catch up.'],href:'/member/grub',label:'Keep tonight manageable',fallback:'Your existing agreed plan is still available.',source:'no_simpler_matching_recipe'};a.reason='You asked for less effort. I could not find a simpler matching meal in your saved choices, so I have left out the new cooking task.';a.awaitingChoice=false;s.memberSupport.response=a.reason;return;
  }
 }
 if(state.options?.effort==='five')context.maxMinutes=Math.min(context.maxMinutes||Infinity,5);
 if(a.practical.key==='assembly')state.options={...state.options,effort:'no-cook'};
 if(input.outcome==='helped'&&previous?.nextShift?.practical?.recipeId)state.recommendation={recipeId:previous.nextShift.practical.recipeId};
 const selected=recommendationFor(state,pool,context),r=selected.recipe;
 if(!r){
  if(a.practical.key==='assembly'){
   a.kind='support';a.title='No extra cooking job tonight.';a.detail='Keep your familiar fallback';
   a.practical={key:'pause',kind:'support',memoryId:a.practical.memoryId,title:a.title,name:a.detail,time:'You can leave the new idea for now',items:[],steps:['Use a familiar meal already available that suits your needs.','Leave the new meal idea for another day. There is nothing to catch up.'],href:'/member/grub',label:'Keep tonight manageable',fallback:'Your existing agreed plan is still available.',source:'no_simpler_matching_recipe'};
   a.reason='You asked for less effort. I could not find a simpler matching meal in your saved choices, so I have left out the new cooking task.';a.awaitingChoice=false;s.memberSupport.response=a.reason;return;
  }
  unavailable(a,selected.message,'/member/grub');return;
 }
 const servings=Number.isInteger(selected.servings)&&selected.servings>=1&&selected.servings<=8?selected.servings:r.servings;
 const items=shoppingForWeek([{recipeId:r.id,servings}],pool).map(i=>i.text);
 a.practical={...a.practical,pending:false,recipeId:r.id,name:r.name,minutes:r.minutes,ingredientCount:r.ingredients.length,time:(r.minutes!==null?'About '+r.minutes+' minutes · ':'')+'serves '+servings,items,steps:r.method.map(toText).filter(Boolean),source:'published_catalogue',sourcePreferencesRevision:prefs.grubV2?.revision||0,allergens:r.allergens,allergenNote:r.allergen_note,foodSafety:r.food_safety,fallback:'If this does not fit, use a familiar meal that suits your needs or review your food choices. Check ingredients and product labels.'};
 a.detail=r.name;a.reason=[a.reason,...selected.reasons,'This is the reviewed recipe and ingredient list, using your saved Grub choices.'].filter(Boolean).join(' ');
 a.awaitingChoice=false;
}
export function prepareMovementFromPlan(s,plan,planId){
 const a=s.nextShift;if(!a?.practical||a.kind!=='movement')return;
 const rejected=new Set(allOffers(s).filter(o=>(o.reviews||[]).some(r=>['not-fit','not-helped'].includes(r.outcome))).map(o=>o.practical?.sessionKey).filter(Boolean));
 const sessions=Array.isArray(plan?.sessions)?plan.sessions:[];
 const selected=sessions.map((v,i)=>({v,key:String(planId)+':'+i})).find(x=>!rejected.has(x.key));
 if(!selected){unavailable(a,'No saved Fit session is available for this choice. Review your time, equipment and limitations in Fit.','/member/fit');return;}
 const session=selected.v,blocks=Array.isArray(session.blocks)?session.blocks:[];
 const exercises=[...(Array.isArray(session.exercises)?session.exercises:[]),...blocks.flatMap(b=>b.exercises||b.items||[])];
 const steps=exercises.map(e=>[e.name||e.title,e.prescription||[e.sets?e.sets+' sets':null,e.reps?e.reps+' reps':null,e.seconds?e.seconds+' seconds':null].filter(Boolean).join(' · '),...(Array.isArray(e.instructions)?e.instructions:[])].filter(Boolean).join(' — ')).filter(Boolean);
 if(!steps.length){unavailable(a,'Your saved Fit session is available in Fit. Review its original instructions and easier alternatives there.','/member/fit');return;}
 a.practical={...a.practical,pending:false,label:'Show me this session',sessionKey:selected.key,planId,name:session.title||session.name||'Your saved Fit session',time:'Your saved session · use its existing effort and limitations',items:session.equipment||plan.equipment||[],steps,fallback:'Open Fit for its easier alternatives. Your saved safety choices stay in place.',source:'own_saved_fit_plan'};
 a.detail=a.practical.name;a.reason='Prepared from your own saved Fit plan. Your equipment, effort and limitations have not been changed.';a.awaitingChoice=false;
}
export function prepareTimingFromPrevious(next,previous,input){
 const a=next.nextShift,old=previous?.nextShift?.practical;
 if(a?.practical?.key!=='earlier'||!old||old.pending||!old.steps?.length||!(input.reason==='timing'||input.outcome==='helped'&&old.key==='earlier'))return false;
 const preparedKind=old.preparedKind||old.kind||previous.nextShift.kind,noun=preparedKind==='movement'?'session':preparedKind==='food'?'meal':'plan',title='Same '+noun+'. A better moment.';
 a.practical={...structuredClone(old),key:'earlier',preparedKind,title,memoryId:a.practical.memoryId};
 a.title=title;a.detail=old.name;a.href=old.href;a.label=old.label;a.awaitingChoice=false;
 a.reason='You said the timing was wrong. I have kept '+old.name+' and its instructions ready for a time you choose, so you do not have to start again.';
 if(input.outcome==='helped')a.reason='You said this better-timed '+noun+' helped. I have kept the useful version ready.';
 return true;
}

export async function connectPreparedOption(DB,prefs,next,previous,input){
 if(!['support-start','shift-feedback','support-obstacle','support-record'].includes(input.action)||next.nextShift?.id===previous.nextShift?.id)return;
 const a=next.nextShift;if(!a?.practical)return;
 if(prepareTimingFromPrevious(next,previous,input))return;
 if(a.kind==='food'){
  try{prepareFoodFromRecords(prefs,next,usableCatalogue(await loadGrubCatalogue(DB)),previous,input);}
  catch{unavailable(a,'The reviewed recipe library is unavailable. Your existing food plan is unchanged.','/member/grub');}
 }else if(a.kind==='movement'){
  try{const row=await DB.prepare("SELECT id,plan_json FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1").bind(input.authenticatedUserId).first();prepareMovementFromPlan(next,row?JSON.parse(row.plan_json):null,row?.id);}
  catch{unavailable(a,'Your saved Fit plan could not be loaded. Open Fit to review your options.','/member/fit');}
 }
}
