// Shared by the member API and the isolated recipe trial. No recipe generation.
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
let authored;
const normalise=value=>String(value??'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const words=value=>normalise(value).split(' ').map(x=>({eggs:'egg',potatoes:'potato',tomatoes:'tomato',peppers:'pepper',noodles:'noodle',beans:'bean',wraps:'wrap',mushrooms:'mushroom',sausages:'sausage'}[x]||x)).filter(Boolean);
const ignored=new Set(['a','and','with','the','for','of','some','please','meal','meals','recipe','recipes','dinner','lunch','breakfast','snack','fresh','frozen','raw','cooked','dried','chopped','sliced','mixed','wholemeal','wholewheat','brown','white','lean','low','fat','reduced']);
const pantry=new Set(['salt','black pepper','water','olive oil','cooking oil']);
const animal=/\b(chicken|beef|pork|lamb|turkey|bacon|ham|sausage|salmon|tuna|prawn|cod|haddock|fish|anchovy|gelatine|gelatin)\b/i;
const present=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
export function enrichGrubRecipes(recipes){
 authored??=new Map(buildIndustrialCatalogue().recipes.map(r=>[r.id,r]));
 return recipes.map(r=>{
  const a=authored.get(r.id),d=r.data||{};
  // Recover serving metadata dropped by the publication serializer, only where
  // the accepted recipe's actual title, ingredients and method still agree.
  const exact=a&&a.title===r.title&&JSON.stringify(a.ingredients)===JSON.stringify(d.ingredients)&&JSON.stringify(a.method)===JSON.stringify(d.method);
  return {...r,data:{...(exact?{prep_minutes:a.prep_minutes,cook_minutes:a.cook_minutes,tags:a.tags,taxonomy:a.taxonomy,food_format:a.food_format}:{}),...d}};
 });
}
function containsIngredient(supplied,ingredient){
 const a=words(supplied).filter(x=>!ignored.has(x)&&!/^\d+$/.test(x)),b=words(ingredient);
 if(!a.length)return false;
 // A supplied multiword ingredient must describe the same thing: soy milk is
 // not soy sauce, and chicken stock is not chicken breast.
 return a.every(x=>b.includes(x));
}
export function memberRecipe(row,items=[]){
 const d=row.data||{},ingredients=d.ingredients,method=d.method,n=d.nutrition||{};
 if(!row.id||!row.title||n.status!=='validated'||!Array.isArray(ingredients)||!ingredients.length||ingredients.some(i=>!i.item||!i.amount)||!Array.isArray(method)||method.length<2)return null;
 const matched=ingredients.filter(i=>items.some(x=>containsIngredient(x,i.item))).map(i=>i.item);
 const missing=ingredients.filter(i=>!matched.includes(i.item)).map(i=>i.item);
 const prep=present(d.prep_minutes)?Number(d.prep_minutes):null,cook=present(d.cook_minutes)?Number(d.cook_minutes):null;
 const minutes=present(d.timeMinutes)?Number(d.timeMinutes):prep!==null&&cook!==null?prep+cook:null;
 return {id:row.id,name:row.title,meal_type:d.meal_type,servings:Number(d.servings)||1,minutes,prep_minutes:prep,cook_minutes:cook,protein_g:present(n.protein_g)?Number(n.protein_g):null,kcal:present(n.kcal)?Number(n.kcal):null,nutrition:n,ingredients,method,allergens:d.allergens||[],food_safety:d.food_safety||[],storage:d.storage||{},equipment:d.equipment||[],matched,missing,pantry:missing.filter(x=>pantry.has(normalise(x))),source:'published_catalogue',taxonomy:d.taxonomy||{},food_format:d.food_format||'',tags:d.tags||[]};
}
export function filterRecipe(r,filter){
 switch(filter){
  case 'fast':return r.minutes!==null&&r.minutes<=25;
  case 'high protein':return r.protein_g!==null&&r.protein_g>=25;
  case 'family':return r.taxonomy.family_size==='scalable';
  case 'budget':return ['budget','budget-friendly'].includes(r.taxonomy.budget);
  case 'vegetarian':return r.ingredients.every(i=>!animal.test(i.item))&&!r.allergens.some(x=>/fish|crustacean|mollusc/i.test(x));
  default:return !filter;
 }
}
export function searchGrubRecipes(input,records){
 const mode=input?.mode==='fridge'?'fridge':'discover',filter=normalise(input?.filter||'');
 const items=(Array.isArray(input?.items)?input.items:[]).flatMap(x=>String(x).split(/[,;\n]+/)).map(x=>x.trim()).filter(Boolean).slice(0,40);
 const query=String(input?.query||'').trim().slice(0,300);
 const queryParts=query.split(/[,;\n]+/).map(x=>words(x).filter(w=>!ignored.has(w))).filter(x=>x.length);
 const usable=records.map(r=>memberRecipe(r,mode==='fridge'?items:[])).filter(Boolean);
 if(mode==='fridge'&&!items.length)return {top:[],source:'published_catalogue',catalogue_size:usable.length,message:'Add at least one ingredient first.'};
 if(filter&&!['fast','high protein','family','budget','vegetarian'].includes(filter))return {top:[],source:'published_catalogue',catalogue_size:usable.length,message:'Choose one of the available recipe filters.'};
 // Free-text allergy promises would be unsafe: this is ingredient search, not
 // a validated allergy selector. Do not silently ignore those constraints.
 if(/\b(allerg|coeliac|celiac|gluten.free|nut.free|dairy.free|without|no )/i.test(query))return {top:[],source:'published_catalogue',catalogue_size:usable.length,message:'This search cannot verify allergy or exclusion requests. Search for an ingredient, then check the full ingredient list and product labels.'};
 let candidates=usable.filter(r=>filterRecipe(r,filter)).map(r=>{
  const missingCore=r.missing.filter(x=>!pantry.has(normalise(x))),matchedCore=r.matched.filter(x=>!pantry.has(normalise(x)));
  const title=words(r.name),all=words([r.name,...r.ingredients.map(x=>x.item),...r.equipment,...r.tags].join(' '));
  const queryMatches=queryParts.filter(part=>part.every(w=>all.includes(w))).length;
  const relevance=queryMatches*100+queryParts.filter(part=>part.every(w=>title.includes(w))).length*20;
  return {...r,score:mode==='fridge'?matchedCore.length*20-missingCore.length*5:relevance,missingCore,matchedCore,queryMatches};
 }).filter(r=>mode==='fridge'?r.matchedCore.length>0:!queryParts.length||r.queryMatches>0);
 candidates.sort((a,b)=>b.score-a.score||(a.minutes??999)-(b.minutes??999)||a.name.localeCompare(b.name));
 // Prefer different meal formats before filling the result with seasoning
 // variants of the same toastie. Exact recipe content remains untouched.
 const seen=new Set(),first=[],rest=[];
 for(const r of candidates){const key=[r.food_format||r.name,r.taxonomy.main_protein||''].join(':');(seen.has(key)?rest:first).push(r);seen.add(key)}
 const total=candidates.length,top=[...first,...rest].slice(0,12).map(({score,missingCore,matchedCore,queryMatches,taxonomy,tags,food_format,...r})=>r);
 return {top,total,source:'published_catalogue',catalogue_size:usable.length,mode,filter,message:top.length?(mode==='fridge'?'Closest matches first. Missing ingredients include oil and seasonings; nothing is assumed.':`${total} recipes match. Showing ${top.length}.`):'No recipe matches this search. Try one ingredient or clear the filter.'};
}
