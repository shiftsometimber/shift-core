// Website-owned editorial publications. No vendor receipts or human reviews are fabricated.
export const ORIGIN='https://shiftsometimber.co.uk';
export const POLICY='shift-website-editorial-20261018-v1';
export const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export const frozenArticle=a=>JSON.stringify({title:a.title,slug:a.slug,category:a.category,author:a.author,summary:a.summary,body:a.body,seo_title:a.seo_title,publish_at:a.publish_at});
export function londonParts(now=Date.now()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(x=>[x.type,x.value]));
 return {day:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour),minute:Number(p.minute)};
}
export function londonRelease(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('invalid_release_day');
 let utc=Date.parse(day+'T14:00:00Z');
 for(let i=0;i<3;i++){const p=londonParts(utc);utc+=(14-p.hour)*3600000-p.minute*60000;}
 if(londonParts(utc).day!==day||londonParts(utc).hour!==14)throw Error('timezone_resolution_failed');
 return new Date(utc).toISOString();
}
export async function ensureEditorialSchema(DB){
 const sql=[
 `CREATE TABLE IF NOT EXISTS knowledge_editorial_briefs (intent_key TEXT PRIMARY KEY, question TEXT NOT NULL, audience TEXT NOT NULL, cluster TEXT NOT NULL, target_url TEXT NOT NULL, brief_json TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 0, demand_basis TEXT NOT NULL DEFAULT 'editorial_hypothesis', state TEXT NOT NULL DEFAULT 'planned', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS knowledge_editorial_releases (release_day TEXT NOT NULL, intent_key TEXT NOT NULL, article_id INTEGER, slug TEXT NOT NULL, state TEXT NOT NULL, token TEXT PRIMARY KEY, policy TEXT NOT NULL, due_at TEXT NOT NULL, final_sha256 TEXT, payload_json TEXT NOT NULL, evidence_json TEXT, review_json TEXT, previous_json TEXT, attempts INTEGER NOT NULL DEFAULT 0, generated_at TEXT, published_at TEXT, verified_at TEXT, verification_json TEXT, notification_state TEXT NOT NULL DEFAULT 'pending', notification_receipt TEXT, reason TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS knowledge_editorial_jobs (job_key TEXT PRIMARY KEY, token TEXT NOT NULL, state TEXT NOT NULL, model_calls INTEGER NOT NULL DEFAULT 0, usage_json TEXT, draft_json TEXT, review_json TEXT, started_at TEXT NOT NULL, finished_at TEXT, reason TEXT)`,
 `CREATE TABLE IF NOT EXISTS knowledge_editorial_page_meta (source_uri TEXT PRIMARY KEY, canonical TEXT NOT NULL, audience TEXT, subject TEXT, source_links_json TEXT NOT NULL, review_dates_json TEXT NOT NULL, publication_date TEXT, content_sha256 TEXT NOT NULL, checked_at TEXT NOT NULL, state TEXT NOT NULL, reason TEXT)`,
 `CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_active_day ON knowledge_editorial_releases(release_day) WHERE state IN ('preparing','ready','publishing','published','verified')`,
 `CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_pending_intent ON knowledge_editorial_releases(intent_key) WHERE state IN ('preparing','ready','publishing')`,
 `CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_pending_slug ON knowledge_editorial_releases(slug) WHERE state IN ('preparing','ready','publishing')`,
 `CREATE TABLE IF NOT EXISTS knowledge_editorial_events (event_key TEXT PRIMARY KEY, event_type TEXT NOT NULL, release_day TEXT, details_json TEXT NOT NULL, created_at TEXT NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS idx_editorial_release_state ON knowledge_editorial_releases(state,due_at)`];
 for(const q of sql)await DB.prepare(q).run();
 const columns=(await DB.prepare('PRAGMA table_info(knowledge_editorial_jobs)').all()).results||[];
 for(const name of ['draft_json','review_json'])if(!columns.some(c=>c.name===name))await DB.prepare(`ALTER TABLE knowledge_editorial_jobs ADD COLUMN ${name} TEXT`).run();
}
async function acceptedEditorialRow(a,now){
 if(!a||a.policy!==POLICY)return null;
 if(a.editorial_state==='publishing')return {editorialBlocked:true};
 if(!['published','verified'].includes(a.editorial_state)){const old=JSON.parse(a.previous_json||'null');return old&&frozenArticle(a)===frozenArticle(old)?null:{editorialBlocked:true};}
 if(Date.parse(a.editorial_due_at)>now||await digest(frozenArticle(a))!==a.final_sha256)return {editorialBlocked:true};
 return {...a,source_id:'shift-editorial',editorial:true};
}
export async function editorialPublication(env,slug,{now=Date.now()}={}){
 if(!env.DB||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 try{
 const a=await env.DB.prepare(`SELECT a.*,r.final_sha256,r.policy,r.due_at editorial_due_at,r.published_at editorial_published_at,r.state editorial_state,r.previous_json FROM knowledge_articles a JOIN knowledge_editorial_releases r ON r.article_id=a.id AND r.slug=a.slug WHERE a.slug=? AND a.status='published' AND r.policy=? AND a.publish_at IS NOT NULL ORDER BY CASE WHEN r.state IN ('publishing','published','verified') THEN 0 ELSE 1 END,r.due_at DESC,r.generated_at DESC LIMIT 1`).bind(slug,POLICY).first();
 return acceptedEditorialRow(a,now);
 }catch{return null;}
}
export async function publicArticlePublication(env,slug,{now=Date.now()}={}){
 if(!env.DB||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 try{
  // One fresh database snapshot: an editorial lookup must not consume a second
  // publication read or allow a vendor receipt to bypass an owned failed check.
  const a=await env.DB.prepare(`SELECT a.*,b.source_id,r.final_sha256,r.policy,r.due_at editorial_due_at,r.published_at editorial_published_at,r.state editorial_state,r.previous_json FROM knowledge_articles a LEFT JOIN babylove_receipts b ON b.slug=a.slug LEFT JOIN knowledge_editorial_releases r ON r.article_id=a.id AND r.slug=a.slug WHERE a.slug=? AND a.status='published' AND a.publish_at IS NOT NULL AND julianday(a.publish_at)<=julianday('now') AND (b.slug IS NOT NULL OR r.token IS NOT NULL) ORDER BY CASE WHEN r.state IN ('publishing','published','verified') THEN 0 ELSE 1 END,r.due_at DESC,r.generated_at DESC LIMIT 1`).bind(slug).first();
  if(!a)return null;if(a.policy){if(a.policy!==POLICY)return {editorialBlocked:true};const accepted=await acceptedEditorialRow(a,now);return accepted||{...a,editorial:false};}return a;
 }catch(e){
  // The journal does not exist before initial activation. A generated article
  // must never be served through this schema-compatibility path.
  if(!/no such table: (?:main\.)?knowledge_editorial_releases/i.test(String(e.message)))return null;
  try{return await env.DB.prepare(`SELECT a.*,b.source_id FROM knowledge_articles a JOIN babylove_receipts b ON b.slug=a.slug WHERE a.slug=? AND a.status='published' AND a.author IS NOT 'SHIFT Editorial' AND a.publish_at IS NOT NULL AND julianday(a.publish_at)<=julianday('now')`).bind(slug).first();}catch{return null;}
 }
}
export async function editorialDiscovery(env,{now=Date.now()}={}){
 try{const rows=(await env.DB.prepare(`SELECT slug,max(due_at) latest_due FROM knowledge_editorial_releases WHERE policy=? AND state IN ('published','verified') AND julianday(due_at)<=julianday(?) GROUP BY slug ORDER BY latest_due DESC LIMIT 100`).bind(POLICY,new Date(now).toISOString()).all()).results||[];
 const accepted=[];for(const r of rows){const a=await editorialPublication(env,r.slug,{now});if(a&&!a.editorialBlocked)accepted.push(a);}return accepted;
 }catch{return [];}
}
export function verificationChecks(html,a,response){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const canonical=html.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']([^"']+)/i)?.[1];
 const first=String(a.body).split(/\n\s*\n/).find(x=>x.trim()&&!/^#/.test(x.trim()))||'';
 const visibleFirst=first.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*|`/g,'').replace(/\s+/g,' ').trim();
 const visibleHtml=html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ');
 return {http200:response.status===200,canonical:canonical===ORIGIN+'/articles/'+a.slug,indexable:/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*index,follow/i.test(html)&&!/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*noindex/i.test(html),title:html.includes('<h1>'+escape(a.title)+'</h1>'),bodyOpening:!!visibleFirst&&visibleHtml.includes(visibleFirst),headersIndexable:!/(?<![a-z])noindex\b/i.test(response.headers.get('X-Robots-Tag')||''),mobileViewport:/name=["']viewport["']/i.test(html),editorialSource:response.headers.get('X-Shift-Article-Source')==='shift-editorial'};
}
export async function verifyEditorialRelease(env,r,{fetcher=fetch,now=Date.now()}={}){
 const a=await editorialPublication(env,r.slug,{now});if(!a||a.editorialBlocked)throw Error('publication_not_serving_eligible');
 const url=ORIGIN+'/articles/'+a.slug;
 const res=await fetcher(url,{redirect:'error',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)}),html=await res.text();
 const checks=verificationChecks(html,a,res);
 const {articleHTML}=await import('../babylove/dynamic-public.mjs');
 const main=s=>s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
 checks.completePublicBody=!!main(html)&&main(html)===main(articleHTML(a));
 checks.metadataDescription=html.includes(articleHTML(a).match(/<meta\b(?=[^>]*name=["']description["'])[^>]*>/i)?.[0]||'__missing_description__');
 checks.seoTitle=html.match(/<title>([^<]*)<\/title>/i)?.[1]===articleHTML(a).match(/<title>([^<]*)<\/title>/i)?.[1];
 const sitemap=await fetcher(ORIGIN+'/sitemap.xml',{redirect:'error',signal:AbortSignal.timeout(12000)});
 checks.sitemap=sitemap.ok&&(await sitemap.text()).includes('<loc>'+url+'</loc>');
 const hub=await fetcher(ORIGIN+'/explore-knowledge',{redirect:'error',signal:AbortSignal.timeout(12000)});
 checks.hub=hub.ok&&(await hub.text()).includes('/articles/'+a.slug);
 if(!Object.values(checks).every(Boolean))throw Error('live_verification_failed:'+Object.entries(checks).filter(([,v])=>!v).map(([k])=>k).join(','));
 const stamp=new Date().toISOString(),proof={at:stamp,url,checks,htmlSha256:await digest(html),finalSha256:r.final_sha256,physicalDeviceVerified:false,googleIndexed:false};
 await env.DB.prepare(`UPDATE knowledge_editorial_releases SET state='verified',verified_at=?,verification_json=?,updated_at=? WHERE release_day=? AND token=? AND final_sha256=? AND state='published'`).bind(stamp,JSON.stringify(proof),stamp,r.release_day,r.token,r.final_sha256).run();
 return {a,proof,html};
}
