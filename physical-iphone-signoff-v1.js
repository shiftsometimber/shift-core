const CHECK_KEYS=['homepage','route','results','product','my_timber','no_overflow','no_dead_ends'];

function json(body,status=200,extra={}){return new Response(JSON.stringify(body,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}})}
function clean(value,max){return String(value||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
export function isPhysicalIphoneSafari(userAgent){const ua=String(userAgent||'');return /iPhone/i.test(ua)&&/AppleWebKit/i.test(ua)&&/Safari/i.test(ua)&&!/(CriOS|FxiOS|EdgiOS|OPiOS|Headless|Playwright)/i.test(ua)}
export function validatePhysicalSignoff(input,userAgent){
  const reviewer=clean(input?.reviewer_name,80),notes=clean(input?.notes,1200),checks=input?.checks||{};
  const missing=CHECK_KEYS.filter(key=>checks[key]!==true);
  if(reviewer.length<2)return {ok:false,error:'reviewer_name_required'};
  if(input?.physical_iphone_confirmation!==true)return {ok:false,error:'physical_iphone_confirmation_required'};
  if(!isPhysicalIphoneSafari(userAgent))return {ok:false,error:'physical_iphone_safari_required'};
  if(missing.length)return {ok:false,error:'checks_incomplete',missing};
  return {ok:true,reviewer,notes,checks:Object.fromEntries(CHECK_KEYS.map(key=>[key,true])),userAgent:clean(userAgent,500)};
}
function enabled(env){return env?.SHIFT_ENVIRONMENT==='my-timber-preview'&&env?.PHYSICAL_IPHONE_SIGNOFF_ENABLED==='true'}
function proof(row,origin){return {
  proof:'SHIFT_PHYSICAL_IPHONE_SAFARI_SIGNOFF_V1',status:'passed',evidence_id:row.evidence_id,
  reviewer_name:row.reviewer_name,confirmed_at:row.confirmed_at,device_user_agent:row.device_user_agent,
  checks:JSON.parse(row.checks_json),notes:row.notes||'',preview_origin:origin,
  scope:'isolated-preview-only',production_deployed:false,medicine_purchase_enabled:false,
  gates:{commercial:'locked',claims:'locked',stock:'locked',supplier:'locked',purchase:'locked',clinical:'locked'}
}}

export async function physicalIphoneSignoffRoutes(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  const match=path.match(/^\/v1\/preview\/physical-iphone-signoff\/([a-f0-9-]{36})$/);
  if(path!=='/v1/preview/physical-iphone-signoff'&&!match)return null;
  if(!enabled(env))return json({error:'not_found'},404);
  if(request.method==='POST'&&path==='/v1/preview/physical-iphone-signoff'){
    const input=await request.json().catch(()=>null),checked=validatePhysicalSignoff(input,request.headers.get('user-agent'));
    if(!checked.ok)return json({error:checked.error,missing:checked.missing},422);
    const evidenceId=crypto.randomUUID(),confirmedAt=new Date().toISOString();
    await env.DB.prepare('INSERT INTO physical_iphone_signoffs(evidence_id,reviewer_name,confirmed_at,device_user_agent,checks_json,notes) VALUES(?,?,?,?,?,?)')
      .bind(evidenceId,checked.reviewer,confirmedAt,checked.userAgent,JSON.stringify(checked.checks),checked.notes).run();
    const row={evidence_id:evidenceId,reviewer_name:checked.reviewer,confirmed_at:confirmedAt,device_user_agent:checked.userAgent,checks_json:JSON.stringify(checked.checks),notes:checked.notes};
    return json({ok:true,proof:proof(row,url.origin),proof_url:`${url.origin}/physical-iphone-signoff/proof/${evidenceId}.json`},201);
  }
  if(request.method==='GET'&&match){
    const row=await env.DB.prepare('SELECT evidence_id,reviewer_name,confirmed_at,device_user_agent,checks_json,notes FROM physical_iphone_signoffs WHERE evidence_id=?').bind(match[1]).first();
    if(!row)return json({error:'evidence_not_found'},404);
    return json(proof(row,url.origin),200,{'content-disposition':`attachment; filename="physical-iphone-signoff-${match[1]}.json"`});
  }
  return json({error:'method_not_allowed'},405,{'allow':match?'GET':'POST'});
}
