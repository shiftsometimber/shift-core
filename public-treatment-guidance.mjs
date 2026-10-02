// Bounded public information and SHIFT service-eligibility correction.
// References checked 2 October 2026: MHRA patient guidance (5 February 2026),
// MHRA/ASA/GPhC September 2025 advertising notice, NHS Dehydration.
export const CENTRE_GUIDANCE_REPLACEMENTS=[
 ['Start Here asks the focused questions, shows the five hero medicine routes and carries the selected option into its full product specification. The wider evidence library remains underneath when you want to dig deeper.','Start Here helps you explore lifestyle support, NHS care and clinical assessment. The information pages explain treatment options, benefits, risks and limitations. A prescriber decides whether any medicine is suitable.'],
 ['Compare treatment options and doses here; Shift currently provides information and decision support and does not supply medication.','Read the information and service criteria before considering assessment. The prescribing and dispensing services have their own responsibilities. A clinical assessment may end without a prescription.']
];
export function repairCentreGuidance(html){for(const [before,after]of CENTRE_GUIDANCE_REPLACEMENTS)html=html.replace(before,after);return html;}
export const INSULIN_GATE=`<section class="op-insulin-gate" data-insulin-gate aria-labelledby="insulin-service-title"><p class="op-eyebrow">SHIFT SERVICE CRITERIA</p><h2 id="insulin-service-title">Do you currently take insulin?</h2><label for="shift-insulin-use">Select your current answer</label><select id="shift-insulin-use" data-insulin-use required><option value="">Choose one</option><option value="no">No</option><option value="yes">Yes</option></select><p>If you take insulin, you cannot use SHIFT’s weight-management injection service. This applies to new and repeat orders. Do not stop or reduce insulin to qualify.</p><div data-insulin-excluded hidden role="alert"><strong>This service is not available to you.</strong><p>Speak to the clinician who manages your diabetes about suitable options. <a href="/shift-health">Explore SHIFT Health</a> for wider health guides and practical support. SHIFT Health does not replace diabetes care.</p></div></section>`;
export const ORDER_GUIDANCE_REPLACEMENTS=[
 ['Based on your answers, this could perhaps work for you…','Understand the treatment options.'],
 ['This option was carried across from your preference filters. You can compare it with every other treatment route below.','Read the benefits, risks and limitations before considering a clinical assessment. Your preferences do not establish whether a medicine is suitable. Assessment may lead to another form of support or no prescription.'],
 ['Choose a treatment, review the monthly price and continue through Shift\'s treatment-order journey.','Understand treatment options, SHIFT service criteria and the clinical assessment required before prescribing.'],
 ['<a href="/shift-health/health-mot">Take the Health MOT</a>','<a href="/shift-health">Explore SHIFT Health</a>'],
 ['Start somewhere that fits today, then revisit treatment if your circumstances change.','SHIFT Health offers wider health guides and practical support. Your GP or existing prescriber can advise on suitable care. If you already use medicine, discuss continuing care rather than changing it yourself.'],
 ['Short prompts at the right moment. No content avalanche.','Use the guidance when it helps. An entry in My Timber is not a clinical review and does not mean someone is monitoring you.'],
 ['Urgent or concerning symptoms must use our clinical support route or emergency services—not a coaching chatbot.','Contact your prescriber or pharmacist for medicine advice. Severe or rapidly worsening symptoms need urgent medical care. Do not wait for an app entry or an unanswered company message.']
];
export function repairOrderGuidance(html){
 if(html.includes('data-shift-treatment-guidance'))return html;
 for(const [before,after]of ORDER_GUIDANCE_REPLACEMENTS)html=html.replace(before,after);
 html=html.replace('<section class="op-bmi-gate"',INSULIN_GATE+'<section class="op-bmi-gate"');
 return html.replace('</head>',`<style data-shift-treatment-guidance>.op-positive-outlook,.op-product-art,[data-trial-calculator],[data-theory-output]{display:none!important}.op-product{grid-template-columns:minmax(0,1fr) auto}.op-insulin-gate{margin:32px 0;padding:24px;border:1px solid #707762;border-radius:16px}.op-insulin-gate label{display:block;margin:16px 0 8px}.op-insulin-gate select{font:inherit;max-width:100%;min-height:44px;padding:10px 14px}.op-insulin-gate p{max-width:70ch}.op-insulin-gate [role=alert]{padding:16px;border-left:4px solid #707762}.op-insulin-gate a{text-decoration:underline}@media(max-width:700px){.op-product{grid-template-columns:1fr}.op-insulin-gate{padding:20px}}</style></head>`);
}
const CONTROLLER_GATE=`
  // SHIFT current service gate; no health answer is saved in browser storage.
  const insulinField=$('[data-insulin-use]'),insulinBox=$('[data-insulin-gate]');let insulinMedicine='';
  function insulinCheckPassed(){return !String(product().form||'').toLowerCase().includes('injection')||insulinField?.value==='no'}
  function syncInsulinGate(){const injection=String(product().form||'').toLowerCase().includes('injection');if(insulinBox)insulinBox.hidden=!injection;if(insulinField){if(insulinMedicine!==medicationSelect.value)insulinField.value='';insulinMedicine=medicationSelect.value;insulinField.required=injection;}const excluded=$('[data-insulin-excluded]');if(excluded)excluded.hidden=!injection||insulinField?.value!=='yes'}
  if(insulinField)insulinField.addEventListener('change',()=>{syncInsulinGate();updateContinue();if(!insulinCheckPassed()&&step>0)show(0)});
  window.SHIFT_SERVICE_ELIGIBILITY=()=>{const metric=bmiUnit==='metric',heightCm=metric?Number($('[data-bmi-cm]').value):(Number($('[data-bmi-ft]').value)*12+Number($('[data-bmi-in]').value))*2.54,weightKg=metric?Number($('[data-bmi-kg]').value):(Number($('[data-bmi-st]').value)*14+Number($('[data-bmi-lb]').value||0))*0.45359237;return {insulinUse:insulinField?.value||'',eligibility:{heightCm,weightKg,weightRelatedCondition:$('input[name="bmi-condition"]:checked')?.value||''}}};
`;
export function repairOrderControllerGuidance(source){
 if(source.includes('// SHIFT current service gate;'))return source;
 source=source.replace('  function populateOptions(){',CONTROLLER_GATE+'  function populateOptions(){');
 source=source.replace('    const item=product();\n    $(\'[data-product-name]\')','    syncInsulinGate();\n    const item=product();\n    $(\'[data-product-name]\')');
 source=source.replace("const next=$('[data-op-next]'),ready=bmiCanContinue;","const alternativeLink=$('[data-alternative-route] a[href=\"/shift-health/health-mot\"]');if(alternativeLink){alternativeLink.href='/shift-health';alternativeLink.textContent='Explore SHIFT Health'}const next=$('[data-op-next]'),ready=bmiCanContinue&&insulinCheckPassed();");
 source=source.replace("priorityItem.classList.add('done');priorityItem.textContent='Journey preferences happen after approval';","priorityItem.classList.toggle('done',insulinCheckPassed());"+"priorityItem.textContent=insulinCheckPassed()?'Service check complete':insulinField?.value==='yes'?'Service unavailable':'Answer the insulin question';");
 source=source.replace("function show(n){step=", "function show(n){if(n>0&&(!bmiCanContinue||!insulinCheckPassed()))n=0;step=");
 // Continuing-treatment selection is not a patient-controlled eligibility waiver.
 source=source.replace(/      if\(stage==='continuing'\)\{[\s\S]*?      \}else if\(bmi>=item\.bmiStandard\)\{/,"      if(bmi>=item.bmiStandard){");
 source=source.replace('Why ${item.name} is currently suggested:','Information about ${item.name}:').replace('SUGGESTED FROM YOUR ANSWERS','SELECTED FOR INFORMATION').replace('Choose this treatment','View treatment information').replace('Your current choice','Currently viewing');
 return source;
}
export function repairIntegratedGuidance(source){
 if(source.includes('// SHIFT eligibility payload 20261002'))return source;
 source='// SHIFT eligibility payload 20261002\n'+source;
 source=source.replace('JSON.stringify({variantId:Number(option.value),verificationToken:verification.token})','JSON.stringify({variantId:Number(option.value),verificationToken:verification.token,...(window.SHIFT_SERVICE_ELIGIBILITY?.()||{})})');
 source=source.replace("if(theoryBox)theoryBox.hidden=!d?.theory;","if(theoryBox)theoryBox.hidden=true;");
 source=source.replace('Two appetite pathways. One weekly routine.','How tirzepatide works.').replace('An established weekly appetite-support route.','How semaglutide works.').replace('A new daily tablet without fasting rules.','How orforglipron works.').replace('A familiar incretin route with daily dosing.','How liraglutide works.');
 return source;
}
export const HYDRATION_SECTION=`<section class="cluster-section" data-shift-hydration-guidance><h2>Fluids, salts and electrolytes</h2><p>Keep drinking regularly. If you feel sick, small sips may be easier. Vomiting or diarrhoea can cause you to lose water and salts (electrolytes). Ask a pharmacist whether an oral rehydration solution is appropriate for you, especially if you have other conditions or take other medicines. There is no general requirement to take an electrolyte supplement after every injection.</p><p>If you cannot keep fluids down, are passing much less urine, or dizziness when standing does not go away, get urgent medical advice. Severe, persistent stomach pain that may spread to your back, with or without sickness, needs urgent medical help because it can be a sign of pancreatitis. Do not wait for a company inbox.</p><p>Follow the current leaflet for your medicine and your clinical team’s advice. <a href="https://www.nhs.uk/conditions/dehydration/" rel="noopener noreferrer">NHS: dehydration and oral rehydration</a> · <a href="https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know" rel="noopener noreferrer">MHRA: medicine risks and when to get help</a>. Guidance checked 2 October 2026.</p></section>`;
export function repairSideEffectGuidance(html){if(html.includes('data-shift-hydration-guidance'))return html;return html.replace('<section class="cluster-section"><h2>Missed dose, changed day or not sure what to do?</h2>',HYDRATION_SECTION+'<section class="cluster-section"><h2>Missed dose, changed day or not sure what to do?</h2>');}
