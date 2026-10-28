// Product-specific facts checked against the partner's current product pages.
// Private source URLs, hashes and unresolved items are in content-audit.json.
const labKit=['Lancet and finger-prick blood collection equipment','Prepaid sample-return packaging','Product-specific collection instructions'];
const lab={kit:labKit,collect:'Collect a small finger-prick blood sample using the lancet and collection equipment supplied.',run:'Put the sample in the supplied prepaid return packaging and post it as the kit instructs.',read:'Access your report through our testing partner’s secure results portal when analysis is complete.'};
const bloodKit=['Self-test device','Lancet and blood collection equipment','Buffer solution','Instructions and result guide'];
const collectBlood='Use the supplied lancet and collection equipment to obtain the blood sample described in your kit’s leaflet.';
const readAt=minutes=>'Read the device after '+minutes+' minutes using the supplied result guide. Keep to the leaflet’s reading window.';
export const specifications=Object.freeze({
 testosterone:{...lab},
 diabetes:{...lab},
 'psa-lab':{...lab},
 'male-hormone':{...lab},
 'heart-health':{...lab},
 'bowel-health':{
  kit:['Stool collection paper','Sample tube with collection applicator and buffer','Self-test device','Instructions and result guide'],
  collect:'Use the collection paper and applicator to take a small sample from three areas of the stool, then close the collection tube.',
  run:'Shake the closed tube to mix the sample with the buffer. Keep it upright and add two drops to the test’s sample well as instructed.',
  read:readAt(5)
 },
 'prostate-health':{
  description:'A finger-prick PSA self-test, with a result read at home five minutes after running the test.',
  kit:['Self-test device','Lancet and collection pipette','Buffer solution','Instructions and result guide'],
  collect:'Use the supplied lancet to obtain a finger-prick blood sample and collect it with the pipette.',
  run:'Add the collected blood to the sample well, followed by two drops of buffer. Follow the amounts in your kit’s leaflet.',
  read:readAt(5)
 },
 'male-fertility':{
  kit:['Semen collection cup','Semen transfer device','Buffer solution and self-test device','Instructions and result guide'],
  resultLabel:'1-hour preparation + 5-minute test',
  resultTime:'Leave the collected semen sample to stand for 1 hour before preparing the test. Read the result 5 minutes after adding the prepared sample to the device.',
  preparation:'Allow for the one-hour sample preparation wait as well as collection and testing time.',
  collect:'Collect the semen sample in the supplied cup and leave it to stand for one hour. Follow the leaflet’s preparation requirements.',
  run:'Use the transfer device to mix 0.1 mL of sample with the buffer. Add two drops of the mixture to the sample well as directed.',
  read:readAt(5)
 },
 cholesterol:{
  kit:['Cholesterol self-test card','Lancet and blood collection equipment','Sliding colour chart','Instructions and result guide'],
  resultLabel:'2 minutes, then a 30-second reading window',
  resultTime:'Wait 2 minutes after applying the blood sample. Within the following 30 seconds, match the result against the sliding colour chart. Follow the supplied reading instructions.',
  collect:collectBlood,
  run:'Put the blood sample into the test’s sample well and wait two minutes.',
  read:'Within the next 30 seconds, match the result colour with the sliding chart to find the total-cholesterol band.'
 },
 'vitamin-d':{
  kit:bloodKit,collect:collectBlood,
  run:'Add the blood sample to the sample well, then add two drops of buffer as directed in the leaflet.',
  read:readAt(10)
 },
 iron:{
  kit:bloodKit,collect:collectBlood,
  run:'Add the blood sample to the sample well, followed by one drop of buffer as directed in the leaflet.',
  read:readAt(5)
 },
 thyroid:{
  kit:bloodKit,collect:collectBlood,
  run:'Add two drops of blood to the sample well, followed by two drops of buffer. Follow the kit’s leaflet.',
  read:readAt(10)
 },
 'kidney-health':{
  kit:['Urine self-test device with cap','Instructions and result guide'],
  collect:'Remove the cap. Hold the absorbent tip in the urine stream or a collected urine sample for 10–15 seconds, as the leaflet directs.',
  run:'Replace the cap and lay the device on a flat surface.',
  read:readAt(3)
 },
 multivitamin:{
  sample:'Capsules',pack:'60 capsules; listed as suitable for vegans.',
  strength:'30+ vitamins, minerals and nutrients',
  serving:'Published serving: one capsule daily. Follow the final label or your healthcare professional’s advice.'
 },
 'vitamin-d-supplement':{
  sample:'Capsules',pack:'60 capsules; listed as suitable for vegans.',
  description:'A vegan vitamin D3 supplement with a stated strength of 1,000 IU.',
  strength:'Stated strength: 1,000 IU of vitamin D3',
  serving:'Published serving: one capsule daily. Follow the final label or your healthcare professional’s advice.'
 },
 'iron-supplement':{
  sample:'Capsules',pack:'60 capsules; listed as suitable for vegans.',
  description:'An iron bisglycinate supplement with a stated strength of 20 mg of elemental iron.',
  strength:'Stated strength: 20 mg elemental iron as iron bisglycinate',
  serving:'Published serving: one capsule daily. Follow the final label or your healthcare professional’s advice.'
 }
});
