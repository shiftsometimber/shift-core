import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const COMMISSIONING_OPS_VERSION='final-v1-worker-publication-v1-20260815';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const fitAsset=await fitPremiumAsset(request,env,p);if(fitAsset)return fitAsset;
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  const finalV1Publication=p==='/v1/commissioning/final-v1-publication'&&request.method==='POST';
  const syntheticSafety=p==='/v1/commissioning/synthetic-safety-drill'&&request.method==='POST';
  const hqCloseout=p==='/v1/commissioning/hq-controls-closeout'&&request.method==='POST';
  if(!radar&&!productEvents&&!finalV1Publication&&!syntheticSafety&&!hqCloseout)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,radar:result})}
  if(finalV1Publication)return publishFinalV1(request,env,identity);
  if(syntheticSafety){try{return await syntheticSafetyDrill(request,env,identity)}catch(e){console.error('synthetic_safety_drill_failed',e?.message);return json({ok:false,error:'synthetic_safety_drill_failed',detail:String(e?.message||e).slice(0,240)},503)}}
  if(hqCloseout){try{return await hqControlsCloseout(request,env,identity)}catch(e){console.error('hq_controls_closeout_failed',e?.message);return json({ok:false,error:'hq_controls_closeout_failed',detail:String(e?.message||e).slice(0,240)},503)}}
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},503)}
}
async function hqControlsCloseout(request,env,identity){
  const body=await request.json().catch(()=>({})),action=String(body.action||''),runId=String(body.runId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
  if(!runId)return json({ok:false,error:'run_id_required'},400);
  const marker=`hq-closeout-${runId}`,email=`${marker}@shift.test`,stamp=new Date().toISOString();
  if(action==='setup'){
    const sessionToken=`hq_closeout_${crypto.randomUUID()}_${crypto.randomUUID()}`,tokenHash=await sha256(sessionToken),expires=new Date(Date.now()+30*60*1000).toISOString();
    let user=await env.DB.prepare('SELECT id FROM hq_users WHERE email=?').bind(email).first();
    if(!user){const result=await env.DB.prepare("INSERT INTO hq_users(email,name,password_hash,role,status,mfa_enabled,created_at,updated_at) VALUES(?,?,?,'owner','active',0,?,?)").bind(email,'Synthetic HQ Closeout','commissioning_oidc_only',stamp,stamp).run();user={id:Number(result.meta?.last_row_id)}}
    await env.DB.prepare("UPDATE hq_users SET role='owner',status='active',updated_at=? WHERE id=?").bind(stamp,user.id).run();
    await env.DB.prepare('INSERT INTO hq_sessions(hq_user_id,token_hash,expires_at,created_at,last_used_at) VALUES(?,?,?,?,?)').bind(user.id,tokenHash,expires,stamp,stamp).run();
    await env.DB.prepare("INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,'hq.synthetic_closeout_started','hq_user',?,?,?)").bind(user.id,String(user.id),JSON.stringify({runId,workflowRef:identity.claims?.workflow_ref||''}),stamp).run();
    return json({ok:true,action,runId,hqUserId:Number(user.id),sessionToken,expiresAt:expires,commissioningIdentity:'github_actions_oidc'});
  }
  if(action==='cleanup'){
    const user=await env.DB.prepare('SELECT id FROM hq_users WHERE email=?').bind(email).first();if(!user)return json({ok:true,action,runId,alreadyClean:true});
    const {results=[]}=await env.DB.prepare("SELECT id FROM site_content_overrides WHERE content_key=?").bind(marker).all();
    for(const row of results){await env.DB.prepare('DELETE FROM site_content_versions WHERE content_override_id=?').bind(row.id).run();await env.DB.prepare('DELETE FROM site_content_overrides WHERE id=?').bind(row.id).run()}
    await env.DB.prepare('UPDATE hq_sessions SET revoked_at=? WHERE hq_user_id=? AND revoked_at IS NULL').bind(stamp,user.id).run();
    await env.DB.prepare("UPDATE hq_users SET status='disabled',updated_at=? WHERE id=?").bind(stamp,user.id).run();
    await env.DB.prepare("INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,'hq.synthetic_closeout_completed','hq_user',?,?,?)").bind(user.id,String(user.id),JSON.stringify({runId,contentRowsRemoved:results.length}),stamp).run();
    return json({ok:true,action,runId,hqUserId:Number(user.id),contentRowsRemoved:results.length,sessionRevoked:true,userDisabled:true,commissioningIdentity:'github_actions_oidc'});
  }
  return json({ok:false,error:'invalid_hq_closeout_action'},400);
}
async function sha256(value){const bytes=new TextEncoder().encode(String(value)),hash=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}

async function syntheticSafetyDrill(request,env,identity){
  const body=await request.json().catch(()=>({})),action=String(body.action||''),userId=Number(body.userId||0),postId=Number(body.postId||0),actor="Matt O'Brien";
  const commissioned=async id=>{if(!Number.isInteger(id)||id<=0)return false;const row=await env.DB.prepare("SELECT id FROM audit_log WHERE user_id=? AND action='auth.commissioning_identity_verified' LIMIT 1").bind(id).first();return !!row?.id};
  if(action==='cleanup_previous'){
    const {results=[]}=await env.DB.prepare("SELECT p.id,p.user_id FROM tap_room_posts p JOIN tap_room_reports r ON r.post_id=p.id JOIN audit_log a ON a.user_id=p.user_id AND a.action='auth.commissioning_identity_verified' WHERE substr(p.body,1,59)='TEST INCIDENT — synthetic safeguarding delivery drill only.' AND p.status='held' AND r.priority='P0' AND r.status='open' GROUP BY p.id,p.user_id").all();
    for(const row of results)await closeSyntheticTap(env,Number(row.id),Number(row.user_id),actor,'Recovered authorised TEST INCIDENT after proof-run interruption');
    return json({ok:true,action,closed:results.length,commissioningIdentity:'github_actions_oidc'});
  }
  if(!await commissioned(userId))return json({ok:false,error:'synthetic_commissioning_member_required'},403);
  if(action==='inspect_and_close_tap'){
    const row=await env.DB.prepare("SELECT p.id,p.user_id,p.body,p.status,p.risk_flags_json,r.id report_id,r.priority,r.status report_status FROM tap_room_posts p JOIN tap_room_reports r ON r.post_id=p.id WHERE p.id=? AND p.user_id=? AND substr(p.body,1,59)='TEST INCIDENT — synthetic safeguarding delivery drill only.' AND r.priority='P0' AND r.status='open' LIMIT 1").bind(postId,userId).first();
    if(!row||row.status!=='held'||!String(row.risk_flags_json||'').includes('crisis'))return json({ok:false,error:'synthetic_p0_queue_proof_failed'},409);
    await closeSyntheticTap(env,postId,userId,actor,'Authorised TEST INCIDENT production drill');
    const closed=await env.DB.prepare("SELECT p.id,p.body,p.status,r.priority,r.status report_status,r.reviewed_by,r.outcome,a.action,a.actor FROM tap_room_posts p JOIN tap_room_reports r ON r.post_id=p.id JOIN tap_room_moderation_audit a ON a.content_id=p.id WHERE p.id=? ORDER BY a.id DESC LIMIT 1").bind(postId).first();
    return json({ok:true,action,before:{postId,status:row.status,priority:row.priority,reportStatus:row.report_status,riskFlags:safe(row.risk_flags_json)},after:closed,commissioningIdentity:'github_actions_oidc'});
  }
  if(action==='seed_health'){
    const today=new Date().toISOString().slice(0,10);
    await env.DB.batch([env.DB.prepare("INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,notes,source) VALUES(?,?,?,?,?,?)").bind(userId,today,99.9,99.9,'SYNTHETIC ERASURE DRILL','commissioning'),env.DB.prepare("INSERT INTO check_ins(user_id,weight,waist,wellbeing_score,notes) VALUES(?,?,?,?,?)").bind(userId,99.9,99.9,5,'SYNTHETIC ERASURE DRILL')]);
    const counts=await syntheticHealthCounts(env,userId);return json({ok:counts.progressRows===1&&counts.checkInRows===1,action,...counts,commissioningIdentity:'github_actions_oidc'});
  }
  if(action==='verify_health_erasure'){
    const counts=await syntheticHealthCounts(env,userId),withdrawal=await env.DB.prepare("SELECT COUNT(*) n FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' AND granted=0").bind(userId).first(),audit=await env.DB.prepare("SELECT COUNT(*) n FROM audit_log WHERE user_id=? AND action='privacy.health_tracking_erased'").bind(userId).first();
    const result={...counts,withdrawalRows:Number(withdrawal?.n||0),auditRows:Number(audit?.n||0)};return json({ok:result.progressRows===0&&result.checkInRows===0&&result.withdrawalRows>=1&&result.auditRows>=1,action,...result,commissioningIdentity:'github_actions_oidc'});
  }
  return json({ok:false,error:'invalid_synthetic_drill_action'},400);
}
async function closeSyntheticTap(env,postId,userId,actor,reason){const at=new Date().toISOString(),closedLabel=`[TEST INCIDENT CLOSED #${postId}]`;await env.DB.batch([env.DB.prepare("UPDATE tap_room_posts SET body=?,status='hidden_by_moderator',deleted_at=?,updated_at=? WHERE id=? AND user_id=?").bind(closedLabel,at,at,postId,userId),env.DB.prepare("UPDATE tap_room_reports SET status='reviewed',reviewed_at=?,reviewed_by=?,outcome='synthetic_drill_closed' WHERE post_id=? AND status='open'").bind(at,actor,postId),env.DB.prepare("INSERT INTO tap_room_moderation_audit(actor,action,reason,content_id,affected_user_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(actor,'synthetic_p0_drill_close',reason,postId,userId,JSON.stringify({synthetic:true,realHealthData:false}),at)]);}
async function syntheticHealthCounts(env,userId){const p=await env.DB.prepare("SELECT COUNT(*) n FROM progress_entries WHERE user_id=? AND notes='SYNTHETIC ERASURE DRILL'").bind(userId).first(),c=await env.DB.prepare("SELECT COUNT(*) n FROM check_ins WHERE user_id=? AND notes='SYNTHETIC ERASURE DRILL'").bind(userId).first();return{progressRows:Number(p?.n||0),checkInRows:Number(c?.n||0)}}

async function publishFinalV1(request,env,identity){
  try{
    const body=await request.json();
    const sourceSha=String(body?.source_sha||'');
    const proof=String(body?.proof||'');
    const items=Array.isArray(body?.items)?body.items:[];
    if(!/^[0-9a-f]{40}$/.test(sourceSha)||proof!=='FINAL_V1_WORKER_PUBLICATION_PAYLOAD_V1')return json({ok:false,error:'invalid_publication_authority'},400);
    if(items.length!==2124)return json({ok:false,error:'invalid_publication_count',count:items.length},400);
    const ids=new Set(),rows=[];let recipes=0,exercises=0;
    for(const item of items){
      const id=String(item?.id||''),contentType=String(item?.content_type||''),title=String(item?.title||''),status=String(item?.status||''),dataJson=String(item?.data_json||''),reviewJson=String(item?.review_json||'');
      if(!id||ids.has(id)||!title||status!=='published'||!['recipe','exercise'].includes(contentType))return json({ok:false,error:'invalid_publication_row',id},400);ids.add(id);
      let data,review;try{data=JSON.parse(dataJson);review=JSON.parse(reviewJson)}catch{return json({ok:false,error:'invalid_publication_json',id},400)}
      if(data?.provenance?.final_v1_acceptance?.accepted!==true||review?.status!=='approved'||review?.final_v1!==true)return json({ok:false,error:'unaccepted_publication_row',id},400);
      if(contentType==='recipe')recipes++;else exercises++;
      rows.push({id,contentType,title,dataJson,reviewJson});
    }
    if(recipes!==798||exercises!==1326)return json({ok:false,error:'invalid_publication_partition',recipes,exercises},400);
    const statements=[env.DB.prepare(`CREATE TABLE IF NOT EXISTS structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',data_json TEXT NOT NULL,review_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status)`),...publicationStatements(env.DB,rows)];
    if(typeof env.DB.batch!=='function')return json({ok:false,error:'transactional_batch_unavailable'},503);
    await env.DB.batch(statements);
    const count=await env.DB.prepare(`SELECT COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1`).first();
    const partition=await env.DB.prepare(`SELECT content_type,COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1 GROUP BY content_type ORDER BY content_type`).all();
    if(Number(count?.c)!==2124)return json({ok:false,error:'publication_verification_failed',count:Number(count?.c||0)},503);
    return json({ok:true,proof:'FINAL_V1_WORKER_D1_PUBLICATION_V1',source_sha:sourceSha,commissioningIdentity:'github_actions_oidc',workflow_ref:identity.claims?.workflow_ref||'',published:2124,recipes,exercises,partition:partition.results||[]});
  }catch(e){console.error('final_v1_worker_publication_failed',e?.message);return json({ok:false,error:'final_v1_publication_failed',detail:String(e?.message||e).slice(0,300)},503)}
}
function publicationStatements(DB,rows){const out=[],size=15;for(let i=0;i<rows.length;i+=size){const chunk=rows.slice(i,i+size),values=chunk.map(()=>'(?,?,?,1,\'published\',?,?,CURRENT_TIMESTAMP)').join(','),sql=`INSERT INTO structured_content(id,content_type,title,version,status,data_json,review_json,updated_at) VALUES ${values} ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,version=structured_content.version+1,status='published',data_json=excluded.data_json,review_json=excluded.review_json,updated_at=CURRENT_TIMESTAMP`,bind=[];for(const r of chunk)bind.push(r.id,r.contentType,r.title,r.dataJson,r.reviewJson);out.push(DB.prepare(sql).bind(...bind))}return out}
async function fitPremiumAsset(request,env,path){
  const acceptedPath=/^(?:\/fit-premium\/|\/assets\/fit\/premium\/)[a-z0-9-]+\.svg$/.test(path);
  if(request.method!=='GET'||!acceptedPath||!env.MEMBER_ASSETS)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('fit premium asset unavailable',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  const h=new Headers(asset.headers);h.set('content-type','image/svg+xml; charset=utf-8');h.set('cache-control','public, max-age=3600, must-revalidate');h.set('x-content-type-options','nosniff');h.set('x-shift-fit-visual-authority',`git:frontend/member${path}`);
  return new Response(asset.body,{status:200,headers:h});
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}
