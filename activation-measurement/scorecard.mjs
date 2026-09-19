import {acquisitionBreakdown} from '../acquisition-activation/report.mjs';
// Owner/HQ-only aggregate reporting. No new tracking, tables or customer writes.
// Read source-of-truth account and audit records, not browser-reported conversions.
export const TEST_ACCOUNT_SQL = `(EXISTS(SELECT 1 FROM audit_log test WHERE test.user_id=u.id AND test.action IN ('auth.commissioning_identity_verified','auth.commissioning_login_verified')) OR lower(u.email) LIKE '%@example.invalid' OR lower(u.email) LIKE '%@example.test' OR lower(u.email) GLOB 'shiftsometimber+finish-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+longitudinal-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+b03-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+structured-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+structured-authrender-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+sport-*@gmail.com' OR lower(u.email) GLOB 'shiftsometimber+safety-*@gmail.com')`;
const REQUIRED=['users','user_auth','audit_log'];
export function reportingWindow({days=30,now=Date.now()}={}){
 const end=new Date(now);if(!Number.isFinite(end.getTime()))throw Error('invalid_reporting_clock');
 const n=Number(days);days=Number.isFinite(n)?Math.max(1,Math.min(365,Math.trunc(n))):30;
 return {days,asOf:end.toISOString(),since:new Date(end.getTime()-days*86400000).toISOString()};
}
const percentage=(n,d)=>d?Math.round(n/d*10000)/100:null;
export const COHORT_CTE=`WITH bounds AS (SELECT julianday(?) asof,julianday(?) since), cohort AS (
 SELECT u.id,julianday(u.created_at) joined,
 CASE WHEN a.email_verified=1 AND julianday(a.email_verified_at)>=julianday(u.created_at) AND julianday(a.email_verified_at)<=(SELECT asof FROM bounds) THEN julianday(a.email_verified_at) END verified
 FROM users u JOIN user_auth a ON a.user_id=u.id
 WHERE julianday(u.created_at)>=(SELECT since FROM bounds) AND julianday(u.created_at)<(SELECT asof FROM bounds) AND NOT ${TEST_ACCOUNT_SQL}
 ), logins AS (
 SELECT c.id,MIN(julianday(l.created_at)) signed_in
 FROM cohort c JOIN audit_log l ON l.user_id=c.id AND l.action='auth.login'
 WHERE julianday(l.created_at)>=c.verified AND julianday(l.created_at)<=(SELECT asof FROM bounds)
 GROUP BY c.id
 ), staged AS (
 SELECT c.id,c.joined,c.verified,l.signed_in,
 MIN(CASE WHEN r.action IN ('my_journey.update','passport.add','passport.update') AND julianday(r.created_at)>=l.signed_in THEN julianday(r.created_at) END) first_save,
 MAX(CASE WHEN julianday(r.created_at)>=c.joined+1 AND julianday(r.created_at)<c.joined+8 THEN 1 ELSE 0 END) week1_return,
 MAX(CASE WHEN julianday(r.created_at)>=c.joined+21 AND julianday(r.created_at)<c.joined+28 THEN 1 ELSE 0 END) week4_return
 FROM cohort c LEFT JOIN logins l ON l.id=c.id
 LEFT JOIN audit_log r ON r.user_id=c.id AND r.action IN ('auth.login','my_journey.update','passport.add','passport.update')
 AND julianday(r.created_at)>=c.verified AND julianday(r.created_at)<=(SELECT asof FROM bounds)
 GROUP BY c.id,c.joined,c.verified,l.signed_in
 )`;
export async function activationScorecard(DB,options={}){
 const window=reportingWindow(options);
 const {results=[]}=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','user_auth','audit_log')").all();
 const missingTables=REQUIRED.filter(name=>!results.some(x=>x.name===name));
 if(missingTables.length)return {available:false,missingTables,...window,reason:'Missing evidence is not zero conversions.'};
 // julianday normalises ISO-Z and SQLite timestamps; string comparison would
 // misclassify records within the same day. All stages are bound to this cohort.
 const sql=COHORT_CTE+` SELECT COUNT(*) registered,
 COALESCE(SUM(verified IS NOT NULL),0) verified,
 COALESCE(SUM(signed_in IS NOT NULL),0) signed_in,
 COALESCE(SUM(signed_in IS NOT NULL AND first_save>=signed_in),0) first_save,
 COALESCE(SUM((SELECT asof FROM bounds)>=joined+8),0) week1_eligible,
 COALESCE(SUM((SELECT asof FROM bounds)>=joined+8 AND week1_return=1),0) week1_returned,
 COALESCE(SUM((SELECT asof FROM bounds)>=joined+28),0) week4_eligible,
 COALESCE(SUM((SELECT asof FROM bounds)>=joined+28 AND week4_return=1),0) week4_returned
 FROM staged`;
 const row=await DB.prepare(sql).bind(window.asOf,window.since).first();
 const excluded=await DB.prepare(`SELECT COUNT(*) count FROM users u JOIN user_auth a ON a.user_id=u.id WHERE julianday(u.created_at)>=julianday(?) AND julianday(u.created_at)<julianday(?) AND ${TEST_ACCOUNT_SQL}`).bind(window.since,window.asOf).first();
 const counts=Object.fromEntries(Object.entries(row||{}).map(([k,v])=>[k,Number(v||0)]));
 const stages=[['account_created','registered'],['email_verified','verified'],['signed_in','signed_in'],['first_successful_save','first_save']].map(([name,key])=>({name,members:counts[key],percentOfRegistered:percentage(counts[key],counts.registered)}));
 return {available:true,version:'activation-cohort-v1',...window,stages,acquisition:await acquisitionBreakdown(DB,window,COHORT_CTE),
  retention:{week1:{eligible:counts.week1_eligible,returned:counts.week1_returned,ratePct:percentage(counts.week1_returned,counts.week1_eligible),window:'Days 1–7 after registration; denominator needs eight complete days.'},week4:{eligible:counts.week4_eligible,returned:counts.week4_returned,ratePct:percentage(counts.week4_returned,counts.week4_eligible),window:'Days 21–27 after registration; denominator needs 28 complete days.'}},
  excludedKnownTestAccounts:Number(excluded?.count||0),sampleWarning:counts.registered<20?'Small cohort: operational counts, not reliable evidence of programme effectiveness.':null,
  privacy:'Aggregate owner/HQ reporting only. No identities, URLs, health values or notes returned; no third-party transmission.',
  limitations:['Unknown staff/test accounts are not magically identifiable and may remain.','Returns count authenticated logins and successful Journey/Passport writes, not all passive browsing.','Deleted accounts are absent; audit retention or erasure can reduce historical counts.','First save requires a successful stored-record audit after an observed verified login; missing historical audit entries can undercount it, and it is not a health outcome.','Anonymous Start Here completion is not available. Acquisition attribution is prospective, optional and source/medium only; it is not a full marketing attribution model.']};
}
