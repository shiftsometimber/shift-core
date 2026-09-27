import {continuityScorecard} from './continuity-measurement/scorecard.mjs';
import {activationScorecard,reportingWindow,TEST_ACCOUNT_SQL} from './activation-measurement/scorecard.mjs';
const STEPS=['registration_started','registration_completed','onboarding_completed','today_viewed','feature_completed','progress_logged','member_returned'];
export async function memberJourneySnapshot(DB,options={}){
 const window=reportingWindow(options),activation=await activationScorecard(DB,options),continuity=await continuityScorecard(DB,options);
 const table=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_events'").first();
 if(!table||!activation.available)return {windowDays:window.days,asOf:window.asOf,steps:[],transitions:[],activation,continuity,privacy:'aggregate_only',interpretation:'Event evidence unavailable; no conversion rate inferred.'};
 const base=`FROM product_events e JOIN users u ON u.id=e.user_id WHERE julianday(e.occurred_at)>=(SELECT since FROM bounds) AND julianday(e.occurred_at)<(SELECT asof FROM bounds) AND e.source='server' AND NOT ${TEST_ACCOUNT_SQL}`;
 const steps=[];
 for(const event of STEPS){const row=await DB.prepare(`WITH bounds AS (SELECT julianday(?) since,julianday(?) asof) SELECT COUNT(*) events,COUNT(DISTINCT e.user_id) members ${base} AND e.event_name=?`).bind(window.since,window.asOf,event).first();steps.push({event,events:Number(row?.events||0),members:Number(row?.members||0)});}
 const transitions=[];
 for(let i=1;i<steps.length;i++){
  const from=steps[i-1],to=steps[i];
  const row=await DB.prepare(`WITH bounds AS (SELECT julianday(?) since,julianday(?) asof), first_step AS (SELECT e.user_id,MIN(julianday(e.occurred_at)) started ${base} AND e.event_name=? GROUP BY e.user_id) SELECT COUNT(*) members FROM first_step f WHERE EXISTS(SELECT 1 FROM product_events n WHERE n.user_id=f.user_id AND n.event_name=? AND n.source='server' AND julianday(n.occurred_at)>=f.started AND julianday(n.occurred_at)<(SELECT asof FROM bounds))`).bind(window.since,window.asOf,from.event,to.event).first();
  const paired=Number(row?.members||0);
  transitions.push({from:from.event,to:to.event,fromMembers:from.members,toMembers:paired,observedConversionPct:from.members?paired/from.members*100:null,basis:'Same account, ordered server-recorded events within this window; pairwise, not a cumulative funnel.'});
 }
 return{windowDays:window.days,asOf:window.asOf,steps,transitions,activation,continuity,privacy:'aggregate_only',interpretation:'Known commissioning accounts and browser-reported events excluded. Historical registration_started is emitted on successful creation, so it cannot measure abandoned registrations. Activation reports account onboarding only. Use continuity for first-Today cohorts and meaningful saved-action return rates. No causal or clinical outcome claim.'};
}
