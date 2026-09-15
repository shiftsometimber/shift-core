import fs from 'node:fs';
import assert from 'node:assert/strict';
import {exercisePurpose,purposeSources} from './exercise-purpose.mjs';

export function guidanceRecords(pack){
  const source=JSON.parse(fs.readFileSync('preview/fit-grub/guidance/workbook.json'));
  const byId=new Map(source.movements.map(x=>[x.id,x]));
  assert.equal(byId.size,300);
  const records=pack.records.map(asset=>{
    const row=byId.get(asset.id);assert.ok(row,`Missing written guidance: ${asset.id}`);
    assert.deepEqual(row.variants.map(v=>v.id).sort(),asset.variants.map(v=>v.id).sort());
    for(const key of ['setup','cues','mistakes','modifications','safety','equipmentSetup','space'])assert.ok(row[key],`${asset.id}: missing ${key}`);
    return {...row,status:asset.status,image:asset.image,imageHash:asset.sha256,purpose:exercisePurpose[row.id]||generalPurpose(row)};
  });
  return {source:source.source,sha256:source.sha256,records};
}

function generalPurpose(row){
  const type=row.movementType;
  const core=/Core/.test(type),cardio=/cardio|Conditioning/i.test(type),balance=/Balance/.test(type),mobility=/Stretch|Gentle/.test(type);
  return {
    focus:core?'Abdominal control and strength':cardio?'Activity and stamina':balance?'Balance and coordination':mobility?'Comfortable movement practice':'Strength and controlled movement',
    benefit:`${row.title} practises ${core?'trunk control':cardio?'repeated movement':balance?'balance and coordination':mobility?'moving through a comfortable range':'controlled resistance work'}. The movement guide identifies its main muscles as: ${row.muscles}.`,
    weightLoss:core?'This works the abdominal muscles. It cannot choose where body fat is lost: crunches do not selectively burn belly fat.':cardio?'Regular activity uses energy and can support weight management alongside eating habits. Duration, effort and consistency matter.':balance||mobility?'Its main purpose is movement practice, not a large calorie burn. It can be one part of a varied activity routine.':'Resistance work develops muscle strength. Combine it with regular aerobic activity and eating habits that support your weight goal.',
    sources:[purposeSources.activity,purposeSources.bodyFat]
  };
}

export function guidanceAssets(pack){
  const data=guidanceRecords(pack);
  const firstVariants=data.records.map(r=>({...r,variants:r.variants.slice(0,1)}));
  return {
    data,
    script:'window.SHIFT_FIT_GUIDANCE='+JSON.stringify(firstVariants).replaceAll('<','\\u003c')+';\n',
    galleryScript:'<script id="fit-guidance" type="application/json">'+JSON.stringify(data.records).replaceAll('<','\\u003c')+'</script>',
    summary:{source:data.source,sourceSha256:data.sha256,movements:300,variants:2688,approvedImages:pack.approvedImages,heldImages:pack.heldImages,sourceReviewStatus:'preserved; no new technique or member-release approval',productionChanged:false}
  };
}
