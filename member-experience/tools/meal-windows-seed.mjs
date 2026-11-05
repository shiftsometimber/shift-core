// Owned choose-action synthetic fixture only. No members, messages or purchases.
import fs from'node:fs';import crypto from'node:crypto';
import{cloudflareRequest as cf}from'/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
import{prepareMealOffers}from'../v7-context.mjs';
import{v7LoadGrubCatalogue as loadGrubCatalogue,v7UsableCatalogue as usableCatalogue,v7EmptyGrub as emptyGrub,v7RecommendationFor as recommendationFor,v7GrubMemberContext as grubMemberContext}from'/private/tmp/my-timber-v7-captured-programme/worker.mjs';
const ep='/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/247b065f-fea4-4891-945b-b707f2417656/query';
const q=async(sql,params=[])=>{const r=await cf(ep,'POST',{sql,params});if(r.some(x=>!x.success))throw Error('Test query failed');return r[0];};
const DB={prepare(sql){let params=[];return{bind(...p){params=p;return this},all(){return q(sql,params)},async first(){return(await q(sql,params)).results[0]||null}}}};
const a=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-test-access.json')).cases.choose;if(a.id!==900710001||!a.email.endsWith('@example.invalid'))throw Error('Owned synthetic identity failed');
const at=new Date().toISOString(),on=at.slice(0,10),old=(await q('SELECT preferences FROM member_state WHERE user_id=?',[a.id])).results[0];if(!old)throw Error('Missing owned fixture');
const prefs=JSON.parse(old.preferences),progress=prefs.lifeBack.progress;delete progress.v7.days[on];progress.revision=(progress.revision||0)+1;
prefs.food.protein_target=127;prefs.food.calorie_target=2180;
const recipes=usableCatalogue(await loadGrubCatalogue(DB)),offers=prepareMealOffers(prefs,recipes,at,{emptyGrub,recommendationFor,grubMemberContext});
progress.v7.offers=offers;
await q('UPDATE member_state SET preferences=? WHERE user_id=?',[JSON.stringify(prefs),a.id]);
await q('UPDATE user_sessions SET expires_at=?,revoked_at=NULL WHERE user_id=? AND token_hash=?',[new Date(Date.now()+86400000).toISOString(),a.id,crypto.createHash('sha256').update(a.token).digest('hex')]);
const report={synthetic:a.email,at,recipes:recipes.length,periods:Object.fromEntries(Object.entries(offers.mealOffers).map(([k,o])=>[k,{kind:o.action.kind,meal:o.action.meal,recipe:o.action.recipeId,name:o.action.name,proteinG:o.action.proteinG,swaps:o.alternatives.map(a=>({meal:a.meal,proteinG:a.proteinG}))}]))};
fs.mkdirSync('member-experience/meal-windows-evidence',{recursive:true});fs.writeFileSync('member-experience/meal-windows-evidence/catalogue-fixture.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(Object.values(offers.mealOffers).some(o=>o.action.kind!=='food'||o.alternatives.length!==3))throw Error('Real catalogue did not prepare three meal groups');
