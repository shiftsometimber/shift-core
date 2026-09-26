import {memberRecipe} from './grub-search.mjs';
import {loadGrubCatalogue} from './grub-routes.mjs';
// Reuse Grub's full publication authority. Never trust recipe bodies from a request.
export async function attachSelectedRecipe(DB,journey,message){
 const id=journey?.grub?.chosenForToday?.recipeId;
 if(!id||!/(?:chosen|planned|recipe|ingredients|my\s+meal|this\s+meal|that\s+meal)/i.test(message))return journey;
 try{
  const row=(await loadGrubCatalogue(DB)).find(r=>r.id===id);
  const recipe=row?memberRecipe(row):null;
  if(!recipe)return journey;
  const detail={id:recipe.id,name:recipe.name||recipe.title,servings:recipe.servings,ingredients:recipe.ingredients,method:recipe.method,allergens:recipe.allergens,food_safety:recipe.food_safety,storage:recipe.storage,minutes:recipe.minutes,source:'Current governed Grub publication; original recipe servings, not confirmed eaten'};
  // Do not silently truncate safety or cooking instructions.
  if(JSON.stringify(detail).length<=7000)journey.grub.recipe=detail;
 }catch{journey.grub.recipeStatus='unavailable'}
 return journey;
}
