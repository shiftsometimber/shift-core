// Shift Some Timber — self-service erasure of optional non-clinical health tracking.
// Uses the existing authenticated core to resolve the signed-in user, then clears
// only optional tracking stores that actually exist. Missing optional stores are
// reported rather than turning a partial delete into a false success.

const TRACKING_CONSENT='my_shift_health_tracking';

export async function privacyHealthErasureRoute(request,env,ctx,coreFetch){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='DELETE'||path!=='/v1/privacy/health-tracking')return null;

  const me=await coreFetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!me.ok)return me;
  const body=await me.json().catch(()=>({}));
  const userId=Number(body?.user?.id||0);
  if(!userId)return json({ok:false,error:'unauthorised'},401);

  const required=['progress_entries','check_ins'];
  const optional=['health_mot_entries','health_mots','progress_photos'];
  const present=await existingTables(env.DB,[...required,...optional]);
  const missingRequired=required.filter(name=>!present.has(name));
  if(missingRequired.length)return json({ok:false,error:'health_erasure_schema_incomplete',missing:missingRequired},503);

  const deleted=[];
  for(const table of [...required,...optional]){
    if(!present.has(table))continue;
    const result=await env.DB.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(userId).run();
    deleted.push({table,changes:Number(result?.meta?.changes||0)});
  }

  // Record withdrawal as a new immutable consent event. Keep consent/audit
  // history so Shift can evidence that withdrawal and erasure were honoured.
  const now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at,withdrawn_at,created_at) VALUES(?,?,?,?,?,?,?)`)
    .bind(userId,TRACKING_CONSENT,'2026-08-18-v1',0,null,now,now).run();

  // Reuse the core audit behaviour through the consent route when possible is
  // deliberately avoided here because data is already deleted. Store a narrow
  // audit record without health values.
  if(present.has('audit_log')||await tableExists(env.DB,'audit_log')){
    await env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,?)`)
      .bind(userId,'privacy.health_tracking_erased','privacy',String(userId),JSON.stringify({scopes:deleted.map(x=>x.table)}),now).run();
  }
  return json({ok:true,erasedAt:now,deleted,consentWithdrawn:true});
}

async function existingTables(DB,names){
  const out=new Set();
  for(const name of names){if(await tableExists(DB,name))out.add(name)}
  return out;
}
async function tableExists(DB,name){
  const row=await DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).bind(name).first();
  return !!row?.name;
}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
