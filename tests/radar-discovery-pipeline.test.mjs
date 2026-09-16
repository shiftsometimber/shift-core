import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryDB } from '../preview/newsroom-discovery/memory-db.mjs';
import { ensureRadarSchema, prepareVerifiedRadarQueue, verifyEvidence } from '../radar-integration-v1.js';
import { AUTHORITATIVE_RADAR_SOURCES, loadRadarSources, runAuthoritativeRadarScan, parseRelevantHtmlLinks, parseAuthoritativeFeed, notifyDetection, editorialScores } from '../radar-authoritative-scan-v1.js';
import { radarFreshnessState } from '../radar-freshness-v2.js';
import { ukCoverage, isRelevantNewsItem } from '../radar-uk-editorial-v1.js';
const asa=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='asa-weight-rulings');
const news=AUTHORITATIVE_RADAR_SOURCES.find(x=>x.id==='uk-advertising-news-search');
const fixture='<li class="icon-listing-item"><h4><a href="https://www.asa.org.uk/rulings/shemed-ltd.html">SheMed Ltd</a></h4><ul><li>Upheld</li><li>02 September 2026</li></ul><p>A weight-loss prescription-only medicines ad was banned.</p></li>';
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
