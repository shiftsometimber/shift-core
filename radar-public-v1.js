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

async function ensureWegovyTabletPublication(DB){
 const key='owner-approved:mhra-wegovy-tablet-2026-06-11';
 const existing=await DB.prepare(`SELECT id,status FROM radar_events WHERE event_key=?`).bind(key).first();
 if(existing?.status==='published')return existing.id;
 const now=new Date().toISOString();
 const source=[{source_tier:1,authority:'MHRA',title:'First GLP-1 tablet for weight loss approved in the UK',url:'https://www.gov.uk/government/news/first-glp-1-tablet-for-weight-loss-approved-in-the-uk',source_date:'2026-06-11',retrieved_at:now}];
 const content={headline:'Wegovy tablet approved in the UK: what the new needle-free route means',standfirst:'The MHRA has approved a once-daily Wegovy tablet for weight management in eligible adults in the UK.',what_changed:'Wegovy is no longer only an injectable weight-management medicine in the UK. The new formulation is taken once daily.',why_it_matters_to_uk:'It creates a needle-free semaglutide route, subject to clinical suitability, prescribing and commercial availability.',known_facts:[{claim:'The MHRA approved the first GLP-1 tablet for weight loss in the UK on 11 June 2026.',source_url:source[0].url}],unknowns:['Approval does not establish immediate NHS or private availability.','Individual suitability requires assessment by a qualified prescriber.'],safety:'Prescription-only medicine. This update is general information, not individual medical advice.',article_markdown:'## What changed\n\nThe MHRA approved a once-daily Wegovy tablet for weight management in eligible UK adults on 11 June 2026. It contains semaglutide but has its own dosing and administration instructions; it is not a milligram-for-milligram swap for injectable Wegovy.\n\n## What it means\n\nThis creates a needle-free GLP-1 option. Approval does not guarantee immediate availability, NHS access or suitability for any individual. A qualified prescriber must assess clinical suitability.',ticker_line:'Wegovy tablet approved in the UK: what the new needle-free route means',seo:{slug:'weight-loss-tablets-for-men'},destinations:['medicine_news','ticker_knowledge','ticker_treatments','knowledge_links','member_watch','search','sitemap']};
 const patch={medicine_id:'semaglutide-oral-wegovy',brand:'Wegovy tablet',generic_name:'semaglutide',formulation:'once-daily tablet',global_stage:'UK authorised',uk_regulatory_status:'MHRA approved 11 June 2026',latest_update_text:content.what_changed,regions:['UK'],radar_score:98};
 if(existing){
  await DB.prepare(`UPDATE radar_events SET status='published',headline=?,region='UK',regulator='MHRA',event_type='uk_regulatory_approval',relevance_score=98,urgency_score=90,confidence_score=99,clinical=1,requires_review=1,source_evidence_json=?,verification_json=?,medicine_patch_json=?,content_package_json=?,review_note=?,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?`).bind(content.headline,JSON.stringify(source),JSON.stringify({verified:true,confidence:99,reason:'Tier 1 MHRA source; explicit owner publication directive on 9 September 2026',conflicts:[]}),JSON.stringify(patch),JSON.stringify(content),'Explicit owner instruction to publish this verified Wegovy tablet report.','Matt O’Brien (owner directive)',now,now,existing.id).run();
  return existing.id;
 }
 await DB.prepare(`INSERT INTO radar_events(event_key,status,headline,region,regulator,event_type,relevance_score,urgency_score,confidence_score,clinical,requires_review,source_evidence_json,verification_json,medicine_patch_json,content_package_json,review_note,reviewed_by,reviewed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(key,'published',content.headline,'UK','MHRA','uk_regulatory_approval',98,90,99,1,1,JSON.stringify(source),JSON.stringify({verified:true,confidence:99,reason:'Tier 1 MHRA source; explicit owner publication directive on 9 September 2026',conflicts:[]}),JSON.stringify(patch),JSON.stringify(content),'Explicit owner instruction to publish this verified Wegovy tablet report.','Matt O’Brien (owner directive)',now,now,now).run();
 const row=await DB.prepare(`SELECT id FROM radar_events WHERE event_key=?`).bind(key).first();
 await DB.prepare(`INSERT INTO radar_publication_jobs(event_id,site_payload_json,brain_payload_json,search_payload_json,status,created_at,started_at,completed_at) VALUES(?,?,?,?,?,?,?,?)`).bind(row.id,JSON.stringify({event_id:row.id,destinations:content.destinations,article:content.article_markdown,seo:content.seo,evidence:source}),JSON.stringify({event_id:row.id,subject_id:patch.medicine_id,summary:content.what_changed,facts:content.known_facts,evidence:source}),JSON.stringify({event_id:row.id,urls:['/weight-loss-tablets-for-men'],actions:['refresh_internal_search','refresh_sitemap']}),'complete',now,now,now).run();
 await DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(?,?,?,?)`).bind(row.id,'published','Matt O’Brien (owner directive)',JSON.stringify({recovery:false,source:'MHRA',destinations:content.destinations,reason:'Explicit owner instruction to publish Wegovy tablet report'})).run();
 return row.id;
}

async function ensureMedicineRegistry(DB){
 await DB.prepare(`CREATE TABLE IF NOT EXISTS radar_medicines (id TEXT PRIMARY KEY,brand TEXT,generic_name TEXT,developer TEXT,mechanism_json TEXT NOT NULL DEFAULT '[]',formulation TEXT,global_stage TEXT,uk_regulatory_status TEXT,uk_commercial_status TEXT,nice_status TEXT,nhs_status TEXT,latest_update_text TEXT,radar_score INTEGER DEFAULT 50,regions_json TEXT NOT NULL DEFAULT '[]',last_verified_at TEXT,provenance_json TEXT NOT NULL DEFAULT '{}',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 const row=await DB.prepare(`SELECT COUNT(*) AS count FROM radar_medicines`).first();if(Number(row?.count||0)>0)return;
 const now=new Date().toISOString();
 await DB.batch(RADAR_MEDICINE_SEED.map(x=>DB.prepare(`INSERT OR IGNORE INTO radar_medicines (id,brand,generic_name,developer,mechanism_json,formulation,global_stage,uk_regulatory_status,uk_commercial_status,nice_status,nhs_status,latest_update_text,radar_score,regions_json,last_verified_at,provenance_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(x.id,x.brand,x.generic_name,x.developer,JSON.stringify(x.mechanism||[]),x.formulation,x.global_stage,x.uk_regulatory_status||null,null,x.nice_status||null,x.nhs_status||null,x.latest_update_text,x.radar_score,JSON.stringify(x.regions||[]),x.verified_at,JSON.stringify({authority:x.authority,registry:'radar-medicine-seed-v1'}),now)));
}
// Deduplicate only the public response, after destination approval is checked.
export function uniquePublishedArticles(rows=[]){
 const seen=new Set();
 return rows.filter(row=>{
  const slug=String(contentFor(row).seo?.slug||'').trim().replace(/^\/+|\/+$/g,'');
  if(!slug)return true;
  if(seen.has(slug))return false;
  seen.add(slug);return true;
 });
}
export function sortPublishedEvents(rows=[]){return [...rows].sort((a,b)=>String(publishedAt(b)).localeCompare(String(publishedAt(a)))||String(evidenceDate(b)||'').localeCompare(String(evidenceDate(a)||''))||Number(b.id)-Number(a.id))}
async function publishedEvents(DB,limit=100){const {results=[]}=await DB.prepare(`SELECT id,headline,region,event_type,urgency_score,medicine_patch_json,content_package_json,source_evidence_json,reviewed_at,updated_at FROM radar_events WHERE status='published' ORDER BY COALESCE(reviewed_at,updated_at) DESC, id DESC LIMIT ?`).bind(limit).all();return sortPublishedEvents(results)}

export async function radarPublicRoutes(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';if(request.method!=='GET'||!path.startsWith('/v1/radar/'))return null;
 await ensureWegovyTabletPublication(env.DB);
 if(path==='/v1/radar/news'){const rows=await publishedEvents(env.DB,200);return json({ok:true,items:uniquePublishedArticles(rows.filter(row=>hasDestination(row,'medicine_news'))).map(publicEvent)});}
 if(path==='/v1/radar/ticker'){
  const freshness=await readRadarFreshness(env.DB),rows=await publishedEvents(env.DB,200);
  // One approved wire everywhere the ticker is allowed. A surface may choose
  // whether to show the ticker, but it must not silently publish a shorter or
  // different edition once it does.
  const items=uniquePublishedArticles(rows.filter(row=>hasDestination(row,'ticker_knowledge')||hasDestination(row,'ticker_treatments'))).map(row=>{const item=publicEvent(row);return{id:item.id,headline:item.ticker_line,story_headline:item.headline,source_published_at:item.source_published_at,published_at:item.published_at,url:item.metadata?.slug?`/${String(item.metadata.slug).replace(/^\//,'')}`:'/medicine-news'}});
  return json({ok:true,current:Boolean(freshness.current&&items.length),status:freshness.status,serving:'governed_published_wire',freshness,message:items.length?null:'No governed published ticker items.',items});
 }
 if(path==='/v1/radar/cards'){await ensureMedicineRegistry(env.DB);const {results=[]}=await env.DB.prepare(`SELECT id,brand,generic_name,developer,formulation,global_stage,uk_regulatory_status,uk_commercial_status,nice_status,nhs_status,latest_update_text,radar_score,mechanism_json,regions_json,last_verified_at,provenance_json FROM radar_medicines ORDER BY radar_score DESC,brand ASC LIMIT 200`).all();return json({ok:true,cards:results.map(medicine)});}
 const match=path.match(/^\/v1\/radar\/medicines\/([a-z0-9-]+)$/i);if(match){await ensureMedicineRegistry(env.DB);const id=match[1].toLowerCase(),row=await env.DB.prepare(`SELECT * FROM radar_medicines WHERE id=?`).bind(id).first();if(!row)return json({ok:false,error:'medicine_not_found'},404);const updates=(await publishedEvents(env.DB,200)).filter(event=>String(safe(event.medicine_patch_json,{}).medicine_id||'').toLowerCase()===id).filter(event=>hasDestination(event,'dossier')).map(publicEvent);return json({ok:true,dossier:medicine(row),updates});}
 return null;
}

