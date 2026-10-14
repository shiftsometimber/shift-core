import {uid} from './store.mjs';
import {readToday} from './today.mjs';
import {boundary,personalContextBoundary} from './safety.mjs';
export const components=['energy','sleep','activity','mood','waist','weight'];
export function chooseComponents(state,chosen){if(!Array.isArray(chosen)||!chosen.length||chosen.some(c=>!components.includes(c))||chosen.length===1&&chosen[0]==='weight')throw Object.assign(Error('choose_non_weight_component'),{status:400});state.components=[...new Set(chosen)];return{dataUsed:[]};}
export function weeklyReview(state,rating,now=Date.now()){
 if(!Number.isInteger(rating)||rating<1||rating>5)throw Object.assign(Error('rating_1_to_5_required'),{status:400});
 const r={id:uid(),rating,at:now,source:'member',personal:true};state.reviews.push(r);state.lastActivity=now;
 if(state.reviews.slice(-2).length===2&&state.reviews.slice(-2).every(r=>r.rating<=2))state.stage='Hit a wall';
 return{dataUsed:[r.id]};
}
const at=value=>typeof value==='number'?value:typeof value==='string'?Date.parse(value):NaN;
const safeText=value=>typeof value==='string'&&value.length>0&&value.length<=2000&&boundary(value).coaching;
const ids=values=>values.map(x=>x.id).filter(id=>typeof id==='string'&&id.length>0);
const labels={energy:'Energy',sleep:'Sleep',activity:'Activity',mood:'Mood',waist:'Waist',weight:'Weight'};
const units=new Set(['','kg','cm','h','hours','min','minutes','steps','score']);
// A factual summary of this member's permitted saved records, not a health
// score or an inference about missing days. Reading it never writes state.
export function reviewView(state,now=Date.now()){
 if(!Number.isFinite(now))throw Object.assign(Error('invalid_review_time'),{status:400});
 const from=now-7*86400000,window={from,to:now,days:7},within=value=>Number.isFinite(at(value))&&at(value)>=from&&at(value)<=now;
 const empty={personal:true,combinedScore:null,components:[],weeklyAssessment:null,change:null,win:null,window,whatMoved:[],whatDidnt:[],unknowns:[],next:null,nextAction:null,reviewSecondsTarget:60};
 if(!personalContextBoundary(state).coaching)return{...empty,supportRequired:true};
 const whatMoved=[],whatDidnt=[],unknowns=[];
 const selected=[...new Set(state.components||[])].filter(key=>components.includes(key));
 const componentViews=selected.map(key=>{
  const readings=(state.readings||[]).filter(r=>r.kind===key&&typeof r.id==='string'&&r.id.length>0&&!r.conflict&&state.permissions?.[r.source]===true&&within(r.at)&&Number.isFinite(r.value)).sort((a,b)=>at(a.at)-at(b.at));
  const first=readings[0],last=readings.at(-1),unit=first?.unit||'';
  if(readings.length<2||at(first?.at)>=at(last?.at)||!units.has(unit)||readings.some(r=>(r.unit||'')!==unit)){
   unknowns.push({component:key,text:labels[key]+': not enough comparable saved readings in these seven days. Missing days stay unknown.'});
  }else{
   const show=value=>String(value)+(unit?' '+unit:'');
   const item={kind:key,text:first.value===last.value?labels[key]+': your first and latest saved readings were both '+show(last.value)+'. Missing days stay unknown.':labels[key]+': your saved readings changed from '+show(first.value)+' to '+show(last.value)+'.',dataUsed:ids([first,last])};
   (first.value===last.value?whatDidnt:whatMoved).push(item);
  }
  return{key,readings,missing:readings.length===0};
 });
 const reviews=(state.reviews||[]).filter(r=>within(r.at)&&r.source==='member'&&r.personal===true&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5).sort((a,b)=>at(a.at)-at(b.at));
 const latest=reviews.at(-1),prior=reviews.at(-2);
 if(latest&&prior){
  const item={kind:'personal_rating',text:'Your own weekly rating '+(latest.rating===prior.rating?'stayed at '+latest.rating:'changed from '+prior.rating+' to '+latest.rating)+'. This is your assessment, not a clinical score.',dataUsed:ids([prior,latest])};
  (latest.rating===prior.rating?whatDidnt:whatMoved).push(item);
 }else unknowns.push({component:'personal_rating',text:'There are not two personal weekly ratings in these seven days to compare.'});
 const outcomes=(state.outcomes||[]).filter(o=>within(o.at)&&['helped','didnt-help','didnt-fit','didnt-try'].includes(o.value)&&(!o.title||safeText(o.title))).sort((a,b)=>at(a.at)-at(b.at));
 const helped=outcomes.filter(o=>o.value==='helped').at(-1);
 if(helped)whatMoved.push({kind:'helped',text:'You said “'+(helped.title||'your saved step')+'” helped.',dataUsed:ids([helped])});
 for(const [value,wording]of [['didnt-help','did not help'],['didnt-fit','did not fit your week'],['didnt-try','was not tried']]){
  const outcome=outcomes.filter(o=>o.value===value).at(-1);
  if(outcome)whatDidnt.push({kind:value,text:'You recorded that “'+(outcome.title||'your saved step')+'” '+wording+'.',dataUsed:ids([outcome])});
 }
 const action=readToday(state),title=action?.task?.title||action?.title;
 const current=action&&action.type!=='member-choice'&&!action.awaitingWant&&safeText(title)&&Number.isFinite(at(action.preparedAt))&&at(action.preparedAt)<=now;
 const nextAction=current?{id:action.id,title,minutes:action.minutes,status:action.status,dataUsed:[...(action.dataUsed||[])]}:null;
 return{...empty,components:componentViews,weeklyAssessment:latest||null,change:latest&&prior?latest.rating-prior.rating:null,
  win:helped?{text:helped.title?'You said “'+helped.title+'” helped. Keep that useful step if it still fits.':'You marked your last action as done and helpful.',dataUsed:ids([helped]),at:helped.at}:null,
  whatMoved,whatDidnt,unknowns,next:nextAction?.title||null,nextAction,supportRequired:false};
}
