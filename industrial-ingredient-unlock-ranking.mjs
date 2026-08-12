import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';
const recipes=buildIndustrialCatalogue().recipes||[];
const clean=s=>String(s||'').trim().toLowerCase();
const by=new Map();
for(const r of recipes){const seen=new Set();for(const ing of r.ingredients||[]){const k=clean(ing.item);if(!k)continue;let x=by.get(k);if(!x)by.set(k,x={ingredient:k,occurrences:0,recipes:new Set(),amounts:new Set(),mealTypes:new Set(),families:new Set()});x.occurrences++;x.recipes.add(r.id);x.amounts.add(String(ing.amount));x.mealTypes.add(r.meal_type);x.families.add(r.food_format||r.family_identity||'unknown');seen.add(k)}}
const ranked=[...by.values()].map(x=>({ingredient:x.ingredient,recipeUnlock:x.recipes.size,occurrences:x.occurrences,amounts:[...x.amounts].sort(),mealTypes:[...x.mealTypes].sort(),families:[...x.families].sort()})).sort((a,b)=>b.recipeUnlock-a.recipeUnlock||b.occurrences-a.occurrences||a.ingredient.localeCompare(b.ingredient));
const placeholder=ranked.filter(x=>/flavouring or spice to match the title/i.test(x.ingredient));
console.log(JSON.stringify({canonicalIngredientIdentities:ranked.length,totalOccurrences:ranked.reduce((n,x)=>n+x.occurrences,0),placeholderRecipes:placeholder.reduce((n,x)=>n+x.recipeUnlock,0),ranked},null,2));
if(placeholder.length)throw new Error(`placeholder ingredients remain: ${placeholder.map(x=>x.ingredient).join(', ')}`);
if(ranked.length>200)throw new Error(`unexpected canonical ingredient explosion: ${ranked.length}`);
console.log(`PASS ingredient unlock ranking: ${ranked.length} canonical authored ingredient identities, ${ranked.reduce((n,x)=>n+x.occurrences,0)} occurrences, zero placeholder recipes.`);
