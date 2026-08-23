import core from './worker.js';
import hq from './hq-ai.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const safe=(v,d={})=>{try{return typeof v==='string'?JSON.parse(v):v??d}catch{return d}};
let graphSchemaReady=false;

async function ensureGraphSchema(DB){
 if(graphSchemaReady)return;
 await DB.batch([
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_knowledge_nodes (id TEXT PRIMARY KEY,node_type TEXT NOT NULL,domain TEXT NOT NULL,label TEXT NOT NULL,data_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'active',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_knowledge_edges (id INTEGER PRIMARY KEY AUTOINCREMENT,from_id TEXT NOT NULL,edge_type TEXT NOT NULL,to_id TEXT NOT NULL,weight REAL NOT NULL DEFAULT 1,data_json TEXT NOT NULL DEFAULT '{}',UNIQUE(from_id,edge_type,to_id))`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_knowledge_sources (id INTEGER PRIMARY KEY AUTOINCREMENT,node_id TEXT NOT NULL,source_type TEXT NOT NULL,source_ref TEXT NOT NULL,authority INTEGER DEFAULT 50,verified_at TEXT,expires_at TEXT,provenance_json TEXT NOT NULL DEFAULT '{}')`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_kg_type ON shift_knowledge_nodes(node_type,domain)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_kg_edge_from ON shift_knowledge_edges(from_id,edge_type)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_kg_edge_to ON shift_knowledge_edges(to_id,edge_type)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_kg_sources_node ON shift_knowledge_sources(node_id,authority)`)
 ]);
 graphSchemaReady=true;
}

export async function knowledgeRoutes(request,env,ctx){
 const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',m=request.method.toUpperCase();
 if(!p.startsWith('/v1/shift/knowledge')&&!p.startsWith('/v1/hq/knowledge-graph'))return null;
 await ensureGraphSchema(env.DB);
 if(p.startsWith('/v1/hq/')){const a=await hqAuth(request,env,ctx);if(a.response)return a.response;if(m==='POST'&&p==='/v1/hq/knowledge-graph/ingest')return ingest(request,env,a.user);if(m==='GET'&&p==='/v1/hq/knowledge-graph/stats')return stats(env);}
 const a=await userAuth(request,env,ctx);if(a.response)return a.response;
 if(m==='GET'&&p==='/v1/shift/knowledge/related')return related(env,u.searchParams.get('id'),Number(u.searchParams.get('depth')||2));
 if(m==='GET'&&p==='/v1/shift/knowledge/search')return search(env,u.searchParams.get('q')||'',Number(u.searchParams.get('limit')||20));
 return json({ok:false,error:'not_found'},404);
}
async function userAuth(r,e,c){const x=await core.fetch(new Request(new URL('/v1/me',r.url),{method:'GET',headers:r.headers}),e,c);return x.ok?{user:(await x.json()).user}:{response:x}}
async function hqAuth(r,e,c){const x=await hq.fetch(new Request(new URL('/v1/hq/me',r.url),{method:'GET',headers:r.headers}),e,c);return x.ok?{user:(await x.json()).user}:{response:x}}
function validate(item){if(!item?.id||!item?.type||!item?.label)return{ok:false,reason:'identity_required'};if(item.domain==='health'&&!item.provenance?.verified)return{ok:false,reason:'health_knowledge_requires_verified_provenance'};return{ok:true}}
export async function upsertKnowledge(env,item){await ensureGraphSchema(env.DB);const v=validate(item);if(!v.ok)return{accepted:false,reason:v.reason};await env.DB.prepare(`INSERT INTO shift_knowledge_nodes(id,node_type,domain,label,data_json,status,updated_at) VALUES(?,?,?,?,?,'active',CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET node_type=excluded.node_type,domain=excluded.domain,label=excluded.label,data_json=excluded.data_json,status='active',updated_at=CURRENT_TIMESTAMP`).bind(String(item.id),String(item.type),String(item.domain||'general'),String(item.label),JSON.stringify(item.data||{})).run();for(const s of item.sources||[])await env.DB.prepare(`INSERT INTO shift_knowledge_sources(node_id,source_type,source_ref,authority,verified_at,expires_at,provenance_json) VALUES(?,?,?,?,?,?,?)`).bind(String(item.id),String(s.type||'source'),String(s.ref||s.url||''),Number(s.authority||50),s.verified_at||null,s.expires_at||null,JSON.stringify(s.provenance||{})).run();for(const e of item.edges||[])if(e.to&&e.type)await env.DB.prepare(`INSERT INTO shift_knowledge_edges(from_id,edge_type,to_id,weight,data_json) VALUES(?,?,?,?,?) ON CONFLICT(from_id,edge_type,to_id) DO UPDATE SET weight=excluded.weight,data_json=excluded.data_json`).bind(String(item.id),String(e.type),String(e.to),Number(e.weight||1),JSON.stringify(e.data||{})).run();return{accepted:true,id:item.id}}
async function ingest(request,env,user){const b=await read(request),items=Array.isArray(b.items)?b.items:[b.item||b],results=[];for(const item of items.slice(0,250))results.push(await upsertKnowledge(env,item));return json({ok:true,actor:user.email||user.name,results},201)}
async function related(env,id,depth){await ensureGraphSchema(env.DB);if(!id)return json({ok:false,error:'id_required'},400);depth=Math.max(1,Math.min(4,depth));const root=await env.DB.prepare('SELECT * FROM shift_knowledge_nodes WHERE id=? AND status=?').bind(id,'active').first();if(!root)return json({ok:false,error:'node_not_found'},404);const seen=new Set([id]),frontier=[id],nodes=[],edges=[];for(let d=0;d<depth&&frontier.length;d++){const next=[];for(const cur of frontier){const {results}=await env.DB.prepare(`SELECT e.*,n.id n_id,n.node_type,n.domain,n.label,n.data_json,n.status FROM shift_knowledge_edges e JOIN shift_knowledge_nodes n ON n.id=CASE WHEN e.from_id=? THEN e.to_id ELSE e.from_id END WHERE (e.from_id=? OR e.to_id=?) AND n.status='active' LIMIT 250`).bind(cur,cur,cur).all();for(const r of results||[]){edges.push({from:r.from_id,type:r.edge_type,to:r.to_id,weight:r.weight,data:safe(r.data_json,{})});if(!seen.has(r.n_id)){seen.add(r.n_id);nodes.push({id:r.n_id,type:r.node_type,domain:r.domain,label:r.label,data:safe(r.data_json,{})});next.push(r.n_id)}}}frontier.splice(0,frontier.length,...next)}return json({ok:true,root:{id:root.id,type:root.node_type,domain:root.domain,label:root.label,data:safe(root.data_json,{})},nodes,edges})}
async function search(env,q,limit){await ensureGraphSchema(env.DB);q=String(q).trim().slice(0,200);if(!q)return json({ok:true,nodes:[]});limit=Math.max(1,Math.min(50,limit));const like=`%${q.replace(/[%_]/g,'')}%`,{results}=await env.DB.prepare(`SELECT id,node_type,domain,label,data_json,updated_at FROM shift_knowledge_nodes WHERE status='active' AND (label LIKE ? OR data_json LIKE ?) ORDER BY updated_at DESC LIMIT ?`).bind(like,like,limit).all();return json({ok:true,nodes:(results||[]).map(x=>({...x,data:safe(x.data_json,{})}))})}
async function stats(env){await ensureGraphSchema(env.DB);const [n,e,s]=await Promise.all([env.DB.prepare(`SELECT COUNT(*) c FROM shift_knowledge_nodes WHERE status='active'`).first(),env.DB.prepare(`SELECT COUNT(*) c FROM shift_knowledge_edges`).first(),env.DB.prepare(`SELECT COUNT(*) c FROM shift_knowledge_sources`).first()]);return json({ok:true,nodes:Number(n?.c||0),edges:Number(e?.c||0),sources:Number(s?.c||0)})}
async function read(r){try{return await r.json()}catch{return{}}}
