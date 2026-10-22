// Blog contributor policy. Contributor declarations never approve a live revision.
export const BLOG_ORIGIN = 'https://shiftsometimber.co.uk';
export const RECEIPT_CHECKS = Object.freeze(['pageLive','imageLoads','internalLinksResolve','canonicalCorrect','blogListing','sitemap']);
export function pendingReceipt(state, reasons = []) {
  return {state,reasons,checks:Object.fromEntries(RECEIPT_CHECKS.map(k=>[k,{status:'pending',reason:'Checked after publication.'}]))};
}
export function londonParts(now = Date.now()) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(x=>[x.type,x.value]));
  return {day:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour),minute:Number(p.minute),second:Number(p.second)};
}
export function londonEleven(day) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('invalid_release_day');
  let time=Date.parse(day+'T11:00:00Z');
  for(let i=0;i<3;i++){const p=londonParts(time);time+=(11-p.hour)*3600000-p.minute*60000-p.second*1000;}
  const p=londonParts(time);
  if(p.day!==day||p.hour!==11||p.minute!==0||p.second!==0)throw Error('timezone_resolution_failed');
  return new Date(time).toISOString();
}
export function nextRelease(now = Date.now(), requestedDay) {
  const today=londonParts(now).day;
  if(requestedDay){const at=londonEleven(requestedDay);if(Date.parse(at)<now)throw Error('release_slot_has_passed');return at;}
  const at=londonEleven(today);if(Date.parse(at)>=now)return at;
  const tomorrow=new Date(Date.parse(today+'T12:00:00Z')+86400000).toISOString().slice(0,10);
  return londonEleven(tomorrow);
}
export async function sha256(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
}
export function canonicalArticleUrl(value) {
  if(typeof value!=='string')throw Error('article_url_required');
  if(!/^(?:https:\/\/shiftsometimber\.co\.uk)?\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw Error('article_url_outside_scope');
  return new URL(value,BLOG_ORIGIN).href;
}
export function validateSubmission(payload) {
  const reasons=[];
  if(!payload||Array.isArray(payload)||typeof payload!=='object')return {valid:false,reasons:['post_object_required'],article:null};
  let canonical=null;try{canonical=canonicalArticleUrl(payload.url)}catch(e){reasons.push(e.message)}
  const fields={title:300,body:100000,metaDescription:320,author:150};
  const article={};
  for(const [key,max] of Object.entries(fields)){
    const value=payload[key];article[key]=typeof value==='string'?value.trim():'';
    if(!article[key]||article[key].length>max)reasons.push('invalid_'+key);
  }
  // The existing renderer escapes HTML. Reject it here as well, so unsafe source
  // is held privately instead of being interpreted or silently rewritten.
  if(/<\/?[a-z!][^>]*>|&#(?:x0*3c|0*60);/i.test(article.body))reasons.push('html_not_accepted_use_markdown');
  if(/\]\(\s*(?:javascript|data|vbscript):/i.test(article.body))reasons.push('unsafe_link_protocol');
  if(/\b(?:TODO|FIXME|INSERT (?:COPY|IMAGE)|internal note|developer note)\b/i.test(article.body))reasons.push('unfinished_working_copy');
  const image=payload.heroImage;
  article.heroImage={url:typeof image?.url==='string'?image.url:'',alt:typeof image?.alt==='string'?image.alt.trim():'',caption:typeof image?.caption==='string'?image.caption.trim():''};
  try{const u=new URL(article.heroImage.url);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)throw Error();}catch{reasons.push('invalid_hero_image_url')}
  if(!article.heroImage.alt||article.heroImage.alt.length>500||article.heroImage.caption.length>1000)reasons.push('invalid_image_text');
  if(!Array.isArray(payload.keywords)||!payload.keywords.length||payload.keywords.length>20||payload.keywords.some(x=>typeof x!=='string'||!x.trim()||x.length>100))reasons.push('invalid_keywords');
  article.keywords=Array.isArray(payload.keywords)?payload.keywords:[];
  if(!Array.isArray(payload.sources)||!payload.sources.length||payload.sources.length>50)reasons.push('sources_required');
  article.sources=Array.isArray(payload.sources)?payload.sources:[];
  for(const s of article.sources){try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password||u.port||typeof s.title!=='string'||!s.title.trim())throw Error();}catch{reasons.push('invalid_source');break}}
  if(payload.video!=null){
    const v=payload.video;
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['url','poster','caption','transcript'].includes(k))||typeof v.url!=='string'||!/^https:\/\/shiftsometimber\.co\.uk\/uploads\/blog\/[a-f0-9-]{36}\.(mp4|webm)$/.test(v.url)||typeof v.poster!=='string'||typeof v.caption!=='string'||!v.caption.trim()||v.caption.length>1000||typeof v.transcript!=='string'||v.transcript.length>30000)reasons.push('invalid_blog_video');
    else article.video={url:v.url,poster:v.poster,caption:v.caption.trim(),transcript:v.transcript.trim()};
  }
  article.editorialCheck=payload.editorialCheck;
  if(payload.editorialCheck?.result!=='pass')reasons.push('contributor_editorial_check_failed');
  if(typeof payload.editorialCheck?.reviewer!=='string'||!payload.editorialCheck.reviewer.trim())reasons.push('editorial_reviewer_required');
  article.url=canonical;article.slug=canonical?.split('/').at(-1)||null;
  article.requestedDay=payload.releaseDate||null;
  return {valid:reasons.length===0,reasons,article};
}
export function publicationDecision({valid,exists,ownerApproved=false,baseMatches=true,slotDue=false,siteChecksPassed=false}) {
  if(!valid)return 'draft_failed';
  if(exists&&!ownerApproved)return 'revision_awaiting_owner';
  if(exists&&!baseMatches)return 'revision_base_changed';
  if(!siteChecksPassed)return 'draft_site_checks_failed';
  return slotDue?'ready_to_publish':'scheduled';
}
export function revisionPreview(current,proposed) {
  const fields=['title','body','metaDescription','author','heroImage','keywords','sources','video'];
  return fields.filter(k=>JSON.stringify(current?.[k]??null)!==JSON.stringify(proposed?.[k]??null)).map(field=>({field,before:current?.[field]??null,after:proposed?.[field]??null}));
}
