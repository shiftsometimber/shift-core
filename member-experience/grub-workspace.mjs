import {memberRecipe,filterRecipe} from './grub-search.mjs';

export const emptyGrub=()=>({revision:0,saved:[],week:[],shopping:[],options:{days:7,style:'protein',servings:1,exclude:''},operations:[]});
export class GrubError extends Error{constructor(message,status=400){super(message);this.status=status}}
const fail=m=>{throw new GrubError(m)};
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const slots=['breakfast','lunch','dinner'];
const styles={protein:'high protein',budget:'budget',fast:'fast',vegetarian:'vegetarian'};
export function usableCatalogue(records){return records.map(r=>memberRecipe(r)).filter(Boolean)}
export function planOptions(input){
 const o={days:input.days,style:input.style,servings:input.servings,exclude:String(input.exclude||'').trim()};
 if(![3,5,7].includes(o.days)||!Object.hasOwn(styles,o.style)||!integer(o.servings,1,8)||o.exclude.length>200)fail('Choose the days, meal style and 1–8 servings.');
 if(o.exclude&&!/^[a-z ,'-]+$/i.test(o.exclude))fail('List ingredients to leave out, separated by commas.');
 if(/allerg|coeliac|celiac|free|without|\bno\b/i.test(o.exclude))fail('Enter ingredient names only, such as fish, mushrooms. This planner cannot check allergies.');
 return o;
}
const excluded=(r,text)=>text.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).some(x=>{
 const terms=x==='fish'?['fish','salmon','tuna','cod','haddock','anchovy','mackerel','sardine']:x==='nuts'?['nut','almond','cashew','pecan','pistachio']: [x];
 return terms.some(t=>r.ingredients.some(i=>i.item.toLowerCase().includes(t))||r.allergens.some(a=>a.toLowerCase().includes(t)));
});
function candidates(recipes,options,slot){return recipes.filter(r=>(r.meal_type===slot||(slot==='dinner'&&options.style==='fast'&&r.meal_type==='lunch'))&&filterRecipe(r,styles[options.style])&&!excluded(r,options.exclude))}
function choose(pool,used,seed){const fresh=pool.filter(r=>!used.has(r.id));const list=fresh.length?fresh:pool;return list[seed%list.length]}
export function buildWeek(recipes,input,seed=0){
 const options=planOptions(input),used=new Set(),week=[];
 for(let day=1;day<=options.days;day++)for(const slot of slots){
  const pool=candidates(recipes,options,slot);if(!pool.length)fail('No '+slot+' recipes meet all these choices. Change the style or ingredients to leave out. Your saved week has not changed.');
  const r=choose(pool,used,seed+day*7+slots.indexOf(slot));used.add(r.id);week.push({key:day+':'+slot,day,slot,recipeId:r.id,servings:options.servings});
 }
 return {week,options};
}
const recipeById=(recipes,id)=>recipes.find(r=>r.id===id)||fail('This recipe is no longer available. Choose another recipe.');
const quantity=(amount,factor)=>{
 const text=String(amount).trim(),m=text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?$/i);
 if(m)return {number:Number(m[1])*factor,unit:(m[2]||'').toLowerCase()};
 return {text:factor===1?text:text+' × '+Number(factor.toFixed(3))};
};
export function shoppingForWeek(week,recipes,previous=[]){
 const map=new Map();
 for(const entry of week){const r=recipeById(recipes,entry.recipeId),factor=entry.servings/r.servings;
  for(const ingredient of r.ingredients){const q=quantity(ingredient.amount,factor),unit=(ingredient.unit||q.unit||'').toLowerCase(),key=ingredient.item.toLowerCase()+'|'+unit+(q.text?'|'+q.text:'');
   if(!map.has(key))map.set(key,{key:'recipe:'+key,item:ingredient.item,unit,amount:0,parts:[],source:'week',done:false});
   const item=map.get(key);if(q.number!==undefined)item.amount+=q.number;else item.parts.push(q.text);
  }
 }
 const list=[...map.values()].map(i=>{const amount=i.parts.length?(i.parts.length===1?i.parts[0]:i.parts.length+' × ('+i.parts[0]+')'):String(Number(i.amount.toFixed(2)));const text=[amount,i.unit,i.item].filter(Boolean).join(' ');return {key:i.key,text,source:'week',done:previous.some(p=>p.key===i.key&&p.text===text&&p.done)}});
 return [...list,...previous.filter(i=>i.source==='manual')];
}
export function applyGrubOperation(current,input,recipes){
 const next=structuredClone(current||emptyGrub());
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||''))fail('Request identity is missing. Refresh and try again.');
 if(next.operations.includes(input.operationId))return next;
 if(input.revision!==next.revision)throw new GrubError('Your food list changed in another tab. Reload it before trying again.',409);
 const a=input.action;
 if(a==='save'){
  recipeById(recipes,input.recipeId);if(typeof input.saved!=='boolean')fail('Choose save or remove.');
  next.saved=next.saved.filter(x=>x!==input.recipeId);if(input.saved){if(next.saved.length>=100)fail('You have 100 saved recipes. Remove one before saving another.');next.saved.push(input.recipeId)}
 }else if(a==='plan'){
  const built=buildWeek(recipes,input.options,next.revision);next.week=built.week;next.options=built.options;
 }else if(a==='add'){
  recipeById(recipes,input.recipeId);if(!integer(input.day,1,7)||!slots.includes(input.slot)||!integer(input.servings,1,8))fail('Choose a day, meal and 1–8 servings.');
  const key=input.day+':'+input.slot;next.week=next.week.filter(x=>x.key!==key);next.week.push({key,day:input.day,slot:input.slot,recipeId:input.recipeId,servings:input.servings});next.week.sort((a,b)=>a.day-b.day||slots.indexOf(a.slot)-slots.indexOf(b.slot));
 }else if(a==='remove-meal'||a==='swap'){
  const entry=next.week.find(x=>x.key===input.key);if(!entry)fail('This meal is no longer in your week.');
  if(a==='remove-meal')next.week=next.week.filter(x=>x.key!==input.key);
  else{const pool=candidates(recipes,next.options,entry.slot).filter(r=>r.id!==entry.recipeId);if(!pool.length)fail('There is no alternative matching this meal style. Choose a recipe in Discover instead.');entry.recipeId=choose(pool,new Set(next.week.map(x=>x.recipeId)),next.revision).id;}
 }else if(a==='shopping-add'){
  const text=String(input.text||'').trim();if(!text||text.length>160)fail('Enter a shopping item under 160 characters.');if(next.shopping.filter(x=>x.source==='manual').length>=100)fail('Remove a shopping item before adding another.');
  next.shopping.push({key:'manual:'+input.operationId,text,source:'manual',done:false});
 }else if(a==='shopping-check'){
  const item=next.shopping.find(x=>x.key===input.key);if(!item||typeof input.done!=='boolean')fail('This item has changed. Reload the list.');item.done=input.done;
 }else if(a==='shopping-remove'){
  if(!next.shopping.some(x=>x.key===input.key))fail('This item has changed. Reload the list.');next.shopping=next.shopping.filter(x=>x.key!==input.key);
 }else if(a==='clear-week'){next.week=[];}
 else fail('Unknown food action.');
 if(['plan','add','remove-meal','swap','clear-week'].includes(a))next.shopping=shoppingForWeek(next.week,recipes,next.shopping);
 next.revision++;next.operations=[...next.operations,input.operationId].slice(-30);return next;
}
export function workspaceView(state,recipes){
 const lookup=new Map(recipes.map(r=>[r.id,r]));
 return {revision:state.revision,saved:state.saved,week:state.week,shopping:state.shopping,options:state.options,recipes:[...new Set([...state.saved,...state.week.map(x=>x.recipeId)])].map(id=>lookup.get(id)).filter(Boolean),unavailable:state.saved.filter(id=>!lookup.has(id))};
}
