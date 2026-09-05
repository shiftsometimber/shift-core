const PATH='/v1/continuity-interest';
const ALLOWED_INTENTS=new Set(['considering','using','disrupted','stopping','unspecified']);
const ALLOWED_SOURCES=new Set(['home','start-here','programme','programme-benefits','treatment-centre','clinic-gone-quiet','founding-members','unknown']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(value,max=180)=>String(value??'').trim().slice(0,max);
const normaliseEmail=value=>clean(value,254).toLowerCase();
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)&&value.length<=254;

async function hash(value){const data=new TextEncoder().encode(String(value));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function ensureSchema(DB){await DB.batch([
  DB.prepare(`CREATE TABLE IF NOT EXISTS continuity_interest (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,first_name TEXT,intent TEXT NOT NULL DEFAULT 'unspecified',source TEXT NOT NULL DEFAULT 'unknown',consent_version TEXT NOT NULL,consented_at TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,withdrawn_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS continuity_interest_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT,ip_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_continuity_interest_attempts ON continuity_interest_attempts(ip_hash,created_at)`)
])}

async function rateLimited(request,DB){
  const ip=clean(request.headers.get('CF-Connecting-IP')||request.headers.get('X-Forwarded-For')||'unknown',80);
  const ipHash=await hash(ip);const row=await DB.prepare(`SELECT COUNT(*) count FROM continuity_interest_attempts WHERE ip_hash=? AND created_at>=datetime('now','-1 hour')`).bind(ipHash).first();
  if(Number(row?.count||0)>=8)return true;
  await DB.prepare(`INSERT INTO continuity_interest_attempts(ip_hash) VALUES(?)`).bind(ipHash).run();
  await DB.prepare(`DELETE FROM continuity_interest_attempts WHERE created_at<datetime('now','-2 days')`).run().catch(()=>{});
  return false;
}

export async function continuityInterestRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(path!==PATH)return null;
  if(request.method==='OPTIONS')return null;
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  if(!env.DB)return json({ok:false,error:'capture_unavailable'},503);
  await ensureSchema(env.DB);
  if(await rateLimited(request,env.DB))return json({ok:false,error:'rate_limited',message:'Too many attempts. Please try again later.'},429);
  const body=await request.json().catch(()=>({})),email=normaliseEmail(body.email),firstName=clean(body.first_name,80),intent=ALLOWED_INTENTS.has(body.intent)?body.intent:'unspecified',source=ALLOWED_SOURCES.has(body.source)?body.source:'unknown';
  if(!validEmail(email))return json({ok:false,error:'valid_email_required',message:'Enter a valid email address.'},400);
  if(body.consent!==true)return json({ok:false,error:'consent_required',message:'Please confirm that Shift may email you about supply and continuity updates.'},400);
  const stamp=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO continuity_interest(email,first_name,intent,source,consent_version,consented_at,active,withdrawn_at,created_at,updated_at) VALUES(?,?,?,?,?,?,1,NULL,?,?) ON CONFLICT(email) DO UPDATE SET first_name=COALESCE(NULLIF(excluded.first_name,''),continuity_interest.first_name),intent=excluded.intent,source=excluded.source,consent_version=excluded.consent_version,consented_at=excluded.consented_at,active=1,withdrawn_at=NULL,updated_at=excluded.updated_at`).bind(email,firstName,intent,source,'continuity-interest-v1',stamp,stamp,stamp).run();
  return json({ok:true,status:'registered',message:'You are on the updates list. No purchase, stock or treatment eligibility is promised.'},201);
}
