// Matt's bounded internal-link permission. No replacement copy is accepted.
import {BLOG_ORIGIN,canonicalArticleUrl,sha256,pendingReceipt} from './contributor-policy.mjs';

const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['id','title','slug','category','author','status','summary','body','seo_title','publish_at','updated_at'];
const snapshot=r=>r?Object.fromEntries(fields.map(k=>[k,r[k]??null])):null;
const main=s=>s.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
const parse=s=>{try{return JSON.parse(s)}catch{return null}};
const stamp=now=>new Date(now).toISOString();

export function internalLinkURL(raw){
 if(typeof raw!=='string'||!/^(?:https:\/\/shiftsometimber\.co\.uk)?\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(raw))throw Error('public_internal_link_required');
 const u=new URL(raw,BLOG_ORIGIN);
 if(/^\/(?:v1|api|hq|admin|auth|login|logout|register|account|my-timber|members?|checkout|payments?|orders?|assets|uploads)(?:\/|$)/.test(u.pathname))throw Error('public_internal_link_required');
 return u.href;
}

export function addInternalLinks(body,links,sourceURL){
 if(typeof body!=='string'||body.length>120000||!Array.isArray(links)||links.length<1||links.length>5)throw Error('one_to_five_link_additions_required');
 const spans=[];
 for(const link of links){
  if(!link||Object.keys(link).sort().join(',')!=='text,url'||typeof link.text!=='string'||link.text.length<3||link.text.length>160||link.text.trim()!==link.text||/[\r\n\t\[\]()`*_~<>!|\\]/.test(link.text))throw Error('plain_existing_anchor_text_required');
  const url=internalLinkURL(link.url);if(url===sourceURL)throw Error('self_link_not_added');
  const start=body.indexOf(link.text),end=start+link.text.length;
  if(start<0||body.indexOf(link.text,start+1)!==-1)throw Error('anchor_must_match_once');
  const left=body.slice(0,start),lineStart=left.lastIndexOf('\n')+1,next=body.indexOf('\n',end),line=body.slice(lineStart,next<0?body.length:next);
  // Deliberately restrict automatic edits to plain paragraph lines. Headings,
  // existing links/images, code, lists, tables and possible image captions hold.
  const preceding=body.slice(0,lineStart).trimEnd().split('\n').at(-1)||'';
  if(/^(?: {4}|\t|\s*[#>|`~*+-]|\s*\d+[.)]\s)/.test(line)||/[\[\]()`*_~<>!|\\]/.test(line)||/^!\[/.test(preceding))throw Error('anchor_requires_plain_paragraph');
  if(/[\p{L}\p{N}]/u.test(body[start-1]||'')&&/[\p{L}\p{N}]/u.test(link.text[0])||/[\p{L}\p{N}]/u.test(body[end]||'')&&/[\p{L}\p{N}]/u.test(link.text.at(-1)))throw Error('whole_anchor_words_required');
  if(spans.some(s=>start<s.end&&end>s.start))throw Error('overlapping_link_additions');
  spans.push({start,end,text:link.text,url});
 }
 let after=body;for(const s of [...spans].sort((a,b)=>b.start-a.start))after=after.slice(0,s.start)+'['+s.text+']('+s.url+')'+after.slice(s.end);
 return {body:after,links:spans.map(({text,url})=>({text,url}))};
}

export function prepareLinkPatch(body,payload,sourceURL){
 const inline=payload.links||[],related=payload.related||[];
 if(!Array.isArray(inline)||!Array.isArray(related)||related.length>1||inline.length+related.length<1||inline.length+related.length>5)throw Error('one_to_five_links_and_at_most_one_related_line');
 const result=inline.length?addInternalLinks(body,inline,sourceURL):{body,links:[]};
 if(related.length){
  const r=related[0];
  if(!r||Object.keys(r).sort().join(',')!=='text,url'||typeof r.text!=='string'||r.text.length<3||r.text.length>160||r.text.trim()!==r.text||/[\r\n\t\[\]()`*_~<>!|\\]/.test(r.text))throw Error('plain_related_article_title_required');
  const url=internalLinkURL(r.url);if(url===sourceURL||String(body).includes(url)||String(body).includes(new URL(url).pathname+')'))throw Error('related_link_already_present_or_self');
  result.related={text:r.text,url,related:true};
  result.body+='\n\nRelated: ['+r.text+']('+url+')';
  result.links.push(result.related);
 }
 return result;
}

function relevant(text,title){
 const stop=new Set(['about','with','your','from','that','this','have','more','here','help','shift','some','timber','article','guide','what','when','which','does','into','they','them','will','could','would','should']);
 const words=s=>String(s).toLowerCase().match(/[a-z0-9]{4,}/g)||[];
 const target=new Set(words(title));return words(text).some(w=>!stop.has(w)&&target.has(w));
}

async function destination(fetcher,link,get){
 const {response,text}=await get(fetcher,link.url,'text/html');
 if(!/^text\/html(?:;|$)/i.test(response.headers.get('Content-Type')||'')||/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*noindex/i.test(text)||/noindex/i.test(response.headers.get('X-Robots-Tag')||''))throw Error('destination_not_public_indexable_html');
 const canonical=text.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']([^"']+)/i)?.[1];
 const heading=text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g,' ');
 const plain=t=>String(t).replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'\"').replace(/\s+/g,' ').trim();
 if(canonical!==link.url||!heading||!relevant(link.text,heading)||link.related&&plain(heading)!==link.text)throw Error('destination_canonical_or_relevance_failed');
}

async function receiptChecks(env,row,url,links,{fetcher,get,renderer}){
 const checks={};
 try{const p=await get(fetcher,url,'text/html');checks.pageLive={status:main(p.text)&&main(p.text)===main(renderer.articleHTML(row))?'pass':'fail'};checks.canonicalCorrect={status:p.text.includes('rel="canonical" href="'+url+'"')?'pass':'fail'}}catch{checks.pageLive={status:'fail'};checks.canonicalCorrect={status:'fail'}}
 try{for(const link of links)await destination(fetcher,link,get);checks.internalLinksResolve={status:'pass'}}catch(e){checks.internalLinksResolve={status:'fail',reason:e.message}}
 const image=renderer.representativeImage(row);
 if(!image)checks.imageLoads={status:'not_applicable',reason:'The existing article has no representative image; this operation adds none.'};
 else try{const u=new URL(image.url);if(u.origin!==BLOG_ORIGIN&&!['media.babylovegrowth.ai','csuxjmfbwmkxiegfpljm.supabase.co'].includes(u.hostname))throw Error();const p=await get(fetcher,u.href,'image/*',8000000);if(!/^image\/(?:png|jpeg|webp|gif)(?:;|$)/i.test(p.response.headers.get('Content-Type')||''))throw Error();checks.imageLoads={status:'pass'}}catch{checks.imageLoads={status:'fail'}}
 for(const [key,path,needle]of [['blogListing','/explore-knowledge','/articles/'+row.slug],['sitemap','/sitemap.xml','<loc>'+url+'</loc>']]){try{checks[key]={status:(await get(fetcher,BLOG_ORIGIN+path,'text/html,application/xml')).text.includes(needle)?'pass':'fail'}}catch{checks[key]={status:'fail'}}}
 return checks;
}

export async function submitInternalLinks(env,key,payload,idempotency,{now=Date.now(),fetcher=fetch,helpers}){
 const {respond,get}=helpers,DB=env.DB;
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(idempotency||''))return respond({error:'idempotency_key_required'},400);
 const hash=await sha256(stable({operation:'internal_links',payload}));
 const prior=await DB.prepare('SELECT * FROM knowledge_blog_submissions WHERE key_id=? AND idempotency_key=?').bind(key.id,idempotency).first();
 if(prior)return prior.payload_hash===hash?respond({...helpers.submissionView(prior),duplicate:true}):respond({error:'idempotency_content_conflict'},409);
 const rate=await DB.prepare('SELECT count(*) n FROM knowledge_blog_submissions WHERE key_id=? AND created_at>?').bind(key.id,stamp(now-3600000)).first();if(Number(rate?.n||0)>=10)return respond({error:'submission_rate_limit'},429);
 let before=null,after=null,publicRow=null,owned=null,journal=null,editorialTable=false,metadata=null,patch=null,url=null,slug=null,renderer=null;
 const reasons=[];
 try{
  if(!payload||!Object.hasOwn(payload,'url')||Object.keys(payload).some(k=>!['url','links','related'].includes(k)))throw Error('link_patch_fields_only_no_replacement_copy');
  url=canonicalArticleUrl(payload.url);slug=url.split('/').at(-1);
  renderer=await import('./dynamic-public.mjs');
  publicRow=await renderer.dynamicBabyLovePublication(env,slug);
  if(!publicRow)throw Error('published_cms_blog_required');
  before=snapshot(publicRow);
  owned=await DB.prepare('SELECT * FROM knowledge_blog_pages WHERE slug=?').bind(slug).first();
  editorialTable=!!await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_editorial_releases'").first();
  if(editorialTable){journal=await DB.prepare("SELECT * FROM knowledge_editorial_releases WHERE article_id=? AND slug=? ORDER BY CASE WHEN state IN ('publishing','published','verified') THEN 0 ELSE 1 END,due_at DESC LIMIT 1").bind(before.id,slug).first();if(journal&&(!publicRow.editorial||journal.state==='publishing'||owned))throw Error('publication_owner_conflict');}
  if(owned){metadata=parse(owned.metadata_json);if(!publicRow.contributor||!metadata?.body)throw Error('complete_blog_metadata_required');patch=prepareLinkPatch(metadata.body,payload,url);const prefix=before.body.slice(0,before.body.length-metadata.body.length);if(prefix+metadata.body!==before.body)throw Error('metadata_body_mismatch');after={...before,body:prefix+patch.body,updated_at:stamp(now)};metadata={...metadata,body:patch.body};}
  else{patch=prepareLinkPatch(before.body,payload,url);after={...before,body:patch.body,updated_at:stamp(now)};}
  let rendered=renderer.renderMarkdown(after.body,before.title,slug);
  if(patch.related){const r=patch.related;const paragraph='<p>Related: <a href=\"'+esc(r.url)+'\" rel=\"noopener noreferrer\">'+esc(r.text)+'</a></p>';if(!rendered.endsWith(paragraph))throw Error('related_line_render_mismatch');rendered=rendered.slice(0,-paragraph.length);}
  for(const link of patch.links.filter(l=>!l.related)){const anchor='<a href="'+esc(link.url)+'" rel="noopener noreferrer">'+esc(link.text)+'</a>';if(!rendered.includes(anchor))throw Error('link_render_mismatch');rendered=rendered.replace(anchor,esc(link.text));}
  if(rendered!==renderer.renderMarkdown(before.body,before.title,slug))throw Error('wording_or_formatting_changed');
  const checks=await receiptChecks(env,publicRow,url,patch.links,{fetcher,get,renderer});if(Object.values(checks).some(c=>c.status==='fail'))throw Error('link_or_existing_page_checks_failed');
 }catch(e){reasons.push(String(e.message||'link_checks_failed'));}
 const id=crypto.randomUUID(),baseHash=await sha256(stable(before)),state=reasons.length?'draft_failed':'links_checking';
 const proposed={operation:'internal_links',url:payload?.url,title:before?.title,body:after?.body,links:patch?.links||payload?.links};
 try{await DB.prepare('INSERT INTO knowledge_blog_submissions(id,key_id,idempotency_key,payload_hash,payload_json,slug,state,reasons_json,base_json,base_hash,receipt_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,key.id,idempotency,hash,stable(proposed),slug,state,JSON.stringify(reasons),JSON.stringify(before),baseHash,JSON.stringify(pendingReceipt(state,reasons)),stamp(now),stamp(now)).run();}
 catch(e){const other=await DB.prepare('SELECT * FROM knowledge_blog_submissions WHERE key_id=? AND idempotency_key=?').bind(key.id,idempotency).first();if(other)return other.payload_hash===hash?respond({...helpers.submissionView(other),duplicate:true}):respond({error:'idempotency_content_conflict'},409);throw e;}
 const finish=async(finalState,why,receipt)=>{await DB.prepare('UPDATE knowledge_blog_submissions SET state=?,reasons_json=?,receipt_json=?,updated_at=? WHERE id=?').bind(finalState,JSON.stringify(why),JSON.stringify(receipt||pendingReceipt(finalState,why)),stamp(now),id).run();return respond(helpers.submissionView(await DB.prepare('SELECT * FROM knowledge_blog_submissions WHERE id=?').bind(id).first()),202);};
 if(reasons.length)return finish('draft_failed',reasons);
 const version=crypto.randomUUID();
 try{
  await DB.prepare("UPDATE knowledge_blog_submissions SET state='links_applying',updated_at=? WHERE id=? AND state='links_checking'").bind(stamp(now),id).run();
  const guards=fields.map(k=>k+' IS ?').join(' AND ');
  const pageGuard=owned?'EXISTS(SELECT 1 FROM knowledge_blog_pages WHERE slug=? AND row_hash=? AND metadata_json IS ? AND submission_id=?)':'NOT EXISTS(SELECT 1 FROM knowledge_blog_pages WHERE slug=?)';
  const pageArgs=owned?[slug,owned.row_hash,owned.metadata_json,owned.submission_id]:[slug];
  const journalGuard=!editorialTable?'1=1':journal?"EXISTS(SELECT 1 FROM knowledge_editorial_releases WHERE token=? AND final_sha256=? AND state IN ('published','verified'))":"NOT EXISTS(SELECT 1 FROM knowledge_editorial_releases WHERE article_id=? AND slug=? AND state IN ('publishing','published','verified'))";
  const journalArgs=!editorialTable?[]:journal?[journal.token,journal.final_sha256]:[before.id,slug];
  const rowHash=await sha256(stable(Object.fromEntries(Object.entries(after).filter(([k])=>k!=='id'))));
  const statements=[
   DB.prepare(`UPDATE knowledge_articles SET body=?,updated_at=? WHERE ${guards} AND EXISTS(SELECT 1 FROM knowledge_blog_keys WHERE id=? AND active=1) AND ${pageGuard} AND ${journalGuard}`).bind(after.body,stamp(now),...fields.map(k=>before[k]),key.id,...pageArgs,...journalArgs),
   DB.prepare('INSERT INTO knowledge_blog_versions(id,slug,submission_id,before_json,before_metadata_json,after_json,after_metadata_json,approved_by,created_at) SELECT CASE WHEN changes()=1 THEN ? ELSE NULL END,?,?,?,?,?,?,?,?').bind(version,slug,id,stable(before),owned?.metadata_json||null,stable(after),stable(metadata), 'policy:internal_links_only',stamp(now))
  ];
  if(owned)statements.push(DB.prepare('UPDATE knowledge_blog_pages SET row_hash=?,metadata_json=? WHERE slug=?').bind(rowHash,stable(metadata),slug));
  if(journal){const {digest,frozenArticle}=await import('../daily-content/publication.mjs');if(await digest(frozenArticle(before))!==journal.final_sha256)throw Error('editorial_base_changed');statements.push(DB.prepare("UPDATE knowledge_editorial_releases SET final_sha256=?,state='published',verified_at=NULL,verification_json=NULL,updated_at=? WHERE token=? AND final_sha256=? AND state IN ('published','verified')").bind(await digest(frozenArticle(after)),stamp(now),journal.token,journal.final_sha256));}
  statements.push(DB.prepare("UPDATE knowledge_blog_submissions SET state='links_applied_unverified',updated_at=? WHERE id=?").bind(stamp(now),id));
  await DB.batch(statements);
 }catch(e){return finish('publication_uncertain',['atomic_link_edit_not_completed_or_uncertain_check_owner_record']);}
 try{
  const live=await renderer.dynamicBabyLovePublication(env,slug);if(!live||stable(snapshot(live))!==stable(after))throw Error('changed_after_link_write');
  const checks=await receiptChecks(env,live,url,patch.links,{fetcher,get,renderer});
  const finalState=Object.values(checks).some(c=>c.status==='fail')?'links_verification_failed':'links_verified';
  return finish(finalState,[],{state:finalState,kind:'internal_links',url,checkedAt:stamp(now),checks,existingWordingUnchanged:true,relatedLineAdded:!!patch.related,originalPublicationDate:before.publish_at,addedLinks:patch.links,approvalBasis:'Matt-approved internal-link-only policy',googleIndexed:false});
 }catch(e){return finish('links_verification_failed',[String(e.message||'verification_failed')]);}
}
