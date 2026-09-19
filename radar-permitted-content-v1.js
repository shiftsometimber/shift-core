// Publisher-specific formats authorised in Matt's NICE/GPhC correspondence.
// A permission record is not evidence that a source fetch or clinical review succeeded.
export const PERMITTED_CONTENT_POLICY='nice-summary-gphc-original-20260919-v1';
const RSS='https://www.pharmacyregulation.org/rss';
const parse=(v,f={})=>{try{return typeof v==='string'?JSON.parse(v):v??f}catch{return f}};
export const publisherEvidence=row=>{const v=parse(row?.source_evidence_json,[]);return Array.isArray(v)?v:[]};
const official=(value,host)=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password?u:null}catch{return null}};
export function permittedPublisherMode(row){
 const e=publisherEvidence(row);if(e.length!==1)return null;const s=e[0];
 if(s.source_tier!==1||s.discovery_only||s.conflict)return null;
 const nice=official(s.url,'www.nice.org.uk');
 if(nice&&/^\/guidance\/(?:ng|cg|ta|qs|ph|hst|htg|mtg|dg|ipg)\d+\/?$/.test(nice.pathname)&&!/(?:consultation|draft|develop|terminated|withdraw|replacement)/i.test(s.guidance_stage||'')&&String(s.title||'').trim())return 'nice_editorial_summary';
 if(official(s.url,'www.pharmacyregulation.org')&&s.source_feed===RSS&&typeof s.feed_original_title==='string'&&s.feed_original_title.trim()&&typeof s.feed_original_text==='string'&&s.feed_original_text.length<=20000)return 'gphc_original_notice';
 return null;
}
export function originalFeedFields(block){
 const decode=text=>text.replace(/&(?:amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|rdquo|ldquo);|&#(?:x[0-9a-f]+|\d+);/gi,m=>{const known={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&rsquo;':'’','&lsquo;':'‘','&rdquo;':'”','&ldquo;':'“'};if(known[m.toLowerCase()]!=null)return known[m.toLowerCase()];const n=parseInt(m.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(m)?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):m});
 const get=name=>{const raw=String(block).match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'))?.[1]||'';let value=raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');value=decode(value);if(/<(?:script|style|iframe|object)\b/i.test(value))return null;return decode(value.replace(/<br\s*\/?\s*>|<\/p\s*>/gi,'\n').replace(/<[^>]+>/g,'')).trim()};
 const title=get('title'),description=get('description'),summary=get('summary');if(description===null||summary===null)return {};const text=description||summary||'';
 return title&&text!==null&&title.length<=1000&&text.length<=20000?{feed_original_title:title,feed_original_text:text}:{};
}
export const PUBLISHER_DESTINATIONS=['medicine_news','sitemap'];
export function originalNoticePackage(row){
 if(permittedPublisherMode(row)!=='gphc_original_notice')throw Error('original_gphc_feed_required');
 const s=publisherEvidence(row)[0],intro='Original notice from the General Pharmaceutical Council (GPhC). The supplied feed wording is reproduced below, with a link to the original announcement.';
 return {headline:s.feed_original_title,standfirst:intro,what_changed:'',why_it_matters_to_uk:'',shift_take:'',article_markdown:s.feed_original_text||intro,ticker_line:s.feed_original_title,known_facts:[{claim:s.feed_original_title,source_url:s.url}],unknowns:[],safety:'',review_flags:[],existing_page_updates:[],dossier_amendment:'',shift_brain:{},seo:{title:s.feed_original_title.slice(0,70),description:intro,slug:'gphc-notice-'+row.id,author:'General Pharmaceutical Council (original notice)',reviewer:'Automated original-feed text check',source_url:s.url}};
}
export function applyPublisherFormat(row,pkg){
 const mode=permittedPublisherMode(row);if(!mode)return pkg;const s=publisherEvidence(row)[0];
 const original=mode==='gphc_original_notice'?originalNoticePackage(row):pkg;
 return {...pkg,...original,why_it_matters_to_uk:'',destinations:[...PUBLISHER_DESTINATIONS],existing_page_updates:[],dossier_amendment:'',shift_brain:{},publisher_reuse:{policy:PERMITTED_CONTENT_POLICY,mode,source_url:s.url,source_title:s.feed_original_title||s.title,source_date:s.source_date||null,checked_at:s.retrieved_at||null,uk_editorial_use:mode==='nice_editorial_summary'},seo:{...pkg.seo,...original.seo}};
}
export function publisherPackageError(row,pkg,patch={}){
 const mode=permittedPublisherMode(row);if(!mode)return null;
 if(pkg?.publisher_reuse?.policy!==PERMITTED_CONTENT_POLICY||pkg.publisher_reuse.mode!==mode||pkg.publisher_reuse.source_url!==publisherEvidence(row)[0].url)return 'publisher_format_required';
 if(Object.keys(patch||{}).some(k=>k!=='review_flags'&&patch[k]!=null&&patch[k]!==''))return 'publisher_editorial_not_medicine_update';
 if(!Array.isArray(pkg.destinations)||!pkg.destinations.includes('medicine_news')||pkg.destinations.some(d=>!PUBLISHER_DESTINATIONS.includes(d)))return 'publisher_editorial_destinations_only';
 if(pkg.existing_page_updates?.length||pkg.dossier_amendment||Object.keys(pkg.shift_brain||{}).length)return 'publisher_editorial_only';
 if(mode==='gphc_original_notice'){
  const expected=originalNoticePackage(row);
  for(const k of ['headline','standfirst','what_changed','why_it_matters_to_uk','shift_take','article_markdown','ticker_line','known_facts','unknowns','safety'])if(JSON.stringify(pkg[k])!==JSON.stringify(expected[k]))return 'gphc_original_text_changed';
 }
 return null;
}
export function originalNoticeEligibility(row,pkg,patch={},now=Date.now()){
 const reasons=[],s=publisherEvidence(row)[0]||{};
 const err=publisherPackageError(row,pkg,patch);if(err)reasons.push(err);
 if(permittedPublisherMode(row)!=='gphc_original_notice')reasons.push('original_gphc_feed_required');
 if(row.status!=='ready_for_review'||row.reviewed_at||row.reviewed_by||Number(row.source_review_generation||0)!==0)reasons.push('existing_decision_or_correction');
 if(!parse(row.verification_json).verified)reasons.push('unverified');
 if(!Number.isFinite(Date.parse(s.source_date))||Date.parse(s.source_date)>now||!Number.isFinite(Date.parse(s.retrieved_at))||Date.parse(s.retrieved_at)>now+60000||now-Date.parse(s.retrieved_at)>48*3600000)reasons.push('source_date_or_freshness_missing');
 return {ok:!reasons.length,reasons,evidence:publisherEvidence(row)};
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function publisherAttributionHtml(row){
 const pkg=parse(row.content_package_json),s=publisherEvidence(row)[0];if(pkg.publisher_reuse?.policy!==PERMITTED_CONTENT_POLICY||!s)return '';
 if(pkg.publisher_reuse.mode==='gphc_original_notice')return '<section data-publisher-attribution><h2>Original source</h2><p>Source: General Pharmaceutical Council (GPhC). Feed wording reproduced without an AI rewrite. '+(s.source_date?'Source date: '+esc(s.source_date.slice(0,10))+'. ':'')+'<a href="'+esc(s.url)+'">Read the original GPhC announcement</a>.</p><p>This is GPhC material, not SHIFT research or an endorsement of SHIFT.</p></section>';
 const year=String(s.source_date||'').match(/^\d{4}/)?.[0]||'2026';
 return '<section data-publisher-attribution><h2>NICE source and attribution</h2><p>© NICE '+year+' '+esc(s.title)+'. <a href="'+esc(s.url)+'">Original NICE guidance</a>. All rights reserved. Subject to <a href="https://www.nice.org.uk/reusing-our-content/nice-uk-open-content-licence">Notice of rights</a>.</p><p>NICE guidance is prepared for the National Health Service in England. All NICE guidance is subject to regular review and may be updated or withdrawn. NICE accepts no responsibility for the use of its content in this publication.</p><p>This UK-focused editorial summary reflects the source checked '+esc(s.retrieved_at?String(s.retrieved_at).slice(0,10):'at preparation')+'. It is not a replacement for the recommendations, individual advice or NICE endorsement. SHIFT’s interpretation is separate.</p></section>';
}
export function originalNoticeHtml(row){
 const p=parse(row.content_package_json),s=publisherEvidence(row)[0];
 if(p.publisher_reuse?.policy!==PERMITTED_CONTENT_POLICY||p.publisher_reuse.mode!=='gphc_original_notice'||!s)return null;
 return '<main id="main-content"><article class="radar-article" data-publisher-original><p class="eyebrow">GPhC original notice · carried by SHIFT Newsroom</p><h1>'+esc(s.feed_original_title)+'</h1><blockquote style="white-space:pre-wrap">'+esc(s.feed_original_text)+'</blockquote>'+publisherAttributionHtml(row)+'<p><a href="/shift-newsroom">Back to SHIFT Newsroom</a></p></article></main>';
}

export function isValidOriginalNotice(row){const pkg=parse(row.content_package_json);return permittedPublisherMode(row)==='gphc_original_notice'&&pkg.publisher_reuse?.policy===PERMITTED_CONTENT_POLICY&&!publisherPackageError(row,pkg,parse(row.medicine_patch_json));}
