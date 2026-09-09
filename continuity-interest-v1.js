import {sendTransactionalEmail,medicineEmailTemplates} from './transactional-email-v1.js';

const INTEREST_PATH='/v1/continuity-interest';
const CONTACT_PATH='/v1/contact';
const ALLOWED_INTENTS=new Set(['considering','using','disrupted','stopping','unspecified']);
const ALLOWED_SOURCES=new Set(['home','start-here','programme','programme-benefits','treatment-centre','clinic-gone-quiet','founding-members','unknown']);
const CONTACT_TYPES=new Map([
  ['general','general'],['general question','general'],['support','support'],['customer support','support'],
  ['order','orders'],['orders','orders'],['delivery','orders'],['clinical','clinical'],['clinical enquiry','clinical'],
  ['complaint','complaint'],['complaints','complaint'],['privacy','privacy'],['partner','partner'],['partnership','partner'],
  ['press','press'],['media','press'],['finance','finance'],['accounts','accounts'],['feedback','feedback'],['it','it']
]);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(value,max=180)=>String(value??'').trim().slice(0,max);
const normaliseEmail=value=>clean(value,254).toLowerCase();
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)&&value.length<=254;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
async function handleContact(request,env){
  if(!env.DB)return json({ok:false,error:'capture_unavailable'},503);
  await ensureSchema(env.DB);
  if(await rateLimited(request,env.DB))return json({ok:false,error:'rate_limited',message:'Too many attempts. Please try again later.'},429);
  const body=await request.json().catch(()=>({}));
  const name=clean(body.name||body.first_name,100),email=normaliseEmail(body.email),message=clean(body.message,5000),rawType=clean(body.type||body.enquiry_type||'general',80).toLowerCase();
  const eventType=CONTACT_TYPES.get(rawType)||'general';
  if(!validEmail(email))return json({ok:false,error:'valid_email_required',message:'Enter a valid email address.'},400);
  if(!message)return json({ok:false,error:'message_required',message:'Enter a message.'},400);
  if(body.consent!==true)return json({ok:false,error:'consent_required',message:'Please confirm Shift may use these details to respond to your enquiry.'},400);
  const subject=`SHIFT enquiry — ${rawType||'general'}`.slice(0,180);
  const text=`New website enquiry\n\nName: ${name||'Not supplied'}\nEmail: ${email}\nEnquiry: ${rawType||'general'}\n\n${message}`;
  const html=`<h1>New website enquiry</h1><p><strong>Name:</strong> ${esc(name||'Not supplied')}<br><strong>Email:</strong> ${esc(email)}<br><strong>Enquiry:</strong> ${esc(rawType||'general')}</p><p>${esc(message).replace(/\n/g,'<br>')}</p>`;
  const results=await sendTransactionalEmail(env,{to:email,eventType,internalNotify:true,includeMatt:false,subject,text,html});
  if(results.some(r=>r.status==='failed'||r.status==='binding_missing'))return json({ok:false,error:'delivery_failed',message:'We could not send your message. Please try again.'},503);
  return json({ok:true,status:'sent',message:'Message sent. Shift has it — no email app needed.'},201);
}

export async function continuityInterestRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!==INTEREST_PATH&&path!==CONTACT_PATH)return null;
  if(request.method==='OPTIONS')return null;
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  if(path===CONTACT_PATH)return handleContact(request,env);
  if(!env.DB)return json({ok:false,error:'capture_unavailable'},503);
  await ensureSchema(env.DB);
  if(await rateLimited(request,env.DB))return json({ok:false,error:'rate_limited',message:'Too many attempts. Please try again later.'},429);
  const body=await request.json().catch(()=>({})),email=normaliseEmail(body.email),firstName=clean(body.first_name,80),intent=ALLOWED_INTENTS.has(body.intent)?body.intent:'unspecified',source=ALLOWED_SOURCES.has(body.source)?body.source:'unknown';
  if(!validEmail(email))return json({ok:false,error:'valid_email_required',message:'Enter a valid email address.'},400);
  if(body.consent!==true)return json({ok:false,error:'consent_required',message:'Please confirm that Shift may email you about supply and continuity updates.'},400);
  const stamp=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO continuity_interest(email,first_name,intent,source,consent_version,consented_at,active,withdrawn_at,created_at,updated_at) VALUES(?,?,?,?,?,?,1,NULL,?,?) ON CONFLICT(email) DO UPDATE SET first_name=COALESCE(NULLIF(excluded.first_name,''),continuity_interest.first_name),intent=excluded.intent,source=excluded.source,consent_version=excluded.consent_version,consented_at=excluded.consented_at,active=1,withdrawn_at=NULL,updated_at=excluded.updated_at`).bind(email,firstName,intent,source,'continuity-interest-v1',stamp,stamp,stamp).run();
  const mail=medicineEmailTemplates.interestNotify({});
  await sendTransactionalEmail(env,{to:email,eventType:mail.eventType,internalNotify:true,includeMatt:true,subject:mail.subject,text:mail.text,html:mail.html});
  return json({ok:true,status:'registered',message:'You are on the updates list. No purchase, stock or treatment eligibility is promised.'},201);
}
