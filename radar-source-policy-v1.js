// Source permissions are independent of factual accuracy and technical access.
// Pending publisher clarifications must not be promoted into a reuse licence.
export const SOURCE_POLICY_VERSION='nice-gphc-20260919-v1';
export const GPHC_RSS='https://www.pharmacyregulation.org/rss';
// Exact single-hyphen URL supplied by NICE; the cached double-hyphen URL returned 404.
export const NICE_TOPIC='https://www.nice.org.uk/guidance/lifestyle-and-wellbeing/diet-nutrition-and-obesity';
export const NICE_TOPIC_ID='nice-diet-nutrition-obesity';
export const NICE_TOPIC_SOURCE=Object.freeze({id:NICE_TOPIC_ID,authority:'NICE',region:'UK',url:NICE_TOPIC,eventType:'uk_guidance_discovery',adapter:'html',tier:1,confidence:97});
const parse=value=>{try{return typeof value==='string'?JSON.parse(value):value}catch{return null}};
function authority(value){
 const name=String(value||'').trim().toLowerCase();
 if(name==='gphc'||name==='general pharmaceutical council')return 'GPhC';
 if(name==='nice'||name==='national institute for health and care excellence')return 'NICE';
 return null;
}
function authorityUrl(value){
 try{const u=new URL(String(value)),h=u.hostname.toLowerCase().replace(/\.$/,'');
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;
  if(h==='pharmacyregulation.org'||h.endsWith('.pharmacyregulation.org'))return 'GPhC';
  if(h==='nice.org.uk'||h.endsWith('.nice.org.uk'))return 'NICE';
 }catch{}return null;
}
export function sourceReusePolicy(row={}){
 const raw=parse(row.source_evidence_json??row.source_evidence??[]),evidence=Array.isArray(raw)?raw:[];
 const publishers=new Set();
 for(const x of [row,...evidence]){
  if(!x||typeof x!=='object')continue;
  for(const key of ['authority','regulator','publisher']){const a=authority(x[key]);if(a)publishers.add(a)}
  for(const key of ['url','source_url','source_feed']){const a=authorityUrl(x[key]);if(a)publishers.add(a)}
 }
 const pending=[...publishers].sort();
 return {ok:pending.length===0,policy:SOURCE_POLICY_VERSION,publishers:pending,
  reasons:pending.map(x=>x==='GPhC'?'gphc_original_wording_only_pending_reuse_clarification':'nice_editorial_territory_attribution_scope_pending'),
  discoveryAllowed:true,existingPublicationsUnchanged:true};
}
export function sourceReuseFailure(row){const policy=sourceReusePolicy(row);return policy.ok?null:{ok:false,error:'source_reuse_review_required',message:'Source access is not permission to generate or publish adapted content. Publisher scope clarification is pending.',sourcePolicy:policy}}
export function niceGuidanceStage(item={}){
 let u;try{u=new URL(item.url)}catch{return 'unknown'}
 if(u.origin!=='https://www.nice.org.uk')return 'unknown';
 const text=String(item.title||'')+' '+String(item.summary||'');
 if(/\b(?:this guidance (?:has been |is )?(?:withdrawn|replaced)|withdrawn guidance|replaced by)\b/i.test(text))return 'withdrawal_or_replacement_reported';
 if(/\/consultations?(?:\/|$)/i.test(u.pathname)||/\b(?:in consultation|draft guidance|consultation closes)\b/i.test(text))return 'consultation';
 if(u.pathname.startsWith('/guidance/indevelopment/'))return 'in_development';
 // A guidance URL is not itself proof of current final status, NHS access, or funding.
 if(/^\/guidance\/(?:ng|cg|ta|qs|ph|hste|hst|ipg|htg|mtg|dg|sc|mpg)\d+\/?$/i.test(u.pathname))return 'published_guidance_link_status_requires_check';
 return 'unknown';
}
export function niceTopicListingLinks(html){
 const links=[];
 for(const m of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)){
  let u;try{u=new URL(m[1].replace(/&amp;/g,'&'),NICE_TOPIC)}catch{continue}
  if(u.origin!=='https://www.nice.org.uk'||u.username||u.password||!['/guidance/published','/guidance/indevelopment'].includes(u.pathname))continue;
  // Follow only topic-filtered listings supplied by NICE, never invent a filter or crawl all guidance.
  if(!u.searchParams.has('ngt')&&!u.searchParams.has('topic'))continue;
  u.hash='';if(!links.includes(u.href))links.push(u.href);if(links.length===4)break;
 }return links;
}
export function isNiceGuidanceItem(item){return niceGuidanceStage(item)!=='unknown'}
export async function scanNiceTopic(fetcher,parseLinks,source=NICE_TOPIC_SOURCE){
 const read=async url=>{const r=await fetcher(url,{headers:{accept:'text/html','user-agent':'Shift-Radar/1.0'}});if(!r.ok)throw Error('http_'+r.status);const html=await r.text();if(html.length>2000000||!/<a\b[^>]*href=/i.test(html)||/captcha|access denied|just a moment/i.test(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''))throw Error('unreadable_source_page');return html};
 const html=await read(source.url),listingUrls=niceTopicListingLinks(html),items=new Map();
 const add=(body,s)=>{for(const item of parseLinks(body,s)){if(isNiceGuidanceItem(item))items.set(item.url,{...item,guidance_stage:niceGuidanceStage(item)})}};
 add(html,source);
 for(const url of listingUrls)add(await read(url),{...source,url});
 if(!listingUrls.length&&!items.size)throw Error('nice_topic_guidance_links_missing');
 return [...items.values()].slice(0,80);
}
// Use an existing stored observation for up to one hour without pretending to have re-fetched it.
// A prior 403 stays failed during this interval and is never immediately retried.
export async function recentAuthorityCheck(DB,source,now=Date.now()){
 if(!['gphc-news',NICE_TOPIC_ID].includes(source.id))return null;
 const prior=await DB.prepare('SELECT status,detail_json,completed_at FROM radar_scan_runs WHERE source_id=? AND source_url=? ORDER BY id DESC LIMIT 1').bind(source.id,source.url).first();
 if(!prior)return null;const age=now-Date.parse(prior.completed_at);if(!Number.isFinite(age)||age<0||age>=3600000)return null;
 const detail=parse(prior.detail_json)||{};
 return {source:source.id,ok:prior.status==='completed',skipped:true,reason:'hourly_source_interval',checkedAt:prior.completed_at,nextCheckAfter:new Date(Date.parse(prior.completed_at)+3600000).toISOString(),newEvents:0,...(prior.status==='completed'?{}:{error:detail.error||'previous_source_check_failed'})};
}
export async function migrateGphcFeed(DB){
 // Only the exact retired seeded source changes; retain paused state and all historical records.
 return DB.prepare("UPDATE radar_sources SET url=?,adapter='feed',updated_at=CURRENT_TIMESTAMP WHERE id='gphc-news' AND url='https://www.pharmacyregulation.org/about-us/news-and-updates' AND adapter='html' AND authority='GPhC' AND region='UK' AND event_type='uk_pharmacy_regulation' AND tier=1 AND confidence=99").bind(GPHC_RSS).run();
}
