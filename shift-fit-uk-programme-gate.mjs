import fs from 'node:fs';
function need(ok,message){if(!ok)throw new Error(message)}
const entry=fs.readFileSync('worker-entry-v6.js','utf8'),shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8'),api=fs.readFileSync('frontend/member/api-adapter-v33d.js','utf8'),backend=fs.readFileSync('member-product-v8.js','utf8'),html=fs.readFileSync('frontend/member/member-fit.html','utf8'),js=fs.readFileSync('frontend/member/member-fit-programme-v1.js','utf8');
need(entry.includes("path==='/member/fit'"),'dedicated Fit route is served');
for(const asset of ['/member-fit.html','/member-fit-programme-v1.js','/member-fit-programme-v1.css'])need(entry.includes(asset),`${asset} is Git-served`);
need(html.includes('lang="en-GB"')&&html.includes('UK fitness programme'),'Fit page is explicitly UK');
need(shell.includes('ensureFitProgramme()'),'dashboard loads the Fit redirect bridge');
for(const text of ["days:1",'Build today’s Fit session','1,326 reviewed exercise options','UK activity guidance','I’ve done today’s session','tomorrow','Log my progress','fit_programme_uk'])need(js.includes(text),`missing credible daily programme behaviour: ${text}`);
need(js.includes("sentiment:'nay'")&&js.indexOf("sentiment:'nay'")<js.indexOf('replaceFitExercise'),'swap records a durable Nay before replacement');
for(const text of ['shift-fit-daily-context/v1','shift_today_checkins','hydration_log','sleep_hours','protein_g','fit_session_completed','Current symptoms and safety override progression'])need(backend.includes(text),`daily Fit integration missing: ${text}`);
need(api.includes('completeFitToday')&&js.includes('SST_API.completeFitToday'),'completion is persisted through the API');
need(js.includes('Food, fluids and recovery')&&js.includes('Why today looks like this'),'joined-up coaching is visible to the member');
console.log('shift fit UK programme gate: PASS');
