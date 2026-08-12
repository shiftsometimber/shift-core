import {buildIndustrialCatalogue} from './industrial-catalogue-v3.js';
import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';

export async function seedIndustrialFactoryV2(DB,{recipeLimit=2468,exerciseLimit=2468}={}){
  await ensureStructuredContent(DB);
  const c=buildIndustrialCatalogue();
  const recipes=c.recipes.slice(0,Math.max(0,Math.min(2468,Number(recipeLimit)||0)));
  const exercises=c.exercises.slice(0,Math.max(0,Math.min(2468,Number(exerciseLimit)||0)));
  let grub=0,fit=0;
  for(const r of recipes){await upsertStructuredContent(DB,{id:r.id,contentType:'recipe',title:r.title,version:3,status:'draft',data:r,review:r.review});grub++}
  for(const x of exercises){await upsertStructuredContent(DB,{id:x.id,contentType:'exercise',title:x.title,version:3,status:'draft',data:x,review:x.review});fit++}
  return{ok:true,grubDraftsSeeded:grub,fitDraftsSeeded:fit,totalSeeded:grub+fit,quarantined:true,shortTermTargetIncludingBase32:2500};
}
