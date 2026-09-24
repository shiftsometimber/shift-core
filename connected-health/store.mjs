import {CONSENT_VERSION,scopes,provider,identifier,integer,fail,normaliseBatch,digest,publicObservation,summarise} from './model.mjs';
const activeSession = `EXISTS(SELECT 1 FROM user_sessions s WHERE s.id=c.session_id AND s.user_id=c.user_id AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?))`;
const q = (db,sql,...args)=>db.prepare(sql).bind(...args);
const stamp = now=>new Date(now).toISOString();
const all = async statement=>(await statement.all()).results;
export const getConnection = (db,userId,p)=>q(db,'SELECT * FROM connected_health_connections WHERE user_id=? AND provider=?',userId,provider(p)).first();
function checkIdentity(auth,body) {
  if (!Number.isSafeInteger(auth.userId) || auth.userId <= 0 || body.expectedAccountId !== auth.userId) throw fail('account_changed',409);
  if (!auth.sessionId) throw fail('session_required',401);
}
function bound(c,auth,body) {
  checkIdentity(auth,body);
  if (!c || c.connection_id!==body.connectionId || c.revision!==body.revision) throw fail('connection_changed',409);
  if (String(c.session_id)!==String(auth.sessionId)) throw fail('reconnect_this_session',409);
}
export async function grant(db,auth,body,now=Date.now()) {
  checkIdentity(auth,body); provider(body.provider); integer(body.expectedRevision);
  if (body.consentVersion!==CONSENT_VERSION || body.consent!==true) throw fail('explicit_consent_required',403);
  const selected=scopes(body.scopes),connectionId=crypto.randomUUID(),at=stamp(now);
  const session = `EXISTS(SELECT 1 FROM user_sessions WHERE id=? AND user_id=? AND revoked_at IS NULL AND julianday(expires_at)>julianday(?))`;
  const prior = await getConnection(db,auth.userId,body.provider);
  if ((prior?.revision??0)!==body.expectedRevision) throw fail('connection_changed',409);
  const result=await db.batch([
    q(db,`INSERT INTO connected_health_connections(user_id,provider,connection_id,session_id,scopes_json,consent_version,revision,sync_revision,can_sync,can_personalise,created_at,updated_at,last_import_at)
      SELECT ?,?,?,?,?,?,1,0,1,1,?,?,NULL WHERE ${session} AND (?=0 OR EXISTS(SELECT 1 FROM connected_health_connections WHERE user_id=? AND provider=? AND revision=?))
      ON CONFLICT(user_id,provider) DO UPDATE SET connection_id=excluded.connection_id,session_id=excluded.session_id,scopes_json=excluded.scopes_json,consent_version=excluded.consent_version,revision=connected_health_connections.revision+1,sync_revision=0,can_sync=1,can_personalise=1,created_at=excluded.created_at,updated_at=excluded.updated_at,last_import_at=NULL WHERE connected_health_connections.revision=?`,
      auth.userId,body.provider,connectionId,String(auth.sessionId),JSON.stringify(selected),CONSENT_VERSION,at,at,String(auth.sessionId),auth.userId,at,body.expectedRevision,auth.userId,body.provider,body.expectedRevision,body.expectedRevision),
    q(db,`INSERT INTO connected_health_consent_events SELECT ?,user_id,provider,'grant',consent_version,scopes_json,? FROM connected_health_connections WHERE user_id=? AND provider=? AND connection_id=?`,crypto.randomUUID(),at,auth.userId,body.provider,connectionId)
  ]);
  if (result[0].meta.changes!==1) throw fail('connection_changed',409);
  return connectionView(await getConnection(db,auth.userId,body.provider),auth);
}
export function connectionView(c,auth) {
  return {provider:c.provider,connectionId:c.connection_id,revision:c.revision,syncRevision:c.sync_revision,scopes:JSON.parse(c.scopes_json),consentVersion:c.consent_version,syncEnabled:!!c.can_sync,personalisationEnabled:!!c.can_personalise,requiresReconnect:String(c.session_id)!==String(auth.sessionId),lastImportAt:c.last_import_at};
}
export async function state(db,auth,now=Date.now()) {
  const connections=await all(q(db,'SELECT * FROM connected_health_connections WHERE user_id=? ORDER BY provider',auth.userId));
  const rows=await all(q(db,`SELECT o.* FROM connected_health_observations o JOIN connected_health_connections c ON c.user_id=o.user_id AND c.provider=o.provider WHERE o.user_id=? AND c.can_personalise=1 AND EXISTS(SELECT 1 FROM json_each(c.scopes_json) WHERE value=o.metric) ORDER BY o.end_at DESC LIMIT 1000`,auth.userId));
  return {consentVersion:CONSENT_VERSION,connections:connections.map(c=>connectionView(c,auth)),latest:summarise(rows,now),observations:rows.map(r=>publicObservation(r,now)),truncated:rows.length===1000};
}
export async function ingest(db,auth,body,now=Date.now()) {
  const c=await getConnection(db,auth.userId,body.provider);bound(c,auth,body);
  if (!c.can_sync || !c.can_personalise || c.consent_version!==CONSENT_VERSION) throw fail('sync_not_consented',403);
  const data=normaliseBatch(body,c,now),at=stamp(now);
  const hash=await digest({connectionId:c.connection_id,revision:c.revision,syncRevision:body.syncRevision,...data});
  const receipt=()=>q(db,'SELECT * FROM connected_health_batches WHERE user_id=? AND provider=? AND connection_id=? AND batch_id=?',auth.userId,c.provider,c.connection_id,body.batchId).first();
  const old=await receipt();
  if (old) { if(old.digest!==hash)throw fail('idempotency_conflict',409); if(old.applied)return receiptView(old); }
  if(c.sync_revision!==body.syncRevision)throw fail('sync_changed',409);
  const pending=`EXISTS(SELECT 1 FROM connected_health_batches b WHERE b.user_id=? AND b.provider=? AND b.connection_id=? AND b.batch_id=? AND b.digest=? AND b.applied=0)`;
  const receiptArgs=[auth.userId,c.provider,c.connection_id,body.batchId,hash];
  const writes=[q(db,`INSERT INTO connected_health_batches(user_id,provider,connection_id,batch_id,digest,result_revision,imported_count,deleted_count,created_at)
    SELECT c.user_id,c.provider,c.connection_id,?,?,?,?,?,? FROM connected_health_connections c WHERE c.user_id=? AND c.provider=? AND c.connection_id=? AND c.revision=? AND c.sync_revision=? AND c.can_sync=1 AND c.can_personalise=1 AND ${activeSession} ON CONFLICT DO NOTHING`,
    body.batchId,hash,body.syncRevision+1,data.records.length,data.deleted.length,at,auth.userId,c.provider,c.connection_id,c.revision,body.syncRevision,at)];
  for(const r of data.records) writes.push(q(db,`INSERT INTO connected_health_observations(user_id,provider,metric,external_id,value,unit,start_at,end_at,sources_json,basis,time_zone,imported_at,confirmed_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,NULL WHERE ${pending}
    ON CONFLICT(user_id,provider,metric,external_id) DO UPDATE SET value=excluded.value,unit=excluded.unit,start_at=excluded.start_at,end_at=excluded.end_at,sources_json=excluded.sources_json,basis=excluded.basis,time_zone=excluded.time_zone,imported_at=excluded.imported_at,confirmed_at=CASE WHEN connected_health_observations.value=excluded.value AND connected_health_observations.start_at=excluded.start_at THEN connected_health_observations.confirmed_at ELSE NULL END`,
    auth.userId,c.provider,r.metric,r.externalId,r.value,r.unit,r.startAt,r.endAt,JSON.stringify(r.sources),r.basis,r.timeZone,at,...receiptArgs));
  for(const r of data.deleted) writes.push(q(db,`DELETE FROM connected_health_observations WHERE user_id=? AND provider=? AND metric=? AND external_id=? AND ${pending}`,auth.userId,c.provider,r.metric,r.externalId,...receiptArgs));
  writes.push(q(db,`UPDATE connected_health_connections SET sync_revision=sync_revision+1,last_import_at=?,updated_at=? WHERE user_id=? AND provider=? AND connection_id=? AND sync_revision=? AND ${pending}`,at,at,auth.userId,c.provider,c.connection_id,body.syncRevision,...receiptArgs));
  writes.push(q(db,`UPDATE connected_health_batches SET applied=1 WHERE user_id=? AND provider=? AND connection_id=? AND batch_id=? AND digest=? AND applied=0`,...receiptArgs));
  await db.batch(writes);
  const saved=await receipt();if(!saved?.applied)throw fail('sync_changed',409);
  return receiptView(saved);
}
const receiptView=r=>({batchId:r.batch_id,syncRevision:r.result_revision,imported:r.imported_count,deleted:r.deleted_count,importedAt:r.created_at});
export async function control(db,auth,body,action,now=Date.now()) {
  checkIdentity(auth,body);provider(body.provider);integer(body.revision,1);identifier(body.connectionId);
  if(!['stop','withdraw','delete'].includes(action))throw fail('invalid_action');
  const c=await getConnection(db,auth.userId,body.provider);
  // A member may stop/delete from the web or another device; importing remains session-bound.
  if(!c || c.connection_id!==body.connectionId || c.revision!==body.revision)throw fail('connection_changed',409);
  const at=stamp(now),id=crypto.randomUUID();
  const eventExists=`EXISTS(SELECT 1 FROM connected_health_consent_events WHERE event_id=? AND user_id=?)`;
  const writes=[q(db,`INSERT INTO connected_health_consent_events SELECT ?,user_id,provider,?,consent_version,scopes_json,? FROM connected_health_connections WHERE user_id=? AND provider=? AND connection_id=? AND revision=? AND EXISTS(SELECT 1 FROM user_sessions s WHERE s.id=? AND s.user_id=? AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?))`,id,action,at,auth.userId,c.provider,c.connection_id,c.revision,String(auth.sessionId),auth.userId,at),
    q(db,`UPDATE connected_health_connections SET can_sync=0,can_personalise=?,revision=revision+1,updated_at=? WHERE user_id=? AND provider=? AND ${eventExists}`,action==='stop'?c.can_personalise:0,at,auth.userId,c.provider,id,auth.userId)];
  if(action==='delete') {
    writes.push(q(db,`DELETE FROM connected_health_observations WHERE user_id=? AND provider=? AND ${eventExists}`,auth.userId,c.provider,id,auth.userId));
    writes.push(q(db,`DELETE FROM connected_health_batches WHERE user_id=? AND provider=? AND ${eventExists}`,auth.userId,c.provider,id,auth.userId));
  }
  const results=await db.batch(writes);if(results[0].meta.changes!==1)throw fail('connection_changed',409);
  return {action,connection:connectionView(await getConnection(db,auth.userId,c.provider),auth)};
}
export async function confirmHeight(db,auth,body,now=Date.now()) {
  checkIdentity(auth,body);provider(body.provider);identifier(body.externalId);
  if(typeof body.expectedValue!=='number'||body.confirm!==true)throw fail('confirmation_required');
  const result=await q(db,`UPDATE connected_health_observations SET confirmed_at=? WHERE user_id=? AND provider=? AND metric='height' AND external_id=? AND value=? AND start_at=? AND EXISTS(SELECT 1 FROM connected_health_connections c WHERE c.user_id=connected_health_observations.user_id AND c.provider=connected_health_observations.provider AND c.can_personalise=1 AND EXISTS(SELECT 1 FROM json_each(c.scopes_json) WHERE value='height')) AND EXISTS(SELECT 1 FROM user_sessions s WHERE s.id=? AND s.user_id=? AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?))`,stamp(now),auth.userId,body.provider,body.externalId,body.expectedValue,body.expectedStartAt,String(auth.sessionId),auth.userId,stamp(now)).run();
  if(result.meta.changes!==1)throw fail('measurement_changed',409);
  return {confirmed:true,clinicallyVerified:false};
}
export async function exportData(db,userId) {
  return {connections:await all(q(db,'SELECT provider,scopes_json,consent_version,revision,can_sync,can_personalise,created_at,updated_at,last_import_at FROM connected_health_connections WHERE user_id=?',userId)),observations:await all(q(db,'SELECT * FROM connected_health_observations WHERE user_id=? ORDER BY end_at',userId)),consentEvents:await all(q(db,'SELECT provider,action,consent_version,scopes_json,created_at FROM connected_health_consent_events WHERE user_id=? ORDER BY created_at',userId))};
}
export async function eraseAccountData(db,userId) {
  integer(userId,1);
  await db.batch(['connected_health_batches','connected_health_observations','connected_health_connections','connected_health_consent_events'].map(t=>q(db,`DELETE FROM ${t} WHERE user_id=?`,userId)));
}
