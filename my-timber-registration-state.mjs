import {goals,steps,initialJourney} from './my-timber-registration-model.mjs';
// Every statement belongs to the SAME D1 batch as user_auth and the session.
// Owned JSON paths preserve other preferences and any existing measurements.
export function onboardingStatements(db,userId,input,now){
 const saved={...input,completedAt:now,consentVersion:input.healthConsent?'my-timber-setup-20261021':null};
 const ops=[db.prepare("UPDATE member_state SET preferences=json_set(COALESCE(preferences,'{}'),'$.myTimberOnboarding',json(?)),updated_at=? WHERE user_id=?").bind(JSON.stringify(saved),now,userId)];
 const fill=(column,path,value)=>{
  if(value==null)return;
  ops.push(db.prepare(`UPDATE member_state SET ${column}=json_set(COALESCE(${column},'{}'),?,json(?)),updated_at=? WHERE user_id=? AND (json_extract(${column},?) IS NULL OR json_extract(${column},?)='')`).bind(path,JSON.stringify(value),now,userId,path,path));
 };
 if(input.goals.length)fill('my_why','$.why',input.goals.map(x=>goals[x]).join('; '));
 fill('my_why','$.promise',steps[input.firstStep].label);
 const journey=initialJourney({},input,new Date(now).toLocaleDateString('en-CA',{timeZone:'Europe/London'}));
 if(journey)for(const [group,fields] of Object.entries(journey))for(const [key,value] of Object.entries(fields))fill('preferences','$.myJourney.'+group+'.'+key,value);
 if(input.healthConsent)ops.push(db.prepare('INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,?,?,?,?)').bind(userId,'my_timber_health_personalisation','my-timber-setup-20261021',1,now));
 return ops;
}
