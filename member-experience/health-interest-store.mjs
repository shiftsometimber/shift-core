// One atomic, consent-checked write against the current stored JSON.
// No read/merge/write cycle: concurrent additions cannot overwrite one another.
export const HEALTH_INTERESTS=new Set(['health-mot','testosterone-energy','blood-pressure-monitor','digital-scales','resistance-bands','shift-measure','erectile-dysfunction','hair-loss','stop-smoking','sleep-apnoea']);
export const normaliseHealthInterest=value=>typeof value==='string'&&HEALTH_INTERESTS.has(value.trim().toLowerCase())?value.trim().toLowerCase():'';
const CONSENT="COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1),0)=1";
const P='member_state.preferences';
const ROOT=`CASE WHEN json_type(${P},'$.myJourney')='object' THEN ${P} ELSE json_set(${P},'$.myJourney',json('{}')) END`;
const ARRAY=`CASE WHEN json_type(${P},'$.myJourney.healthInterests')='array' THEN ${P} ELSE json_set(${ROOT},'$.myJourney.healthInterests',json('[]')) END`;
export const ADD_HEALTH_INTEREST_SQL=`INSERT INTO member_state(user_id,preferences,updated_at)
 SELECT ?,json_object('myJourney',json_object('healthInterests',json_array(?))),? WHERE ${CONSENT}
 ON CONFLICT(user_id) DO UPDATE SET
 preferences=CASE WHEN EXISTS(SELECT 1 FROM json_each(${ARRAY},'$.myJourney.healthInterests') WHERE value=?) THEN ${P}
 ELSE json_insert(${ARRAY},'$.myJourney.healthInterests[#]',?) END,
 updated_at=excluded.updated_at
 WHERE ${CONSENT}
 AND CASE WHEN json_valid(${P}) THEN json_type(${P})='object' ELSE 0 END
 AND (json_type(${P},'$.myJourney') IS NULL OR json_type(${P},'$.myJourney')='object')
 AND (json_type(${P},'$.myJourney.healthInterests') IS NULL OR json_type(${P},'$.myJourney.healthInterests')='array')
 AND COALESCE(json_array_length(${P},'$.myJourney.healthInterests'),0)<=10`;
// Every ordinary Journey update retains this endpoint-owned branch from the
// live database, even when the editor's browser contains an older Journey.
export const OWNED_JOURNEY_SQL=`CASE WHEN json_type(member_state.preferences,'$.myJourney.healthInterests')='array' THEN json_set(json_extract(excluded.preferences,'$.myJourney'),'$.healthInterests',json_extract(member_state.preferences,'$.myJourney.healthInterests')) ELSE json_remove(json_extract(excluded.preferences,'$.myJourney'),'$.healthInterests') END`;
export async function saveHealthInterest(DB,userId,value,at=new Date().toISOString()){
 const slug=normaliseHealthInterest(value);
 if(!Number.isSafeInteger(userId)||userId<=0)throw Object.assign(Error('Invalid member.'),{status:401,code:'authentication_required'});
 if(!slug)throw Object.assign(Error('Choose a recognised SHIFT Health pathway.'),{status:400,code:'invalid_health_interest'});
 const result=await DB.prepare(ADD_HEALTH_INTEREST_SQL).bind(userId,slug,at,userId,slug,slug,userId).run();
 if(result.meta?.changes!==1)throw Object.assign(Error('The priority was not saved. Check optional health tracking and reload your Journey.'),{status:409,code:'health_priority_not_saved'});
 const row=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
 const preferences=JSON.parse(row?.preferences||'{}');
 const interests=preferences.myJourney?.healthInterests;
 if(!Array.isArray(interests)||!interests.includes(slug))throw Object.assign(Error('The save could not be verified. Reload your Journey before retrying.'),{status:409,code:'health_priority_save_unverified'});
 return {ok:true,interest:slug,healthInterests:interests};
}
