import {uid} from './store.mjs';
export const components=['energy','sleep','activity','mood','waist','weight'];
export function chooseComponents(state,chosen){if(!Array.isArray(chosen)||!chosen.length||chosen.some(c=>!components.includes(c))||chosen.length===1&&chosen[0]==='weight')throw Object.assign(Error('choose_non_weight_component'),{status:400});state.components=[...new Set(chosen)];return{dataUsed:[]};}
export function weeklyReview(state,rating,now=Date.now()){
 if(!Number.isInteger(rating)||rating<1||rating>5)throw Object.assign(Error('rating_1_to_5_required'),{status:400});
 const r={id:uid(),rating,at:now,source:'member',personal:true};state.reviews.push(r);state.lastActivity=now;
 if(state.reviews.slice(-2).length===2&&state.reviews.slice(-2).every(r=>r.rating<=2))state.stage='Hit a wall';
 return{dataUsed:[r.id]};
}
export function reviewView(state){
 const latest=state.reviews.at(-1),prior=state.reviews.at(-2);
 const helped=state.outcomes.filter(o=>o.value==='helped').at(-1);
 return{personal:true,combinedScore:null,components:state.components.map(key=>({key,readings:state.readings.filter(r=>r.kind===key&&!r.conflict&&state.permissions[r.source]),missing:!state.readings.some(r=>r.kind===key&&!r.conflict&&state.permissions[r.source])})),weeklyAssessment:latest||null,change:latest&&prior?latest.rating-prior.rating:null,win:helped?{text:helped.title?`You said “${helped.title}” helped. Keep that useful step if it still fits.`:'You marked your last action as done and helpful.',dataUsed:[helped.id],at:helped.at}:null,next:'Keep one useful thing. Change the part that did not fit.',reviewSecondsTarget:60};
}
