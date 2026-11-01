// Source snapshot for local model development. No member data, DB writes,
// serving-authority changes or automatic eating records.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const names={full:'grub-uk-full-publication-20261018.mjs',core:'grub-uk-core-publication-20261017.mjs',everyday:'grub-everyday-publication-v1.mjs',images:'grub-image-map.mjs'};
function constant(text,name){
 const marker='export const '+name+'=',start=text.indexOf(marker);
 if(start<0)throw Error('Missing governed source '+name);
 const tail=text.slice(start+marker.length),end=tail.indexOf(';\n');
 if(end<0)throw Error('Expected immutable JSON publication');
 return JSON.parse(tail.slice(0,end));
}
function bodyHash(publication){const{release_id,...body}=publication;return sha(body)===release_id;}

export function buildRecipeCatalogue(files){
 const full=constant(files.full,'UK_FULL_PUBLICATION');
 const core=constant(files.core,'UK_CORE_PUBLICATION');
 const everyday=constant(files.everyday,'EVERYDAY_PUBLICATION');
 const images=constant(files.images,'grubImages');
 const everydayPin=files.everyday.match(/export const EVERYDAY_PUBLICATION_SHA256="([a-f0-9]{64})"/)?.[1];
 if(full.proof!=='GRUB_UK_FULL_EXISTING_CORRECTIONS_20261018'||full.status!=='owner_authorised'||full.owner?.id!=='Matt O’Brien'||!bodyHash(full)||full.recipes.length!==2671)throw Error('Full publication failed qualification');
 if(core.proof!=='GRUB_UK_CORE_SOURCE_PUBLICATION_20261017'||core.status!=='approved'||!bodyHash(core)||!Array.isArray(core.items))throw Error('UK core publication failed qualification');
 if(everyday.proof!=='GRUB_EVERYDAY_SOURCE_PUBLICATION_V1'||everyday.status!=='approved'||sha(everyday)!==everydayPin||everyday.rows.length!==7)throw Error('Everyday publication failed qualification');
 const bindings=new Map(images.map(i=>[i.id,i]));
 const raw=[...full.recipes.map(r=>({...r,publication:'uk_full',release:full.release_id})),
  ...core.items.map(r=>({...r,publication:'uk_core',release:core.release_id})),
  ...everyday.rows.map(r=>({...r,data:JSON.parse(r.data_json),publication:'everyday',release:everyday.release_id}))];
 const seen=new Set(),recipes=[];
 for(const row of raw){
  const d=row.data,n=d?.nutrition;
  if(!row.id||seen.has(row.id)||!row.title||n?.status!=='validated'||!d.ingredients?.length||!d.method?.length)throw Error('Unqualified or duplicate recipe');
  if(row.publication==='uk_full'&&sha({id:row.id,title:row.title,data:d})!==row.content_sha256)throw Error('Full recipe bytes changed');
  if(row.publication!=='uk_full'&&row.status!=='published')throw Error('Draft recipe rejected');
  seen.add(row.id);
  const binding=bindings.get(row.id);
  const exact=!!binding&&binding.title===row.title&&JSON.stringify(binding.ingredients)===JSON.stringify(d.ingredients)&&JSON.stringify(binding.method)===JSON.stringify(d.method);
  const hash=sha({id:row.id,title:row.title,data:d});
  const ingredientNames=d.ingredients.map(i=>String(i.item));
  // Recipe quantities/nutrition do not become visual model inputs.
  const description=('A photo of '+row.title+'. '+String(d.food_format||'meal')+' with '+ingredientNames.slice(0,8).join(', ')+'.').slice(0,700);
  recipes.push({id:row.id,title:row.title,content_sha256:hash,publication:row.publication,release_id:row.release,
   recipe_yield:Number(d.servings),food_format:d.food_format||'',ingredients:d.ingredients.map(i=>({item:i.item,amount:i.amount})),
   description,nutrition:{...n},nutrition_basis:'per_recipe_serving_estimate',allergens:d.allergens||[],
   image:exact?{src:binding.src,sha256:binding.sha256,kind:'illustrative_reference_not_real_meal_test'}:null,
   image_status:exact?'exact_source_binding':binding?'binding_for_older_recipe_snapshot':'no_exact_binding',
   prior_reference:binding?{src:binding.src,sha256:binding.sha256,title:binding.title,
    eligible_for_exact_current_recipe_training:false}:null});
 }
 const stats={recipes:recipes.length,by_publication:Object.fromEntries(['uk_full','uk_core','everyday'].map(p=>[p,recipes.filter(r=>r.publication===p).length])),
  exact_current_images:recipes.filter(r=>r.image).length,older_image_bindings:recipes.filter(r=>r.image_status==='binding_for_older_recipe_snapshot').length,
  missing_image_bindings:recipes.filter(r=>r.image_status==='no_exact_binding').length,
  nutrition_estimates:recipes.length,complete_nutrition:recipes.filter(r=>['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'].every(k=>typeof r.nutrition[k]==='number')).length};
 return {schema:'shift-recipe-recognition-catalogue-1',source_kind:'governed_source_snapshot_not_live_database_readback',
  source_sha256:Object.fromEntries(Object.entries(files).map(([k,v])=>[names[k],sha(v)])),stats,recipes,
  rules:['Recipe matching is a suggestion, not proof of recipe identity or portion.',
   'Ingredient/nutrition estimates require explicit current-recipe and portion confirmation.',
   'Illustrative or stale reference photos are not real-world evaluation images.',
   'No member meal or correction is automatically reused as training data.']};
}

export function recipeDraft(catalogue,{recipeId,recipeHash,memberConfirmed=false,servingsEaten,includeNutrition=false,ingredientsChanged=false}={}){
 if(memberConfirmed!==true)throw Error('Confirm the recipe first');
 const recipe=catalogue.recipes.find(r=>r.id===recipeId);
 if(!recipe||recipe.content_sha256!==recipeHash)throw Error('Recipe is unavailable or changed; review the current recipe');
 if(typeof servingsEaten!=='number'||!Number.isFinite(servingsEaten)||servingsEaten<.25||servingsEaten>8)throw Error('Enter how many recipe servings you ate');
 const nutrition={};
 if(includeNutrition&&!ingredientsChanged){
  for(const [target,key] of Object.entries({kcal:'kcal',proteinG:'protein_g',carbsG:'carbohydrate_g',fatG:'fat_g',fibreG:'fibre_g'})){
   const value=recipe.nutrition[key];
   if(typeof value==='number'&&Number.isFinite(value)&&value>=0)nutrition[target]=Math.round(value*servingsEaten*10)/10;
  }
 }
 return {food:recipe.title,items:[recipe.title],nutrition,nutritionSource:'member_confirmed_estimate',
  recipe:{id:recipe.id,content_sha256:recipe.content_sha256,servingsEaten,recipeYield:recipe.recipe_yield,ingredientsChanged},
  basis:{amount:servingsEaten,unit:'recipe serving'},requiresReview:true,autoSave:false,
  message:ingredientsChanged?'Your ingredients differ. Add amounts from what you actually used.':'Recipe estimates for the serving you confirmed. Check any substitutions, then save once.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [sourceDirectory,output]=process.argv.slice(2);
 if(!sourceDirectory||!output)throw Error('Pass governed source directory and output file');
 const files=Object.fromEntries(Object.entries(names).map(([key,name])=>[key,readFileSync(resolve(sourceDirectory,name),'utf8')]));
 const catalogue=buildRecipeCatalogue(files);
 writeFileSync(output,JSON.stringify(catalogue,null,2)+'\n');
 console.log(JSON.stringify({output:basename(output),...catalogue.stats,source_kind:catalogue.source_kind}));
}
