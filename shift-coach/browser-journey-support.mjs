// Test-only helpers follow the actual approved one-question setup and visible controls.
// No direct API writes, hidden controls or application changes.
import assert from 'node:assert/strict';
import {library} from './voice.mjs';
export async function savedCoaching(page){await page.waitForFunction(()=>document.querySelector('#shiftCoach [data-coach-status]')?.textContent==='Saved.');}
export async function startCoaching(page,goal){
 const form=page.locator('[data-coach-setup]');await form.waitFor();
 assert.equal(await form.locator('input,select,textarea').count(),1,'Setup asks only the approved goal question');
 await form.getByLabel('What would make today feel a bit better?',{exact:true}).fill(goal);
 await form.getByRole('button',{name:'Give me one useful step',exact:true}).click();await savedCoaching(page);await page.locator('[data-coach-action=accept]').waitFor();
}
export async function addCoachingWeek(page,week){
 await page.locator('[data-coach-change-panel] > summary').click();const form=page.locator('[data-coach-circumstances]');
 await form.locator('[name=change]').selectOption('routine');await form.locator('[name=week]').fill(week);
 await form.getByRole('button',{name:'Update my next step',exact:true}).click();await savedCoaching(page);await page.locator('[data-coach-action=accept]').waitFor();
 assert.match(await page.locator('.coach-reason').textContent(),new RegExp(week.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
}
export async function setCoachingSituation(page,{mode,stage}){
 for(const [kind,value,label] of [['mode',mode,'Save my situation'],['stage',stage,'Save my stage']]){
  await page.locator('[data-coach-memory] > summary').click();const form=page.locator('[data-coach-'+kind+']');await form.locator('select').selectOption(value);await form.getByRole('button',{name:label,exact:true}).click();await savedCoaching(page);
 }
}
export async function chooseCoachingFocus(page,focus){
 // A focus choice appears when suggestions are exhausted or a blocker is raised.
 // Follow actual visible declines and explicitly restore this focus when offered.
 for(let i=0;i<=library.length;i++){
  const form=page.locator('[data-coach-focus]');if(await form.isVisible()){
   const values=await form.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));const value=values.find(v=>v===focus+':restore')||values.find(v=>v===focus);assert(value,'Requested focus must be an actual offered choice');await form.locator('select').selectOption(value);await form.getByRole('button',{name:'Prepare my next step',exact:true}).click();await savedCoaching(page);await page.locator('[data-coach-action=accept]').waitFor();
   // Setup's traversal must not pre-reject unrelated focuses for later scenarios.
   // Restore each incidental rejection using the same visible history controls.
   for(let j=0;j<=library.length;j++){
    const memory=page.locator('[data-coach-memory]');await memory.locator(':scope > summary').click();const restore=memory.locator('[data-coach-action=restore]');
    if(!await restore.count()){await memory.locator(':scope > summary').click();return;}
    await restore.first().click();await savedCoaching(page);
   }
   throw Error('Incidental setup rejections were not restored through visible controls');
  }
  const decline=page.locator('[data-coach-action=decline]');assert(await decline.isVisible(),'Focus journey needs an actual visible change control');await decline.click();await savedCoaching(page);
 }
 throw Error('Focus choice was not offered after the finite available suggestions');
}
