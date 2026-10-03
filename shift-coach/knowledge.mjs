// Fixed, source-linked guidance. Selection uses confirmed choices only; no
// diagnosis, hidden treatment inference, model call or automatic content approval.
export const sources=Object.freeze({
 food:{label:'NHS: eating a balanced diet',url:'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/'},
 budget:{label:'NHS: healthy eating on a budget',url:'https://www.cntw.nhs.uk/resources/healthy-eating-on-a-budget'},
 shifts:{label:'HSE: hints and tips for shift workers',url:'https://www.hse.gov.uk/humanfactors/topics/shift-workers.htm'},
 movement:{label:'NHS: physical activity for adults',url:'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/'},
 knees:{label:'NHS: knee pain and when to get help',url:'https://www.nhs.uk/symptoms/knee-pain/'},
 appetite:{label:'NHS: eating habits with weight-loss medicines',url:'https://www.guysandstthomas.nhs.uk/health-information/lifestyle-advice-people-taking-weight-loss-medicines/healthy-eating-habits'},
 smallMeals:{label:'NHS: dietary advice alongside treatment',url:'https://www.guysandstthomas.nhs.uk/health-information/lifestyle-advice-people-taking-weight-loss-medicines/managing-side-effects-diet'},
 treatment:{label:'MHRA: what to know about GLP-1 medicines',url:'https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know'},
 afterwards:{label:'NICE: support after weight-management medicines',url:'https://www.nice.org.uk/guidance/qs212/chapter/Quality-statement-7-Advice-and-support-after-stopping-medicines-for-weight-management-or-completing-behavioural-interventions'}
});
export const guides=Object.freeze({
 food:{title:'Build an ordinary meal you can repeat',paragraphs:[
  'A useful meal needs more thought than “eat less”. Include a familiar starchy food, a protein food and some fruit or vegetables across your meals. Bread, potatoes, rice or pasta can belong in a balanced diet; beans, eggs, fish, tofu or meat can supply protein. Choose foods that suit your allergies, preferences and any professional dietary advice.',
  'Three examples to adapt: beans on wholemeal toast with vegetables; a potato with a filling and salad; or a wrap with a ready-to-eat filling and vegetables. These are examples, not a personalised diet or fixed portion target. Pick one you would actually eat, check what you already have and buy only the missing ingredients.',
  'If a new recipe means six purchases and an hour you do not have, use a familiar meal. The coaching step is to make one meal easier to organise; accepting a plan does not record that you ate it.'
 ],sourceKeys:['food']},
 budget:{title:'Keep the food useful and the shopping bill sensible',paragraphs:[
  'Start with the cupboard and fridge before the shop. Frozen vegetables and tinned beans or lentils can reduce waste and provide useful meal ingredients. Compare the price per kilogram or litre where it is shown: a bigger pack only saves money if you can afford it, store it and use it.',
  'For one meal, choose an ingredient you already have and one missing item. A tin of beans can go with toast or a potato; leftover vegetables can join an omelette or pasta. If you cannot cook, choose a ready-to-eat filling and bread instead. Check labels, allergies, use-by dates and storage instructions.',
  'Keep one low-effort fallback on the list you already use. You do not need specialist “diet” foods, supplements or a new appliance to take this step. Prices vary, so SHIFT does not promise a meal cost it has not checked.'
 ],sourceKeys:['budget']},
 shifts:{title:'Plan around your shift, rather than a nine-to-five timetable',paragraphs:[
  'Name the awkward point: no break, no fridge, getting home tired or sleeping through an ordinary mealtime. That is a practical problem to plan around, not a failed day. HSE advice highlights meal timing, regular lighter meals and protecting sleep for shift workers.',
  'Before one shift, choose a realistic food break and a fallback. With a fridge, use an ordinary packed meal and keep it chilled as its label requires. Without one, choose suitable shelf-stable items rather than carrying food that needs refrigeration. A sandwich, yoghurt or leftovers needs appropriate storage; a bag is not a fridge.',
  'Attach your plan to an event that actually happens—before leaving, a permitted break or waking up—rather than insisting on breakfast at eight. Keep any movement break comfortable and permitted at work. Do not trade needed sleep for a workout, and never drive while dangerously sleepy.'
 ],sourceKeys:['shifts']},
 movement:{title:'Make movement something you can keep doing',paragraphs:[
  'Movement includes everyday activity as well as gym sessions. NHS guidance combines aerobic activity, strengthening and breaking up long periods of sitting. A planning step here is a starting point, not a claim that one short break meets those guidelines.',
  'Choose an activity you already know is suitable and comfortable, then choose when it could fit. Company, enjoyment and reducing the getting-ready hassle are different approaches if a timetable has not worked. If a health condition, pain or a long spell without exercise makes suitability uncertain, speak with a healthcare professional first.',
  'After you try the step, report the result honestly. If it helped, keep it. If the time was wrong, make the commitment smaller. If the approach was wrong, change the approach rather than adding more minutes.'
 ],sourceKeys:['movement']},
 knees:{title:'Work around sore knees without guessing at a treatment',paragraphs:[
  'Sore knees do not tell SHIFT what the cause is or which exercise is safe. Do not turn a general weight-management plan into a knee rehabilitation programme. Start by noting an everyday activity that is comfortable and any movement advice you have already been given. If you are unsure, ask your GP or physiotherapist before choosing activity.',
  'Avoid pushing through pain to complete a coaching step. You can work on an ordinary meal or your routine while getting suitable movement advice. No running, squat target, step count or exercise progression is prescribed by this card.',
  'NHS advice says to get help from 111 for a very painful knee, inability to move it or bear weight, severe swelling or changed shape, locking or giving way, or fever with a hot or red knee. Persistent pain also needs professional advice. This list is not a diagnosis or a complete safety screen.'
 ],sourceKeys:['knees','movement']},
 appetite:{title:'When a small appetite makes meals awkward',paragraphs:[
  'Reduced appetite can make planning and preparing food feel pointless. It is still important to get enough nutrition; deliberately skipping meals is not the aim. An ordinary balanced meal in a manageable amount, with another planned opportunity to eat, can be easier to organise than one large plate.',
  'Pick one familiar option that needs little effort: for example, toast with an egg or beans, or a ready-to-eat filling with bread and some fruit. Choose what suits your preferences, allergies and existing dietary advice. Ready-to-eat protein foods and pre-cut or frozen vegetables can reduce preparation.',
  'Persistent difficulty eating, repeated sickness or trouble keeping fluids down belongs with your prescriber or another healthcare professional. Saving it here does not contact them. This guide does not decide whether a symptom is expected, adjust treatment or set a restrictive calorie target.'
 ],sourceKeys:['appetite','smallMeals']},
 foodNoise:{title:'When food thoughts start taking over again',paragraphs:[
  'Food thoughts and physical hunger can overlap. SHIFT should not tell you to ignore hunger or diagnose why thoughts have returned. Make one short note about when the difficult moment happened and what was going on; it can help you choose a practical change or explain the problem to a professional.',
  'For an awkward evening, have an ordinary meal option ready and decide where it fits. If preparation was the obstacle, use an easier option; if planning itself did not help, try changing the situation or asking for practical support. Avoid turning a difficult evening into skipped meals or punishment the next day.',
  'If food thoughts are distressing, difficult to manage or affect eating, get professional support. Questions about returning hunger, restarting medication or changing a dose belong with the prescriber. Coaching carries on whether or not you buy treatment.'
 ],sourceKeys:['appetite','afterwards']},
 setback:{title:'A difficult week needs a usable fallback',paragraphs:[
  'Choose the obstacle you can name: money, time, preparation, a plan you disliked or needing help to choose. Keep one useful part of the week and change one awkward part. Missing days stay unknown; they are not silently marked as successes or failures.',
  'Try a familiar meal instead of a complicated recipe, a smaller planning commitment instead of a full weekly plan, or asking someone for one practical bit of help. These are SHIFT planning examples, not evidence that motivation alone explains your circumstances.',
  '“Didn’t fit” keeps the aim and reduces the first step. “Didn’t help” rejects that approach and tries a different kind. After two unhelpful approaches, the coach asks about the obstacle and makes the everyday-help route visible. It does not keep relabelling the same suggestion.'
 ],sourceKeys:[]},
 treatment:{title:'Everyday coaching alongside prescribed treatment',paragraphs:[
  'Use My Timber for food, suitable movement, routines and feedback. Your prescribing team decides clinical suitability, medicine, dose, side-effect assessment and when treatment changes. Tell them about concerns using the contact details on your treatment confirmation.',
  'Keep an ordinary meal option and a fallback for a difficult day. If symptoms make eating or movement difficult, contact the appropriate professional rather than treating them as a motivation problem. SHIFT cannot establish the cause or severity from a saved coaching record.',
  'The everyday-help queue is separate from clinical care. Saving a treatment concern or reopening a support request does not send a referral, book a review or establish that anyone is monitoring it.'
 ],sourceKeys:['treatment']},
 afterwards:{title:'Keep the support when treatment ends',paragraphs:[
  'NICE recommends advice and support when weight-management medicines stop. Before a planned end, choose one routine worth carrying forward and a fallback for a difficult day. Discuss when and how to stop with the prescriber; My Timber does not design a stopping schedule.',
  'After treatment, review what your routine needs now. Keep a useful meal or movement plan, note returning food thoughts and change a step that no longer fits. Your earlier feedback remains available. A medication purchase is not a condition for continuing everyday coaching.',
  'A setback does not establish why weight or appetite changed. If you want treatment advice, have symptoms or need more support, contact your prescriber or GP. No weight-maintenance result or prevention of regain is promised by these planning tools.'
 ],sourceKeys:['afterwards']}
});
export function knowledgeFor({focus='food',challenge='everyday',constraints={},mode='none'}={}){
 const keys=[];
 if(challenge==='sore-knees')keys.push('knees');
 if(challenge==='low-appetite')keys.push('appetite');
 if(challenge==='returning-food-noise'||challenge==='evenings')keys.push('foodNoise');
 if(challenge==='busy-days')keys.push('shifts');
 if(challenge==='setback'||challenge==='low-motivation')keys.push('setback');
 if(focus==='food'&&constraints.budget==='tight')keys.push('budget');
 keys.push(focus==='movement'?'movement':focus==='food'?'food':'setback');
 if(mode==='planning-stop'||mode==='stopped')keys.push('afterwards');
 else if(mode==='shift'||mode==='elsewhere')keys.push('treatment');
 return [...new Set(keys)].map(key=>({...guides[key],id:key,sources:guides[key].sourceKeys.map(k=>sources[k]),checkedAt:'2026-10-03',clinicalApproval:false}));
}
