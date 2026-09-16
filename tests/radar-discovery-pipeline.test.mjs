import hq from '../hq-ai.js';
import { pendingSourceChange } from '../radar-source-review-v1.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { memoryDB } from '../preview/newsroom-discovery/memory-db.mjs';
import { ensureRadarSchema, prepareVerifiedRadarQueue, verifyEvidence, radarRoutes, radarPublicationPayloads } from '../radar-integration-v1.js';
import { AUTHORITATIVE_RADAR_SOURCES, loadRadarSources, runAuthoritativeRadarScan, parseRelevantHtmlLinks, parseAuthoritativeFeed, notifyDetection, editorialScores } from '../radar-authoritative-scan-v1.js';
import { radarFreshnessState, readRadarFreshness } from '../radar-freshness-v2.js';
import { ukCoverage, isRelevantNewsItem } from '../radar-uk-editorial-v1.js';
const asa=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='asa-weight-rulings');
const news=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='uk-advertising-news-search');
const fixture='<li class="icon-listing-item"><h4><a href="https://www.asa.org.uk/rulings/shemed-ltd.html">SheMed Ltd</a></h4><ul><li>Upheld</li><li>02 September 2026</li></ul><p>A weight-loss prescription-only medicines ad was banned.</p></li>';
test('Lilly seed migration updates only the exact retired source and preserves paused state and evidence',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
 const retired='https://investor.lilly.com/news-releases',current='https://investor.lilly.com/';
 assert.equal((await DB.prepare("SELECT url FROM radar_sources WHERE id='lilly-newsroom'").first()).url,current);
 await DB.prepare("UPDATE radar_sources SET url=?,active=0,updated_at='2026-09-01 00:00:00' WHERE id='lilly-newsroom'").bind(retired).run();
 await DB.prepare("INSERT INTO radar_events(event_key,status,headline,source_evidence_json,verification_json,reviewed_at) VALUES(?,?,?,?,?,?)").bind('preserved','approved','Historical reviewed record',JSON.stringify([{source_feed:retired,source_date:'2026-08-01',url:'https://investor.lilly.com/news-releases/news-release-details/existing'}]),'{"verified":true}','2026-08-02').run();
 const evidenceBefore=await DB.prepare("SELECT * FROM radar_events WHERE event_key='preserved'").first();
 const listed=await loadRadarSources(DB);
 const migrated=await DB.prepare("SELECT * FROM radar_sources WHERE id='lilly-newsroom'").first();
 assert.equal(migrated.url,current);assert.equal(migrated.active,0);
 assert.equal(listed.some(x=>x.id==='lilly-newsroom'),false);
 assert.deepEqual(await DB.prepare("SELECT * FROM radar_events WHERE event_key='preserved'").first(),evidenceBefore);
 await loadRadarSources(DB);
 assert.deepEqual(await DB.prepare("SELECT * FROM radar_sources WHERE id='lilly-newsroom'").first(),migrated);
 // A customised URL, provider identity or confidence must not be overwritten.
 for(const patch of [{url:'https://www.lilly.com/news'},{url:retired,authority:'Custom review provider'},{url:retired,authority:'Eli Lilly and Company newsroom',confidence:65}]){
  for(const [key,value]of Object.entries(patch))await DB.prepare(`UPDATE radar_sources SET ${key}=? WHERE id='lilly-newsroom'`).bind(value).run();
  const custom=await DB.prepare("SELECT * FROM radar_sources WHERE id='lilly-newsroom'").first();
  await loadRadarSources(DB);
  assert.deepEqual(await DB.prepare("SELECT * FROM radar_sources WHERE id='lilly-newsroom'").first(),custom);
 }
});
test('Lilly latest-news markup keeps the release URL and original date without approving manufacturer claims',async()=>{
 const source=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='lilly-newsroom');
 const html=readFileSync(new URL('./fixtures/radar/lilly-investor-index.html',import.meta.url),'utf8');
 const url='https://investor.lilly.com/news-releases/news-release-details/lilly-present-new-data-foundayo-retatrutide-and-eloratzp-easd';
 const links=parseRelevantHtmlLinks(html+'<a href="https://unrelated.test/news-releases/news-release-details/weight-loss">Weight loss</a>',source);
 assert.equal(links.length,1);assert.equal(links[0].url,url);
 assert.equal(links[0].source_date,'2026-09-15T00:00:00.000Z');
 assert.match(links[0].title,/Foundayo, retatrutide, and eloraTZP/);
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
 await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='lilly-newsroom'").run();
 const original=globalThis.fetch;globalThis.fetch=async request=>{assert.equal(String(request),source.url);return new Response(html)};
 try{
  const scan=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});
  assert.equal(scan.sources[0].ok,true);assert.equal(scan.sources[0].newEvents,1);
  const row=await DB.prepare('SELECT * FROM radar_events').first();
  assert.equal(row.status,'needs_more_evidence');assert.equal(JSON.parse(row.verification_json).verified,false);
  const evidence=JSON.parse(row.source_evidence_json)[0];
  assert.equal(evidence.url,url);assert.equal(evidence.source_feed,source.url);
  assert.equal(evidence.source_date,'2026-09-15T00:00:00.000Z');
  assert.equal((await DB.prepare("SELECT COUNT(*) c FROM radar_audit WHERE action='notification_sent'").first()).c,0);
 }finally{globalThis.fetch=original}
});
test('company-name ASA rulings retain relevance, date and primary host boundary',()=>{
 const items=parseRelevantHtmlLinks(fixture+'<li><a href="https://other.test/news/fake">weight-loss ads banned</a></li>',asa);
 assert.equal(items.length,1);assert.equal(items[0].title,'SheMed Ltd');assert.match(items[0].summary,/weight-loss/);assert.equal(items[0].source_date,'2026-09-02T00:00:00.000Z');assert.equal(editorialScores(asa,items[0]).urgency,90);
});
test('GPhC discovery accepts its published article path but excludes the index and external hosts',async()=>{
 const source=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='gphc-news');
 // Official URL and original date indexed by GPhC; the live host can return 403.
 // This is an adapter fixture, not evidence of successful live retrieval.
 const path='/about-us/news-and-updates/updated-enforcement-notice-issued-weight-management-prescription-medicine-ads';
 const title='Updated enforcement notice issued on weight management prescription medicine ads';
 const url='https://www.pharmacyregulation.org'+path;
 const html=`<li><a href="${path}">${title}</a><time datetime="2025-09-24"></time></li>
 <a href="/about-us/news-and-updates">Weight management news</a>
 <a href="https://unrelated.test${path}">${title}</a>`;
 const rows=parseRelevantHtmlLinks(html,source);
 assert.equal(rows.length,1);assert.equal(rows[0].url,url);
 assert.equal(rows[0].source_date,'2025-09-24T00:00:00.000Z');
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
 await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='gphc-news'").run();
 const original=globalThis.fetch;let blocked=false;
 globalThis.fetch=async()=>blocked?new Response('Forbidden',{status:403}):new Response(html);
 try{
  const scan=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});
  assert.equal(scan.sources[0].newEvents,1);
  const event=await DB.prepare('SELECT status,source_evidence_json FROM radar_events').first();
  assert.equal(event.status,'verified');
  assert.equal(JSON.parse(event.source_evidence_json)[0].url,url);
  blocked=true;
  const failed=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});
  assert.equal(failed.ok,false);assert.equal(failed.sources[0].error,'http_403');
  assert.ok(failed.coverage.failed.includes('gphc-news'));
  assert.equal((await DB.prepare("SELECT COUNT(*) c FROM radar_events WHERE status IN ('approved','published')").first()).c,0);
 }finally{globalThis.fetch=original}
});
test('search finds enforcement without drug names; media evidence cannot verify itself',()=>{
 assert.equal(isRelevantNewsItem(news,{title:'Exclusive: GPhC takes first enforcement action over POM ads'}),true);
 assert.equal(isRelevantNewsItem(news,{title:'Advertising awards for a car company'}),false);
 assert.equal(verifyEvidence([{source_tier:news.tier,url:'https://news.google.com/rss/articles/lead'}]).verified,false);
 assert.equal(ukCoverage(AUTHORITATIVE_RADAR_SOURCES.filter(x=>x.id!=='asa-weight-rulings')).complete,false);
});
test('republished feeds retain original publication and separate update dates',()=>{
 const [item]=parseAuthoritativeFeed('<feed><entry><title>Weight loss advertising</title><link href="https://example.test/a"/><published>2025-07-09</published><updated>2026-09-15</updated></entry></feed>',news);
 assert.equal(item.source_date,'2025-07-09T00:00:00.000Z');assert.equal(item.source_updated_at,'2026-09-15T00:00:00.000Z');
});
test('scan ingests primary ruling and unverified lead, deduplicates rescans, and drafts verified item',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
 await DB.prepare("UPDATE radar_sources SET active=0 WHERE id NOT IN ('asa-weight-rulings','uk-advertising-news-search','uk-weight-news-search')").run();
 const original=globalThis.fetch;globalThis.fetch=async url=>new Response(String(url).includes('asa.org.uk')?fixture:'<rss><channel><item><title>GPhC enforcement over POM ads</title><link>https://news.google.com/rss/articles/example</link><pubDate>Tue, 15 Sep 2026 09:00:00 GMT</pubDate></item></channel></rss>');
 const env={DB,RADAR_SUPPRESS_NOTIFICATIONS:true,AI:{run:async()=>({response:JSON.stringify({medicine_id:'',headline:'ASA advertising ruling',article_markdown:'Test draft for human review.'})})}};
 try{
  const first=await runAuthoritativeRadarScan(env);assert.equal(first.newEvents,2);assert.equal(first.coverage.complete,false);
  assert.equal((await runAuthoritativeRadarScan(env)).newEvents,0);
  const events=(await DB.prepare('SELECT * FROM radar_events ORDER BY id').all()).results;
  const rows=[events.find(x=>x.status==='verified'),events.find(x=>x.status==='needs_more_evidence')];
  assert.ok(rows[0]);assert.ok(rows[1]);
  assert.equal(rows[0].status,'verified');assert.equal(rows[1].status,'needs_more_evidence');
  // Give the unverified lead top priority: it still must not consume the drafting slot.
  await DB.prepare('UPDATE radar_events SET urgency_score=100 WHERE id=?').bind(rows[1].id).run();
  const result=await prepareVerifiedRadarQueue(env,{limit:1});assert.equal(result.prepared[0].id,rows[0].id);assert.equal(result.prepared[0].status,'ready_for_review');
  assert.equal((await DB.prepare("SELECT COUNT(*) c FROM radar_events WHERE status IN ('published','approved')").first()).c,0);
 }finally{globalThis.fetch=original}
});
test('failed sources and malformed feeds cannot produce healthy scan status',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
 await DB.prepare("UPDATE radar_sources SET active=0 WHERE id NOT IN ('asa-weight-rulings','uk-advertising-news-search')").run();
 const original=globalThis.fetch;globalThis.fetch=async url=>String(url).includes('asa.org.uk')?new Response('Forbidden',{status:403}):new Response('<html>challenge</html>');
 try{const scan=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});assert.equal(scan.ok,false);assert.equal(scan.sources.every(x=>!x.ok),true)}finally{globalThis.fetch=original}
 const now=new Date().toISOString();assert.equal(radarFreshnessState({lastScan:now,lastPublication:now,lastTickerItem:now,scanHealthy:false}).status,'RED');
});
test('urgent alert dispatch works and missing/failed transport is never logged as sent',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);
 const base={DB,RADAR_ALERT_TO:'review@example.test'},event={title:'ASA weight-loss advertising enforcement',authority:'ASA / CAP',urgency_score:90,url:'https://www.asa.org.uk/news/example.html'};
 assert.equal((await notifyDetection(base,event)).sent,false);
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('failed',{status:503});
 try{assert.equal((await notifyDetection({...base,RADAR_EMAIL_ENDPOINT:'https://example.test/mail'},event)).sent,false)}finally{globalThis.fetch=original}
 let count=0;assert.equal((await notifyDetection({...base,EMAIL:{send:async()=>{count++}}},event)).sent,true);assert.equal(count,1);
 const sent=await DB.prepare("SELECT COUNT(*) c FROM radar_audit WHERE action='notification_sent'").first();assert.equal(sent.c,1);
});
test('trade publication structured headlines are discovered without executing page scripts',()=>{
 const source=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='cd-regulation');
 const record={_id:'one',type:'story',canonical_url:'/news/regulation/pom-ads-example/',headlines:{basic:'GPhC takes enforcement action over POM ads'},description:{basic:'Pharmacy advertising notice'},display_date:'2026-09-02T08:00:00Z'};
 const rows=parseRelevantHtmlLinks('<script>window.data='+JSON.stringify({content_elements:[record]})+'</script>',source);
 assert.equal(rows.length,1);assert.equal(rows[0].source_date,'2026-09-02T08:00:00.000Z');assert.match(rows[0].url,/chemistanddruggist/);
});
test('encoded feed markup is removed and unrelated ad-industry stories stay out',()=>{
 const [item]=parseAuthoritativeFeed('<rss><item><title>Clearcast expands digital advertising</title><link>https://example.test/a</link><description>&lt;a href=&quot;https://example.test/weight-loss&quot;&gt;AI pre-screening services&lt;/a&gt;</description></item></rss>',news);
 assert.equal(item.summary,'AI pre-screening services');assert.equal(isRelevantNewsItem(news,item),false);
});


test('changed published or approved evidence is held outside the reviewed snapshot and requires explicit correction',async()=>{
 const oldFetch=globalThis.fetch,oldHqFetch=hq.fetch;
 let sourceTitle='Weight-loss prescription medicine advertising ruling',summary='An original source summary.',aiCalls=0,externalCalls=0;
 globalThis.fetch=async url=>{if(String(url)!==asa.url){externalCalls++;throw Error('Unexpected outbound request')}return new Response(`<li><a href="https://www.asa.org.uk/rulings/review-fixture.html">${sourceTitle}</a><time datetime="2026-09-15"></time><p>${summary}</p></li>`)};
 // This test isolates publication governance after the existing HQ authentication
 // boundary; separate integration tests cover real named-account authentication.
 hq.fetch=async()=>Response.json({user:{role:'owner',email:'fictional-reviewer@shift.test'}});
 try{for(const initialStatus of ['published','approved','publish_failed','ready_for_review']){
  sourceTitle='Weight-loss prescription medicine advertising ruling';summary='An original source summary.';
  const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);
  await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='asa-weight-rulings'").run();
  const env={DB,RADAR_SUPPRESS_NOTIFICATIONS:true,SHIFT_SITE_PUBLISH_ENDPOINT:'https://forbidden.test/publish',AI:{run:async()=>{aiCalls++;return{response:'{}'}}}};
  await runAuthoritativeRadarScan(env);const seed=await DB.prepare('SELECT * FROM radar_events').first();
  const oldPackage=JSON.stringify({headline:'Reviewed original article',article_markdown:'Original approved copy. '.repeat(10),destinations:['medicine_news']});
  await DB.prepare("UPDATE radar_events SET status=?,content_package_json=?,medicine_patch_json=?,reviewed_by='original-reviewer',reviewed_at='2026-09-15T12:00:00Z' WHERE id=?").bind(initialStatus,oldPackage,'{"medicine_id":"original"}',seed.id).run();
  await DB.prepare("INSERT INTO radar_publication_jobs(event_id,status,site_payload_json) VALUES(?,'queued',?)").bind(seed.id,JSON.stringify({original:true,evidence:JSON.parse(seed.source_evidence_json)})).run();
  await DB.prepare("INSERT INTO radar_social_approvals(event_id,payload_hash,payload_json,status,approved_by,approved_at) VALUES(?,'original-hash','{}','approved','original-reviewer','2026-09-15T12:00:00Z')").bind(seed.id).run();
  await DB.exec("CREATE TABLE shift_knowledge_nodes(id TEXT PRIMARY KEY,node_type TEXT,status TEXT,data_json TEXT,updated_at TEXT);CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,source_uri TEXT,status TEXT,checksum TEXT)");
  await DB.prepare("INSERT INTO shift_knowledge_nodes VALUES(?,'radar_event','active',?,'2026-09-15T12:00:00Z')").bind('radar:'+seed.id,JSON.stringify({original:true})).run();
  await DB.prepare("INSERT INTO shift_knowledge_nodes VALUES('unrelated','radar_event','active','{}','2026-09-15T12:00:00Z')").run();
  await DB.prepare("INSERT INTO ai_knowledge_documents VALUES(1,?,'approved','unchanged-source-checksum')").bind('radar://event/'+seed.id).run();

  const before=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(seed.id).first();
  // Summary-only changes are meaningful too, even if the title and date did not move.
  summary='The source now describes a changed enforcement outcome.';
  await runAuthoritativeRadarScan(env);
  const after=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(seed.id).first();
  for(const field of ['headline','source_evidence_json','verification_json','content_package_json','medicine_patch_json','reviewed_by','reviewed_at','region'])assert.equal(after[field],before[field],initialStatus+': '+field);
  assert.equal(after.status,initialStatus==='published'?'published':'hold');
  const heldKnowledge=await DB.prepare('SELECT * FROM shift_knowledge_nodes WHERE id=?').bind('radar:'+seed.id).first();assert.equal(heldKnowledge.status,'review_required');assert.deepEqual(JSON.parse(heldKnowledge.data_json),{original:true});assert.equal(heldKnowledge.updated_at,'2026-09-15T12:00:00Z');
  assert.equal((await DB.prepare("SELECT status FROM shift_knowledge_nodes WHERE id='unrelated'").first()).status,'active');
  const heldDocument=await DB.prepare('SELECT * FROM ai_knowledge_documents WHERE id=1').first();assert.equal(heldDocument.status,'review_required');assert.equal(heldDocument.checksum,'unchanged-source-checksum');
  assert.equal((await DB.prepare('SELECT status FROM radar_social_approvals WHERE event_id=?').bind(seed.id).first()).status,'invalidated');
  const freshness=await readRadarFreshness(DB);assert.equal(freshness.current,false);assert.ok(freshness.reasons.some(x=>x.code==='source_review_required'));assert.equal(freshness.reasons.some(x=>x.code==='publication_failures'),false);

  const change=await pendingSourceChange(DB,seed.id);assert.ok(change);assert.deepEqual(change.reviewed_snapshot,{...before});
  assert.match(change.observation.evidence[0].summary,/changed enforcement outcome/);
  const job=await DB.prepare('SELECT * FROM radar_publication_jobs WHERE event_id=?').bind(seed.id).first();assert.equal(job.status,'cancelled');assert.equal(job.error_text,'source_changed_review_required');assert.equal(JSON.parse(job.site_payload_json).original,true);
  await runAuthoritativeRadarScan(env);assert.equal((await DB.prepare("SELECT COUNT(*) c FROM radar_audit WHERE action='source_changed_review_required'").first()).c,1);
  const call=async(action,method='POST')=>radarRoutes(new Request('https://example.test/v1/hq/radar/events/'+seed.id+(action?'/'+action:''),{method,headers:{'content-type':'application/json'},body:'{}'}),env,{});
  for(const action of ['process','approve','publish','social-draft','social-approve','social-publish']){const response=await call(action);assert.equal(response.status,409);assert.equal((await response.json()).error,'source_changed_review_required')}
  assert.equal((await call('','PATCH')).status,409);
  const queue=await radarRoutes(new Request('https://example.test/v1/hq/radar/queue'),env,{});assert.equal((await queue.json()).events[0].source_change.id,change.id);
  assert.equal(aiCalls,0);assert.equal(externalCalls,0);
  // A later source revision must replace the pending observation, never the
  // published snapshot; correction adopts the actual most recent observation.
  summary='The source now includes a second changed enforcement outcome.';
  await runAuthoritativeRadarScan(env);const latest=await pendingSourceChange(DB,seed.id);assert.ok(latest.id>change.id);assert.match(latest.observation.evidence[0].summary,/second changed/);
  const correction=await call('correct');assert.equal(correction.status,200);assert.equal((await correction.json()).status,'verified');
  const fresh=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(seed.id).first();assert.equal(fresh.content_package_json,'{}');assert.equal(fresh.medicine_patch_json,'{}');assert.equal(fresh.reviewed_at,null);assert.equal(fresh.reviewed_by,null);assert.match(JSON.parse(fresh.source_evidence_json)[0].summary,/second changed enforcement outcome/);
  assert.equal(await pendingSourceChange(DB,seed.id),null);assert.equal((await call('approve')).status,409);assert.equal((await call('publish')).status,409);
  // The cancelled job never becomes reusable; a fresh package and approval are needed.
  assert.equal((await DB.prepare('SELECT status FROM radar_publication_jobs WHERE id=?').bind(job.id).first()).status,'cancelled');
  assert.equal(JSON.parse((await DB.prepare("SELECT detail_json FROM radar_audit WHERE action='source_changed_review_required'").first()).detail_json).reviewed_snapshot.content_package_json,oldPackage);
 }}finally{globalThis.fetch=oldFetch;hq.fetch=oldHqFetch}
});

test('an unreviewed discovery still updates in place without a correction hold',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='asa-weight-rulings'").run();
 const original=globalThis.fetch;let title='Weight-loss medicines advertising original notice';
 globalThis.fetch=async()=>new Response(`<li><a href="https://www.asa.org.uk/rulings/unreviewed-fixture.html">${title}</a><time datetime="2026-09-15"></time></li>`);
 try{await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});const before=await DB.prepare('SELECT * FROM radar_events').first();title='Weight-loss medicines advertising updated notice';await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});const after=await DB.prepare('SELECT * FROM radar_events').first();assert.equal(after.id,before.id);assert.equal(after.status,'verified');assert.equal(after.headline,title);assert.equal(JSON.parse(after.source_evidence_json)[0].title,title);assert.equal(await pendingSourceChange(DB,after.id),null)}finally{globalThis.fetch=original}
});


test('in-flight drafting cannot overwrite a newer source correction',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='asa-weight-rulings'").run();
 const original=globalThis.fetch,oldHq=hq.fetch;let title='Weight-loss medicine original source';
 globalThis.fetch=async()=>new Response(`<li><a href="https://www.asa.org.uk/rulings/draft-race.html">${title}</a><time datetime="2026-09-15"></time></li>`);hq.fetch=async()=>Response.json({user:{role:'owner',email:'fictional-reviewer@shift.test'}});
 let begin,release;const begun=new Promise(r=>begin=r),blocked=new Promise(r=>release=r);let aiCalls=0;
 const env={DB,RADAR_SUPPRESS_NOTIFICATIONS:true,AI:{run:async()=>{if(++aiCalls===1){begin();await blocked;return{response:'{}'}}return{response:JSON.stringify({headline:'Old-source package',article_markdown:'Old reviewed evidence only.'})}}}};
 const call=(id,action)=>radarRoutes(new Request(`https://example.test/v1/hq/radar/events/${id}/${action}`,{method:'POST',body:'{}'}),env,{});
 try{
  await runAuthoritativeRadarScan(env);const row=await DB.prepare('SELECT * FROM radar_events').first();await DB.prepare("UPDATE radar_events SET status='ready_for_review',content_package_json=? WHERE id=?").bind(JSON.stringify({headline:'Original package'}),row.id).run();
  const drafting=call(row.id,'process');await begun;
  title='Weight-loss medicine changed source';await runAuthoritativeRadarScan(env);assert.equal((await call(row.id,'correct')).status,200);
  release();const result=await(await drafting).json();assert.equal(result.ok,false);assert.equal(result.error,'source_changed_review_required');
  const current=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(row.id).first();assert.equal(current.status,'verified');assert.equal(current.headline,title);assert.equal(current.content_package_json,'{}');assert.equal(current.reviewed_at,null);
 }finally{release();globalThis.fetch=original;hq.fetch=oldHq}
});

test('a running publication cannot revive an obsolete job after correction, on failure or success',async()=>{
 const original=globalThis.fetch,oldHq=hq.fetch;hq.fetch=async()=>Response.json({user:{role:'owner',email:'fictional-reviewer@shift.test'}});
 try{for(const responseMode of ['failure','success']){
  const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='asa-weight-rulings'").run();
  let title='Weight-loss medicine original source',begin,release,outbound=0;const begun=new Promise(r=>begin=r),blocked=new Promise(r=>release=r);
  globalThis.fetch=async url=>{if(String(url)==='https://delivery.test/article'){outbound++;begin();await blocked;if(responseMode==='failure')throw Error('Test transport failure');return Response.json({ok:true})}return new Response(`<li><a href="https://www.asa.org.uk/rulings/publish-race.html">${title}</a><time datetime="2026-09-15"></time></li>`)};
  const env={DB,RADAR_SUPPRESS_NOTIFICATIONS:true,SHIFT_SITE_PUBLISH_ENDPOINT:'https://delivery.test/article'};
  const call=(id,action)=>radarRoutes(new Request(`https://example.test/v1/hq/radar/events/${id}/${action}`,{method:'POST',body:'{}'}),env,{});
  await runAuthoritativeRadarScan(env);const row=await DB.prepare('SELECT * FROM radar_events').first();await DB.prepare("UPDATE radar_events SET status='approved',content_package_json=?,reviewed_at='2026-09-15T12:00:00Z' WHERE id=?").bind(JSON.stringify({headline:'Original approved article',article_markdown:'Original approved article text.'}),row.id).run();const approvedSnapshot=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(row.id).first(),payloads=radarPublicationPayloads(approvedSnapshot);await DB.prepare("INSERT INTO radar_publication_jobs(event_id,status,site_payload_json,brain_payload_json,search_payload_json) VALUES(?,'queued',?,?,?)").bind(row.id,JSON.stringify(payloads.site),JSON.stringify(payloads.brain),JSON.stringify(payloads.search)).run();
  const publishing=call(row.id,'publish');await begun;assert.equal((await DB.prepare('SELECT status FROM radar_publication_jobs').first()).status,'running');
  title='Weight-loss medicine changed source';await runAuthoritativeRadarScan(env);assert.equal((await call(row.id,'correct')).status,200);release();
  const finished=await publishing;assert.equal(finished.status,409);assert.equal((await finished.json()).error,'source_changed_review_required');
  const current=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(row.id).first();assert.equal(current.status,'verified');assert.equal(current.content_package_json,'{}');assert.equal(current.reviewed_at,null);assert.equal((await DB.prepare('SELECT status FROM radar_publication_jobs').first()).status,'cancelled');
  assert.equal((await call(row.id,'publish')).status,409);assert.equal(outbound,1);assert.equal(await pendingSourceChange(DB,row.id),null);
  const audit=JSON.parse((await DB.prepare("SELECT detail_json FROM radar_audit WHERE action='publish_failed'").first()).detail_json);assert.equal(audit.obsolete_approval,true);assert.equal(audit.external_delivery_requires_review,true);
 }}finally{globalThis.fetch=original;hq.fetch=oldHq}
});

test('bulk approval still queues a fresh reviewed package and reports its result accurately',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);
 const source='https://www.asa.org.uk/rulings/fictional-approval-test.html',headline='Fictional medicines advertising review fixture';
 const content={headline,standfirst:'A fictional source fixture used to verify the review pipeline without making any real clinical or treatment claim.',article_markdown:'Fictional test content retained for a simulated owner review. '.repeat(4),known_facts:[{claim:'A fictional test source was supplied.',source_url:source}],destinations:['medicine_news'],seo:{title:headline,description:'A fictional source fixture used to verify the review pipeline without making any real clinical or treatment claim.',slug:'medicine-news/fictional-approval-fixture'}};
 await DB.prepare("INSERT INTO radar_events(event_key,status,headline,source_evidence_json,verification_json,content_package_json) VALUES('bulk-fixture','ready_for_review',?,?,?,?)").bind(headline,JSON.stringify([{source_tier:1,url:source,source_date:'2026-09-15'}]),'{"verified":true}',JSON.stringify(content)).run();
 const old=hq.fetch;hq.fetch=async()=>Response.json({user:{role:'owner',email:'fictional-reviewer@shift.test'}});
 try{
  const preview=await(await radarRoutes(new Request('https://example.test/v1/hq/radar/bulk-approve-preview'),{DB},{})).json();assert.equal(preview.eligible_count,1);
  const response=await radarRoutes(new Request('https://example.test/v1/hq/radar/bulk-approve',{method:'POST',body:JSON.stringify({preview_token:preview.preview_token})}),{DB},{}),approved=await response.json();assert.equal(response.status,200);assert.equal(approved.approved_count,1);assert.equal(approved.failed_count,0);assert.equal(approved.approved.length,1);
  const job=await DB.prepare('SELECT * FROM radar_publication_jobs').first();assert.equal(job.status,'queued');assert.equal(JSON.parse(job.site_payload_json).approval_generation,0);assert.equal((await DB.prepare('SELECT status FROM radar_events').first()).status,'approved');
 }finally{hq.fetch=old}
});
