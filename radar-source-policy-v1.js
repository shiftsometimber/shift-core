// Permissions, factual evidence and technical access are separate decisions.
export const SOURCE_POLICY_VERSION='nice-gphc-20260919-v1';
export const GPHC_RSS='https://www.pharmacyregulation.org/rss';
export const NICE_TOPIC='https://www.nice.org.uk/guidance/lifestyle-and-wellbeing/diet-nutrition-and-obesity';
export const NICE_TOPIC_ID='nice-diet-nutrition-obesity';
export const NICE_TOPIC_SOURCE=Object.freeze({id:NICE_TOPIC_ID,authority:'NICE',region:'UK',url:NICE_TOPIC,eventType:'uk_guidance_discovery',adapter:'html',tier:1,confidence:97});
const parse=value=>{try{return typeof value==='string'?JSON.parse(value):value}catch{return null}};
function authority(value){const n=String(value||'').trim().toLowerCase();return n==='gphc'||n==='general pharmaceutical council'?'GPhC':n==='nice'||n==='national institute for health and care excellence'?'NICE':null}
function authorityUrl(value){try{const u=new URL(String(value)),h=u.hostname.toLowerCase().replace(/\.$/,'');if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;if(h==='pharmacyregulation.org'||h.endsWith('.pharmacyregulation.org'))return 'GPhC';if(h==='nice.org.uk'||h.endsWith('.nice.org.uk'))return 'NICE'}catch{}return null}
export function sourceReusePolicy(row={}){
 const raw=parse(row?.source_evidence_json??row?.source_evidence??[]),evidence=Array.isArray(raw)?raw:[],publishers=new Set();
 for(const x of [row,...evidence]){if(!x||typeof x!=='object')continue;for(const k of ['authority','regulator','publisher']){const a=authority(x[k]);if(a)publishers.add(a)}for(const k of ['url','source_url','source_feed']){const a=authorityUrl(x[k]);if(a)publishers.add(a)}}
 const pending=[...publishers].sort();return{ok:!pending.length,policy:SOURCE_POLICY_VERSION,publishers:pending,reasons:pending.map(x=>x==='GPhC'?'gphc_original_wording_only_pending_reuse_clarification':'nice_editorial_territory_attribution_scope_pending'),discoveryAllowed:true,existingPublicationsUnchanged:true};
}
export function sourceReuseFailure(row){const p=sourceReusePolicy(row);return p.ok?null:{ok:false,error:'source_reuse_review_required',message:'Source access is not permission to generate or publish adapted content. Publisher scope clarification is pending.',sourcePolicy:p}}
export function niceGuidanceStage(item={}){
 let u;try{u=new URL(item.url)}catch{return 'unknown'}if(u.origin!=='https://www.nice.org.uk')return 'unknown';
 const text=String(item.title||'')+' '+String(item.summary||'');
 if(/\b(?:this guidance (?:has been |is )?(?:withdrawn|replaced)|withdrawn guidance|replaced by)\b/i.test(text))return 'withdrawal_or_replacement_reported';
 if(/\b(?:terminated appraisal|appraisal terminated|status:?\s*terminated)\b/i.test(text))return 'terminated_appraisal';
 if(/\/consultations?(?:\/|$)/i.test(u.pathname)||/\b(?:in consultation|draft guidance|consultation closes)\b/i.test(text))return 'consultation';
 if(u.pathname.startsWith('/guidance/indevelopment/'))return 'in_development';
 if(/^\/guidance\/(?:ng|cg|ta|qs|ph|hste|hst|ipg|htg|mtg|dg|sc|mpg)\d+\/?$/i.test(u.pathname))return 'published_guidance_link_status_requires_check';
 return 'unknown';
}
export function niceTopicListingLinks(html){
 const found=[];const topicPath=new URL(NICE_TOPIC).pathname+'/products';
 for(const m of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)){
  let u;try{u=new URL(m[1].replace(/&amp;/g,'&'),NICE_TOPIC)}catch{continue}
  if(u.origin!=='https://www.nice.org.uk'||u.username||u.password)continue;
  const current=u.pathname===topicPath&&u.searchParams.has('Status');
  const legacy=['/guidance/published','/guidance/indevelopment'].includes(u.pathname)&&u.searchParams.has('topic');
  if(!current&&!legacy)continue;u.hash='';if(found.some(x=>x.url===u.href))continue;
  const narrow=['ProductType','GuidanceProgramme','AdviceProgramme','Recent'].some(k=>u.searchParams.has(k));
  found.push({url:u.href,rank:narrow?1:0});
 }return found.sort((a,b)=>a.rank-b.rank).slice(0,4).map(x=>x.url);
}
export function isNiceGuidanceItem(item){return niceGuidanceStage(item)!=='unknown'}
export async function scanNiceTopic(fetcher,parseLinks,source=NICE_TOPIC_SOURCE){
 const read=async url=>{const r=await fetcher(url,{headers:{accept:'text/html','user-agent':'Shift-Radar/1.0'}});if(!r.ok)throw Error('http_'+r.status);if(r.url&&new URL(r.url).origin!=='https://www.nice.org.uk')throw Error('unexpected_source_redirect');const html=await r.text();if(html.length>2000000||!/<a\b[^>]*href=/i.test(html)||/captcha|access denied|just a moment/i.test(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''))throw Error('unreadable_source_page');return html};
 const html=await read(source.url),listingUrls=niceTopicListingLinks(html),items=new Map();
 const add=(body,s)=>{for(const item of parseLinks(body,s)){if(!isNiceGuidanceItem(item))continue;let stage=niceGuidanceStage(item);const states=new URL(s.url).searchParams.getAll('Status');if(states.includes('Terminated')&&!['withdrawal_or_replacement_reported','terminated_appraisal'].includes(stage))stage='published_or_terminated_requires_individual_check';if(states.length===1&&states[0]==='AwaitingDevelopment')stage='awaiting_development';if(states.length===1&&states[0]==='Prioritisation')stage='topic_prioritisation';items.set(item.url,{...item,guidance_stage:stage})}};
 add(html,source);for(const url of listingUrls)add(await read(url),{...source,url});
 if(!items.size)throw Error('nice_topic_guidance_links_missing');return [...items.values()].slice(0,80);
}
// Reuse a labelled stored observation for up to one hour; never advance its timestamp.
// A 403 remains failed during the interval, and is not immediately retried.
export async function recentAuthorityCheck(DB,source,now=Date.now()){
 if(!['gphc-news',NICE_TOPIC_ID].includes(source.id))return null;
 const prior=await DB.prepare('SELECT status,detail_json,completed_at FROM radar_scan_runs WHERE source_id=? AND source_url=? ORDER BY id DESC LIMIT 1').bind(source.id,source.url).first();
 if(!prior)return null;const age=now-Date.parse(prior.completed_at);if(!Number.isFinite(age)||age<0||age>=3600000)return null;const detail=parse(prior.detail_json)||{};
 return{source:source.id,ok:prior.status==='completed',skipped:true,reason:'hourly_source_interval',checkedAt:prior.completed_at,nextCheckAfter:new Date(Date.parse(prior.completed_at)+3600000).toISOString(),newEvents:0,...(prior.status==='completed'?{}:{error:detail.error||'previous_source_check_failed'})};
}
export async function migrateGphcFeed(DB){
 // Only the exact retired seed changes. Paused/custom settings and all historical records survive.
 return DB.prepare("UPDATE radar_sources SET url=?,adapter='feed',updated_at=CURRENT_TIMESTAMP WHERE id='gphc-news' AND url='https://www.pharmacyregulation.org/about-us/news-and-updates' AND adapter='html' AND authority='GPhC' AND region='UK' AND event_type='uk_pharmacy_regulation' AND tier=1 AND confidence=99").bind(GPHC_RSS).run();
}
