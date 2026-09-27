import {authenticateMember} from './member-state-fast-v1.js';
import {trackingConsent,TRACKING_CONSENT} from './member-experience/health-routes.mjs';

const STATUSES=new Set(['done','not_today','paused_off']);
const FEELS=new Set(['fine','rough','want_door']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const localDate=request=>{const value=String(request.headers.get('X-Shift-Local-Date')||new Date().toISOString().slice(0,10));return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:new Date().toISOString().slice(0,10)};
const cleanNote=value=>String(value??'').trim().slice(0,280);

async function ensure(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS member_pen_day_notes (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,status TEXT NOT NULL,feel TEXT,note TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date));CREATE INDEX IF NOT EXISTS idx_pen_day_member_date ON member_pen_day_notes(user_id,local_date DESC);`)}
const view=row=>row?{date:row.local_date,status:row.status,feel:row.feel||null,note:row.note||'',updatedAt:row.updated_at}:null;

export async function penDayRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/pen-day'||!['GET','POST'].includes(request.method))return null;
  const origin=request.headers.get('Origin');
  if(request.method==='POST'&&origin&&origin!==new URL(request.url).origin&&!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com'].includes(origin))return json({ok:false,error:'origin_not_allowed'},403);
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  await ensure(env.DB);const date=localDate(request);
  if(request.method==='GET'){
    const [today,history]=await Promise.all([
      env.DB.prepare(`SELECT local_date,status,feel,note,updated_at FROM member_pen_day_notes WHERE user_id=? AND local_date=?`).bind(auth.user.id,date).first(),
      env.DB.prepare(`SELECT local_date,status,feel,note,updated_at FROM member_pen_day_notes WHERE user_id=? ORDER BY local_date DESC LIMIT 8`).bind(auth.user.id).all()
    ]);
    return json({ok:true,date,today:view(today),history:(history.results||[]).map(view)});
  }
  if(!await trackingConsent(env.DB,auth.userId))return json({ok:false,error:'health_consent_required',message:'Optional health tracking is off. Review your choice before saving.'},409);
  const body=await request.json().catch(()=>null),status=String(body?.status||''),feel=body?.feel==null||body.feel===''?null:String(body.feel),note=cleanNote(body?.note);
  if(!STATUSES.has(status)||feel&&!FEELS.has(feel))return json({ok:false,error:'invalid_pen_day_note'},400);
  if(status!=='done'&&feel)return json({ok:false,error:'feel_requires_done'},400);
  const stamp=new Date().toISOString();
  // Recheck consent inside the write: withdrawal from another tab wins even
  // when it happens after this request's initial check.
  const result=await env.DB.prepare(`INSERT INTO member_pen_day_notes(user_id,local_date,status,feel,note,created_at,updated_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT granted FROM consents WHERE user_id=? AND consent_type=? ORDER BY id DESC LIMIT 1)=1 ON CONFLICT(user_id,local_date) DO UPDATE SET status=excluded.status,feel=excluded.feel,note=excluded.note,updated_at=excluded.updated_at`).bind(auth.userId,date,status,feel,note,stamp,stamp,auth.userId,TRACKING_CONSENT).run();
  if(Number(result?.meta?.changes)!==1)return json({ok:false,error:'health_consent_required',message:'Health tracking was switched off. This entry was not saved.'},409);
  // Medication status and how someone feels belong only in their private
  // record, not in usage analytics (including the event name).
  return json({ok:true,date,today:{date,status,feel,note,updatedAt:stamp}});
}

export const penDayInternals={STATUSES,FEELS,cleanNote};

export async function appendPenDayExport(request,env,response){
  if(new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const payload=await response.json();
  for(const [key,table,filter]of [['penDayNotes','member_pen_day_notes',''],['penDayLegacyEvents','product_events'," AND event_name IN ('pen_day_done','pen_day_rough','pen_day_status_saved','pen_day_door_click')"]]){
    const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
    payload[key]=exists?(await env.DB.prepare(`SELECT * FROM ${table} WHERE user_id=?${filter} ORDER BY id`).bind(auth.userId).all()).results||[]:[];
  }
  return json(payload);
}
