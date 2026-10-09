import {TEST_ACCOUNT_SQL,reportingWindow,activationScorecard} from '../activation-measurement/scorecard.mjs';
import {continuityScorecard} from '../continuity-measurement/scorecard.mjs';

const sourceRow=(rows,source)=>rows.find(r=>r.source===source)||{source,registered:0,verified:0,signedIn:0,activated:0,todayStarted:0};

export async function distributionScorecard(DB,options={}){
 const window=reportingWindow(options);
 const {results:tableRows=[]}=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
 const tables=new Set(tableRows.map(x=>x.name));
 const required=['users','user_auth','audit_log','member_status','product_events'];
 const missingTables=required.filter(name=>!tables.has(name));
 if(missingTables.length)return{available:false,...window,missingTables,reason:'Distribution account evidence is unavailable; missing data is not zero.'};
 const staff=tables.has('hq_users')?" AND NOT EXISTS(SELECT 1 FROM hq_users h WHERE lower(h.email)=lower(u.email))":'';
 const {results=[]}=await DB.prepare(`
  SELECT ms.source source,
   COUNT(DISTINCT ms.user_id) registered,
   COALESCE(SUM(CASE WHEN ua.email_verified=1 THEN 1 ELSE 0 END),0) verified,
   COALESCE(SUM(CASE WHEN EXISTS(
    SELECT 1 FROM audit_log l WHERE l.user_id=u.id AND l.action='auth.login'
     AND julianday(l.created_at)>=julianday(ms.created_at) AND julianday(l.created_at)<=julianday(?)
   ) THEN 1 ELSE 0 END),0) signed_in,
   COALESCE(SUM(CASE WHEN EXISTS(
    SELECT 1 FROM audit_log a WHERE a.user_id=u.id AND a.action IN ('my_journey.update','passport.add','passport.update')
     AND julianday(a.created_at)>=julianday(ms.created_at) AND julianday(a.created_at)<=julianday(?)
   ) THEN 1 ELSE 0 END),0) activated,
   COALESCE(SUM(CASE WHEN EXISTS(
    SELECT 1 FROM product_events e WHERE e.user_id=u.id AND e.event_name='continuity_today_exposed'
     AND e.source='member_client' AND julianday(e.occurred_at)>=julianday(ms.created_at) AND julianday(e.occurred_at)<=julianday(?)
   ) THEN 1 ELSE 0 END),0) today_started
  FROM member_status ms
  JOIN users u ON u.id=ms.user_id
  JOIN user_auth ua ON ua.user_id=u.id
  WHERE ms.source IN ('my-timber-support','my-timber-share')
   AND julianday(ms.created_at)>=julianday(?) AND julianday(ms.created_at)<julianday(?)
   AND NOT ${TEST_ACCOUNT_SQL}${staff}
  GROUP BY ms.source ORDER BY ms.source`).bind(window.asOf,window.asOf,window.asOf,window.since,window.asOf).all();
 const rows=results.map(r=>({source:r.source,registered:Number(r.registered||0),verified:Number(r.verified||0),signedIn:Number(r.signed_in||0),activated:Number(r.activated||0),todayStarted:Number(r.today_started||0)}));
 const support=sourceRow(rows,'my-timber-support'),shared=sourceRow(rows,'my-timber-share');
 const [activation,continuity]=await Promise.all([activationScorecard(DB,options),continuityScorecard(DB,options)]);
 return{
  available:true,version:'distribution-scorecard-v1',...window,
  registrations:{
   fromWeightLossSupport:support,
   fromSomeoneWhoCares:shared,
   total:support.registered+shared.registered
  },
  acquisition:activation.available?activation.acquisition:{available:false,reason:activation.reason||'Activation evidence unavailable.'},
  afterTreatment:continuity.available?continuity.afterTreatment:{available:false,reason:continuity.reason||'Continuity evidence unavailable.'},
  publicAnalytics:{
   source:'consented GA4',
   joinedToMembers:false,
   status:'separate_evidence',
   note:'Public support-page views and CTA clicks remain in consented GA4. This HQ report intentionally does not join anonymous browser events to member identities.'
  },
  privacy:'Aggregate owner/HQ reporting only. No member identities, health data, URLs, free text or provider records are returned.',
  limitations:[
   'A zero support/share registration count means no qualifying first-party registrations in this window; it does not mean zero page visits.',
   'GA4 public events are consented aggregate evidence and are not person-level attribution.',
   'Known synthetic/test and HQ accounts are excluded; unknown internal activity cannot be identified perfectly.',
   'Acquisition source records are optional, consented and expire under the existing attribution policy.'
  ]
 };
}
