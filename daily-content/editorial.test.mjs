import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureEditorialSchema,editorialPublication,digest,frozenArticle,londonRelease,POLICY} from './publication.mjs';
import {generateEditorialArticle,publishDueEditorial,notifyEditorial,validateEditorialDraft} from './editorial.mjs';
import {publicEditorialUrl,primaryEvidenceUrl,refreshEditorialCorpus} from './corpus.mjs';
import {articleHTML,dynamicBabyLovePublication} from '../babylove/dynamic-public.mjs';

const ORIGIN='https://shiftsometimber.co.uk',TARGET=ORIGIN+'/articles/packed-lunch-example',PRIMARY='https://www.food.gov.uk/safety-hygiene/chilling';
const BEFORE=Date.parse('2026-10-20T08:00:00Z'),DUE=Date.parse('2026-10-20T13:00:00Z');
const QUESTION='How can I make a packed lunch easier when the week changes?';
const paragraph='For this illustrative planning example, choose the working day when deciding what to eat usually becomes difficult. Write down where you will eat, the facilities available and one lunch you already enjoy. Make a short list from what you already have. After trying the plan, ask whether it made that awkward moment easier. Change the practical detail that did not fit instead of treating an unused lunch as a personal failure.';
const makeDraft=()=>({question:QUESTION,title:'A packed lunch plan for a changing week',summary:'Choose one awkward day and make lunch easier with a practical planning exercise.',body:'Start with the day that normally catches you out. Choose one familiar lunch and write down what you need to make it work.\n\n## Choose the actual problem\n\n'+paragraph+'\n\n## An illustrative decision sheet\n\n'+paragraph+'\n\n## Review what helped\n\n'+paragraph+'\n\nFollow the food-storage guidance for your ingredients.\n\n## Sources\n\n[Food Standards Agency guidance]('+PRIMARY+')',new_value:['An illustrative facilities-first planning exercise for an unpredictable week.','A decision sheet that checks whether the plan reduced real effort.'],claims:[{claim:'Follow the food-storage guidance for your ingredients.',source_urls:[PRIMARY]}],qualified_review_required:false,follow_up_questions:[]});
const pass=()=>({decision:'PASS',claims_supported:true,distinct_intent:true,useful_original_answer:true,safe_general_information:true,sources_visible:true,honest_authorship:true,medicine_advertising_safe:true,internal_links_appropriate:true,issues:[]});
const sourceText='This synthetic evidence fixture advises following ingredient storage instructions. It does not establish medical outcomes. '.repeat(7);
function html(url,title='Existing public planning page',content=paragraph.repeat(3)){
 return '<!doctype html><html><head><title>'+title+'</title><link rel="canonical" href="'+url+'"><script type="application/ld+json">{"datePublished":"2026-03-23","dateModified":"2026-10-19"}</script></head><body><main><h1>'+title+'</h1><p>'+content+'</p><a href="'+PRIMARY+'">Primary source</a></main></body></html>';
}
async function fixture({oldCms=false,unsupported=false,failedVerification=false,sourceChanges=false,sendFails=false,reviewHold=false,truncateBody=false}={}){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT);
 CREATE TABLE babylove_receipts(slug TEXT PRIMARY KEY,source_id TEXT);
 CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title TEXT,source_uri TEXT,category TEXT,trust_tier INTEGER,status TEXT,checksum TEXT UNIQUE,updated_at TEXT);
 CREATE TABLE ai_knowledge_chunks(document_id INTEGER,chunk_index INTEGER,content TEXT,search_text TEXT);`);
 const statement=(sql,args=[])=>({sql,args,bind(...v){return statement(sql,v);},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};}});
 const DB={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 await ensureEditorialSchema(DB);
 const brief={question:QUESTION,audience:'Men planning ordinary UK lunches',cluster:'Nutrition',target_url:TARGET,source_urls:[PRIMARY]};
 const intent=await digest(QUESTION);
 await DB.prepare(`INSERT INTO knowledge_editorial_briefs(intent_key,question,audience,cluster,target_url,brief_json,priority,created_at,updated_at) VALUES(?,?,?,?,?,?,100,?,?)`).bind(intent,QUESTION,brief.audience,brief.cluster,TARGET,JSON.stringify(brief),new Date(BEFORE).toISOString(),new Date(BEFORE).toISOString()).run();
 let calls=0,sends=0,primaryReads=0;
 const env={DB,AI:{async run(){calls++;const draft=makeDraft();if(unsupported)draft.claims[0].source_urls=['https://example.com/unread'];return {response:calls%2?draft:reviewHold?{...pass(),decision:'HOLD',issues:['Unsupported clinical interpretation']}:pass(),usage:{input_tokens:100,output_tokens:100}};}},SHIFT_AI_MODEL:'existing-test-model',EMAIL:{async send(){sends++;if(sendFails)throw Error('uncertain_send');return {id:'provider-test-'+sends};}},DAILY_EDITORIAL_NOTIFY_ENABLED:'true',DAILY_EDITORIAL_NOTIFY_TEMPLATE:'verified-link-v1'};
 const fetcher=async url=>{
  if(url===PRIMARY){primaryReads++;return new Response(html(url,'Primary source',sourceText+(sourceChanges&&primaryReads>1?' changed':'')),{headers:{'Content-Type':'text/html'}});}
  if(url===ORIGIN+'/sitemap.xml')return new Response('<urlset><url><loc>'+TARGET+'</loc></url><url><loc>'+ORIGIN+'/guides/lunch-planning</loc></url></urlset>',{headers:{'Content-Type':'application/xml'}});
  if(url===ORIGIN+'/explore-knowledge')return new Response('<a href="/articles/packed-lunch-example">Article</a>',{headers:{'Content-Type':'text/html'}});
  if(url===ORIGIN+'/treatment-centre/medicines-watch')return new Response(html(url,'Medicines Watch'),{headers:{'Content-Type':'text/html'}});
  if(url===TARGET){const a=await editorialPublication(env,'packed-lunch-example',{now:DUE});if(a&&!a.editorialBlocked)return new Response(failedVerification?'<html>broken public page</html>':truncateBody?articleHTML(a).replace(/<h2 id="sources">[\s\S]*?<\/main>/,'</main>'):articleHTML(a),{headers:{'Content-Type':'text/html','X-Shift-Article-Source':'shift-editorial'}});return new Response(html(url),{headers:{'Content-Type':'text/html'}});}
  if(url===ORIGIN+'/guides/lunch-planning')return new Response(html(url,'Planning meals around working days'),{headers:{'Content-Type':'text/html'}});
  return new Response('Missing',{status:404});
 };
 if(oldCms){await DB.prepare(`INSERT INTO knowledge_articles(title,slug,category,author,status,summary,body,seo_title,publish_at,updated_at) VALUES('Original title','packed-lunch-example','Nutrition','SHIFT Team','published','Original summary','Original body','Original SEO','2026-03-23','2026-10-01')`).run();await DB.prepare(`INSERT INTO babylove_receipts(slug,source_id) VALUES('packed-lunch-example','original-vendor')`).run();}
 await refreshEditorialCorpus(env,{fetcher,now:BEFORE,limit:12});
 return {env,DB,sqlite,fetcher,calls:()=>calls,sends:()=>sends,brief};
}
test('London release follows clock changes without early publication',()=>{
 assert.equal(londonRelease('2026-10-24'),'2026-10-24T13:00:00.000Z');assert.equal(londonRelease('2026-10-25'),'2026-10-25T14:00:00.000Z');assert.throws(()=>londonRelease('bad'));
});
test('corpus accepts public Watch/tools and rejects every private account/data path',()=>{
 for(const path of ['/tools/bmi','/male-obesity','/treatment-centre/medicines-watch'])assert(publicEditorialUrl(ORIGIN+path));
 for(const path of ['/member/grub','/v1/me','/v1/hq/articles','/questionnaire','/articles/a?token=x','/articles/a#private'])assert.equal(publicEditorialUrl(ORIGIN+path),null);
 for(const url of ['http://www.nhs.uk/a','https://www.nhs.uk.evil.test/a','https://user:pass@www.nhs.uk/a','https://www.nhs.uk/a?key=x'])assert.equal(primaryEvidenceUrl(url),null);
});
test('real SQL generation and due-time publication remain distinct; overlap and repeats do not duplicate or email twice',async()=>{
 const f=await fixture();const made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(made.status,'ready',JSON.stringify(made));assert.equal(f.calls(),2);
 assert.equal(await editorialPublication(f.env,'packed-lunch-example',{now:BEFORE}),null);
 assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE-1})).status,'not_due');
 const both=await Promise.all([publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE}),publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})]);assert(both.some(x=>x.status==='verified'),JSON.stringify(both));
 const live=await editorialPublication(f.env,'packed-lunch-example',{now:DUE});assert.equal(live.author,'SHIFT Editorial');assert.equal(live.publish_at,'2026-03-23');assert.equal(f.sends(),1);
 await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE+60000});assert.equal(f.sends(),1);assert.equal((await f.DB.prepare(`SELECT count(*) n FROM knowledge_articles`).first()).n,1);f.sqlite.close();
});
test('unsupported claims hold before review/publication and never become trusted published knowledge',async()=>{
 const f=await fixture({unsupported:true});const made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(made.status,'held');assert.match(made.reason,/unsupported/);assert.equal(f.calls(),1);assert.equal((await f.DB.prepare(`SELECT count(*) n FROM knowledge_articles`).first()).n,0);assert.equal(f.sends(),0);f.sqlite.close();
});
test('source changes after review stop publication without advancing a successful watermark',async()=>{
 const f=await fixture({sourceChanges:true});assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');const result=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});assert.equal(result.reason,'primary_source_changed_since_review');assert.equal(await editorialPublication(f.env,'packed-lunch-example',{now:DUE}),null);assert.equal(f.sends(),0);f.sqlite.close();
});
test('failed live verification restores the original imported article, not a fabricated vendor receipt',async()=>{
 const f=await fixture({oldCms:true,failedVerification:true});assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');const r=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});assert.equal(r.status,'verification_failed',JSON.stringify(r));const a=await f.DB.prepare(`SELECT * FROM knowledge_articles`).first();assert.equal(a.body,'Original body');assert.equal(a.status,'published');assert.equal((await f.DB.prepare(`SELECT count(*) n FROM babylove_receipts`).first()).n,1);assert.equal(f.sends(),0);f.sqlite.close();
});
test('post-review edits fail closed instead of rendering through the vendor fallback',async()=>{
 const f=await fixture({oldCms:true});assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});await f.DB.prepare(`UPDATE knowledge_articles SET body='unapproved replacement'`).run();assert.equal(await dynamicBabyLovePublication(f.env,'packed-lunch-example'),null);f.sqlite.close();
});
test('uncertain email outcome is recorded once and cannot cause an automatic resend',async()=>{
 const f=await fixture({sendFails:true});assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});const r=await f.DB.prepare(`SELECT * FROM knowledge_editorial_releases`).first();assert.equal(r.notification_state,'failed');await notifyEditorial(f.env,r,{now:DUE+60000});assert.equal(f.sends(),1);f.sqlite.close();
});
test('frozen hash covers metadata, attribution and original publication date, not just body',async()=>{
 const a={title:'Example',slug:'example',category:'Nutrition',author:'SHIFT Editorial',summary:'Example summary',body:'Example body',seo_title:'Example SEO',publish_at:'2026-03-23'};
 for(const k of Object.keys(a))assert.notEqual(await digest(frozenArticle(a)),await digest(frozenArticle({...a,[k]:a[k]+' changed'})));
});

test('critical review rejection cannot publish or become a clinical approval',async()=>{
 const f=await fixture({reviewHold:true});const result=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(result.status,'held');assert.match(result.reason,/critical_review_hold/);assert.equal(f.calls(),2);assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,0);f.sqlite.close();
});
test('late body truncation fails full live verification even when the opening and canonical remain correct',async()=>{
 const f=await fixture({truncateBody:true});assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');const result=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});assert.equal(result.status,'verification_failed');assert.match(result.reason,/completePublicBody/);assert.equal(f.sends(),0);f.sqlite.close();
});
test('expired precommit claims recover with bounded attempts and no second model or publication',async()=>{
 const f=await fixture();assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');await f.DB.prepare("UPDATE knowledge_editorial_releases SET state='publishing',attempts=1,updated_at=?").bind(new Date(DUE-180000).toISOString()).run();const result=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});assert.equal(result.status,'verified',JSON.stringify(result));assert.equal((await f.DB.prepare('SELECT attempts FROM knowledge_editorial_releases').first()).attempts,2);assert.equal(f.calls(),2);assert.equal(f.sends(),1);f.sqlite.close();
});
test('missed slots persist as failures once rather than appearing as successful publications',async()=>{
 const f=await fixture();for(let i=0;i<2;i++)assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})).status,'missed_slot');assert.equal((await f.DB.prepare("SELECT count(*) n FROM knowledge_editorial_events WHERE event_type='missed_slot'").first()).n,1);assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,0);assert.equal(f.sends(),0);f.sqlite.close();
});
