import {plainText,storePublicPage} from '../member-experience/ai-site-knowledge.mjs';
import {digest,ORIGIN} from './publication.mjs';
const ROOTS=new Set(['/weight-loss-support-for-men','/my-timber-for-providers','/start-here','/male-obesity','/mens-weight-management','/mounjaro','/wegovy','/orlistat','/shift-health','/programme','/life-back','/husband-help','/clinic-gone-quiet','/provider-switch','/grub','/fit','/about','/treatment-centre/medicines-watch']);
const PRIMARY=new Set(['www.nhs.uk','www.england.nhs.uk','www.gov.uk','www.food.gov.uk','www.nice.org.uk','www.medicines.org.uk','clinicaltrials.gov','www.lilly.com','www.novonordisk.com']);
export function publicEditorialUrl(raw){try{const u=new URL(raw);return u.origin===ORIGIN&&!u.search&&!u.hash&&!u.username&&!u.password&&!u.pathname.split('/').some(p=>['member','members','account','portal','private','questionnaire','questionnaires','results','records','conversations','v1','api'].includes(p))&&(ROOTS.has(u.pathname)||/^\/(articles|guides|faq|tools|mental-health|shift-health)\/[a-z0-9/-]+$/.test(u.pathname))?u.href:null;}catch{return null;}}
export function primaryEvidenceUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&PRIMARY.has(u.hostname)&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash?u.href:null;}catch{return null;}}
const links=html=>[...new Set([...html.matchAll(/<a\b[^>]*href=["']([^"']+)/gi)].map(m=>m[1].replace(/&amp;/g,'&')))];
export function structuredPrimaryText(html){
 const marker=' SHIFT_EDITORIAL_SOURCE_BLOCK_20261018 ';
 if(html.includes(marker.trim()))throw Error('source_structure_marker_collision');
 const marked=html.replace(/<\/?(?:h[1-6]|p|ul|ol|li|div|section|article|blockquote|br|tr|td)\b[^>]*>/gi,tag=>{const heading=/^<h([1-6])\b/i.exec(tag);return marker+(heading?'## ':/^<li\b/i.test(tag)?'- ':'');});
 return marked.split(marker).map(plainText).filter(Boolean).join('\n');
}
export function completeEmcLeaflet(html){
 const start=/<div\b[^>]*class=["'][^"']*\bxpilcontent\b[^"']*["'][^>]*>/i.exec(html);
 if(!start)throw Error('primary_leaflet_container_missing');
 const tags=/<\/?div\b[^>]*>/gi;tags.lastIndex=start.index+start[0].length;let depth=1,m;
 while((m=tags.exec(html))){depth+=/^<\//.test(m[0])?-1:1;if(depth===0)return html.slice(start.index+start[0].length,m.index);}
 throw Error('primary_leaflet_incomplete');
}
export async function readablePage(fetcher,url,{primary=false}={}){
 let current=url;
 for(let redirects=0;redirects<3;redirects++){
  const allowed=primary?primaryEvidenceUrl(current):publicEditorialUrl(current);if(!allowed)throw Error('unapproved_source');
  const r=await fetcher(allowed,{redirect:'manual',headers:{Accept:'text/html, application/json'},signal:AbortSignal.timeout(10000)});
  if([301,302,303,307,308].includes(r.status)){const location=r.headers.get('Location');if(!location)throw Error('redirect_missing');current=new URL(location,current).href;continue;}
  if(!r.ok)throw Error('source_http_'+r.status);
  const raw=await r.text();if(raw.length>1500000)throw Error('source_too_large');
  const type=r.headers.get('Content-Type')||'';
  if(type.includes('application/json')&&primary&&new URL(current).hostname==='clinicaltrials.gov'){
   const j=JSON.parse(raw);if(!j.protocolSection?.identificationModule?.nctId||typeof j.hasResults!=='boolean')throw Error('invalid_registry');
   return {url:current,title:j.protocolSection.identificationModule.briefTitle,content:JSON.stringify(j),html:raw,sourceDate:j.protocolSection.statusModule?.lastUpdatePostDateStruct?.date||null,links:[]};
  }
  if(!type.includes('text/html'))throw Error('source_content_type');
  const main=primary&&new URL(current).hostname==='www.medicines.org.uk'?completeEmcLeaflet(raw):raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||(primary?raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]:null);
  const title=plainText(raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
  const content=primary?structuredPrimaryText(main||''):plainText(main||'');if(!title||!main||content.length<150||/captcha|access denied|just a moment/i.test(title))throw Error('source_unreadable');
  const canonical=raw.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']([^"']+)/i)?.[1]||null;
  const dates=[...raw.matchAll(/(?:datePublished|dateModified|dateReviewed)["']?\s*[:=]\s*["']([^"']+)/g)].map(x=>x[1]);
  return {url:current,title,content,html:raw,canonical,links:links(main),sourceDate:dates.at(-1)||null,reviewDates:dates,publicationDate:dates[0]||null,noindex:/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*noindex/i.test(raw)};
 }
 throw Error('redirect_limit');
}
export async function refreshEditorialCorpus(env,{fetcher=fetch,now=Date.now(),limit=12}={}){
 const stamp=new Date(now).toISOString();
 const response=await fetcher(ORIGIN+'/sitemap.xml',{redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('sitemap_unavailable');
 const xml=await response.text();const urls=[...new Set([...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x=>publicEditorialUrl(x[1].trim())).filter(Boolean))];
 if(!urls.length)throw Error('public_inventory_empty');
 if(!urls.includes(ORIGIN+'/treatment-centre/medicines-watch'))urls.push(ORIGIN+'/treatment-centre/medicines-watch');
 const known=(await env.DB.prepare(`SELECT source_uri,checked_at FROM knowledge_editorial_page_meta`).all()).results||[],times=new Map(known.map(x=>[x.source_uri,x.checked_at]));
 for(const row of known)if(!urls.includes(row.source_uri)){
  await env.DB.prepare(`UPDATE knowledge_editorial_page_meta SET state='withdrawn',reason='removed_from_inventory' WHERE source_uri=?`).bind(row.source_uri).run();
  await env.DB.prepare(`UPDATE ai_knowledge_documents SET status='withdrawn' WHERE category='shift_public_site' AND source_uri=?`).bind(row.source_uri).run();
 }
 const legacyPublic=(await env.DB.prepare(`SELECT source_uri FROM ai_knowledge_documents WHERE category='shift_public_site' AND status='published_site'`).all()).results||[];
 for(const row of legacyPublic)if(!publicEditorialUrl(row.source_uri))await env.DB.prepare(`UPDATE ai_knowledge_documents SET status='withdrawn' WHERE category='shift_public_site' AND source_uri=?`).bind(row.source_uri).run();
 let refreshed=0,failed=0;
 for(const url of urls.sort((a,b)=>String(times.get(a)||'').localeCompare(String(times.get(b)||''))).slice(0,Math.min(limit,12))){
  try{
   const page=await readablePage(fetcher,url);if(page.canonical!==url||page.noindex||page.content.length>250000)throw Error('canonical_noindex_or_size');
   let audience='Public readers; narrower audience not declared';const articleSlug=new URL(url).pathname.match(/^\/articles\/([a-z0-9-]+)$/)?.[1];
   if(articleSlug){const owned=await env.DB.prepare(`SELECT b.audience FROM knowledge_editorial_releases r JOIN knowledge_editorial_briefs b ON b.intent_key=r.intent_key WHERE r.slug=? AND r.state='verified' ORDER BY r.due_at DESC LIMIT 1`).bind(articleSlug).first();if(owned?.audience)audience=owned.audience;}
   const words=page.content.split(' '),chunks=[];let chunk='';for(const w of words){if((chunk+' '+w).length>1800){chunks.push(chunk);chunk='';}chunk+=(chunk?' ':'')+w;}if(chunk)chunks.push(chunk);
   if(chunks.join(' ')!==page.content||chunks.length>160)throw Error('incomplete_corpus');
   // The existing published-site knowledge tables remain the one content index.
   // Short pages use the existing atomic writer. Large Watch documents are staged
   // private while bounded chunk batches are written, then made visible atomically.
   if(chunks.length<=36)await storePublicPage(env.DB,{url,title:page.title,chunks});
   else{
    const checksum='shift-public:'+url;
    await env.DB.prepare(`INSERT INTO ai_knowledge_documents(title,source_uri,category,trust_tier,status,checksum,updated_at) VALUES(?,?,'shift_public_site',3,'editorial_indexing',?,?) ON CONFLICT(checksum) DO UPDATE SET status='editorial_indexing',title=excluded.title,updated_at=excluded.updated_at`).bind(page.title,url,checksum,stamp).run();
    await env.DB.prepare(`DELETE FROM ai_knowledge_chunks WHERE document_id=(SELECT id FROM ai_knowledge_documents WHERE checksum=?)`).bind(checksum).run();
    for(let i=0;i<chunks.length;i+=40)await env.DB.batch(chunks.slice(i,i+40).map((content,j)=>env.DB.prepare(`INSERT INTO ai_knowledge_chunks(document_id,chunk_index,content,search_text) VALUES((SELECT id FROM ai_knowledge_documents WHERE checksum=?),?,?,?)`).bind(checksum,i+j,content,(page.title+' '+content).toLowerCase())));
    await env.DB.prepare(`UPDATE ai_knowledge_documents SET status='published_site' WHERE checksum=? AND status='editorial_indexing'`).bind(checksum).run();
   }
   await env.DB.prepare(`INSERT INTO knowledge_editorial_page_meta(source_uri,canonical,audience,subject,source_links_json,review_dates_json,publication_date,content_sha256,checked_at,state,reason) VALUES(?,?,?,?,?,?,?,?,?,'published_site',NULL) ON CONFLICT(source_uri) DO UPDATE SET canonical=excluded.canonical,audience=excluded.audience,subject=excluded.subject,source_links_json=excluded.source_links_json,review_dates_json=excluded.review_dates_json,publication_date=excluded.publication_date,content_sha256=excluded.content_sha256,checked_at=excluded.checked_at,state=excluded.state,reason=NULL`).bind(url,url,audience,page.title,JSON.stringify(page.links.filter(primaryEvidenceUrl)),JSON.stringify(page.reviewDates),page.publicationDate,await digest(page.content),stamp).run();refreshed++;
  }catch(e){failed++;await env.DB.prepare(`UPDATE ai_knowledge_documents SET status='editorial_source_failed' WHERE category='shift_public_site' AND source_uri=?`).bind(url).run();await env.DB.prepare(`INSERT INTO knowledge_editorial_page_meta(source_uri,canonical,source_links_json,review_dates_json,content_sha256,checked_at,state,reason) VALUES(?,?,'[]','[]','',?,'failed',?) ON CONFLICT(source_uri) DO UPDATE SET state='failed',reason=excluded.reason,checked_at=excluded.checked_at`).bind(url,url,stamp,String(e.message).slice(0,160)).run();}
 }
 const latest=(await env.DB.prepare(`SELECT source_uri,state FROM knowledge_editorial_page_meta`).all()).results||[];
 const checked=new Set(latest.map(r=>r.source_uri)),available=new Set(latest.filter(r=>r.state==='published_site').map(r=>r.source_uri));
 return {discovered:urls.length,refreshed,failed,inventoryChecked:urls.every(u=>checked.has(u)),available:urls.filter(u=>available.has(u)).length,complete:urls.every(u=>available.has(u))};
}
export async function retrieveEditorialContext(DB,question,limit=8,now=Date.now()){
 const terms=[...new Set(question.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3))].slice(0,8);
 if(!terms.length)return [];
 const score=terms.map(()=>`CASE WHEN c.search_text LIKE ? THEN 1 ELSE 0 END`).join('+');
 const sql=`SELECT d.source_uri,d.title,c.content,c.chunk_index,(${score}) score FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id JOIN knowledge_editorial_page_meta m ON m.source_uri=d.source_uri WHERE d.category='shift_public_site' AND d.status='published_site' AND m.state='published_site' AND julianday(m.checked_at)>=julianday(?,'-2 days') ORDER BY score DESC,c.chunk_index LIMIT ?`;
 return ((await DB.prepare(sql).bind(...terms.map(t=>'%'+t+'%'),new Date(now).toISOString(),Math.min(limit,12)).all()).results||[]).filter(r=>publicEditorialUrl(r.source_uri));
}
