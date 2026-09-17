import {pendingSourceChange} from './radar-source-review-v1.js';
const parse=(s,f={})=>{try{return JSON.parse(s)}catch{return f}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s||'').replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'$1 ($2)').replace(/^#{1,6}\s+/gm,'').replace(/\*\*/g,'').trim();
const html=s=>esc(plain(s)).replace(/\n/g,'<br>');
const enabled=env=>env.RADAR_NOTIFICATION_MODE==='publication_only'&&!env.RADAR_SUPPRESS_NOTIFICATIONS;
const recipient=env=>String(env.RADAR_PUBLICATION_EMAIL_TO||'').trim();
const iso=()=>new Date().toISOString();
export const LIVE_EMAIL_SCHEMA=`CREATE TABLE IF NOT EXISTS radar_live_email(event_id INTEGER PRIMARY KEY,recipient TEXT NOT NULL,content_json TEXT NOT NULL,evidence_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at TEXT NOT NULL,claim_token TEXT,claimed_at TEXT,sent_at TEXT,provider_message_id TEXT,last_error TEXT,created_at TEXT NOT NULL)`;
async function audit(env,id,action,detail){await env.DB.prepare('INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(?,?,?,?)').bind(id,action,'radar_publication_email',JSON.stringify(detail)).run()}
export function liveArticleEmail(row){
 const p=parse(row.content_package_json),slug=String(p.seo?.slug||'').replace(/^\/+/,''),path=slug.startsWith('medicine-news/')?slug:'medicine-news/'+slug;
 if(!/^medicine-news\/[a-z0-9][a-z0-9-]+$/.test(path)||!p.destinations?.includes('medicine_news'))throw Error('not_a_news_article');
 const title=plain(p.headline||row.headline).replace(/[\r\n]+/g,' ').trim(),take=plain(p.shift_take||p.why_it_matters_to_uk),summary=plain(p.standfirst||p.what_changed),url='https://shiftsometimber.co.uk/'+path;
 if(!title||!take)throw Error('publication_email_copy_incomplete');
 const date=String(row.first_published_at||'').replace(' ','T'),parsed=Date.parse(date.endsWith('Z')?date:date+'Z');
 if(!Number.isFinite(parsed))throw Error('publication_date_missing');
 const published=new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/London'}).format(parsed);
 return{url,title,take,subject:'Now live: '+title,text:`Hi Matt,\n\nThe following article is now live on SHIFT:\n\n${title}\nPublished: ${published} (UK time)\n\n${summary}\n\nSHIFT’s take\n${take}\n\nRead the article: ${url}\n\nThis is a publication confirmation. No approval is needed.`,html:`<h1>The following article is now live</h1><h2>${esc(title)}</h2><p>Published: ${esc(published)} (UK time)</p><p>${html(summary)}</p><h2>SHIFT’s take</h2><p>${html(take)}</p><p><a href="${esc(url)}">Read the article on SHIFT</a></p><p>This is a publication confirmation. No approval is needed.</p>`};
}
async function currentArticle(DB,id){return DB.prepare("SELECT e.*,(SELECT MIN(created_at) FROM radar_audit WHERE event_id=e.id AND action='published') first_published_at FROM radar_events e WHERE e.id=?").bind(id).first()}
export async function queueLiveArticleEmail(env,id){
 if(!enabled(env))return{queued:false,reason:'disabled'};
 const to=recipient(env);if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to))return{queued:false,reason:'recipient_not_configured'};
 await env.DB.prepare(LIVE_EMAIL_SCHEMA).run();const row=await currentArticle(env.DB,id);
 if(!row||row.status!=='published'||await pendingSourceChange(env.DB,id))return{queued:false,reason:'not_currently_published'};
 liveArticleEmail(row);
 const result=await env.DB.prepare("INSERT OR IGNORE INTO radar_live_email(event_id,recipient,content_json,evidence_json,next_attempt_at,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM radar_events WHERE id=? AND status='published' AND content_package_json=? AND source_evidence_json=?)").bind(id,to,row.content_package_json,row.source_evidence_json,iso(),iso(),id,row.content_package_json,row.source_evidence_json).run();
 return{queued:Number(result.meta?.changes)>0};
}
export async function deliverLiveArticleEmail(env,id,{fetcher=fetch}={}){
 if(!enabled(env))return{sent:false,reason:'disabled'};
 if(!env.EMAIL?.send)return{sent:false,reason:'email_binding_unavailable'};
 const token=crypto.randomUUID(),now=iso();
 const claimed=await env.DB.prepare("UPDATE radar_live_email SET status='checking',claim_token=?,claimed_at=?,attempts=attempts+1 WHERE event_id=? AND attempts<5 AND ((status IN ('queued','failed') AND next_attempt_at<=?) OR (status='checking' AND julianday(claimed_at)<julianday('now','-10 minutes'))) ").bind(token,now,id,now).run();
 if(!claimed.meta?.changes)return{sent:false,reason:'not_due_or_already_claimed'};
 let sending=false;
 try{
  const job=await env.DB.prepare('SELECT * FROM radar_live_email WHERE event_id=?').bind(id).first(),row=await currentArticle(env.DB,id);
  if(!row||row.status!=='published'||row.content_package_json!==job.content_json||row.source_evidence_json!==job.evidence_json||await pendingSourceChange(env.DB,id)){
   await env.DB.prepare("UPDATE radar_live_email SET status='cancelled',last_error='article_changed_or_withdrawn' WHERE event_id=? AND claim_token=?").bind(id,token).run();return{sent:false,reason:'article_changed_or_withdrawn'};
  }
  const message=liveArticleEmail(row),response=await fetcher(message.url,{redirect:'error',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('public_page_http_'+response.status);
  const body=await response.text(),text=body.replace(/<[^>]*>/g,' ').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ');
  if(!body.includes('data-shift-take')||!text.includes(message.title)||!text.includes(message.take.replace(/\s+/g,' ').replace(/ \(https:\/\/[^)]+\)/g,'')))throw Error('public_page_copy_not_ready');
  if(await pendingSourceChange(env.DB,id))throw Error('source_changed_before_email');
  const ready=await env.DB.prepare("UPDATE radar_live_email SET status='sending' WHERE event_id=? AND claim_token=? AND status='checking' AND EXISTS (SELECT 1 FROM radar_events e WHERE e.id=radar_live_email.event_id AND e.status='published' AND e.content_package_json=radar_live_email.content_json AND e.source_evidence_json=radar_live_email.evidence_json)").bind(id,token).run();
  if(!ready.meta?.changes)return{sent:false,reason:'article_changed_before_email'};
  sending=true;
  const result=await env.EMAIL.send({from:{email:String(env.ADMIN_EMAIL_FROM||'hq@shiftsometimber.co.uk'),name:'SHIFT Newsroom'},to:job.recipient,subject:message.subject,text:message.text,html:message.html});
  await env.DB.prepare("UPDATE radar_live_email SET status='sent',sent_at=?,provider_message_id=?,last_error=NULL WHERE event_id=? AND claim_token=? AND status='sending'").bind(iso(),result?.messageId||null,id,token).run();
  await audit(env,id,'publication_email_sent',{to:job.recipient,url:message.url,message_id:result?.messageId||null});
  return{sent:true,event_id:id};
 }catch(error){
  // Unknown outcomes after entering send are held, not blindly retried: the
  // provider might have accepted a message before the connection failed.
  const explicitRejection=/^E_(?:VALIDATION_ERROR|FIELD_MISSING|SENDER_NOT_VERIFIED|RECIPIENT_NOT_ALLOWED|RECIPIENT_SUPPRESSED|SENDER_DOMAIN_NOT_AVAILABLE|CONTENT_TOO_LARGE|DELIVERY_FAILED|RATE_LIMIT_EXCEEDED|DAILY_LIMIT_EXCEEDED)$/.test(error?.code||'');
  const status=sending&&!explicitRejection?'uncertain':'failed',detail=String(error?.message||error).slice(0,500);
  await env.DB.prepare("UPDATE radar_live_email SET status=?,last_error=?,next_attempt_at=? WHERE event_id=? AND claim_token=? AND status IN ('checking','sending')").bind(status,detail,new Date(Date.now()+15*60000).toISOString(),id,token).run();
  await audit(env,id,'publication_email_failed',{status,error:detail});return{sent:false,reason:status};
 }
}
export async function runLiveArticleEmails(env,{limit=5,fetcher=fetch}={}){
 if(!enabled(env))return{sent:0,reason:'disabled'};
 await env.DB.prepare(LIVE_EMAIL_SCHEMA).run();
 // Recover a missed enqueue only for first publications after this policy was
 // enabled. Never send the historical archive as a backlog of new articles.
 const since=env.RADAR_PUBLICATION_EMAIL_SINCE;
 if(Number.isFinite(Date.parse(since))){const {results=[]}=await env.DB.prepare("SELECT e.id FROM radar_events e WHERE e.status='published' AND julianday((SELECT MIN(created_at) FROM radar_audit WHERE event_id=e.id AND action='published'))>=julianday(?) AND NOT EXISTS(SELECT 1 FROM radar_live_email n WHERE n.event_id=e.id) ORDER BY e.id LIMIT 10").bind(since).all();for(const row of results)try{await queueLiveArticleEmail(env,row.id)}catch(error){await audit(env,row.id,'publication_email_queue_failed',{error:String(error.message||error)})}}
 const {results=[]}=await env.DB.prepare("SELECT event_id FROM radar_live_email WHERE attempts<5 AND ((status IN ('queued','failed') AND julianday(next_attempt_at)<=julianday('now')) OR (status='checking' AND julianday(claimed_at)<julianday('now','-10 minutes'))) ORDER BY created_at LIMIT ?").bind(Math.max(1,Math.min(10,limit))).all();
 const deliveries=[];for(const job of results)deliveries.push(await deliverLiveArticleEmail(env,job.event_id,{fetcher}));
 return{sent:deliveries.filter(x=>x.sent).length,deliveries};
}
