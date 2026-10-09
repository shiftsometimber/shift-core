import {continuityScorecard} from './continuity-measurement/scorecard.mjs';
import legacy from './hq-ai.js';
import {watchtowerSnapshot} from './watchtower-v1.js';
import {outcomesSnapshot} from './outcomes-v1.js';
import {memberJourneySnapshot} from './journey-analytics-v1.js';
import {distributionScorecard} from './distribution-measurement/scorecard.mjs';

export default{async fetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  const readPaths=['/v1/hq/continuity','/v1/hq/watchtower','/v1/hq/outcomes','/v1/hq/journey','/v1/hq/distribution','/v1/hq/attention'];
  const distributionPage=request.method==='GET'&&path==='/hq/distribution';
  const ack=path.match(/^\/v1\/hq\/attention\/([a-zA-Z0-9_-]+)\/ack$/);
  if((request.method==='GET'&&readPaths.includes(path))||distributionPage||(request.method==='POST'&&ack)){
    const auth=await legacy.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!auth.ok)return auth;
    const authData=await auth.clone().json().catch(()=>({}));const actor=authData.user||{};
    if(distributionPage)return distributionPortal();
    if(request.method==='POST'&&ack)return acknowledgeAttention(env,actor,ack[1],await readJson(request));
    if(path==='/v1/hq/outcomes')return json(await outcomesSnapshot(env.DB));
    if(path==='/v1/hq/continuity')return json(await continuityScorecard(env.DB,{days:new URL(request.url).searchParams.get('days')??90}));
    if(path==='/v1/hq/journey')return json(await memberJourneySnapshot(env.DB,{days:new URL(request.url).searchParams.get('days')??30}));
    if(path==='/v1/hq/distribution')return json(await distributionScorecard(env.DB,{days:new URL(request.url).searchParams.get('days')??30}));
    const w=await watchtowerSnapshot(env);
    if(path==='/v1/hq/attention')return json(await attentionWithActions(env,w));
    return json(w);
  }
  return legacy.fetch(request,env,ctx)
}};

export async function ensureAttentionActions(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS hq_attention_actions (id INTEGER PRIMARY KEY AUTOINCREMENT,alert_code TEXT NOT NULL,hq_user_id INTEGER,operator_email TEXT,action TEXT NOT NULL DEFAULT 'acknowledged',note TEXT,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,resolved_at TEXT)`).run();await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_hq_attention_actions_code ON hq_attention_actions(alert_code,status,updated_at)`).run()}
export async function acknowledgeAttention(env,actor,code,body={}){await ensureAttentionActions(env.DB);const note=String(body.note||'').trim().slice(0,1000),status=body.status==='resolved'?'resolved':'acknowledged',now=new Date().toISOString();await env.DB.prepare(`INSERT INTO hq_attention_actions(alert_code,hq_user_id,operator_email,action,note,status,created_at,updated_at,resolved_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(String(code),actor?.id||null,actor?.email||null,'acknowledged',note,status,now,now,status==='resolved'?now:null).run();return json({ok:true,alertCode:String(code),status,operator:{id:actor?.id||null,email:actor?.email||null},persisted:true})}
export async function attentionWithActions(env,w){await ensureAttentionActions(env.DB);const {results=[]}=await env.DB.prepare(`SELECT alert_code,operator_email,action,note,status,updated_at,resolved_at FROM hq_attention_actions ORDER BY id DESC LIMIT 200`).all();const latest=new Map();for(const x of results)if(!latest.has(x.alert_code))latest.set(x.alert_code,x);return{ok:w.ok,status:w.status,generatedAt:w.generatedAt,summary:w.summary,attention:(w.attention||[]).map(a=>({...a,operatorAction:latest.get(a.code)||null})),operatorActions:results}}
function distributionPortal(){return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Distribution · SHIFT HQ</title><style>body{margin:0;background:#050505;color:#e7e3da;font:16px/1.5 system-ui}main{max-width:1100px;margin:auto;padding:28px}a{color:#e7e3da}.muted{color:#aaa69d}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.toolbar button{border:1px solid #707762;background:#707762;color:#050505;border-radius:999px;padding:9px 14px;font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:18px 0}.card,.panel{border:1px solid #707762;border-radius:15px;padding:18px}.card strong{font-size:2rem;display:block}.panel{margin:18px 0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px;border-bottom:1px solid #34372f}.ok{color:#bccba9}.warn{color:#e6c98d}</style></head><body><main><p class="muted">SHIFT HQ · DISTRIBUTION</p><h1>Organic &amp; My Timber distribution</h1><p>Aggregate first-party registrations and product proof. Public page views/clicks remain separate consented GA4 evidence and are not joined to member identities.</p><div class="toolbar"><span>Window:</span><button data-days="30">30 days</button><button data-days="90">90 days</button><a href="/hq/commerce-content-controls">HQ controls</a></div><div id="status" class="muted" role="status">Loading…</div><div id="app"></div></main><script>
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=x=>x&&x.ratePct!=null?x.ratePct+'%':x&&x.status?esc(x.status):'—';
async function load(days){const status=document.querySelector('#status'),app=document.querySelector('#app');status.textContent='Loading '+days+'-day view…';try{const r=await fetch('/v1/hq/distribution?days='+days,{credentials:'include',cache:'no-store'}),b=await r.json();if(!r.ok||!b.available)throw Error(b.reason||b.error||'Distribution evidence unavailable');const s=b.registrations.fromWeightLossSupport,h=b.registrations.fromSomeoneWhoCares,a=b.afterTreatment||{},sources=b.acquisition?.sources||[];app.innerHTML='<div class="grid">'+
'<div class="card"><span>Support-page registrations</span><strong>'+s.registered+'</strong><small>'+s.verified+' verified · '+s.signedIn+' signed in · '+s.todayStarted+' reached Today</small></div>'+
'<div class="card"><span>Someone-who-cares registrations</span><strong>'+h.registered+'</strong><small>'+h.verified+' verified · '+h.signedIn+' signed in · '+h.todayStarted+' reached Today</small></div>'+
'<div class="card"><span>After-treatment starters</span><strong>'+(a.starters??'—')+'</strong><small>12-week support starts</small></div>'+
'<div class="card"><span>Mature week-4 return</span><strong>'+pct(a.week4)+'</strong><small>'+(a.week4?.numerator??0)+' / '+(a.week4?.denominator??0)+' eligible</small></div>'+
'<div class="card"><span>Answered steps marked helpful</span><strong>'+pct(a.helped)+'</strong><small>'+(a.helped?.numerator??0)+' / '+(a.helped?.denominator??0)+' answered</small></div></div>'+
'<div class="panel"><h2>Consented first-touch acquisition</h2>'+(sources.length?'<table><thead><tr><th>Source</th><th>Medium</th><th>Registered</th><th>Activated</th></tr></thead><tbody>'+sources.map(x=>'<tr><td>'+esc(x.source)+'</td><td>'+esc(x.medium)+'</td><td>'+x.registered+'</td><td>'+x.activated+'</td></tr>').join('')+'</tbody></table>':'<p class="muted">No attributed registrations in this window.</p>')+'</div>'+
'<div class="panel"><h2>Measurement boundary</h2><p>'+esc(b.publicAnalytics.note)+'</p><p class="muted">'+b.limitations.map(esc).join(' · ')+'</p></div>';status.textContent='As of '+new Date(b.asOf).toLocaleString('en-GB')+' · '+days+' days';}catch(e){app.innerHTML='';status.className='warn';status.textContent=e.message}}
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>load(+b.dataset.days));load(30);
</script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}})}
async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
