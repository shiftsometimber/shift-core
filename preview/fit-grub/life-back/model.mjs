export const areas = [
 {id:'energy',label:'Energy',icon:'sun',description:'Getting through the day without crashing.',prompt:'How is your energy right now?'},
 {id:'sleep',label:'Sleep',icon:'moon',description:'Waking up feeling more rested.',prompt:'How rested do you feel right now?'},
 {id:'confidence',label:'Confidence',icon:'sparkles',description:'Feeling more like yourself again.',prompt:'How confident do you feel right now?'},
 {id:'movement',label:'Movement',icon:'footprints',description:'Feeling stronger and more capable.',prompt:'How comfortable does everyday movement feel right now?'},
 {id:'clothes',label:'Clothes',icon:'shirt',description:'More comfort in what you wear.',prompt:'How comfortable do you feel in your clothes right now?'},
 {id:'personal',label:'Playing with the kids',icon:'heart',description:'More present. More moments.',prompt:'How close do you feel to your personal goal right now?'}
];
export const sample = {
 goalId:'sample-family',
 ratings:{energy:72,sleep:64,confidence:70,movement:66,clothes:60,personal:75},
 previous:{energy:60,sleep:56,confidence:61,movement:59,clothes:50,personal:66},
 goal:'Playing with the kids',win:'Walked my son to football without stopping.',
 winDate:'15 September',next:'Make time for another walk together this weekend.'
};
export const goalChoices=['Playing with the kids','Walking the dog','Enjoying a weekend away','Getting back to a hobby','Feeling comfortable in my clothes'];
export function score(ratings){
 const values=areas.map(a=>ratings[a.id]);
 if(values.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))return null;
 return values.reduce((sum,v)=>sum+v,0)/values.length;
}
export function summary(state){
 const current=score(state.ratings),previous=score(state.previous);
 return {score:current===null?null:Math.round(current),change:current===null||previous===null?null:Math.round(current-previous)};
}
export function recordCheckin(state,ratings,win,at=new Date().toISOString()){
 if(score(ratings)===null||Object.values(ratings).some(v=>!Number.isInteger(v)))throw Error('Rate all six areas with a whole number from 0 to 100, or keep your answers as a draft.');
 if(!Number.isFinite(Date.parse(at)))throw Error('A valid check-in time is required.');
 const clean=String(win||'').trim().slice(0,180);
 const entry={id:'entry-'+at+'-'+state.entries.length,at,goalId:state.goalId,goal:state.goal,ratings:{...ratings},win:clean};
 return {...state,previous:{...state.ratings},ratings:{...ratings},win:clean||state.win,entries:[...state.entries,entry]};
}
export function setGoal(state,goal){
 const clean=String(goal||'').trim();if(!clean||clean.length>70)throw Error('Choose a goal or write one in 70 characters or fewer.');
 if(clean===state.goal)return state;
 const blank=Object.fromEntries(areas.map(a=>[a.id,null]));
 return {...state,goalId:'personal-'+((state.goalRevision||0)+1),goalRevision:(state.goalRevision||0)+1,goal:clean,ratings:{...blank},previous:{...blank}};
}
export function dailyTrend(entries,goalId){
 const grouped=new Map(),formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
 for(const e of entries){const value=score(e.ratings);if(e.goalId!==goalId||value===null)continue;const parts=Object.fromEntries(formatter.formatToParts(new Date(e.at)).map(p=>[p.type,p.value]));const key=parts.year+'-'+parts.month+'-'+parts.day;const g=grouped.get(key)||{sum:0,count:0};g.sum+=value;g.count++;grouped.set(key,g)}
 return [...grouped].sort(([a],[b])=>a.localeCompare(b)).map(([day,g])=>({day,value:g.sum/g.count,count:g.count,label:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Europe/London'}).format(new Date(day+'T12:00:00Z'))}));
}
sample.entries=[
 {at:'2026-09-08T18:15:00Z',ratings:sample.previous,win:'More patience. Less snapping.'},
 {at:'2026-09-10T17:45:00Z',ratings:{energy:64,sleep:57,confidence:65,movement:60,clothes:52,personal:67},win:''},
 {at:'2026-09-11T19:10:00Z',ratings:{energy:65,sleep:59,confidence:64,movement:62,clothes:55,personal:68},win:''},
 {at:'2026-09-12T18:30:00Z',ratings:{energy:68,sleep:61,confidence:67,movement:64,clothes:57,personal:71},win:'Took the longer route home.'},
 {at:'2026-09-14T18:30:00Z',ratings:sample.previous,win:'A tired day. Still made time for a walk.'},
 {at:'2026-09-15T18:15:00Z',ratings:sample.ratings,win:sample.win}
].map((e,i)=>({...e,id:'sample-'+i,goalId:sample.goalId,goal:sample.goal,ratings:{...e.ratings}}));
