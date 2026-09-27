export class WorkError extends Error {constructor(message,status=400){super(message);this.status=status}}
export const requireWork=(ok,message,status=400)=>{if(!ok)throw new WorkError(message,status)};
export const NOTICE='work-pilot-2026-09-12-v1';
export const nowISO=()=>new Date().toISOString();
const date=v=>Number.isFinite(Date.parse(v+'T00:00:00Z'))&&typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export const clean=(v,max)=>{requireWork(typeof v==='string'&&v.trim().length<=max,'Invalid text field.');return v.trim()};
export const keys=(obj,allowed)=>requireWork(obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every(k=>allowed.includes(k)),'Unexpected fields.');
export function config(input){
 keys(input,['name','start','end','seats','feePence','scope','support','testingAllowancePence','reporterIds']);
 const c={name:clean(input.name,160),start:input.start,end:input.end,seats:input.seats,feePence:input.feePence??null,scope:clean(input.scope,1600),support:clean(input.support,600),testingAllowancePence:input.testingAllowancePence??null,reporterIds:input.reporterIds??[]};
 requireWork(c.name&&c.scope&&c.support,'Name, agreed deliverables and support limits are required.');
 requireWork(date(c.start)&&date(c.end)&&c.end>c.start,'Choose valid start and end dates.');
 requireWork(Date.parse(c.end)-Date.parse(c.start)===84*86400000,'The pilot runs for twelve weeks; the end date is exclusive.');
 requireWork(Number.isInteger(c.seats)&&c.seats>=1&&c.seats<=150,'Choose 1–150 pilot seats.');
 for(const v of [c.feePence,c.testingAllowancePence])requireWork(v===null||(Number.isSafeInteger(v)&&v>=0&&v<=100000000),'Use an agreed amount in pence or leave pricing unconfirmed.');
 requireWork(Array.isArray(c.reporterIds)&&c.reporterIds.length<=5&&c.reporterIds.every(x=>Number.isSafeInteger(x)&&x>0),'Use up to five verified employer contact account IDs.');c.reporterIds=[...new Set(c.reporterIds)];return c;
}
export function active(s,now=nowISO()){return s.status==='active'&&now>=s.config.start+'T00:00:00.000Z'&&now<s.config.end+'T00:00:00.000Z'}
export function canJoin(s,now=nowISO()){return s.status==='active'&&now<s.config.end+'T00:00:00.000Z'}
export function week(s,now=nowISO()){return Math.min(12,Math.max(0,Math.floor((Date.parse(now)-Date.parse(s.config.start+'T00:00:00Z'))/604800000)+1))}
export const member=(s,uid)=>s.members.find(m=>m.userId===uid&&!m.withdrawnAt);
export function memberView(s,uid,now=nowISO()){
 const m=member(s,uid);requireWork(m,'Workplace access not found.',404);
 return {employerId:s.id,name:s.config.name,start:s.config.start,end:s.config.end,status:s.status,scope:s.config.scope,support:s.config.support,active:active(s,now),week:week(s,now),revision:s.revision,joinedAt:m.joinedAt,completedWeeks:m.completedWeeks,noticeVersion:m.noticeVersion,testing:{available:false,message:'Home blood testing is not available. No test has been ordered.'}};
}
export function adminView(s){return {id:s.id,revision:s.revision,config:s.config,status:s.status,privacyReference:s.privacyReference??null,invites:s.invites.map(({hash,...i})=>i),report:s.report??null,candidateReport:!s.report&&nowISO()>=s.config.end+'T00:00:00.000Z'?closingReport(s):null,testing:{available:false},audit:s.audit}}
// One immutable closing report. No arbitrary filters, live counters or raw export.
// Do not present thresholds alone as proof of anonymity: contextual review is required.
export function closingReport(s,now=nowISO()){
 requireWork(now>=s.config.end+'T00:00:00.000Z','The pilot has not ended.',409);
 const ms=s.members.filter(m=>!m.withdrawnAt),n=ms.length;
 const withheld={status:'withheld',reason:'Insufficient safely reportable participation.'};
 const metric=count=>count>=10&&n-count>=10?{status:'reported',count:Math.floor(count/5)*5,precision:'Rounded down to five'}:withheld;
 return {employerId:s.id,programmeStart:s.config.start,programmeEnd:s.config.end,issuedAt:now,invitations:{status:'not-measured',reason:'Generic invitation codes do not measure invitations delivered.'},activations:n>=20&&s.config.seats-n>=10?{status:'reported',count:Math.floor(n/5)*5,precision:'Rounded down to five'}:withheld,engagement:n>=20?metric(ms.filter(m=>m.completedWeeks.length>=1).length):withheld,completion:n>=20?metric(ms.filter(m=>m.completedWeeks.length===12).length):withheld,wellbeing:{status:'not-collected',reason:'No health scores or clinical results are collected by this workplace module.'},definitions:{engagement:'At least one self-guided weekly review marked complete.',completion:'All twelve weekly reviews marked complete.'}};
}
export class WorkStore{
 constructor(db){this.db=db}
 async get(id){const r=await this.db.prepare('SELECT id,revision,state_json FROM work_employers WHERE id=?').bind(id).first();return r?{...JSON.parse(r.state_json),id:r.id,revision:r.revision}:null}
 async all(){const r=await this.db.prepare('SELECT id,revision,state_json FROM work_employers ORDER BY updated_at DESC').all();return r.results.map(x=>({...JSON.parse(x.state_json),id:x.id,revision:x.revision}))}
 async forUser(uid){const r=await this.db.prepare("SELECT id,revision,state_json FROM work_employers WHERE EXISTS (SELECT 1 FROM json_each(state_json,'$.members') m WHERE json_extract(m.value,'$.userId')=? AND json_extract(m.value,'$.withdrawnAt') IS NULL)").bind(uid).all();return r.results.map(x=>({...JSON.parse(x.state_json),id:x.id,revision:x.revision}))}
 async create(s){await this.db.prepare('INSERT INTO work_employers(id,revision,state_json,updated_at) VALUES(?,0,?,?)').bind(s.id,JSON.stringify(s),nowISO()).run();return s}
 async save(s,revision){const result=await this.db.prepare('UPDATE work_employers SET state_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(s),nowISO(),s.id,revision).run();requireWork(result.meta.changes===1,'This record changed. Reload and try again.',409);s.revision=revision+1;return s}
 async rate(uid,now=nowISO()){const window=Math.floor(Date.parse(now)/60000);const r=await this.db.prepare('INSERT INTO work_rate_limits(user_id,window,attempts) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET window=excluded.window,attempts=CASE WHEN work_rate_limits.window=excluded.window THEN work_rate_limits.attempts+1 ELSE 1 END RETURNING attempts').bind(uid,window).first();requireWork(r.attempts<=8,'Too many invitation attempts. Try again in a minute.',429)}
}
export async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
