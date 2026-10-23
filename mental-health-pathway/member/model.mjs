export const CONSENT='good_to_talk_followthrough';
export const STEPS={read:'Read about getting support',prepare:'Prepare for a conversation',gp:'Contact my GP',service:'Contact a support service',review:'Review my next step'};
export const STATUSES={not_contacted:'Not contacted yet',waiting:'Waiting for a response',appointment:'Appointment arranged',receiving:'Receiving support',complete:'Step complete'};
export const ddl=[`CREATE TABLE IF NOT EXISTS my_timber_support_steps(user_id INTEGER PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,state_json TEXT,operation_id TEXT,operation_hash TEXT,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,`CREATE TABLE IF NOT EXISTS my_timber_support_devices(endpoint TEXT PRIMARY KEY,user_id INTEGER NOT NULL,session_id TEXT NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,consented_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,`CREATE TABLE IF NOT EXISTS my_timber_support_deliveries(endpoint TEXT NOT NULL,reminder_id TEXT NOT NULL,status TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(endpoint,reminder_id),FOREIGN KEY(endpoint) REFERENCES my_timber_support_devices(endpoint) ON DELETE CASCADE)`];
export const fail=(code,status=400)=>{throw Object.assign(Error(code),{status})};
export function validate(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['step','status','reminderAt','consent','revision','operationId'].includes(k)))fail('invalid_request');
 if(!Object.hasOwn(STEPS,input.step)||!Object.hasOwn(STATUSES,input.status))fail('invalid_step');
 if(input.consent!==true)fail('support_consent_required',409);
 if(!Number.isSafeInteger(input.revision)||input.revision<0||!/^[-\w]{16,80}$/.test(input.operationId||''))fail('invalid_revision');
 let at=null;
 if(input.reminderAt!==null){const date=Date.parse(input.reminderAt);if(typeof input.reminderAt!=='string'||!Number.isFinite(date)||date<=now.getTime()||date>now.getTime()+90*86400000)fail('choose_future_reminder_within_90_days');at=new Date(date).toISOString();}
 if(input.status==='complete')at=null;
 return{step:input.step,status:input.status,reminderAt:at};
}
export const decode=row=>row?.state_json?JSON.parse(row.state_json):null;
export const publicState=row=>({revision:row?.revision||0,state:decode(row)});
export function nextState(old,body,at,now=new Date()){
 return{step:body.step,status:body.status,consentedAt:old?.consentedAt||now.toISOString(),reminder:at?{at,id:old?.reminder?.at===at?old.reminder.id:crypto.randomUUID()}:null};
}
export function validEndpoint(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.port&&u.href.length<2048&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'))}catch{return false}}
export function validKey(value,n){try{return typeof value==='string'&&/^[\w-]+$/.test(value)&&Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='))).length===n}catch{return false}}
export function calendar(state){
 if(!state?.reminder)fail('no_reminder',409);
 const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SHIFT Some Timber//My Timber//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+state.reminder.id+'@shiftsometimber.co.uk','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(state.reminder.at),'DURATION:PT5M','SUMMARY:My Timber reminder','DESCRIPTION:Open My Timber to review the next step you chose.','URL:https://shiftsometimber.co.uk/member/support','CLASS:PRIVATE','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:My Timber reminder','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
