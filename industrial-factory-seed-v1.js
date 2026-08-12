import {buildIndustrialCatalogue} from './industrial-catalogue-v1.js';
import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';
export async function seedIndustrialFactory(DB,{recipeLimit=224,exerciseLimit=224}={}){
  await ensureStructuredContent(DB);
  const c=buildIndustrialCatalogue();
  const recipes=c.recipes.slice(0,Math.max(0,Math.min(224,Number(recipeLimit)||0)));
  const exercises=c.exercises.slice(0,Math.max(0,Math.min(224,Number(exerciseLimit)||0)));
  let grub=0,fit=0;
  for(const r of recipes){await upsertStructuredContent(DB,{id:r.id,contentType:'recipe',title:r.title,version:1,status:'draft',data:r,review:r.review});grub++}
  for(const x of exercises){await upsertStructuredContent(DB,{id:x.id,contentType:'exercise',title:x.title,version:1,status:'draft',data:x,review:x.review});fit++}
  return{ok:true,grubDraftsSeeded:grub,fitDraftsSeeded:fit,totalSeeded:grub+fit,quarantined:true};
}
