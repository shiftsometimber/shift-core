const ORIGIN='https://shiftsometimber.co.uk';
const CATEGORY='shift_public_site';
const STOP=new Set('about after again also been before being could does doing from have help helps helping here just know like more much need needs please question really should some tell than that their them then there these they this those want wants what when where which while will with would your make making practical useful advice explain suggest suggestions simple easy today'.split(' '));
export const queryTerms=q=>[...new Set(String(q).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(t=>t.length>3&&!STOP.has(t)))].slice(0,10);
export function publicKnowledgeUrl(value){try{const u=new URL(value);return u.origin===ORIGIN&&!u.search&&!u.hash&&(/^\/(?:articles|guides|faq|mental-health|shift-health)\/[a-z0-9/-]+$/.test(u.pathname)||['/life-back','/clinic-gone-quiet','/provider-switch','/husband-help','/programme','/grub','/fit','/about'].includes(u.pathname))?u.href:null}catch{return null}}
const entities=s=>s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/gi,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'",'&nbsp;':' '}[x.toLowerCase()]||x)).replace(/&#(\d+);/g,(_,n)=>Number(n)<0x110000?String.fromCodePoint(Number(n)):'');
export function plainText(html){return entities(String(html).replace(/<(script|style|nav|header|footer|form|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim()}
export function extractPublicPage(html,url){
 if(!publicKnowledgeUrl(url)||/\bnoindex\b/i.test(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0]||''))return null;
 const heading=plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
 const title=plainText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||heading);
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];if(!main||!title||!heading)return null;
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
// Rank and deduplicate at the database so discarded passage bodies never cross
// the network. Every request still checks publication status and source freshness.
export function publishedSiteQuery(query,limit=4){
 const terms=queryTerms(query);if(!terms.length)return null;
 const conditions=terms.map(()=>"c.search_text LIKE ?").join(' OR ');
 const rough=terms.map(()=>"(CASE WHEN lower(d.title) LIKE ? THEN 4 ELSE 0 END + CASE WHEN c.search_text LIKE ? THEN 1 ELSE 0 END)").join(' + ');
 // GLOB's negated ASCII class exactly matches the JS token boundary /[^a-z0-9]/.
 const matches=column=>terms.map(t=>`CASE WHEN (' ' || lower(${column}) || ' ') GLOB '*[^a-z0-9]${t}[^a-z0-9]*' THEN 1 ELSE 0 END`).join(' + ');
 const canonical=`(source_uri IN ('${ORIGIN}/life-back','${ORIGIN}/clinic-gone-quiet','${ORIGIN}/provider-switch','${ORIGIN}/husband-help','${ORIGIN}/programme','${ORIGIN}/grub','${ORIGIN}/fit','${ORIGIN}/about') OR (${['articles','guides','faq','mental-health','shift-health'].map(path=>`(source_uri LIKE '${ORIGIN}/${path}/%' AND length(source_uri)>${(ORIGIN+'/'+path+'/').length})`).join(' OR ')} ) AND substr(source_uri,${ORIGIN.length+1}) NOT GLOB '*[^a-z0-9/-]*')`;
 const sql=`WITH candidates AS (SELECT d.id,d.title,d.source_uri,d.updated_at,c.chunk_index,c.content,c.search_text,(${rough}) AS rough_score FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.category=? AND d.status='published_site' AND julianday(d.updated_at)>=julianday('now','-2 days') AND (${conditions}) ORDER BY rough_score DESC,c.chunk_index ASC LIMIT 100), scored AS (SELECT *,(${matches('search_text')}) AS matched,(${matches('search_text')})+3*(${matches('title')}) AS score FROM candidates), eligible AS (SELECT * FROM scored WHERE matched>=? AND ${canonical}), ranked AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY id ORDER BY score DESC,chunk_index ASC,rough_score DESC) AS position FROM eligible) SELECT id,title,source_uri,updated_at,chunk_index,content FROM ranked WHERE position=1 AND score>=max(2,(SELECT max(score)*0.85 FROM eligible)) ORDER BY score DESC,chunk_index ASC,rough_score DESC,id ASC LIMIT ?`;
 return{sql,args:[...terms.flatMap(t=>['%'+t+'%','%'+t+'%']),CATEGORY,...terms.map(t=>'%'+t+'%'),Math.min(2,terms.length),Math.max(1,Math.min(100,Math.trunc(limit)||4))]};
}
export async function retrievePublishedSite(DB,query,limit=4){
 const statement=publishedSiteQuery(query,limit);if(!statement)return[];
 try{const rows=(await DB.prepare(statement.sql).bind(...statement.args).all()).results||[];
 return rows.filter(r=>publicKnowledgeUrl(r.source_uri)).map(r=>({id:'site:'+r.id,sourceWorld:'published_shift_site',title:r.title,content:r.content,authority:75,reviewState:'published_site',citation:r.source_uri,provenance:[{type:'shift_website',ref:r.source_uri,checkedAt:r.updated_at}],limitations:'Published SHIFT website information. Publication is not evidence of individual clinical review.'}));
 }catch{return[]}
}
