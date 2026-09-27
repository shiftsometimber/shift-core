import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('open catalogue staging creates an attributed fail-closed expansion queue',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'shift-grub-open-'));
  const input=path.join(root,'input.json'),out=path.join(root,'out');
  const rows=Array.from({length:8},(_,index)=>({
    source:'Wikibooks Cookbook',source_url:`https://en.wikibooks.org/wiki/Cookbook:Meal_${index}`,
    source_id:`meal-${index}`,name:index<3?`Chicken fakeaway curry ${index}`:`Healthy bean bowl ${index}`,
    servings:'2',time:'30 minutes',category:'Dinner',
    ingredients:['100 g chicken or beans','1 onion','1 pepper'],instructions:['Prepare the ingredients.','Cook until done.'],
    licence:'CC BY-SA 4.0',attribution_required:true
  }));
  fs.writeFileSync(input,JSON.stringify(rows));
  const run=spawnSync(process.execPath,['grub-open-catalogue-shift-stage.mjs'],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,GRUB_OPEN_CATALOGUE_INPUT:input,GRUB_SHIFT_STAGE_DIR:out,GRUB_SHIFT_REQUIRED:'6'}});
  assert.equal(run.status,0,run.stderr||run.stdout);
  const queue=JSON.parse(fs.readFileSync(path.join(out,'shift-review-queue.json'),'utf8'));
  const summary=JSON.parse(fs.readFileSync(path.join(out,'summary.json'),'utf8'));
  assert.equal(queue.length,6);
  assert.equal(summary.projected_live_after_approval,804);
  assert.ok(summary.lanes.fakeaway>=3);
  for(const row of queue){
    assert.equal(row.source.licence,'CC BY-SA 4.0');
    assert.equal(row.source.attribution_required,true);
    assert.equal(row.publication_ready,false);
    assert.ok(row.shift_adaptation.blockers.includes('independent_human_review'));
    assert.equal(row.shift_adaptation.title,null);
  }
});
