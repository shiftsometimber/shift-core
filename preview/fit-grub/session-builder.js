// Pure preview composer. No account, network, database or production dependencies.
// Uses the first source protocol as a review example; it never approves a draft.
export function createFitPreview(records){
    const hasContext=x=>!!String(x||'').trim()&&!/^(none|no|n\/a|not applicable)$/i.test(String(x).trim());
  const negative=new Set(),recent=[];
  const preferred=['low-impact-march','walk','stationary-bike','sit-to-stand','chair-supported-squat','squat','counter-push-up','standing-wall-push-up','push-up','row','standing-band-row','dead-bug','glute-bridge','chair-balance-reach','wall-slides','hamstring-mobility','thoracic-rotation'];
  const priority=r=>{const n=preferred.indexOf(r.id);return n<0?999:n};
  const group=r=>/Core/.test(r.movementType)?'core':/cardio|Conditioning/i.test(r.movementType)?'cardio':/Balance/.test(r.movementType)?'balance':/Stretch|Gentle/.test(r.movementType)?'mobility':/chest|push|press|triceps/i.test(r.id)?'push':/row|pull|curl|back/i.test(r.id)?'pull':'legs';
  const requirements=r=>{
    // Exact requirements remain visible. Unknown or specialist equipment requires
    // the equipped-gym option; a single matching word never clears the whole setup.
    const original={walk:[],squat:[],'hip-hinge':[],'calf-raise':['Chair'],'sit-to-stand':['Chair'],'chair-balance-reach':['Chair'],'chest-press':['Full gym'],row:['Dumbbells','Chair'],'overhead-press':['Dumbbells'],'lat-pulldown':['Full gym'],'loaded-carry':['Dumbbells'],'triceps-extension':['Resistance band'],'step-up':['Full gym'],'stationary-bike':['Full gym'],'rowing-erg':['Full gym'],'wall-slides':['Wall'],'glute-bridge':['Mat'],'dead-bug':['Mat'],plank:['Mat'],'push-up':['Mat'],'hip-flexor-mobility':['Mat'],'hamstring-mobility':['Chair'],'thoracic-rotation':['Chair'],'reverse-lunge':[],'shadow-boxing':[],'low-impact-march':[]};
    if(Object.hasOwn(original,r.id))return original[r.id];
    let text=r.equipment.toLowerCase();const required=[];
    const known=[[/exercise mat|\bmat\b/g,'Mat'],[/two light dumbbells|two dumbbells|one dumbbell|dumbbell/g,'Dumbbells'],[/sturdy chair|chair with fixed armrests|chair/g,'Chair'],[/fixed counter nearby|fixed counter/g,'Fixed counter'],[/long band secured beneath both feet|long band secured under feet|long resistance band/g,'Resistance band'],[/\bwall\b/g,'Wall']];
    for(const [re,name] of known){if(re.test(text)){required.push(name);text=text.replace(re,' ');}}
    text=text.replace(/\b(none|clear floor|and|with|a|the)\b/g,'').replace(/[\s.,/]+/g,'');
    if(text)required.push('Full gym');
    return [...new Set(required)];
  };
  function context(body){
    const location=body.location,minutes=Number(body.minutes_per_day),equipment=new Set(body.equipment||[]);
    const notes=String(body.notes||'').trim(),noFloor=/^no floor exercises[.!]?$/i.test(notes);
    return {location,minutes,equipment,noFloor,held:!['home','gym','outside'].includes(location)||![10,20,30,45,60].includes(minutes)||hasContext(body.limitations)||(hasContext(notes)&&!noFloor),goal:String(body.goal||body.preferences||'general fitness')};
  }
  function eligible(r,c){
    if(r.status!=='approved'||negative.has(r.id)||r.variants[0]?.difficulty!=='beginner'||r.movementType==='Ballistic skill')return false;
    if(c.noFloor&&r.floorAccess!=='No floor transfer')return false;
    if(c.location==='outside'&&!String(r.location).split(/\s+/).includes('outside'))return false;
    if(c.location==='home'&&/equipped home gym/.test(r.location)&&!c.equipment.has('Full gym'))return false;
    return requirements(r).every(x=>c.equipment.has(x)||(c.location==='gym'&&c.equipment.has('Full gym')));
  }
  function exercise(r,c){
    const v=r.variants[0],required=requirements(r);
    return {id:v.id,canonical_movement:r.id,name:r.title,group:group(r),dose_text:v.dose,how:[r.setup,r.cues,v.instructions],form_cues:[r.equipmentSetup,r.space],safety_cues:[r.safety,r.mistakes],regressions:[r.modifications],equipment:required,source_release_status:v.releaseStatus,selection_reason:`Included in this preview for ${group(r)==='cardio'?'stamina':group(r)==='core'?'trunk control':group(r)==='mobility'?'movement practice':group(r)==='balance'?'balance':'strength'} within your selected ${c.minutes}-minute window. ${required.length?'Its listed setup uses '+required.join(', ')+', which you selected.':'It needs no exercise equipment.'}${c.noFloor?' It requires no floor transfer.':''}`};
  }
  const held=()=>({preview:true,held:true,sessions:[],message:'Your choices are kept. This preview cannot assess an injury, medical restriction or unrecognised note. Review the profile or follow your existing agreed plan.'});
  function build(body){
    const c=context(body);if(c.held)return held();
    let pool=records.filter(r=>eligible(r,c));
    const goals=/strength/.test(c.goal)?['legs','push','pull','core','cardio']:/stamina|cardiovascular/.test(c.goal)?['cardio','legs','core','mobility']:/mobility|balance/.test(c.goal)?['mobility','balance','core']:['cardio','legs','push','pull','core','mobility'];
    const count=Math.min(6,Math.max(2,Math.floor(c.minutes/5))),picked=[];
    pool.sort((a,b)=>Number(recent.includes(a.id))-Number(recent.includes(b.id))||priority(a)-priority(b)||a.id.localeCompare(b.id));
    for(const g of [...goals,...goals]){if(picked.length>=count)break;const r=pool.find(x=>group(x)===g&&!picked.some(y=>y.id===x.id));if(r)picked.push(r);}
    if(!picked.length)return{...held(),message:'No illustrated example matches all the selected equipment and setting. Review your kit or browse the full movement guides.'};
    recent.splice(0,recent.length,...picked.map(r=>r.id));
    return {preview:true,timing_kind:'time_budget',location:c.location,equipment:[...c.equipment],minutes_per_day:c.minutes,daily_coaching:{mode:'light',headline:`Your ${c.minutes}-minute session preview`,reasons:[`Selected for ${c.goal}.`,`The ${picked.length} movements match your chosen setting and kit.`,`This is a time window, not a measured duration for the listed repetitions. Rest as needed and stop when your available time is up.`]},sessions:[{title:'Today’s movement preview',requested_minutes:c.minutes,estimated_minutes:c.minutes,exercises:picked.map(r=>exercise(r,c)),brief:'Review the illustrated instructions and original dose for each movement. Allow time to start gently, rest between sets and ease down. Do not rush or add repetitions to fill the clock. Draft protocols still require technique and suitability review.'}]};
  }
  function replace(body){
    const c=context(body);if(c.held)throw Error('Review the movement profile before swapping.');
    const ids=new Set(body.exclude||[]),canonicals=new Set(records.filter(r=>r.variants.some(v=>ids.has(v.id))).map(r=>r.id));
    const r=[...records].sort((a,b)=>priority(a)-priority(b)).find(r=>eligible(r,c)&&group(r)===body.group&&!canonicals.has(r.id));
    if(!r)throw Error('No different movement matches this role and all your current kit and limits. Keep this option or review your profile.');
    return {exercise:exercise(r,c)};
  }
  function feedback(id,sentiment){const r=records.find(r=>r.variants.some(v=>v.id===id));if(r&&sentiment==='nay')negative.add(r.id);return {ok:true};}
  return {build,replace,feedback,requirements};
}
