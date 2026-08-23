import legacy from './hq-ai.js';
import {watchtowerSnapshot} from './watchtower-v1.js';
import {outcomesSnapshot} from './outcomes-v1.js';
import {memberJourneySnapshot} from './journey-analytics-v1.js';

export default{async fetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  const readPaths=['/v1/hq/watchtower','/v1/hq/outcomes','/v1/hq/journey','/v1/hq/attention'];
  const ack=path.match(/^\/v1\/hq\/attention\/([a-zA-Z0-9_-]+)\/ack$/);
  if((request.method==='GET'&&readPaths.includes(path))||(request.method==='POST'&&ack)){
    const auth=await legacy.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!auth.ok)return auth;
    const authData=await auth.clone().json().catch(()=>({}));const actor=authData.user||{};
    if(request.method==='POST'&&ack)return acknowledgeAttention(env,actor,ack[1],await readJson(request));
    if(path==='/v1/hq/outcomes')return json(await outcomesSnapshot(env.DB));
    if(path==='/v1/hq/journey')return json(await memberJourneySnapshot(env.DB));
    const w=await watchtowerSnapshot(env);
    if(path==='/v1/hq/attention')return json(await attentionWithActions(env,w));
    return json(w);
  }
  return legacy.fetch(request,env,ctx)
}};

export async function ensureAttentionActions(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS hq_attention_actions (id INTEGER PRIMARY KEY AUTOINCREMENT,alert_code TEXT NOT NULL,hq_user_id INTEGER,operator_email TEXT,action TEXT NOT NULL DEFAULT 'acknowledged',note TEXT,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,resolved_at TEXT)`).run();await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_hq_attention_actions_code ON hq_attention_actions(alert_code,status,updated_at)`).run()}
export async function acknowledgeAttention(env,actor,code,body={}){await ensureAttentionActions(env.DB);const note=String(body.note||'').trim().slice(0,1000),status=body.status==='resolved'?'resolved':'acknowledged',now=new Date().toISOString();await env.DB.prepare(`INSERT INTO hq_attention_actions(alert_code,hq_user_id,operator_email,action,note,status,created_at,updated_at,resolved_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(String(code),actor?.id||null,actor?.email||null,'acknowledged',note,status,now,now,status==='resolved'?now:null).run();return json({ok:true,alertCode:String(code),status,operator:{id:actor?.id||null,email:actor?.email||null},persisted:true})}
export async function attentionWithActions(env,w){await ensureAttentionActions(env.DB);const {results=[]}=await env.DB.prepare(`SELECT alert_code,operator_email,action,note,status,updated_at,resolved_at FROM hq_attention_actions ORDER BY id DESC LIMIT 200`).all();const latest=new Map();for(const x of results)if(!latest.has(x.alert_code))latest.set(x.alert_code,x);return{ok:w.ok,status:w.status,generatedAt:w.generatedAt,summary:w.summary,attention:(w.attention||[]).map(a=>({...a,operatorAction:latest.get(a.code)||null})),operatorActions:results}}
async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
