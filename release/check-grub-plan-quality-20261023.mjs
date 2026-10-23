// Source-only catalogue exercise. No production API calls or member writes.
import {DB,server} from '../member-experience/tests/grub-ease-fixture.mjs';
import {loadGrubCatalogue} from '../member-experience/grub-routes.mjs';
import {usableCatalogue,buildWeek} from '../member-experience/grub-workspace.mjs';
import {planNutrition} from '../member-experience/grub-plan-quality.mjs';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
try{
 const recipes=usableCatalogue(await loadGrubCatalogue(DB)),styles=[];
 for(const style of ['protein','budget','fast','vegetarian']){
  const summary={style,attempted:0,returned:0,heldForReview:0,returnedDays:0,minimumReturnedKcal:null,maximumReturnedKcal:null};
  for(const days of [3,5,7])for(let seed=0;seed<30;seed++){
   summary.attempted++;
   try{const plan=buildWeek(recipes,{days,style,servings:2,exclude:''},seed),view=planNutrition(plan.week,recipes);
    assert(view.days.every(d=>!d.review));summary.returned++;summary.returnedDays+=view.days.length;
    for(const d of view.days){summary.minimumReturnedKcal=Math.min(summary.minimumReturnedKcal??Infinity,d.kcal);summary.maximumReturnedKcal=Math.max(summary.maximumReturnedKcal??0,d.kcal);}
   }catch(e){if(!/cannot save this as an automatic week|missing energy information/.test(e.message))throw e;summary.heldForReview++;}
  }
  assert(summary.returned>0);styles.push(summary);
 }
 const receipt={date:new Date().toISOString(),state:'prepared_and_tested_not_deployed',catalogue:'Current governed 2692-row source, including UK corrections and discovery rules',recipes:recipes.length,attempts:styles.reduce((n,s)=>n+s.attempted,0),styles,productionWrites:0,nutritionSignOff:false,interpretation:'A returned plan is above the engineering low-total trigger; this does not establish nutritional adequacy or a member calorie target.'};
 writeFileSync('release/grub-plan-quality-catalogue-check-20261023.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}finally{await new Promise(r=>server.close(r));}
