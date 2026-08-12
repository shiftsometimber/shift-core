import {upsertStructuredContent,listPublishedContent} from './structured-content-v1.js';

const RECIPE_REQUIRED=['mealType','servings','ingredients','method','timings','equipment','nutrition','allergens','substitutions','storage','foodSafety','provenance'];
const EXERCISE_REQUIRED=['movementPattern','instructions','prescription','restSeconds','formCues','safetyCues','equipment','locations','regression','progression','substitutions','limitations','visualGuidance','provenance'];

export function validateContentItem(item){
  const errors=[];
  if(!item?.id||!item?.contentType||!item?.title)errors.push('identity');
  const data=item?.data||{};
  const required=item?.contentType==='recipe'?RECIPE_REQUIRED:item?.contentType==='exercise'?EXERCISE_REQUIRED:[];
  for(const key of required)if(data[key]===undefined||data[key]===null||(Array.isArray(data[key])&&!data[key].length))errors.push(key);
  if(item?.contentType==='recipe'){
    if(!Array.isArray(data.ingredients)||data.ingredients.some(x=>!x?.item||!x?.quantity))errors.push('ingredient_quantities');
    if(!Array.isArray(data.method)||data.method.length<2)errors.push('numbered_method');
    if(!['validated','estimated_pending_validation'].includes(data?.nutrition?.status))errors.push('nutrition_status');
    if(data?.nutrition?.status==='validated'&&!data?.nutrition?.methodologyRef)errors.push('nutrition_methodology');
  }
  if(item?.contentType==='exercise'){
    if(!Array.isArray(data.instructions)||data.instructions.length<2)errors.push('instructions_depth');
    if(!data.visualGuidance?.assetRef&&!data.visualGuidance?.status)errors.push('visual_guidance_contract');
  }
  return {ok:errors.length===0,errors:[...new Set(errors)]};
}

export async function stageContentBatch(DB,items,{actor='content-factory'}={}){
  const results=[];
  for(const raw of items){
    const validation=validateContentItem(raw);
    const status=validation.ok?'review':'draft';
    const item={...raw,status,review:{...(raw.review||{}),deterministicValidation:validation,stagedBy:actor,stagedAt:new Date().toISOString()}};
    await upsertStructuredContent(DB,item);
    results.push({id:item.id,status,validation});
  }
  return results;
}

export async function publishReviewedContent(DB,item,{reviewedBy,reviewNote=''}){
  if(!reviewedBy)throw new Error('reviewer_required');
  const validation=validateContentItem(item);if(!validation.ok)throw new Error(`content_invalid:${validation.errors.join(',')}`);
  if(item.contentType==='recipe'&&item.data.nutrition.status!=='validated')throw new Error('recipe_nutrition_not_validated');
  if(item.contentType==='exercise'&&item.data.visualGuidance.status!=='approved')throw new Error('exercise_visual_not_approved');
  await upsertStructuredContent(DB,{...item,status:'published',review:{deterministicValidation:validation,reviewedBy,reviewNote,reviewedAt:new Date().toISOString()}});
  return {id:item.id,status:'published'};
}

export async function catalogueStats(DB){
  const [recipes,exercises]=await Promise.all([listPublishedContent(DB,'recipe',{limit:500}),listPublishedContent(DB,'exercise',{limit:500})]);
  return {recipes:recipes.length,exercises:exercises.length,illustratedExercises:exercises.filter(x=>x.data?.visualGuidance?.status==='approved'&&x.data?.visualGuidance?.assetRef).length,validatedRecipes:recipes.filter(x=>x.data?.nutrition?.status==='validated').length};
}
