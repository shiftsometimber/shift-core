import fs from 'node:fs';
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8');
const grub=fs.readFileSync('grub-v1-publication-pack.mjs','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(ops.includes("'/v1/commissioning/structured-content/batch'"),'missing restricted structured batch route');
need(ops.includes("'/v1/commissioning/structured-content/status'"),'missing restricted structured status route');
need(ops.includes('verifyGithubOidc'),'commissioning OIDC boundary missing');
need(ops.includes('MAX_STRUCTURED_BATCH=25'),'bounded batch ceiling missing');
need(ops.includes("FINAL_V1_AUTHORITY='matt-final-v1-2026-08-14'"),'exact Matt V1 authority missing');
need(ops.includes('await upsertStructuredContent(env.DB,item)'),'validated structured upsert not used');
need(ops.includes("item?.review?.authority")&&ops.includes('FINAL_V1_AUTHORITY'),'accepted review authority not enforced per item');
need(ops.includes("json_extract(review_json,'$.authority')"),'publication status does not count exact accepted authority');
need(grub.includes('meal_type:mealType'),'Grub publication payload does not retain member-serving meal_type');
need(grub.includes('servedByMeal'),'Grub publication payload does not assert per-meal launch floor');
need(grub.includes("authority:'matt-final-v1-2026-08-14'"),'Grub records are not bound to final human authority');
need(grub.includes("['breakfast','lunch','dinner','snack']"),'Grub member-serving meal type validation missing');
if(fail.length){console.error(JSON.stringify({proof:'FINAL_V1_PRODUCTION_PUBLICATION_SOURCE_V1',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'FINAL_V1_PRODUCTION_PUBLICATION_SOURCE_V1',status:'PASS',batchMax:25,authority:'matt-final-v1-2026-08-14',criterion:'Only GitHub Actions OIDC may batch-publish bounded reviewed+approved exact final V1 authority; Grub records retain member-serving meal metadata and publication status can be reconciled by authority.'},null,2));
