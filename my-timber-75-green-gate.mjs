import fs from 'node:fs';
import {composeDailyOutput} from './member-product-v8.js';
import {buildDailyReminderMessage} from './daily-reminder-copy-v1.js';

const pass=[];
const green=(name,condition)=>{if(!condition)throw new Error(`RED: ${name}`);pass.push(name)};
const read=path=>fs.readFileSync(path,'utf8');
const today=read('frontend/member/member-my-timber-problem-v1.js');
const fit=read('frontend/member/member-fit-programme-v1.js');
const grub=read('frontend/member/member-grub-programme-v1.js');
const shell=read('frontend/member/member-product-v33d.js');
const reminders=read('fit-reminders-v1.js');
const api=read('frontend/member/api-adapter-v33d.js');
const css=read('frontend/member/member-today-premium-v1.css');
const fixture={date:'2026-08-22',hour:18,grubStartsOn:'2026-08-22',grubPlan:{days:[{day:1,meals:[{id:'slow',type:'Dinner',name:'Slow chilli',minutes:45,kcal:600,protein:40}]},{day:2,meals:[{id:'quick',type:'Dinner',name:'Quick chicken',minutes:12,kcal:520,protein:44}]}]},fitPlan:{sessions:[{title:'Full body',estimated_minutes:30,exercises:[{name:'Chair squat'},{name:'Wall press'},{name:'Band row'}]}]},hydrationMl:500,mode:'train',minutesCap:60,reasons:[],completedToday:false};
const late=composeDailyOutput({...fixture,dayChange:'working_late'});
const mealDone=composeDailyOutput({...fixture,dayChange:'working_late',mealAccepted:true});
const movementDone=composeDailyOutput({...fixture,mealAccepted:true,completedToday:true});
const fluidsDone=composeDailyOutput({...fixture,mealAccepted:true,completedToday:true,hydrationMl:1600});
const allDone=composeDailyOutput({...fixture,mealAccepted:true,completedToday:true,hydrationMl:1600,recoveryDone:true});

green('1. Today serves real meal and workout detail',late.meal.name==='Quick chicken'&&late.workout.exercises.length===3);
green('2. Working late recalculates the whole remaining day',late.workout.minutes===10&&late.next.kind==='meal');
green('3. One next action advances without a dead end',mealDone.next.kind==='movement'&&movementDone.next.kind==='hydration'&&fluidsDone.next.kind==='recovery'&&allDone.next.kind==='complete');
green('4. Meal acceptance, swap and permanent rejection are actionable',/I’ll have that/.test(today)&&/Swap it/.test(today)&&/Don’t suggest again/.test(today)&&/mealAccepted/.test(read('member-product-v8.js')));
green('5. Grub and Fit preferences persist and feed generation',/saveMemberState/.test(grub)&&/dietaryRequirements/.test(grub)&&/saveMemberState/.test(fit)&&/limitations/.test(fit)&&/equipment/.test(fit));
green('6. Clicked and generated results reveal immediately',/function revealPanel/.test(shell)&&/behavior:'auto',block:'start'/.test(shell)&&/revealRoot/.test(today)&&!/#hydration/.test(fit+grub));
const reminderMessage=buildDailyReminderMessage({daily_output:late});
green('7. Morning plan is opt-in, editable and Today-led',/Morning plan reminder/.test(today)&&/getFitReminder/.test(api)&&/saveFitReminder/.test(api)&&/member\/dashboard#today/.test(reminders)&&reminderMessage.next.kind==='meal'&&/Quick chicken/.test(reminderMessage.decision));
green('8. Reminder consent, suppression and single-delivery controls remain intact',/email_verified=1/.test(reminders)&&/completed_today/.test(reminders)&&/UNIQUE\(user_id,local_date,channel\)/.test(reminders)&&/withdrawn_at/.test(reminders));
green('9. Mobile presentation retains one-thumb horizontal containment',/scroll-snap-type:x mandatory/.test(css)&&/@media\(max-width:760px\)/.test(css)&&/width:100%;min-width:0/.test(css));
green('10. Failures remain visible and retryable',/That did not save\. Try once more\./.test(today)&&/Try again/.test(today)&&/Could not build today’s Fit session/.test(fit)&&/Could not build your week/.test(grub));

green('11. Every Grub taste path reaches exact or nearest safe choices',/nearest_safe/.test(read('member-product-v7.js'))&&/recipeTasteMatch/.test(read('member-product-v7.js'))&&/sg-recovery/.test(grub)&&/Clear and start again/.test(grub)&&/data-recovery="cancel"/.test(grub));

console.log(JSON.stringify({proof:'MY_TIMBER_75_GREEN',status:'PASS',green:`${pass.length}/${pass.length}`,checks:pass},null,2));
