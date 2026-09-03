import {readRadarFreshness} from './radar-freshness-v2.js';
import {RADAR_MEDICINE_SEED} from './radar-medicine-seed-v1.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60, stale-while-revalidate=240','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'}});
const safe=(value,fallback={})=>{try{return typeof value==='string'?JSON.parse(value):value??fallback}catch{return fallback}};
const medicine=row=>({...row,mechanism:safe(row.mechanism_json,[]),regions:safe(row.regions_json,[]),provenance:safe(row.provenance_json,{})});
const evidenceDate=row=>safe(row.source_evidence_json,[]).map(x=>x.source_date).filter(Boolean).sort().at(-1)||null;
const contentFor=row=>safe(row.content_package_json,{});
const destinationsFor=row=>safe(contentFor(row).destinations,[]);
const hasDestination=(row,name)=>destinationsFor(row).includes(name);
const publishedAt=row=>row.reviewed_at||row.updated_at;
const publicEvent=row=>{const content=contentFor(row),evidence=safe(row.source_evidence_json,[]);return{id:row.id,headline:content.headline||row.headline,standfirst:content.standfirst||'',what_changed:content.what_changed||'',uk_meaning:content.why_it_matters_to_uk||'',known_facts:content.known_facts||[],unknowns:content.unknowns||[],safety:content.safety||'',article_markdown:content.article_markdown||'',metadata:content.seo||{},ticker_line:content.ticker_line||content.headline||row.headline,region:row.region,event_type:row.event_type,evidence_level:Math.min(...evidence.map(x=>Number(x.source_tier)||4),4),sources:evidence.map(x=>({authority:x.authority,title:x.title,url:x.url,source_published_at:x.source_date,retrieved_at:x.retrieved_at})),source_published_at:evidenceDate(row),published_at:publishedAt(row),destinations:destinationsFor(row)}};

async function ensureMedicineRegistry(DB){
 await DB.prepare(`CREATE TABLE IF NOT EXISTS radar_medicines (id TEXT PRIMARY KEY,brand TEXT,generic_name TEXT,developer TEXT,mechanism_json TEXT NOT NULL DEFAULT '[]',formulation TEXT,global_stage TEXT,uk_regulatory_status TEXT,uk_commercial_status TEXT,nice_status TEXT,nhs_status TEXT,latest_update_text TEXT,radar_score INTEGER DEFAULT 50,regions_json TEXT NOT NULL DEFAULT '[]',last_verified_at TEXT,provenance_json TEXT NOT NULL DEFAULT '{}',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 const row=await DB.prepare(`SELECT COUNT(*) AS count FROM radar_medicines`).first();if(Number(row?.count||0)>0)return;
 const now=new Date().toISOString();
 await DB.batch(RADAR_MEDICINE_SEED.map(x=>DB.prepare(`INSERT OR IGNORE INTO radar_medicines (id,brand,generic_name,developer,mechanism_json,formulation,global_stage,uk_regulatory_status,uk_commercial_status,nice_status,nhs_status,latest_update_text,radar_score,regions_json,last_verified_at,provenance_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(x.id,x.brand,x.generic_name,x.developer,JSON.stringify(x.mechanism||[]),x.formulation,x.global_stage,x.uk_regulatory_status||null,null,x.nice_status||null,x.nhs_status||null,x.latest_update_text,x.radar_score,JSON.stringify(x.regions||[]),x.verified_at,JSON.stringify({authority:x.authority,registry:'radar-medicine-seed-v1'}),now)));
}
export function sortPublishedEvents(rows=[]){return [...rows].sort((a,b)=>String(publishedAt(b)).localeCompare(String(publishedAt(a)))||String(evidenceDate(b)||'').localeCompare(String(evidenceDate(a)||''))||Number(b.id)-Number(a.id))}
async function publishedEvents(DB,limit=100){const {results=[]}=await DB.prepare(`SELECT id,headline,region,event_type,urgency_score,content_package_json,source_evidence_json,reviewed_at,updated_at FROM radar_events WHERE status='published' ORDER BY COALESCE(reviewed_at,updated_at) DESC, id DESC LIMIT ?`).bind(limit).all();return sortPublishedEvents(results)}

export async function radarPublicRoutes(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';if(request.method!=='GET'||!path.startsWith('/v1/radar/'))return null;
 if(path==='/v1/radar/news'){const rows=await publishedEvents(env.DB,200);return json({ok:true,items:rows.filter(row=>hasDestination(row,'medicine_news')).map(publicEvent)});}
 if(path==='/v1/radar/ticker'){
  const freshness=await readRadarFreshness(env.DB),surface=url.searchParams.get('surface')==='treatments'?'ticker_treatments':'ticker_knowledge',rows=await publishedEvents(env.DB,50);
  const items=rows.filter(row=>hasDestination(row,surface)).slice(0,12).map(row=>{const item=publicEvent(row);return{id:item.id,headline:item.ticker_line,story_headline:item.headline,source_published_at:item.source_published_at,published_at:item.published_at,url:item.metadata?.slug?`/${String(item.metadata.slug).replace(/^\//,'')}`:'/medicine-news'}});
  return json({ok:true,current:freshness.current,status:freshness.status,freshness,message:items.length?null:'No approved current SHIFT AI headlines.',items});
 }
 if(path==='/v1/radar/cards'){await ensureMedicineRegistry(env.DB);const {results=[]}=await env.DB.prepare(`SELECT id,brand,generic_name,developer,formulation,global_stage,uk_regulatory_status,uk_commercial_status,nice_status,nhs_status,latest_update_text,radar_score,mechanism_json,regions_json,last_verified_at,provenance_json FROM radar_medicines ORDER BY radar_score DESC,brand ASC LIMIT 200`).all();return json({ok:true,cards:results.map(medicine)});}
 const match=path.match(/^\/v1\/radar\/medicines\/([a-z0-9-]+)$/i);if(match){await ensureMedicineRegistry(env.DB);const id=match[1].toLowerCase(),row=await env.DB.prepare(`SELECT * FROM radar_medicines WHERE id=?`).bind(id).first();if(!row)return json({ok:false,error:'medicine_not_found'},404);const updates=(await publishedEvents(env.DB,200)).filter(event=>String(event.content_package_json).includes(`\"medicine_id\":\"${id}\"`)||String(event.content_package_json).includes(`\"medicine_id\": \"${id}\"`)).filter(event=>hasDestination(event,'dossier')).map(publicEvent);return json({ok:true,dossier:medicine(row),updates});}
 return null;
}
