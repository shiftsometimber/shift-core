export const ROUTE_STEPS=Object.freeze(['adult','measurements','condition_pathway','treatment_history','previous_treatment_detail','preference','result']);
const PREFERENCES=new Set(['weekly_injection','daily_tablet','either']);

export function advanceRoute(state={},answer={}){
  const step=state.step||'adult',answers={...(state.answers||{})};
  if(step==='adult'){
    if(answer.adult!==true)return {ok:false,error:'adult_confirmation_required',step};
    answers.adult=true;return {ok:true,step:'measurements',answers};
  }
  if(step==='measurements'){
    const heightCm=Number(answer.heightCm),weightKg=Number(answer.weightKg);
    if(!Number.isFinite(heightCm)||heightCm<120||heightCm>230)return {ok:false,error:'invalid_height',step};
    if(!Number.isFinite(weightKg)||weightKg<35||weightKg>350)return {ok:false,error:'invalid_weight',step};
    answers.heightCm=heightCm;answers.weightKg=weightKg;return {ok:true,step:'condition_pathway',answers};
  }
  if(step==='condition_pathway'){
    if(!['yes','no','unsure'].includes(answer.relevantCondition))return {ok:false,error:'condition_answer_required',step};
    answers.relevantCondition=answer.relevantCondition;return {ok:true,step:'treatment_history',answers};
  }
  if(step==='treatment_history'){
    if(typeof answer.previousTreatment!=='boolean')return {ok:false,error:'treatment_history_required',step};
    answers.previousTreatment=answer.previousTreatment;return {ok:true,step:answer.previousTreatment?'previous_treatment_detail':'preference',answers};
  }
  if(step==='previous_treatment_detail'){
    if(!String(answer.medicine||'').trim()||!String(answer.strength||'').trim()||!['0_7','8_14','15_21','22_plus'].includes(answer.lastDoseTiming))return {ok:false,error:'previous_treatment_detail_required',step};
    answers.previousMedicine=String(answer.medicine).trim().slice(0,100);answers.previousStrength=String(answer.strength).trim().slice(0,40);answers.lastDoseTiming=answer.lastDoseTiming;
    return {ok:true,step:'preference',answers};
  }
  if(step==='preference'){
    if(!PREFERENCES.has(answer.preference))return {ok:false,error:'preference_required',step};
    answers.preference=answer.preference;return {ok:true,step:'result',answers};
  }
  return {ok:false,error:'route_already_complete',step:'result'};
}

export function buildCommercialRouteResult(state,catalogue=[]){
  if(state?.step!=='result')throw new TypeError('route_not_complete');
  const preference=state.answers?.preference||'either';
  const routes=catalogue.filter(item=>item.governanceState==='approved'&&item.claimsState==='approved'&&item.catalogueState!=='withdrawn')
    .filter(item=>preference==='either'||item.formulation===preference)
    .map(item=>({id:item.id,formulation:item.formulation,routine:item.routine,proposedPricePence:item.proposedPricePence,priceStatus:'proposed',availability:item.availability,ctaState:item.ctaState,whyRelevant:'Matches the practical route preference you selected. Clinical suitability has not been assessed.'}));
  return {wording:'Based on your initial answers, these treatment routes may be relevant. A qualified clinician must review your full assessment before anything can be prescribed.',commercialRoutingOnly:true,clinicalEligibilityDetermined:false,routes,nextAction:routes.some(x=>x.ctaState==='enabled')?'create_account':'view_information'};
}
