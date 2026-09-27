import {createHash,timingSafeEqual} from 'node:crypto';

const clean=(value,max=40000)=>String(value??'').trim().slice(0,max);
const sha=value=>createHash('sha256').update(String(value)).digest('hex');
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const bearer=request=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
function secure(request,secret){const a=Buffer.from(bearer(request)),b=Buffer.from(String(secret||''));return b.length>31&&a.length===b.length&&timingSafeEqual(a,b)}
async function schema(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS evidence_desk_staging_deliveries(id INTEGER PRIMARY KEY AUTOINCREMENT,destination TEXT NOT NULL,copy_sha256 TEXT NOT NULL,payload_sha256 TEXT NOT NULL,payload_json TEXT NOT NULL,idempotency_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'published',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run()}

export default{async fetch(request,env){
  try{
    await schema(env.DB);const url=new URL(request.url),preview=url.pathname.match(/^\/preview\/(\d+)$/);
    if(preview&&request.method==='GET'){
      const row=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_deliveries WHERE id=?`).bind(Number(preview[1])).first();if(!row)return new Response('Not found',{status:404});
      return new Response(`<!doctype html><meta name="robots" content="noindex,nofollow"><title>Staging distribution preview</title><h1>NON-PRODUCTION ${clean(row.destination,30)} PREVIEW</h1><pre>${clean(row.payload_json,40000).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre>`,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
    }
    const match=url.pathname.match(/^\/v1\/(newsletter|facebook|instagram|linkedin|x)$/);if(!match||request.method!=='POST')return json({ok:false,error:'not_found'},404);
    if(!secure(request,env.STAGING_DISTRIBUTION_TOKEN))return json({ok:false,error:'unauthorized'},401);
    const raw=await request.text(),input=JSON.parse(raw),destination=match[1],copySha=clean(input.sourceCopySha256,64),payloadSha=sha(raw),key=clean(request.headers.get('idempotency-key'),300);
    if(!/^[a-f0-9]{64}$/.test(copySha)||!key||clean(request.headers.get('x-payload-sha256'),64)!==payloadSha)return json({ok:false,error:'distribution_contract_invalid'},400);
    const existing=await env.DB.prepare(`SELECT * FROM evidence_desk_staging_deliveries WHERE idempotency_key=?`).bind(key).first();
    const row=existing||await env.DB.prepare(`INSERT INTO evidence_desk_staging_deliveries(destination,copy_sha256,payload_sha256,payload_json,idempotency_key) VALUES(?,?,?,?,?) RETURNING *`).bind(destination,copySha,payloadSha,raw,key).first();
    const ref=`${clean(env.STAGING_DISTRIBUTOR_PUBLIC_URL,500)||url.origin}/preview/${row.id}`;
    return json({published:true,idempotent:!!existing,url:ref,messageId:String(row.id),postId:String(row.id),copySha256:copySha,payloadSha256:payloadSha});
  }catch(error){console.error(JSON.stringify({event:'staging_distribution_failed',error:String(error?.message||error)}));return json({ok:false,error:'failed_closed'},500)}
}};
