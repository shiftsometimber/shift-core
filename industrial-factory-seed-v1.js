import {buildIndustrialCatalogue} from './industrial-catalogue-v3.js';
import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';
const INDUSTRIAL_TARGET=2468;
export async function seedIndustrialFactory(DB,{recipeLimit=INDUSTRIAL_TARGET,exerciseLimit=INDUSTRIAL_TARGET}={}){
  await ensureStructuredContent(DB);
  const c=buildIndustrialCatalogue();
  const recipes=c.recipes.slice(0,Math.max(0,Math.min(INDUSTRIAL_TARGET,Number(recipeLimit)||0)));
  const exercises=c.exercises.slice(0,Math.max(0,Math.min(INDUSTRIAL_TARGET,Number(exerciseLimit)||0)));
  let grub=0,fit=0;
  for(const r of recipes){await upsertStructuredContent(DB,{id:r.id,contentType:'recipe',title:r.title,version:1,status:'draft',data:r,review:r.review});grub++}
  for(const x of exercises){await upsertStructuredContent(DB,{id:x.id,contentType:'exercise',title:x.title,version:1,status:'draft',data:x,review:x.review});fit++}
  return{ok:true,grubDraftsSeeded:grub,fitDraftsSeeded:fit,totalSeeded:grub+fit,quarantined:true,totalWithOriginalStructured:{grub:grub+32,fit:fit+32}};
}
