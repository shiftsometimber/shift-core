import {PAIRS,VERSION} from './model.mjs';
export async function acquisitionBreakdown(DB,window,cohortSQL){
 const {results=[]}=await DB.prepare('PRAGMA table_info(audit_log)').all();
 if(!results.some(x=>x.name==='metadata'))return {available:false,reason:'Registration source evidence is unavailable; do not infer attribution.'};
 const pairs=Object.entries(PAIRS).flatMap(([source,media])=>media.map(m=>"(source='"+source+"' AND medium='"+m+"')")).join(' OR ');
 const sql=cohortSQL+`, raw_sources AS (
 SELECT a.user_id,a.created_at,CASE WHEN json_valid(a.metadata) THEN json_extract(a.metadata,'$.acquisition') END value
 FROM audit_log a WHERE a.action='auth.register' AND a.id=(SELECT MIN(z.id) FROM audit_log z WHERE z.user_id=a.user_id AND z.action='auth.register')
 ), candidates AS (
 SELECT user_id,created_at,json_extract(value,'$.source') source,json_extract(value,'$.medium') medium,value FROM raw_sources WHERE json_valid(value)
 ), attributed AS (
 SELECT user_id,source,medium FROM candidates
 WHERE json_extract(value,'$.version')='${VERSION}' AND json_extract(value,'$.consent')=1
 AND julianday(json_extract(value,'$.expiresAt'))>(SELECT asof FROM bounds)
 AND julianday(json_extract(value,'$.capturedAt'))<=julianday(created_at)+1.0/86400
 AND julianday(created_at)-julianday(json_extract(value,'$.capturedAt'))<=30
 AND julianday(json_extract(value,'$.consentAt'))<=julianday(json_extract(value,'$.capturedAt'))
 AND (${pairs})
 ) SELECT COALESCE(a.source,'unattributed') source,COALESCE(a.medium,'unknown') medium,
 COUNT(*) registered,COALESCE(SUM(s.verified IS NOT NULL),0) verified,COALESCE(SUM(s.signed_in IS NOT NULL),0) signed_in,
 COALESCE(SUM(s.first_save>=s.signed_in),0) activated
 FROM staged s LEFT JOIN attributed a ON a.user_id=s.id
 GROUP BY COALESCE(a.source,'unattributed'),COALESCE(a.medium,'unknown') ORDER BY registered DESC,source,medium`;
 const rows=(await DB.prepare(sql).bind(window.asOf,window.since).all()).results||[];
 const sources=rows.map(r=>({source:r.source,medium:r.medium,registered:Number(r.registered),verified:Number(r.verified),signedIn:Number(r.signed_in),activated:Number(r.activated),activationRatePct:r.registered?Math.round(r.activated/r.registered*10000)/100:null}));
 return {available:true,model:'First recognised consented touch within 30 days before registration; fixed to that account.',sources,attributedMembers:sources.filter(x=>x.source!=='unattributed').reduce((a,b)=>a+b.registered,0),unattributedMembers:sources.filter(x=>x.source==='unattributed').reduce((a,b)=>a+b.registered,0),limitations:['No historical backfill or cross-device matching.','No consent, unsupported tags, expired or deleted source records remain unattributed.','direct_or_unknown means no referring source was available, not proven direct acquisition.','Source tags are browser-supplied observations, not independently verified ad conversions.','Known synthetic accounts are excluded by the same cohort rules; unknown internal activity can remain.','Account-linked source data expires after 90 days; historical source breakdowns can therefore change.']};
}
