import {listPublishedContent} from './structured-content-v1.js';

export async function loadStructuredProductCatalogue(DB){
  const [recipes,exercises]=await Promise.all([
    listPublishedContent(DB,'recipe',{limit:500}),
    listPublishedContent(DB,'exercise',{limit:500})
  ]);
  return {
    recipes:recipes.map(toRecipe),
    exercises:exercises.map(toExercise),
    evidence:{source:'structured_content',publishedRecipes:recipes.length,publishedExercises:exercises.length}
  };
}

function toRecipe(row){const d=row.data||{};return{id:row.id,type:d.mealType,name:row.title,servings:d.servings,ingredients:d.ingredients,method:d.method,timings:d.timings,equipment:d.equipment,nutrition:d.nutrition,allergens:d.allergens,substitutions:d.substitutions,storage:d.storage,reheating:d.reheating,batchCooking:d.batchCooking,foodSafety:d.foodSafety,tags:d.tags||[],provenance:d.provenance,version:row.version,structured:true};}
function toExercise(row){const d=row.data||{};return{id:row.id,name:row.title,group:d.movementPattern,bodyArea:d.bodyArea,instructions:d.instructions,prescription:d.prescription,rest_seconds:d.restSeconds,formCues:d.formCues,safetyCues:d.safetyCues,equipment:d.equipment,locations:d.locations,regression:d.regression,progression:d.progression,substitutions:d.substitutions,limitations:d.limitations,visualGuidance:d.visualGuidance,provenance:d.provenance,version:row.version,structured:true};}

export function structuredCatalogueReady(catalogue,{recipeFloor=64,exerciseFloor=48}={}){
  const recipes=catalogue?.recipes||[],exercises=catalogue?.exercises||[];
  const nutritionReady=recipes.every(x=>x.nutrition?.status==='validated'&&x.nutrition?.methodologyRef);
  const visualsReady=exercises.every(x=>x.visualGuidance?.status==='approved'&&x.visualGuidance?.assetRef);
  return {ready:recipes.length>=recipeFloor&&exercises.length>=exerciseFloor&&nutritionReady&&visualsReady,recipeCount:recipes.length,exerciseCount:exercises.length,nutritionReady,visualsReady,recipeFloor,exerciseFloor};
}
