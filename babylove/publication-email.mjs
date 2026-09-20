import {ARTICLE as oral,oralPublication} from './oral-public.mjs';
const now=()=>new Date().toISOString();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function notifyArticlePublication(env,{fetcher=fetch}={}){
 const to=env.RADAR_PUBLICATION_EMAIL_TO;
 if(!env.EMAIL?.send||!to)return{sent:false,reason:'email_not_configured'};
 const row=await oralPublication(env);if(!row)return{sent:false,reason:'not_published'};
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS knowledge_publication_email(slug TEXT PRIMARY KEY,status TEXT NOT NULL,recipient TEXT NOT NULL,created_at TEXT NOT NULL,sent_at TEXT,provider_message_id TEXT,last_error TEXT)").run();
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO knowledge_publication_email(slug,status,recipient,created_at) VALUES(?,'checking',?,?)").bind(oral.slug,to,now()).run();
 if(!claim.meta?.changes)return{sent:false,reason:'already_claimed'};
 let sending=false;
 try{
  const response=await fetcher(oral.proposed_url,{redirect:'manual',signal:AbortSignal.timeout(15000)}),html=await response.text();
  if(response.status!==200||!html.includes(oral.body)||!html.includes('rel="canonical" href="'+oral.proposed_url+'"'))throw Error('live_article_not_verified');
  if(!await oralPublication(env))throw Error('publication_changed');
  await env.DB.prepare("UPDATE knowledge_publication_email SET status='sending' WHERE slug=? AND status='checking'").bind(oral.slug).run();sending=true;
  const subject='Now live: '+oral.title;
  const text=`Hi Matt,\n\nThis article is now live on SHIFT:\n\n${oral.title}\n${oral.proposed_url}\n\n${oral.summary}\n\nSHIFT’s take\n${oral.shiftTake}\n\nThe public page was checked before this notification. No approval is needed.`;
  const result=await env.EMAIL.send({from:{email:env.ADMIN_EMAIL_FROM||'hq@shiftsometimber.co.uk',name:'SHIFT'},to,subject,text,html:'<h1>Now live on SHIFT</h1><h2>'+escape(oral.title)+'</h2><p>'+escape(oral.summary)+'</p><h3>SHIFT’s take</h3><p>'+escape(oral.shiftTake)+'</p><p><a href="'+oral.proposed_url+'">Read the article</a></p>'});
  await env.DB.prepare("UPDATE knowledge_publication_email SET status='sent',sent_at=?,provider_message_id=? WHERE slug=? AND status='sending'").bind(now(),result?.messageId||null,oral.slug).run();return{sent:true};
 }catch(error){
  if(sending)await env.DB.prepare("UPDATE knowledge_publication_email SET status='delivery_unknown',last_error=? WHERE slug=? AND status='sending'").bind(String(error.message).slice(0,200),oral.slug).run();
  else await env.DB.prepare("DELETE FROM knowledge_publication_email WHERE slug=? AND status='checking'").bind(oral.slug).run();
  return{sent:false,reason:sending?'delivery_unknown':'live_check_failed'};
 }
}
