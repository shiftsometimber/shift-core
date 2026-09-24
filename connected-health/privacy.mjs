import {exportData} from './store.mjs';
import {integer} from './model.mjs';
export const HEALTH_TABLES=Object.freeze(['connected_health_connections','connected_health_observations','connected_health_batches','connected_health_consent_events']);
export async function healthSchema(db){
 const rows=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?,?,?,?)").bind(...HEALTH_TABLES).all()).results;
 if(rows.length!==0&&rows.length!==4)throw new Error('connected_health_schema_incomplete');
 return rows.length===4;
}
// Join these statements to the EXISTING erasure transaction. Keep a consent
// tombstone/revision so an in-flight import or stale reconnect cannot revive data.
export async function connectedHealthErasureStatements(db,userId,at=new Date().toISOString()){
 integer(userId,1);if(!await healthSchema(db))return [];
 return [
  db.prepare("INSERT INTO connected_health_consent_events SELECT lower(hex(randomblob(16))),user_id,provider,'delete',consent_version,scopes_json,? FROM connected_health_connections WHERE user_id=?").bind(at,userId),
  db.prepare('UPDATE connected_health_connections SET can_sync=0,can_personalise=0,revision=revision+1,updated_at=?,last_import_at=NULL WHERE user_id=?').bind(at,userId),
  db.prepare('DELETE FROM connected_health_observations WHERE user_id=?').bind(userId),
  db.prepare('DELETE FROM connected_health_batches WHERE user_id=?').bind(userId)
 ];
}
export async function appendConnectedHealthExport(request,env,response,authenticate){
 if(new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 try{
  // Export must still work after a feature flag is turned off.
  if(!await healthSchema(env.DB))return response;
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  const data=await exportData(env.DB,auth.userId),body=await response.json();
  const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');
  headers.set('Content-Type','application/json; charset=utf-8');headers.delete('Content-Length');headers.delete('ETag');
  return new Response(JSON.stringify({...body,connectedHealth:data}),{status:response.status,headers});
 }catch{return new Response(JSON.stringify({ok:false,error:'connected_health_export_failed',message:'The complete account export could not be prepared. Please retry.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});}
}
