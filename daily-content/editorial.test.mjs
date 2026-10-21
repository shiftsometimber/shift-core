import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureEditorialSchema,editorialPublication,publicArticlePublication,digest,frozenArticle,londonRelease,POLICY} from './publication.mjs';
import {generateEditorialArticle,publishDueEditorial,notifyEditorial,validateEditorialDraft,reviewEvidenceIssues,editorialReviewMaterial,resolveEditorialReview,reviewAccepted,recoverInterruptedEditorialJobs,sourceSupportAccepted,sourceSupportInput} from './editorial.mjs';
import {publicEditorialUrl,primaryEvidenceUrl,refreshEditorialCorpus,completeEmcLeaflet,structuredPrimaryText} from './corpus.mjs';
import {articleHTML,dynamicBabyLovePublication} from '../babylove/dynamic-public.mjs';

const ORIGIN='https://shiftsometimber.co.uk',TARGET=ORIGIN+'/articles/packed-lunch-example',PRIMARY='https://www.food.gov.uk/safety-hygiene/chilling';
const BEFORE=Date.parse('2026-10-20T08:00:00Z'),DUE=Date.parse('2026-10-20T13:00:00Z');
const QUESTION='How can I make a packed lunch easier when the week changes?';
const paragraph='For this illustrative planning example, choose the working day when deciding what to eat usually becomes difficult. Write down where you will eat, the facilities available and one lunch you already enjoy. Make a short list from what you already have. After trying the plan, ask whether it made that awkward moment easier. Change the practical detail that did not fit instead of treating an unused lunch as a personal failure.';
const makeDraft=()=>({question:QUESTION,title:'A packed lunch plan for a changing week',summary:'Choose one awkward day and make lunch easier with a practical planning exercise.',body:'Start with the day that normally catches you out. Choose one familiar lunch and write down what you need to make it work.\n\n## Choose the actual problem\n\n'+paragraph+'\n\n## An illustrative decision sheet\n\n'+paragraph+'\n\n## Review what helped\n\n'+paragraph+'\n\nFollow the food-storage guidance for your ingredients.\n\n## Sources\n\n[Food Standards Agency guidance]('+PRIMARY+')',new_value:['An illustrative facilities-first planning exercise for an unpredictable week.','A decision sheet that checks whether the plan reduced real effort.'],claims:[{claim:'Follow the food-storage guidance for your ingredients.',source_urls:[PRIMARY]}],qualified_review_required:false,follow_up_questions:[]});
const pass=()=>({decision:'PASS',claims_supported:true,distinct_intent:true,useful_original_answer:true,safe_general_information:true,sources_visible:true,honest_authorship:true,medicine_advertising_safe:true,internal_links_appropriate:true,qualified_review_required:false,qualified_review_issue:'',evidence_checks:[{claim:'Follow the food-storage guidance for your ingredients.',source_id:'E1',supported:true,evidence_quote:'This synthetic evidence fixture advises following ingredient storage instructions.'}],usefulness_quotes:['Choose one familiar lunch and write down what you need to make it work.','After trying the plan, ask whether it made that awkward moment easier.'],brief_delivery_checks:[],issues:[]});
const supportPass=()=>({claims:[{id:'C1',verdict:'SUPPORTED',unsupported_parts:[],reason:'The supplied exact source quotation supports the complete factual reminder.'}],unmapped_claims:[],decision:'PASS'});
const sourceText='This synthetic evidence fixture advises following ingredient storage instructions. It does not establish medical outcomes. '.repeat(7);
function html(url,title='Existing public planning page',content=('Synthetic existing public background about packed lunches and working weeks. This older guide explains how to find ordinary meal-planning information and public tools. It does not contain the new decision sheet or example. ').repeat(5)){
 return '<!doctype html><html><head><title>'+title+'</title><link rel="canonical" href="'+url+'"><script type="application/ld+json">{"datePublished":"2026-03-23","dateModified":"2026-10-01"}</script></head><body><main><h1>'+title+'</h1><p>'+content+'</p><a href="'+PRIMARY+'">Primary source</a></main></body></html>';
}
async function fixture({oldCms=false,unsupported=false,failedVerification=false,sourceChanges=false,sendFails=false,reviewHold=false,truncateBody=false,recentlyUpdated=false,providerFails=false,structured=false,supportHold=false}={}){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT);
 CREATE TABLE babylove_receipts(slug TEXT PRIMARY KEY,source_id TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title TEXT,source_uri TEXT,category TEXT,trust_tier INTEGER,status TEXT,checksum TEXT UNIQUE,updated_at TEXT);
 CREATE TABLE ai_knowledge_chunks(document_id INTEGER,chunk_index INTEGER,content TEXT,search_text TEXT);`);
 const statement=(sql,args=[])=>({sql,args,bind(...v){return statement(sql,v);},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};}});
 const DB={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 await ensureEditorialSchema(DB);
 const brief={question:QUESTION,audience:'Men planning ordinary UK lunches',cluster:'Nutrition',target_url:TARGET,source_urls:[PRIMARY]};
 const intent=await digest(QUESTION);
 await DB.prepare(`INSERT INTO knowledge_editorial_briefs(intent_key,question,audience,cluster,target_url,brief_json,priority,created_at,updated_at) VALUES(?,?,?,?,?,?,100,?,?)`).bind(intent,QUESTION,brief.audience,brief.cluster,TARGET,JSON.stringify(brief),new Date(BEFORE).toISOString(),new Date(BEFORE).toISOString()).run();
 let calls=0,sends=0,primaryReads=0,publicNow=DUE;
 const env={DB,AI:{async run(_model,request){calls++;if(providerFails)throw Error('shared gateway budget exhausted');const draft=makeDraft();if(structured){const [answer,...parts]=draft.body.split(/\n\n(?=## )/);draft.answer=answer;draft.sections=parts.filter(p=>!p.startsWith('## Sources')).map(p=>({heading:p.split('\n')[0].replace(/^## /,''),paragraphs:p.split('\n\n').slice(1),bullets:[]}));draft.qualified_review_issue='';draft.claims=draft.claims.map(c=>({claim:c.claim,source_ids:['E1']}));delete draft.body;}if(unsupported)draft.claims[0].source_urls=['https://example.com/unread'];return {response:request.messages[0].content.includes('website editorial writer')?draft:request.messages[0].content.includes('source-entailment verifier')?(supportHold?{...supportPass(),decision:'HOLD',claims:[{id:'C1',verdict:'UNSUPPORTED',unsupported_parts:['A factual relationship absent from the source.'],reason:'The quotation does not support the complete claimed relationship.'}]}:supportPass()):reviewHold?{...pass(),decision:'HOLD',issues:['Unsupported clinical interpretation']}:pass(),usage:{input_tokens:100,output_tokens:100}};}},SHIFT_AI_MODEL:'existing-test-model',DAILY_EDITORIAL_SUPPORT_MODEL:'existing-test-model',EMAIL:{async send(){sends++;if(sendFails)throw Error('uncertain_send');return {id:'provider-test-'+sends};}},DAILY_EDITORIAL_NOTIFY_ENABLED:'true',DAILY_EDITORIAL_NOTIFY_TEMPLATE:'verified-link-v1'};
 const fetcher=async url=>{
  if(url===PRIMARY){primaryReads++;return new Response(html(url,'Primary source',sourceText+(sourceChanges&&primaryReads>1?' changed':'')),{headers:{'Content-Type':'text/html'}});}
  if(url===ORIGIN+'/sitemap.xml')return new Response('<urlset><url><loc>'+TARGET+'</loc></url><url><loc>'+ORIGIN+'/guides/lunch-planning</loc></url></urlset>',{headers:{'Content-Type':'application/xml'}});
  if(url===ORIGIN+'/explore-knowledge')return new Response('<a href="/articles/packed-lunch-example">Article</a>',{headers:{'Content-Type':'text/html'}});
  if(url===ORIGIN+'/treatment-centre/medicines-watch')return new Response(html(url,'Medicines Watch'),{headers:{'Content-Type':'text/html'}});
  if(url===TARGET){const a=await editorialPublication(env,'packed-lunch-example',{now:publicNow});if(a&&!a.editorialBlocked)return new Response(failedVerification?'<html>broken public page</html>':truncateBody?articleHTML(a).replace(/<h2 id="sources">[\s\S]*?<\/main>/,'</main>'):articleHTML(a),{headers:{'Content-Type':'text/html','X-Shift-Article-Source':'shift-editorial'}});return new Response(recentlyUpdated?html(url).replace('2026-10-01','2026-10-20'):html(url),{headers:{'Content-Type':'text/html'}});}
  if(url===ORIGIN+'/guides/lunch-planning')return new Response(html(url,'Planning meals around working days'),{headers:{'Content-Type':'text/html'}});
  return new Response('Missing',{status:404});
 };
 if(oldCms){await DB.prepare(`INSERT INTO knowledge_articles(title,slug,category,author,status,summary,body,seo_title,publish_at,updated_at) VALUES('Original title','packed-lunch-example','Nutrition','SHIFT Team','published','Original summary','Original body','Original SEO','2026-03-23','2026-10-01')`).run();await DB.prepare(`INSERT INTO babylove_receipts(slug,source_id,created_at) VALUES('packed-lunch-example','original-vendor','2026-03-23T00:00:00.000Z')`).run();}
 await refreshEditorialCorpus(env,{fetcher,now:BEFORE,limit:12});
 return {env,DB,sqlite,fetcher,calls:()=>calls,sends:()=>sends,brief,setPublicNow:value=>{publicNow=value;}};
}
test('London release follows clock changes without early publication',()=>{
 assert.equal(londonRelease('2026-10-24'),'2026-10-24T13:00:00.000Z');assert.equal(londonRelease('2026-10-25'),'2026-10-25T14:00:00.000Z');assert.throws(()=>londonRelease('bad'));
});
test('corpus accepts public Watch/tools and rejects every private account/data path',()=>{
 for(const path of ['/tools/bmi','/male-obesity','/treatment-centre/medicines-watch'])assert(publicEditorialUrl(ORIGIN+path));
 for(const path of ['/shift-health/results/abc','/mental-health/questionnaire/abc','/tools/private/example','/member/grub','/v1/me','/v1/hq/articles','/questionnaire','/articles/a?token=x','/articles/a#private'])assert.equal(publicEditorialUrl(ORIGIN+path),null);
 for(const url of ['http://www.nhs.uk/a','https://www.nhs.uk.evil.test/a','https://user:pass@www.nhs.uk/a','https://www.nhs.uk/a?key=x'])assert.equal(primaryEvidenceUrl(url),null);
});
test('real SQL generation and due-time publication remain distinct; overlap and repeats do not duplicate or email twice',async()=>{
 const f=await fixture();const made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(made.status,'ready',JSON.stringify(made));assert.equal(f.calls(),3);
 assert.equal(await editorialPublication(f.env,'packed-lunch-example',{now:BEFORE}),null);
 assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE-1})).status,'not_due');
 const both=await Promise.all([publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE}),publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})]);assert(both.some(x=>x.status==='verified'),JSON.stringify(both));
 const live=await editorialPublication(f.env,'packed-lunch-example',{now:DUE});assert.equal((await publicArticlePublication(f.env,'packed-lunch-example',{now:DUE})).editorial,true);assert.equal(live.author,'SHIFT Editorial');assert.equal(live.publish_at,'2026-03-23');assert.equal(f.sends(),1);
 await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE+60000});assert.equal(f.sends(),1);assert.equal((await f.DB.prepare(`SELECT count(*) n FROM knowledge_articles`).first()).n,1);f.sqlite.close();
});
test('unsupported claims hold before review/publication and never become trusted published knowledge',async()=>{
 const f=await fixture({unsupported:true});const made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(made.status,'held');assert.match(made.reason,/unsupported/);assert.match((await f.DB.prepare('SELECT draft_json FROM knowledge_editorial_jobs').first()).draft_json,/example.com\/unread/);assert.equal(f.calls(),1);assert.equal((await f.DB.prepare(`SELECT count(*) n FROM knowledge_articles`).first()).n,0);assert.equal(f.sends(),0);f.sqlite.close();
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

test('disabled production email configuration preserves verified due-time publication and deduplication',async()=>{
 const config=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 const flag=config.match(/"DAILY_EDITORIAL_NOTIFY_ENABLED": "(true|false)"/)?.[1];
 assert.equal(flag,'false');
 for(const name of ['DAILY_WEBSITE_CONTENT_ENABLED','DAILY_WEBSITE_EDITORIAL_AUTOPUBLISH','DAILY_CONTENT_BUDGET_VERIFIED'])assert(config.includes('"'+name+'": "true"'));
 const f=await fixture();try{
  f.env.DAILY_EDITORIAL_NOTIFY_ENABLED=flag;
  assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');
  assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE-1})).status,'not_due');
  const results=await Promise.all([publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE}),publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})]);
  assert(results.some(r=>r.status==='verified'),JSON.stringify(results));
  assert.equal((await publicArticlePublication(f.env,'packed-lunch-example',{now:DUE})).editorial,true);
  const release=await f.DB.prepare('SELECT * FROM knowledge_editorial_releases').first();
  assert.equal(release.state,'verified');assert.equal(release.notification_state,'pending');assert.equal(release.notification_receipt,null);
  assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE+60000})).status,'already_verified');
  assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,1);assert.equal(f.sends(),0);
 }finally{f.sqlite.close();}
});
test('disabled production email configuration performs no notification claim or provider operation',async()=>{
 const config=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),flag=config.match(/"DAILY_EDITORIAL_NOTIFY_ENABLED": "(true|false)"/)?.[1];assert.equal(flag,'false');
 let claims=0,sends=0;
 const env={DAILY_EDITORIAL_NOTIFY_ENABLED:flag,DAILY_EDITORIAL_NOTIFY_TEMPLATE:'verified-link-v1',DB:{prepare(){claims++;throw Error('Notification claim forbidden while disabled');}},EMAIL:{async send(){sends++;throw Error('Notification send forbidden while disabled');}}};
 assert.deepEqual(await notifyEditorial(env,{state:'verified',release_day:'2026-10-20'}),{status:'notification_template_not_enabled'});
 assert.equal(claims,0);assert.equal(sends,0);
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
 const f=await fixture();assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');await f.DB.prepare("UPDATE knowledge_editorial_releases SET state='publishing',attempts=1,updated_at=?").bind(new Date(DUE-180000).toISOString()).run();const result=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE});assert.equal(result.status,'verified',JSON.stringify(result));assert.equal((await f.DB.prepare('SELECT attempts FROM knowledge_editorial_releases').first()).attempts,2);assert.equal(f.calls(),3);assert.equal(f.sends(),1);f.sqlite.close();
});
test('missed slots persist as failures once rather than appearing as successful publications',async()=>{
 const f=await fixture();for(let i=0;i<2;i++)assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})).status,'missed_slot');assert.equal((await f.DB.prepare("SELECT count(*) n FROM knowledge_editorial_events WHERE event_type='missed_slot'").first()).n,1);assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,0);assert.equal(f.sends(),0);f.sqlite.close();
});

test('recent substantive canonical updates are preserved rather than automatically rewritten again',async()=>{
 const f=await fixture({recentlyUpdated:true});const result=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(result.status,'held');assert.match(result.reason,/preserve_completed_work/);assert.equal(f.calls(),0);f.sqlite.close();
});

test('gateway refusal preserves ready-publication authority, pauses generation for the day and retries only three days',async()=>{
 const f=await fixture({providerFails:true});
 for(let day=0;day<3;day++){
  const now=BEFORE+day*86400000;await refreshEditorialCorpus(f.env,{fetcher:f.fetcher,now});
  const result=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now});assert.equal(result.status,day<2?'provider_blocked':'held',JSON.stringify(result));
  assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:now+60000})).status,'provider_blocked');assert.equal(f.calls(),day+1);
 }
 assert.equal((await f.DB.prepare('SELECT state FROM knowledge_editorial_briefs').first()).state,'held');assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,0);f.sqlite.close();
});

test('job-journal upgrade preserves existing receipts while adding private draft and review history',async()=>{
 const f=await fixture();await f.DB.prepare("INSERT INTO knowledge_editorial_jobs(job_key,token,state,model_calls,usage_json,started_at) VALUES('earlier','earlier-token','held',1,?,'2026-10-01')").bind(JSON.stringify([{earlier:true}])).run();
 f.sqlite.exec('ALTER TABLE knowledge_editorial_jobs DROP COLUMN draft_json;ALTER TABLE knowledge_editorial_jobs DROP COLUMN review_json;');await ensureEditorialSchema(f.DB);
 const row=await f.DB.prepare("SELECT * FROM knowledge_editorial_jobs WHERE job_key='earlier'").first();assert.equal(row.state,'held');assert.equal(row.model_calls,1);assert.equal(row.draft_json,null);assert.equal(row.review_json,null);assert.equal(row.usage_json,JSON.stringify([{earlier:true}]));f.sqlite.close();
});

test('structured writer paragraphs compile to a complete sourced article before separate review, retaining both private versions',async()=>{
 const f=await fixture({structured:true});const result=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(result.status,'ready',JSON.stringify(result));assert.equal(f.calls(),3);
 const a=await f.DB.prepare('SELECT body FROM knowledge_articles').first(),j=await f.DB.prepare('SELECT draft_json,review_json FROM knowledge_editorial_jobs').first();assert.match(a.body,/## Sources/);assert(!/<br/i.test(a.body));assert(Array.isArray(JSON.parse(j.draft_json).sections));assert.equal(JSON.parse(j.review_json).decision,'PASS');f.sqlite.close();
});

test('existing SHIFT paragraphs cannot be repackaged as an original daily release',()=>{
 const draft=makeDraft();const issues=validateEditorialDraft(draft,{brief:{question:QUESTION,target_url:TARGET},sources:[{url:PRIMARY,content:sourceText}],context:[{source_uri:TARGET,content:draft.body}]});assert(issues.includes('no_substantive_new_value'));
});

test('a PASS with invented primary evidence or an unreviewed safety duration remains rejected',()=>{
 const draft=makeDraft(),sources=[{id:'E1',url:PRIMARY,content:sourceText}];
 const forged={...pass(),evidence_checks:[{claim:'Follow the food-storage guidance for your ingredients.',source_id:'E1',supported:true,evidence_quote:'An invented quotation that does not exist in the source.'}]};assert(reviewEvidenceIssues(forged,draft,sources).includes('article_or_primary_quote_not_verified'));
 const timed={...draft,body:draft.body.replace('## Sources','Keep chilled food out for a maximum of four hours.\n\n## Sources')};assert(reviewEvidenceIssues(pass(),timed,sources).some(s=>s.startsWith('material_quantity_not_reviewed:')));
});
test('two substantive releases can update one canonical while the prior verified version stays visible until the next slot',async()=>{
 const f=await fixture();assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');assert.equal((await publishDueEditorial(f.env,{fetcher:f.fetcher,now:DUE})).status,'verified');
 const normalised=await f.DB.prepare(`UPDATE knowledge_articles SET updated_at=? WHERE slug='packed-lunch-example' AND status='published'`).bind(new Date(DUE).toISOString()).run();assert.equal(Number(normalised.meta?.changes||0),1);
 const first=await editorialPublication(f.env,'packed-lunch-example',{now:DUE});
 const nextBefore=BEFORE+3*86400000,nextDue=DUE+3*86400000,question='How can I adapt this lunch plan after my working pattern changes?';await refreshEditorialCorpus(f.env,{fetcher:f.fetcher,now:nextBefore});
 const brief={...f.brief,question};await f.DB.prepare(`INSERT INTO knowledge_editorial_briefs(intent_key,question,audience,cluster,target_url,brief_json,priority,created_at,updated_at) VALUES(?,?,?,?,?,?,200,?,?)`).bind(await digest(question),question,brief.audience,brief.cluster,TARGET,JSON.stringify(brief),new Date(nextBefore).toISOString(),new Date(nextBefore).toISOString()).run();
 const a='Write the changed working pattern on a sheet beside the kitchen cupboard. Mark the place where preparation will become awkward and decide which practical detail you can adjust before the next working day begins.';
 const b='Keep an alternative note beside that detail, using choices already familiar to you. After the first attempt, cross out the option that added work and keep the one that fitted the facilities you actually had.';
 let calls=0;f.env.AI.run=async(_model,request)=>{calls++;if(request.messages[0].content.includes('source-entailment verifier'))return {response:supportPass()};if(request.messages[0].content.includes('website editorial writer')){const d=makeDraft();return {response:{...d,question,title:'Adapt your lunch plan when the working pattern changes',body:'Use a changed working pattern as information for the next plan, rather than a reason to abandon it.\n\n## Mark the changed moment\n\n'+a+'\n\n'+b+'\n\n## Put the alternative where you need it\n\n'+a+'\n\n'+b+'\n\nFollow the food-storage guidance for your ingredients.\n\n## Sources\n\n[Food Standards Agency guidance]('+PRIMARY+')'}};}return {response:{...pass(),usefulness_quotes:[a,b]}};};
 const made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:nextBefore});assert.equal(made.status,'ready',JSON.stringify(made));assert.equal((await editorialPublication(f.env,'packed-lunch-example',{now:nextBefore})).title,first.title);
 f.setPublicNow(nextDue);const released=await publishDueEditorial(f.env,{fetcher:f.fetcher,now:nextDue});assert.equal(released.status,'verified',JSON.stringify(released));assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,1);assert.equal((await f.DB.prepare("SELECT count(*) n FROM knowledge_editorial_releases WHERE state='verified'").first()).n,2);assert.equal((await editorialPublication(f.env,'packed-lunch-example',{now:nextDue})).publish_at,'2026-03-23');assert.equal(f.sends(),2);f.sqlite.close();
});

test('unit references preserve separate delivered passages and reject invented evidence IDs',()=>{
 const draft=makeDraft(),sources=[{id:'E1',content:sourceText,url:PRIMARY}],brief={outline:['Supply the actual planning actions']},m=editorialReviewMaterial(draft,sources,brief);
 assert(!m.article_units.some(u=>u.text.includes('[Food Standards Agency')));
 const claim=m.article_units.find(u=>u.text==='Follow the food-storage guidance for your ingredients.');
 const practical=m.article_units.filter(u=>u.text.length>70).slice(0,2);
 const raw={...pass(),evidence_checks:[{article_unit_ids:[claim.id],source_unit_ids:[m.primary_sources[0].units[0].id],supported:true,source_support_rationale:'The exact source instruction supports this ordinary ingredient-storage reminder.'}],usefulness_unit_ids:practical.map(u=>u.id),brief_delivery_checks:[{requirement_no:1,article_unit_ids:practical.map(u=>u.id)}]};
 const resolved=resolveEditorialReview(raw,draft,sources,brief);assert(reviewAccepted(resolved,draft,sources,brief));
 const forged=resolveEditorialReview({...raw,evidence_checks:[{...raw.evidence_checks[0],source_unit_ids:['E1.999999']}]},draft,sources,brief);
 assert(!reviewAccepted(forged,draft,sources,brief));assert(forged.unit_reference_issues.includes('unknown_primary_unit:E1.999999'));
});
test('follow-up questions receive their own complete brief instead of inheriting the parent outline',async()=>{
 const f=await fixture(),run=f.env.AI.run.bind(f.env.AI),follow={question:'How can I prepare a useful list for a supermarket trip?',audience:'Men planning a supermarket visit',outline:['Check the actual food already available','List ingredients for a chosen ordinary meal','Review what was used after the visit'],original_value:'A concrete cupboard-first shopping exercise with a worked list.',source_ids:['E1']};
 f.env.AI.run=async(...args)=>{const r=await run(...args);if(r.response.question)r.response.follow_up_briefs=[follow];return r;};
 assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');
 const row=await f.DB.prepare('SELECT brief_json FROM knowledge_editorial_briefs WHERE question=?').bind(follow.question).first(),next=JSON.parse(row.brief_json);
 assert.deepEqual(next.outline,follow.outline);assert.equal(next.audience,follow.audience);assert.equal(next.original_value,follow.original_value);assert(!('intent_key' in next));assert.notEqual(next.target_url,TARGET);
 f.sqlite.close();
});

test('complete manufacturer leaflet extraction preserves nested content and its final warning',()=>{
 const html='<body>Navigation<div class="xpilcontent"><p>Opening leaflet text.</p><div><p>Nested information.</p></div><p>Final safety warning.</p></div>Footer</body>';
 assert.equal(completeEmcLeaflet(html),'<p>Opening leaflet text.</p><div><p>Nested information.</p></div><p>Final safety warning.</p>');
 assert.throws(()=>completeEmcLeaflet(html.replace('</div>Footer','Footer')),/primary_leaflet_incomplete/);
 assert.throws(()=>completeEmcLeaflet('<body>Cookie and navigation text</body>'),/primary_leaflet_container_missing/);
});

test('interrupted generation recovers its private brief without a same-day repeated model execution',async()=>{
 const f=await fixture(),key=await digest(QUESTION),job='2026-10-20:'+key;
 await f.DB.prepare(`UPDATE knowledge_editorial_briefs SET state='generating' WHERE intent_key=?`).bind(key).run();
 await f.DB.prepare(`INSERT INTO knowledge_editorial_jobs(job_key,token,state,model_calls,started_at) VALUES(?,?,'running',1,?)`).bind(job,'lost-worker',new Date(BEFORE-31*60000).toISOString()).run();
 assert.equal((await recoverInterruptedEditorialJobs(f.DB,BEFORE)).recovered,1);
 assert.equal((await f.DB.prepare('SELECT state FROM knowledge_editorial_jobs WHERE job_key=?').bind(job).first()).state,'interrupted');
 assert.equal((await f.DB.prepare('SELECT state FROM knowledge_editorial_briefs WHERE intent_key=?').bind(key).first()).state,'planned');
 assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'no_eligible_brief');assert.equal(f.calls(),0);
 assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE+86400000})).status,'ready');assert.equal(f.calls(),3);f.sqlite.close();
});

test('provider final-choice JSON is accepted and a truncated completion is never published',async()=>{
 const f=await fixture(),run=f.env.AI.run.bind(f.env.AI);
 f.env.DAILY_EDITORIAL_MODEL='isolated-test-editorial-model';
 f.env.AI.run=async(...args)=>{assert.equal(args[0],args[1].messages[0].content.includes('source-entailment verifier')?f.env.DAILY_EDITORIAL_SUPPORT_MODEL:f.env.DAILY_EDITORIAL_MODEL);const r=await run(...args);return {choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(r.response)}}],usage:r.usage};};
 assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE})).status,'ready');assert.equal(f.calls(),3);f.sqlite.close();
 const g=await fixture(),original=g.env.AI.run.bind(g.env.AI);
 g.env.AI.run=async(...args)=>{const r=await original(...args);return {choices:[{finish_reason:'length',message:{role:'assistant',content:JSON.stringify(r.response)}}],usage:r.usage};};
 const held=await generateEditorialArticle(g.env,{fetcher:g.fetcher,now:BEFORE});assert.equal(held.status,'held');assert.match(held.reason,/model_output_incomplete/);assert.equal(g.calls(),1);assert.equal((await g.DB.prepare('SELECT count(*) n FROM knowledge_editorial_releases').first()).n,0);g.sqlite.close();
});

test('primary evidence retains urgent-callout headings and separates their condition lists',()=>{
 const text=structuredPrimaryText('<h2>Immediate action: Call 999</h2><ul><li>Severe difficulty breathing</li></ul><h2>Urgent advice: Contact 111</h2><ul><li>More short of breath than usual</li></ul>');
 assert.match(text,/## Immediate action: Call 999\n- Severe difficulty breathing\n## Urgent advice: Contact 111\n- More short of breath than usual/);
 const draft=makeDraft();draft.body=draft.body.replace('## Sources','If severe shortness of breath develops, contact NHS 111 or see a GP.\n\n## Sources');
 assert(validateEditorialDraft(draft,{brief:{question:QUESTION,target_url:TARGET},sources:[{url:PRIMARY,content:sourceText}],context:[]}).includes('emergency_symptoms_routed_to_non_emergency_help'));
});

test('source-entailment rejection stays private and supplies bounded correction feedback on a later day',async()=>{
 const f=await fixture({supportHold:true}),made=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.equal(made.status,'held');assert.match(made.reason,/source_support_hold/);assert.equal(f.calls(),3);assert.equal(f.sends(),0);
 assert.equal((await f.DB.prepare('SELECT count(*) n FROM knowledge_articles').first()).n,0);assert.match((await f.DB.prepare('SELECT support_json FROM knowledge_editorial_jobs').first()).support_json,/UNSUPPORTED/);
 assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE+60000})).status,'no_eligible_brief');assert.equal(f.calls(),3);
 const original=f.env.AI.run.bind(f.env.AI);let feedback=null;f.env.AI.run=async(model,request)=>{if(request.messages[0].content.includes('website editorial writer'))feedback=JSON.parse(request.messages[1].content).previous_attempt_feedback;return original(model,request);};
 await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE+86400000});assert(JSON.stringify(feedback?.source_support).includes('UNSUPPORTED'));assert.equal(f.calls(),6);f.sqlite.close();
});
test('source-support acceptance cannot omit, duplicate or excuse an unsupported claim',()=>{
 const input={claims:[{id:'C1'},{id:'C2'}]},valid={claims:[{...supportPass().claims[0],id:'C1'},{...supportPass().claims[0],id:'C2'}],unmapped_claims:[],decision:'PASS'};
 assert(sourceSupportAccepted(valid,input));assert(!sourceSupportAccepted({...valid,claims:valid.claims.slice(1)},input));assert(!sourceSupportAccepted({...valid,claims:[valid.claims[0],valid.claims[0]]},input));assert(!sourceSupportAccepted({...valid,unmapped_claims:['An unmapped care interval']},input));assert(!sourceSupportAccepted({...valid,claims:[valid.claims[0],{...valid.claims[1],verdict:'UNSUPPORTED'}]},input));
});
test('a named qualified-review issue is held while unrelated practical content can continue',async()=>{
 const f=await fixture(),original=f.env.AI.run.bind(f.env.AI);
 f.env.AI.run=async(model,request)=>{const out=await original(model,request);if(request.messages[0].content.startsWith('Act as a separate'))out.response={...out.response,decision:'HOLD',qualified_review_required:true,qualified_review_issue:'A qualified laboratory clinician must resolve this test-interpretation question.'};return out;};
 const result=await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:BEFORE});assert.match(result.reason,/qualified_review_required/);assert.equal(result.retryEligible,false);assert.equal(f.calls(),2);assert.equal((await f.DB.prepare('SELECT state FROM knowledge_editorial_briefs').first()).state,'held');f.sqlite.close();
});

test('brief proof accepts complete message quotations that also contain short numbered-list markers',()=>{
 const draft=makeDraft();draft.body=draft.body.replace('## Sources','- 1.\nWhich clinician can explain the result?\n\n## Sources');
 const r={...pass(),brief_delivery_checks:[{requirement:'Provide the complete message',body_quotes:['- 1.','Which clinician can explain the result?']}]};
 assert.equal(reviewEvidenceIssues(r,draft,[{id:'E1',content:sourceText}],{outline:['Provide the complete message']}).length,0);
});

test('actual morning receipts stop a competing release even when the vendor preserves an older publication date',async()=>{
 for(const scenario of [{now:BEFORE,receipt:'2026-10-20T06:00:00Z'},{now:Date.parse('2026-10-25T08:00:00Z'),receipt:'2026-10-24T23:30:00Z'}]){
  const f=await fixture();
  await f.DB.prepare(`INSERT INTO knowledge_articles(title,slug,category,author,status,summary,body,seo_title,publish_at,updated_at) VALUES(?,'vendor-morning-question','Knowledge','BabyLoveGrowth','published','Morning summary','Actual morning copy','Morning title','2026-03-23',?)`).bind(QUESTION,scenario.receipt).run();
  await f.DB.prepare(`INSERT INTO babylove_receipts(slug,source_id,created_at) VALUES('vendor-morning-question','actual-morning-output',?)`).bind(scenario.receipt).run();
  assert.equal((await generateEditorialArticle(f.env,{fetcher:f.fetcher,now:scenario.now})).status,'no_eligible_brief');assert.equal(f.calls(),0);
  assert.equal((await f.DB.prepare("SELECT body FROM knowledge_articles WHERE slug='vendor-morning-question'").first()).body,'Actual morning copy');f.sqlite.close();
 }
});
