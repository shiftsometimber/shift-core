const ORIGIN='https://shiftsometimber.co.uk';
const CATEGORY='shift_public_site';
const STOP=new Set('about after again also been before being could does doing from have help helps helping here just know like more much need needs please question really should some tell than that their them then there these they this those want wants what when where which while will with would your make making practical useful advice explain suggest suggestions simple easy today'.split(' '));
export const queryTerms=q=>[...new Set(String(q).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(t=>t.length>3&&!STOP.has(t)))].slice(0,10);
export function publicKnowledgeUrl(value){try{const u=new URL(value);return u.origin===ORIGIN&&!u.search&&!u.hash&&(/^\/(?:articles|guides|faq|mental-health|shift-health)\/[a-z0-9/-]+$/.test(u.pathname)||['/life-back','/clinic-gone-quiet','/provider-switch','/husband-help','/programme','/grub','/fit','/about'].includes(u.pathname))?u.href:null}catch{return null}}
const entities=s=>s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/gi,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'",'&nbsp;':' '}[x.toLowerCase()]||x)).replace(/&#(\d+);/g,(_,n)=>Number(n)<0x110000?String.fromCodePoint(Number(n)):'');
export function plainText(html){return entities(String(html).replace(/<(script|style|nav|header|footer|form|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim()}
export function extractPublicPage(html,url){
 if(!publicKnowledgeUrl(url)||/\bnoindex\b/i.test(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0]||''))return null;
 const title=plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];if(!main||!title)return null;
 const text=plainText(main);if(text.length<150)return null;
 // Keep consecutive sections together; never infer clinical approval from publication.
 const sentences=text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[text];const chunks=[];let chunk='';
 for(const sentence of sentences){if(chunk.length+sentence.length>1800&&chunk){chunks.push(chunk.trim());chunk=''}chunk+=sentence;if(chunks.length>=35)break;}if(chunk&&chunks.length<36)chunks.push(chunk.trim().slice(0,2200));
 return{url,title:title.slice(0,240),chunks:chunks.filter(x=>x.length>40)};
}
export function sitemapUrls(xml){return [...new Set([...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>publicKnowledgeUrl(entities(m[1].trim()))).filter(Boolean))].slice(0,700)}
export async function storePublicPage(DB,page){
 const checksum='shift-public:'+page.url;const statements=[DB.prepare(`INSERT INTO ai_knowledge_documents(title,source_uri,category,trust_tier,status,checksum,updated_at) VALUES(?,?,?,3,'published_site',?,CURRENT_TIMESTAMP) ON CONFLICT(checksum) DO UPDATE SET title=excluded.title,status='published_site',updated_at=CURRENT_TIMESTAMP`).bind(page.title,page.url,CATEGORY,checksum),DB.prepare('DELETE FROM ai_knowledge_chunks WHERE document_id=(SELECT id FROM ai_knowledge_documents WHERE checksum=?)').bind(checksum)];
 page.chunks.forEach((content,i)=>statements.push(DB.prepare('INSERT INTO ai_knowledge_chunks(document_id,chunk_index,content,search_text) VALUES((SELECT id FROM ai_knowledge_documents WHERE checksum=?),?,?,?)').bind(checksum,i,content,plainText(page.title+' '+content).toLowerCase())));
 await DB.batch(statements);
}
export async function refreshPublicKnowledge(env,{limit=12,fetcher=fetch}={}){
 try{
 const r=await fetcher(ORIGIN+'/sitemap.xml',{redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('sitemap_unavailable');const urls=sitemapUrls(await r.text());if(!urls.length)throw Error('sitemap_empty');
 const known=(await env.DB.prepare('SELECT source_uri,updated_at FROM ai_knowledge_documents WHERE category=?').bind(CATEGORY).all()).results||[];const dates=new Map(known.map(x=>[x.source_uri,x.updated_at]));
 // Removed sitemap entries stop being evidence before the next crawl batch.
 for(const row of known)if(!urls.includes(row.source_uri))await env.DB.prepare("UPDATE ai_knowledge_documents SET status='withdrawn' WHERE category=? AND source_uri=?").bind(CATEGORY,row.source_uri).run();
 const targets=urls.sort((a,b)=>String(dates.get(a)||'').localeCompare(String(dates.get(b)||''))).slice(0,limit);let refreshed=0,withdrawn=0,failed=0;
 for(const url of targets){try{const page=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(6000),headers:{Accept:'text/html'}});if([404,410].includes(page.status)){await env.DB.prepare("UPDATE ai_knowledge_documents SET status='withdrawn' WHERE category=? AND source_uri=?").bind(CATEGORY,url).run();withdrawn++;continue;}if(!page.ok)throw Error('page_unavailable');const html=await page.text();if(html.length>1500000)throw Error('page_too_large');const extracted=extractPublicPage(html,url);if(!extracted){await env.DB.prepare("UPDATE ai_knowledge_documents SET status='withdrawn' WHERE category=? AND source_uri=?").bind(CATEGORY,url).run();withdrawn++;continue;}await storePublicPage(env.DB,extracted);refreshed++;}catch{failed++;}}
 return{ok:failed===0,discovered:urls.length,refreshed,withdrawn,failed};
 }catch{return{ok:false,reason:'public_knowledge_refresh_failed'}}
}
export async function retrievePublishedSite(DB,query,limit=4){
 const terms=queryTerms(query);if(!terms.length)return[];
 try{const conditions=terms.map(()=>"c.search_text LIKE ? ESCAPE '\\'").join(' OR ');const sql=`SELECT d.id,d.title,d.source_uri,d.updated_at,c.chunk_index,c.content,c.search_text FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.category=? AND d.status='published_site' AND julianday(d.updated_at)>=julianday('now','-2 days') AND (${conditions}) LIMIT 100`;
 const rows=(await DB.prepare(sql).bind(CATEGORY,...terms.map(t=>'%'+t+'%')).all()).results||[];
 const ranked=rows.map(r=>{const words=new Set(String(r.search_text).toLowerCase().split(/[^a-z0-9]+/)),title=new Set(queryTerms(r.title));const matched=terms.filter(t=>words.has(t));return{...r,score:matched.length+terms.filter(t=>title.has(t)).length*3,matched:matched.length}}).filter(r=>r.matched>=Math.min(2,terms.length)&&publicKnowledgeUrl(r.source_uri)).sort((a,b)=>b.score-a.score||a.chunk_index-b.chunk_index);
 const seen=new Set();return ranked.filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true}).slice(0,limit).map(r=>({id:'site:'+r.id,sourceWorld:'published_shift_site',title:r.title,content:r.content,authority:75,reviewState:'published_site',citation:r.source_uri,provenance:[{type:'shift_website',ref:r.source_uri,checkedAt:r.updated_at}],limitations:'Published SHIFT website information. Publication is not evidence of individual clinical review.'}));
 }catch{return[]}
}
