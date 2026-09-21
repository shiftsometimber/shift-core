import assert from 'node:assert/strict';
const replacements=[
 ['Retatrutide, CagriSema, Orforglipron, Amycretin, MariTide and the next generation of weight-management treatments.','Retatrutide, CagriSema, Amycretin, MariTide and the next generation of weight-management treatments.'],
 ['Use the free Health MOT to organise your current picture and identify sensible priorities.','Explore the SHIFT Health MOT home blood test and what it covers.'],
 ['>Take the Health MOT</a>','>Explore the Health MOT</a>']
];
// Undo only the exact reviewed Centre accuracy changes for the existing complete
// page fingerprint. Missing, mixed or duplicated corrections must fail closed.
export function preserveTreatmentCentreAccuracy(path,body,{required=false}={}){
 if(path!=='/treatment-centre')return body;
 let text=body.toString('utf8');
 if(!required&&!replacements.some(([,after])=>text.includes(after)))return body;
 for(const [before,after]of replacements){
  assert.equal(text.split(after).length,2,'Expected one exact Centre accuracy correction');
  assert(!text.includes(before),'Mixed old and corrected Centre claims');
  text=text.replace(after,before);
 }
 return Buffer.from(text);
}
