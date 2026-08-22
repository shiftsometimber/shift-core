import fs from 'node:fs';
function need(ok,message){if(!ok)throw new Error(message)}
const entry=fs.readFileSync('worker-entry-v6.js','utf8'),shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8'),api=fs.readFileSync('frontend/member/api-adapter-v33d.js','utf8'),backend=fs.readFileSync('member-product-v8.js','utf8'),daily=fs.readFileSync('member-daily-v3.js','utf8'),html=fs.readFileSync('frontend/member/member-fit.html','utf8'),js=fs.readFileSync('frontend/member/member-fit-programme-v1.js','utf8'),grub=fs.readFileSync('frontend/member/member-grub-programme-v1.js','utf8');
need(entry.includes("path==='/member/fit'"),'dedicated Fit route is served');
for(const asset of ['/member-fit.html','/member-fit-programme-v1.js','/member-fit-programme-v1.css'])need(entry.includes(asset),`${asset} is Git-served`);
need(html.includes('lang="en-GB"')&&html.includes('UK fitness programme'),'Fit page is explicitly UK');
need(shell.includes('ensureFitProgramme()'),'dashboard loads the Fit redirect bridge');
for(const text of ["days:1",'Start today’s movement','1,326 reviewed exercise options','UK activity guidance','I’ve done today’s session','tomorrow','Log my progress','fit_programme_uk'])need(js.includes(text),`missing credible daily programme behaviour: ${text}`);
need(js.includes("sentiment:'nay'")&&js.indexOf("sentiment:'nay'")<js.indexOf('replaceFitExercise'),'swap records a durable Nay before replacement');
for(const text of ['shift-fit-daily-context/v2','/v1/shift/daily-plan','today_plan','shift_today_checkins','hydration_log','sleep_hours','protein_g','fit_session_completed','Current symptoms and safety override progression'])need(backend.includes(text),`daily Fit integration missing: ${text}`);
for(const text of ['activitySummary','trained_yesterday','showing_up_streak','moderate_minutes:150','strength_days:2','progression'])need(backend.includes(text),`safe progression layer missing: ${text}`);
need(api.includes('completeFitToday')&&js.includes('SST_API.completeFitToday'),'completion is persisted through the API');
need(js.includes('Food, fluids and recovery')&&js.includes('Why today looks like this'),'joined-up coaching is visible to the member');
need(js.includes('Your movement picture')&&js.includes('Progression today:')&&js.includes('showing-up streak'),'weekly progress and progression are visible');
for(const text of ['YOUR DAILY SHIFT','MOVEMENT','GRUB','FLUIDS','RECOVERY','Why has Shift chosen this?'])need(js.includes(text)&&grub.includes(text),`shared Daily Shift missing across Fit and Grub: ${text}`);
need(api.includes('getDailyShift')&&js.includes('SST_API.getDailyShift()')&&grub.includes('SST_API.getDailyShift()'),'Fit and Grub consume one Daily Shift contract');
need(daily.includes("choiceKey==='programme'")&&grub.includes('saveShiftTodayGrub'),'a kept Grub meal becomes shared daily context');
console.log('shift fit UK programme gate: PASS');
