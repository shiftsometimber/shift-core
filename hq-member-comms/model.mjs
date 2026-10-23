import {calendar} from '../mental-health-pathway/member/model.mjs';
export const FROM='hq@shiftsometimber.co.uk',REPLY='hello@shiftsometimber.co.uk';
export const PUSH={title:'My Timber update',body:'You have an update in My Timber. Open the app when you’re ready.',url:'/member/notifications'};
export const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
export const ddl=[
`CREATE TABLE IF NOT EXISTS hq_comms_drafts(id TEXT PRIMARY KEY,hash TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',scheduled_at TEXT NOT NULL,created_by INTEGER NOT NULL,approved_by INTEGER,created_at TEXT NOT NULL,approved_at TEXT,cancelled_at TEXT)`,
`CREATE TABLE IF NOT EXISTS hq_comms_recipients(draft_id TEXT NOT NULL,email TEXT NOT NULL,user_id INTEGER,status TEXT NOT NULL DEFAULT 'pending',provider_id TEXT,error_code TEXT,at TEXT,read_at TEXT,PRIMARY KEY(draft_id,email),FOREIGN KEY(draft_id) REFERENCES hq_comms_drafts(id))`,
`CREATE TABLE IF NOT EXISTS hq_comms_devices(endpoint TEXT PRIMARY KEY,user_id INTEGER NOT NULL,session_id TEXT NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,consented_at TEXT NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS hq_comms_push_receipts(draft_id TEXT NOT NULL,endpoint TEXT NOT NULL,status TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(draft_id,endpoint))`,
`CREATE TABLE IF NOT EXISTS hq_comms_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,draft_id TEXT,actor_id INTEGER,action TEXT NOT NULL,at TEXT NOT NULL)`];
const clean=(s,max)=>{if(typeof s!=='string'||s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s))fail('invalid_text');return s.trim()};
export function validate(body,now){
 if(!body||Array.isArray(body)||Object.keys(body).some(k=>!['channel','recipients','subject','body','scheduledAt','calendarAt','serviceOnly'].includes(k)))fail('invalid_request');
 if(!['email','notification'].includes(body.channel)||body.serviceOnly!==true)fail('service_messages_only');
 if(!Array.isArray(body.recipients)||body.recipients.length<1||body.recipients.length>25)fail('choose_1_to_25_recipients');
 const recipients=[...new Set(body.recipients.map(x=>clean(x,254).toLowerCase()))];
 if(recipients.some(x=>! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(x)||/[\r\n]/.test(x)))fail('invalid_email');
 const subject=clean(body.subject,160),text=clean(body.body,12000);if(!subject||!text||/[\r\n]/.test(subject))fail('subject_and_body_required');
 const date=(s,optional)=>{if(!s&&optional)return null;const ms=Date.parse(s);if(typeof s!=='string'||!Number.isFinite(ms)||ms<now.getTime()-60000||ms>now.getTime()+90*86400000)fail('choose_time_within_90_days');return new Date(ms).toISOString()};
 const scheduledAt=body.scheduledAt?date(body.scheduledAt):now.toISOString(),calendarAt=date(body.calendarAt,true);if(calendarAt&&calendarAt<scheduledAt)fail('calendar_must_follow_send_time');return{channel:body.channel,recipients,subject,body:text,scheduledAt,calendarAt};
}
export const hash=async value=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')};
export function attachment(at,id,stamp){if(!at)return null;return{filename:'My-Timber-reminder.ics',type:'text/calendar; charset=utf-8',text:calendar({reminder:{at,id}},stamp).replace('URL:https://shiftsometimber.co.uk/member/support','URL:https://shiftsometimber.co.uk/member/notifications').replace('Open My Timber to review the next step you chose.','Open My Timber to review your update.')};}
export function emailMessage(payload,to){const message={from:{email:FROM,name:'SHIFT Some Timber'},replyTo:REPLY,to,subject:payload.subject,text:payload.body};if(payload.attachment)message.attachments=[{filename:payload.attachment.filename,type:payload.attachment.type,content:btoa(payload.attachment.text),disposition:'attachment'}];return message;}
