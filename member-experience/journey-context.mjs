import {summary,lifeBackState} from './life-back/model.mjs';
export function ukDate(at=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(at)}
export async function connectedDay(DB,userId,prefs,date=ukDate()){
 if(!prefs){const row=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();prefs=JSON.parse(row?.preferences||'{}')}
 const choice=prefs.grubV2?.today,meal=choice?.date===date?choice:null;
 const activity=Object.values(prefs.fitJourney?.entries||{}).filter(e=>e.recordedOn?e.recordedOn===date:Number.isFinite(Date.parse(e.updatedAt))&&ukDate(new Date(e.updatedAt))===date);
 const progress=prefs.lifeBack?.progress,state=lifeBackState(progress),s=summary(state),last=state.entries.filter(e=>e.goalId===state.goalId).at(-1);
 const mood=await DB.prepare('SELECT wellbeing_score,notes,submitted_at FROM check_ins WHERE user_id=? AND case_id IS NULL ORDER BY id DESC LIMIT 1').bind(userId).first();
 const done=activity.filter(e=>e.status==='done').length,skipped=activity.filter(e=>e.status==='skipped').length,checkedToday=!!last&&ukDate(new Date(last.at))===date;
 const next=!meal?{title:'Choose your next meal',detail:'Pick a reviewed recipe and choose it for today.',href:'/member/grub',label:'Open Grub'}:done===0?{title:'Make room for movement',detail:'Your saved time, equipment and limitations stay in place.',href:'/member/fit',label:'Open Fit'}:!checkedToday?{title:'How are you feeling now?',detail:'Your movement is recorded. Add a Life Back reflection when it suits you.',href:'/member/life-back#check-in',label:'Add a check-in'}:{title:'Notice what you’re getting back',detail:'Your choices and latest reflection are saved. You can return whenever you want.',href:'/member/life-back',label:'See Life Back'};
 return {date,meal,weekMeals:prefs.grubV2?.week?.length||0,movement:{done,skipped},lifeBack:{score:s.score,change:s.change,at:last?.at||null,win:state.win,goal:state.goal,entries:state.entries.length},mood:mood?{label:['Tough day','Struggling','OK','Good','Brilliant'][mood.wellbeing_score-1],at:mood.submitted_at}:null,next};
}
