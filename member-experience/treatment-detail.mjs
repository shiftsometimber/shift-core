// Member-reported locations and symptoms only. No dosing or rotation advice.
export const INJECTION_MEDICINES=['Mounjaro','Wegovy','Liraglutide'];
export const INJECTION_SITES=[
 {value:'abdomen_left',label:'Abdomen · left'},
 {value:'abdomen_right',label:'Abdomen · right'},
 {value:'thigh_left',label:'Thigh · left'},
 {value:'thigh_right',label:'Thigh · right'},
 {value:'upper_arm_left',label:'Upper arm · left'},
 {value:'upper_arm_right',label:'Upper arm · right'}
];
export const SYMPTOM_IMPACTS=['None','A little','Some','A lot'];
export function describeTreatmentEvent(event,sites=[]){
 const d=event.details||{};
 if(d.checkin){
  const c=d.checkin,lines=[
   'Weight: '+(c.weight===null||c.weight===undefined?'Not recorded':c.weight+' kg'),
   'Appetite: '+(c.appetite||'Not recorded')+' · Energy: '+(c.energy||'Not recorded'),
   'Reported side effects: '+(c.sideEffects||'None reported')
  ];
  if(c.foodNote)lines.push('Food note: '+c.foodNote);
  if(c.proteinGrams!==undefined)lines.push('Protein so far that day: '+c.proteinGrams+' g (member estimate)');
  if(c.waterMl!==undefined)lines.push('Water so far that day: '+c.waterMl+' ml (member report)');
  if(c.symptomImpact)lines.push('Effect on your day: '+c.symptomImpact);
  if(c.symptomStartedAt)lines.push('Reported symptom start: '+new Date(c.symptomStartedAt).toLocaleString('en-GB',{timeZone:'Europe/London'})+' (Europe/London)');
  return lines.join('\n');
 }
 const lines=[d.note||d.prescriptionDetails||''];
 if(event.kind==='dose_taken'&&d.injectionSite)lines.push('Injection site: '+(sites.find(s=>s.value===d.injectionSite)?.label||'Not recorded'));
 return lines.filter(Boolean).join('\n');
}
