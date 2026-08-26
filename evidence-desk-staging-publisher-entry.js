import {createHash,timingSafeEqual} from 'node:crypto';

const now=()=>new Date().toISOString();
const clean=(value,max=15000)=>String(value??'').trim().slice(0,max);
const sha=value=>createHash('sha256').update(String(value)).digest('hex');
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const bearer=request=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
function secure(request,secret){
  const supplied=Buffer.from(bearer(request)),expected=Buffer.from(String(secret||''));
  return expected.length>31&&supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}

async function schema(DB){
  const sql=`
    CREATE TABLE IF NOT EXISTS evidence_desk_staging_pages(
      page_path TEXT PRIMARY KEY,current_html TEXT NOT NULL DEFAULT '',current_sha256 TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_staging_versions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER NOT NULL,page_path TEXT NOT NULL,
      content_key TEXT NOT NULL,copy_sha256 TEXT NOT NULL,payload_sha256 TEXT NOT NULL,
      baseline_sha256 TEXT NOT NULL,rollback_locator TEXT NOT NULL,candidate_html TEXT NOT NULL,
      candidate_sha256 TEXT NOT NULL,idempotency_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,rolled_back_at TEXT
    );
  `;
  const statements=sql.split(';').map(statement=>statement.trim()).filter(Boolean);
  if(typeof DB.batch==='function')await DB.batch(statements.map(statement=>DB.prepare(statement)));
  else for(const statement of statements)await DB.prepare(statement).run();
}

function candidateHtml(payload){
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Shift staging candidate</title><style>body{font-family:system-ui;background:#f4f1e8;color:#182016;margin:0}.banner{background:#7d1717;color:white;padding:14px 24px;font-weight:800}main{max-width:760px;margin:auto;padding:48px 24px}.copy{background:white;border:1px solid #c6c1b4;border-radius:14px;padding:24px;white-space:pre-wrap}</style></head><body><div class="banner">NON-PRODUCTION STAGING · SPECIALIST AND PUBLICATION GATES APPLY</div><main><p>Package ${Number(payload.packageId)}</p><h1>${escape(payload.pagePath)}</h1><div class="copy" data-content-key="${escape(payload.contentKey)}">${escape(payload.proposedText)}</div><p>Copy SHA-256: <code>${escape(payload.copySha256)}</code></p></main></body></html>`;
}

async function publish(request,env){
  if(!secure(request,env.STAGING_PUBLISH_TOKEN))return json({ok:false,error:'unauthorized'},401);
  const input=await request.json().catch(()=>({}));
  const packageId=Number(input.packageId),pagePath=clean(input.pagePath,500),contentKey=clean(input.contentKey,500),text=clean(input.proposedText,15000);
  const copySha=clean(input.copySha256,64),baselineSha=clean(input.baselineSha256,64),rollback=clean(input.rollbackLocator,2000);
  const key=clean(request.headers.get('idempotency-key'),300),payloadSha=clean(request.headers.get('x-payload-sha256'),64),controlEpoch=Number(request.headers.get('x-control-epoch'));
  if(!packageId||!pagePath.startsWith('/')||!contentKey||!text||sha(text)!==copySha||!key||!/^[a-f0-9]{64}$/.test(baselineSha)||!rollback||!/^[a-f0-9]{64}$/.test(payloadSha))return json({ok:false,error:'publish_contract_invalid'},400);
  const controls=await env.DB.prepare(`SELECT monitoring_enabled,website_enabled,staging_publication_enabled,production_authority_enabled,control_epoch FROM evidence_desk_operational_control WHERE id=1`).first();
  const base=await env.DB.prepare(`SELECT enabled,website_publish_enabled FROM evidence_desk_control WHERE id=1`).first();
  if(!Number(base?.enabled)||!Number(base?.website_publish_enabled)||!Number(controls?.website_enabled)||!Number(controls?.staging_publication_enabled)||Number(controls?.production_authority_enabled)||Number(controls?.control_epoch)!==controlEpoch)return json({ok:false,error:'publisher_control_closed'},409);
  const existing=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_versions WHERE idempotency_key=?`).bind(key).first();
  if(existing)return json({published:existing.status==='published',idempotent:true,versionId:String(existing.id),url:`${new URL(request.url).origin}/preview/${existing.id}`,copySha256:existing.copy_sha256,payloadSha256:existing.payload_sha256,baselineSha256:existing.baseline_sha256});
  const page=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_pages WHERE page_path=?`).bind(pagePath).first();
  const currentSha=page?.current_sha256||sha('');
  if(currentSha!==baselineSha)return json({ok:false,error:'stale_baseline',currentSha256:currentSha},409);
  const html=candidateHtml({packageId,pagePath,contentKey,proposedText:text,copySha256:copySha}),candidateSha=sha(html),at=now();
  const row=await env.DB.prepare(`INSERT INTO evidence_desk_staging_versions(package_id,page_path,content_key,copy_sha256,payload_sha256,baseline_sha256,rollback_locator,candidate_html,candidate_sha256,idempotency_key,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,'published',?) RETURNING id`).bind(packageId,pagePath,contentKey,copySha,payloadSha,baselineSha,rollback,html,candidateSha,key,at).first();
  await env.DB.prepare(`INSERT INTO evidence_desk_staging_pages(page_path,current_html,current_sha256,updated_at) VALUES(?,?,?,?) ON CONFLICT(page_path) DO UPDATE SET current_html=excluded.current_html,current_sha256=excluded.current_sha256,updated_at=excluded.updated_at`).bind(pagePath,html,candidateSha,at).run();
  return json({published:true,versionId:String(row.id),url:`${new URL(request.url).origin}/preview/${row.id}`,copySha256:copySha,payloadSha256:payloadSha,baselineSha256:baselineSha,candidateSha256:candidateSha});
}

async function baseline(request,env){
  if(!secure(request,env.STAGING_PUBLISH_TOKEN))return json({ok:false,error:'unauthorized'},401);
  const input=await request.json().catch(()=>({})),pagePath=clean(input.pagePath,500);
  if(!Number(input.packageId)||!pagePath.startsWith('/'))return json({ok:false,error:'baseline_contract_invalid'},400);
  const page=await env.DB.prepare(`SELECT current_sha256 FROM evidence_desk_staging_pages WHERE page_path=?`).bind(pagePath).first();
  const baselineSha256=page?.current_sha256||sha('');
  return json({verified:true,pagePath,baselineSha256,rollbackLocator:`staging://page/${encodeURIComponent(pagePath)}/${baselineSha256}`});
}

async function rollback(request,env){
  if(!secure(request,env.STAGING_PUBLISH_TOKEN))return json({ok:false,error:'unauthorized'},401);
  const input=await request.json().catch(()=>({})),versionId=Number(input.versionId),copySha=clean(input.copySha256,64);
  const version=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_versions WHERE id=?`).bind(versionId).first();
  if(!version)return json({ok:false,error:'version_not_found'},404);
  if(version.copy_sha256!==copySha)return json({ok:false,error:'rollback_copy_hash_mismatch'},409);
  if(version.status==='rolled_back')return json({ok:true,rolledBack:true,idempotent:true,baselineSha256:version.baseline_sha256});
  const page=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_pages WHERE page_path=?`).bind(version.page_path).first();
  if(page?.current_sha256!==version.candidate_sha256)return json({ok:false,error:'rollback_candidate_drift'},409);
  const restoredHtml='',at=now();
  if(sha(restoredHtml)!==version.baseline_sha256)return json({ok:false,error:'rollback_baseline_unavailable'},409);
  await env.DB.batch([
    env.DB.prepare(`UPDATE evidence_desk_staging_pages SET current_html=?,current_sha256=?,updated_at=? WHERE page_path=?`).bind(restoredHtml,version.baseline_sha256,at,version.page_path),
    env.DB.prepare(`UPDATE evidence_desk_staging_versions SET status='rolled_back',rolled_back_at=? WHERE id=?`).bind(at,versionId)
  ]);
  return json({ok:true,rolledBack:true,versionId:String(versionId),baselineSha256:version.baseline_sha256});
}

async function preview(request,env,id){
  const row=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_versions WHERE id=?`).bind(Number(id)).first();
  if(!row)return new Response('Not found',{status:404});
  if(row.status!=='published')return new Response('<!doctype html><title>Rolled back</title><h1>This staging candidate has been rolled back.</h1>',{status:410,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
  return new Response(row.candidate_html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
}

export default{async fetch(request,env){
  try{
    await schema(env.DB);const url=new URL(request.url);
    if(url.pathname==='/health')return json({ok:true,environment:'staging',production:false});
    if(url.pathname==='/v1/baseline'&&request.method==='POST')return baseline(request,env);
    if(url.pathname==='/v1/publish'&&request.method==='POST')return publish(request,env);
    if(url.pathname==='/v1/rollback'&&request.method==='POST')return rollback(request,env);
    const match=url.pathname.match(/^\/preview\/(\d+)$/);if(match&&request.method==='GET')return preview(request,env,match[1]);
    return json({ok:false,error:'not_found'},404);
  }catch(error){console.error(JSON.stringify({event:'staging_publisher_failed',error:String(error?.message||error)}));return json({ok:false,error:'failed_closed'},500)}
}};
