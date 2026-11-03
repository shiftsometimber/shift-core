import {journeyDay} from './journey-records.mjs';
import {v7State,v7NextReason,v7Share} from './v7-model.mjs';
import {practicalActions} from './support-plan.mjs';

const pause={id:'routine:pause',...practicalActions.pause,completedLabel:'One ordinary job left for later.'};
function prepared(a,id){
 return {id,name:a.name,kind:a.kind||'routine',time:a.time||'',href:a.href||'/member/grub',label:a.label||'Open the original instructions',
  steps:a.steps||[],items:a.items||[],pending:!!a.pending,reason:a.reason||null,
  ...(a.recipeId?{recipeId:a.recipeId}:{}),...(Number.isFinite(a.proteinG)?{proteinG:a.proteinG}:{}),
  completedLabel:a.kind==='food'?'Dinner made.':'Your action is saved.'};
}
export function v7Offer(prefs,recipes=[],at=new Date().toISOString(),helpers={}){
 const progress=prefs.lifeBack?.progress||{},view=v7State(progress,at),reason=v7NextReason(progress,view.today),saved=progress.v7?.days?.[view.today]?.selected;
 const old=progress.nextShift?.practical;
 const grub=structuredClone(prefs.grubV2||helpers.emptyGrub?.()||{}),context=helpers.grubMemberContext?.(prefs,view.today)||{};
 const excluded=new Set();
 if(['not-helped','not-fit'].includes(reason.outcome)&&reason.actionId?.startsWith('recipe:'))excluded.add(reason.actionId.slice(7));
 let pool=recipes.filter(r=>!excluded.has(r.id)),dinners=[];
 for(let n=0;n<4&&pool.length;n++){
  const recommendation=helpers.recommendationFor(grub,pool,context),r=recommendation.recipe;if(!r)break;
  const a={id:'recipe:'+r.id,kind:'food',recipeId:r.id,name:r.name,proteinG:r.protein_g,minutes:r.minutes,time:r.minutes===null?'Your reviewed recipe':r.minutes+' mins',
   href:'/member/grub#recipe-'+encodeURIComponent(r.id),label:'Recipe',items:r.ingredients.map(i=>[i.amount,i.unit,i.item].filter(Boolean).join(' ')),
   steps:r.method.map(s=>typeof s==='string'?s:s?.text||s?.instruction||'').filter(Boolean),allergenNote:r.allergen_note,allergens:r.allergens,
   completedLabel:'Dinner made.',reason:reason.text||recommendation.reasons.join(' ')||'From your reviewed Grub choices.'};
  dinners.push(a);pool=pool.filter(x=>x.id!==r.id);delete grub.recommendation;
 }
 const returnEasy=view.returning||reason.outcome==='not-tried'||reason.outcome==='not-helped';
 const easier=reason.previousName===pause.name?{id:'routine:earlier',...practicalActions.earlier,completedLabel:'Your fallback is chosen.'}:pause;
 let initial=returnEasy?{...easier,reason:reason.text||'Good to see you. Keep today manageable. Your pile is still here.'}:old&&!old.pending&&!reason.outcome?prepared(old,old.recipeId?'recipe:'+old.recipeId:'support:'+progress.nextShift.id):dinners[0];
 if(!initial)initial={id:'review:food',name:'Review a familiar dinner in Grub',kind:'food',pending:true,href:'/member/grub',label:'Open Grub',reason:'Your saved choices need checking before we can suggest a reviewed dinner.'};
 const action=saved||initial,alternatives=dinners.filter(a=>a.id!==action.id).slice(0,3);
 return {action,alternatives,adaptation:reason.text,returning:view.returning};
}
export async function v7Context(DB,userId,prefs,at=new Date().toISOString()){
 const progress=prefs.lifeBack?.progress||{},stored=progress.v7?.offers;
 let offer=v7Offer(prefs,[],at);
 if(stored&&stored.on===journeyDay(at)&&stored.grubRevision===(prefs.grubV2?.revision||0)&&stored.foodChoices===JSON.stringify(prefs.food||{})){const selected=progress.v7?.days?.[stored.on]?.selected;offer={...offer,action:selected||stored.action,alternatives:stored.alternatives};}
 const target=Number(prefs.food?.protein_target);
 const view=v7State(progress,at);
 let proteinG=null,unknownAmounts=false;
 const exists=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_food_entries'").first();
 if(exists){
  const rows=(await DB.prepare('SELECT body_json FROM member_food_entries WHERE user_id=? AND recorded_on=?').bind(userId,view.today).all()).results||[];
  proteinG=0;for(const r of rows){const e=JSON.parse(r.body_json);if(typeof e.proteinG==='number'&&Number.isFinite(e.proteinG))proteinG+=e.proteinG;else unknownAmounts=true;}
 }
 return {...offer,...view,proteinTarget:Number.isFinite(target)&&target>0?target:null,proteinG,unknownAmounts,
  goal:progress.goal&&progress.goal!=='Your personal goal'?progress.goal:null,share:v7Share(progress)};
}
