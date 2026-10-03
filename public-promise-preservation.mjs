import assert from 'node:assert/strict';
import {CENTRE_GUIDANCE_REPLACEMENTS,CENTRE_GUIDANCE_COUNTS} from './public-treatment-guidance.mjs';
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
 // PR #1039 published this exact, reviewed three-part clarification together.
 // Restore its predecessor for the existing whole-page comparison only.
 const reviewed=[
  ['The Health MOT guide explains a proposed blood-test route and how it differs from the older browser questionnaire. No test or clinical review is booked by reading it.','Explore the SHIFT Health MOT home blood test and what it covers.'],
  ['>Read the Health MOT guide</a>','>Explore the Health MOT</a>'],
  ['Explore general route information and questions to discuss with a clinician. Some Decision Centre calculations require previously saved browser information.','Use your Health MOT to see which treatment routes are most worth understanding.']
 ];
 if(reviewed.some(([current])=>text.includes(current))){
  for(const [current,prior] of reviewed){
   assert.equal(text.split(current).length-1,1,'Expected complete exact reviewed MOT clarification');
   assert(!text.includes(prior),'Mixed MOT clarification versions');
   text=text.replace(current,prior);
  }
 }

 for(const [index,[before,after]]of CENTRE_GUIDANCE_REPLACEMENTS.entries()){if(required||text.includes(after)){assert.equal(text.split(after).length-1,CENTRE_GUIDANCE_COUNTS[index],'Expected exact Centre service-information correction count');assert(!text.includes(before),'Mixed old and corrected service information');text=text.replaceAll(after,before)}}
 if(!required&&!replacements.some(([,after])=>text.includes(after)))return Buffer.from(text);
 for(const [before,after]of replacements){
  assert.equal(text.split(after).length,2,'Expected one exact Centre accuracy correction');
  assert(!text.includes(before),'Mixed old and corrected Centre claims');
  text=text.replace(after,before);
 }
 return Buffer.from(text);
}
