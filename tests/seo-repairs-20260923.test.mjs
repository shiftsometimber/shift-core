import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {repairSeoPresentation,seoAssetResponse} from '../public-seo-presentation.mjs';
import {SEO_IMAGES,SEO_ASSETS} from '../public-seo-assets-data.mjs';
import {legacyAuthorityRedirects,publicHeader,publicDrawer,publicFooter,reconcilePublicDocument} from '../public-shell-contract.mjs';
import {tickerAllowed,tickerStyles} from '../public-navigation-policy.mjs';
import {renderShiftHealthDocument} from '../shift-health-public.mjs';
import {sourceDateLabel} from '../radar-editorial-trust-v1.js';
import {autoNewsEligibility,AUTO_NEWS_POLICY} from '../radar-auto-news-v1.js';
import {prepareNews,correctionSQL,digest} from '../scripts/seo-repairs-20260923/build-news.mjs';
import {ARTICLE_CORRECTIONS} from '../editorial/seo-repairs-20260923/corrections.mjs';
const shell='<html><head><title>Keep title</title></head><body>'+publicHeader+publicDrawer+'<main><h1>Keep heading</h1><p>Keep copy.</p></main>'+publicFooter+'</body></html>';

test('public presentation is idempotent; same links/labels and protected data surfaces',()=>{
 const once=reconcilePublicDocument(shell,'/'),twice=reconcilePublicDocument(once,'/');assert.equal(twice,once);
 assert.match(once,/Keep title/);assert.match(once,/<h1>Keep heading<\/h1><p>Keep copy\.<\/p>/);
 assert.match(once,/href="\/mens-mental-health">Good to Talk/);assert.doesNotMatch(once,/href="\/good-to-talk"/);
 assert.match(once,/href="\/treatment-centre">Treatments/);assert.match(once,/My Timber/);
 for(const path of ['/member/dashboard','/member-login','/v1/profile','/hq/work','/treatment-order'])assert.equal(repairSeoPresentation(shell,path),shell);
});
test('Good to Talk aliases share one destination; no content removal or ticker-policy expansion',()=>{
 assert.equal(legacyAuthorityRedirects['/good-to-talk'],'/mens-mental-health');assert.equal(legacyAuthorityRedirects['/good-to-talk.html'],'/mens-mental-health');
 for(const path of ['/','/mens-mental-health','/good-to-talk','/about','/start-here','/member/dashboard'])assert.equal(tickerAllowed(path),false,path);
 assert.match(tickerStyles,/background:#050505;color:#E7E3DA/);assert.match(tickerStyles,/90s linear infinite/);
});
test('asset originals and optimized bytes are reproducible, cacheable, read-only and smaller',async()=>{
 const limits={logo:135518,heroSmall:210578,heroLarge:210578};
 for(const [key,asset] of Object.entries(SEO_IMAGES)){
  const data=Buffer.from(SEO_ASSETS[asset.path].base64,'base64');assert.equal(digest(data),asset.sha256);assert(data.length<limits[key]);assert.equal(data.toString('ascii',8,12),'WEBP');
  const req=new Request('https://shiftsometimber.co.uk'+asset.path),res=seoAssetResponse(req);assert.equal(res.status,200);assert.match(res.headers.get('Cache-Control'),/immutable/);assert.equal((await res.arrayBuffer()).byteLength,data.length);
  assert.equal(seoAssetResponse(new Request(req,{method:'POST'})).status,405);
  assert.equal(seoAssetResponse(new Request(req,{headers:{'If-None-Match':'"'+asset.sha256+'"'}})).status,304);
  assert.equal(await seoAssetResponse(new Request(req,{method:'HEAD'})).text(),'');
 }
 assert.equal(seoAssetResponse(new Request('https://shiftsometimber.co.uk/assets/not-ours.webp')),null);
});
test('homepage image remains the same artwork with correct aspect ratio and responsive priority',()=>{
 const old='<html><head></head><body><main><img alt="Existing image" src="/assets/home-hero-men-v32o.jpg?v=42g3"></main></body></html>';
 const result=repairSeoPresentation(old,'/');assert.match(result,/alt="Existing image"/);assert.match(result,/srcset=/);assert.match(result,/fetchpriority="high"/);assert.match(result,/width="1536" height="1024"/);assert.equal(repairSeoPresentation(result,'/'),result);
});
test('health renderer aligns the descriptive title and heading without changing routes or service availability',()=>{
 const result=renderShiftHealthDocument(shell);assert.match(result,/<title>Men’s Health: Energy, Sleep &amp; Wellbeing \| SHIFT Health<\/title>/);assert.match(result,/<h1>SHIFT Health: what would you like to sort\?<\/h1>/);assert.match(result,/href="\/shift-health\/testosterone-energy"/);assert.match(result,/https:\/\/shiftsometimber.co.uk\/shift-health/);
 const child=renderShiftHealthDocument(shell,'testosterone-energy');assert.match(child,/SHIFT does not prescribe/);assert.doesNotMatch(child,/SHIFT Health: what would you like to sort/);
});
test('source display separates online publication from issue date, labels preliminary work and escapes data',()=>{
 const label=sourceDateLabel({online_publication_date:'2026-07-23',issue_date:'2026-12-01',evidence_type:'Review'});assert.match(label,/First published online: 23 July 2026/);assert.match(label,/Journal issue: 1 December 2026/);assert.doesNotMatch(label,/Source date:/);
 assert.match(sourceDateLabel({evidence_type:'Preprint — not peer reviewed',online_publication_date:'2026-09-03'}),/Preprint — not peer reviewed/);
 assert.match(sourceDateLabel({source_date:'2026-09-10'}),/Source date: 10 September 2026/);
 assert.match(sourceDateLabel({evidence_type:'<script>',online_publication_date:'bad'}),/&lt;script&gt;/);
});
test('new automatic checks hold unfinished and undisclosed preliminary copy, without authorising treatment changes',()=>{
 const now=Date.parse('2026-09-23T12:00:00Z'),source={source_tier:1,url:'https://www.gov.uk/example',authority:'UK authority',source_date:'2026-09-22',retrieved_at:'2026-09-23T11:00:00Z',summary:'The authority has published a new update explaining the status of a public consultation. The consultation invites responses from stakeholders. It does not announce a change to treatment eligibility or prescribing rules. Final decisions have not yet been made.'};
 const row={status:'ready_for_review',source_evidence_json:JSON.stringify([source]),verification_json:'{"verified":true}',source_review_generation:0};
 const pkg={editorial_policy:AUTO_NEWS_POLICY,headline:'Consultation update',standfirst:'A consultation is open.',article_markdown:'The authority opened a consultation and invites responses from stakeholders. It has not announced any final decision.',shift_take:'This is consultation, not a treatment-access change.',known_facts:[{claim:'Consultation is open.',source_url:source.url}],review_flags:[],unknowns:['Final outcome']};
 assert(autoNewsEligibility(row,pkg,{review_flags:[]},now).ok);
 assert(autoNewsEligibility(row,{...pkg,article_markdown:pkg.article_markdown+' [journal name]'},{review_flags:[]},now).reasons.includes('unfinished_placeholder'));
 const pre={...row,source_evidence_json:JSON.stringify([{...source,evidence_type:'Preprint'}])};
 assert(autoNewsEligibility(pre,pkg,{review_flags:[]},now).reasons.includes('preprint_disclosure_missing'));
 assert(!autoNewsEligibility(pre,{...pkg,standfirst:'This is a preprint, not peer reviewed.'},{review_flags:[]},now).reasons.includes('preprint_disclosure_missing'));
});
test('candidate corrects exactly the selected articles and dates, preserving first publication and every other row',()=>{
 const snapshot=JSON.parse(readFileSync('seo-news-snapshot/published.json','utf8')),result=prepareNews(snapshot,'2026-09-23T13:00:00.000Z');
 assert.equal(result.changes.length,13);
 for(const c of result.changes){assert.equal(c.before.first_published_at,c.after.first_published_at);assert.equal(c.before.reviewed_at,c.after.reviewed_at);assert.equal(JSON.parse(c.before.content_package_json).seo.datePublished,JSON.parse(c.after.content_package_json).seo.datePublished);}
 for(const edit of ARTICLE_CORRECTIONS){const row=result.news.find(x=>x.id===edit.id),c=JSON.parse(row.content_package_json);assert.equal(c.headline,edit.headline);assert.doesNotMatch(c.article_markdown,/\[journal name\]/);}
 assert.match(JSON.parse(result.news.find(x=>x.id===188).content_package_json).standfirst,/preprint/);
 const ids=new Set(result.changes.map(x=>x.id));for(const row of snapshot.news)if(!ids.has(row.id))assert.deepEqual(result.news.find(x=>x.id===row.id),row);
});
test('the data plan is all-or-none on stale content, preserves review decisions, and is idempotent',()=>{
 const snapshot=JSON.parse(readFileSync('seo-news-snapshot/published.json','utf8')),candidate=prepareNews(snapshot,'2026-09-23T13:00:00.000Z');
 function setup(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,content_package_json TEXT,source_evidence_json TEXT,updated_at TEXT,reviewed_at TEXT);CREATE TABLE radar_audit(event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT);');const insert=db.prepare("INSERT INTO radar_events VALUES(?,'published',?,?,?,?)");for(const {before:r} of candidate.changes)insert.run(r.id,r.content_package_json,r.source_evidence_json,r.updated_at,r.reviewed_at);return db;}
 const sql=correctionSQL(candidate.changes,candidate.modifiedAt);let db=setup();db.exec(sql);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,13);for(const x of candidate.changes)assert.equal(db.prepare('SELECT content_package_json c FROM radar_events WHERE id=?').get(x.id).c,x.after.content_package_json);db.exec(sql);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,13);db.close();
 db=setup();db.prepare('UPDATE radar_events SET content_package_json=? WHERE id=?').run('newer editorial change',candidate.changes.at(-1).id);db.exec(sql);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,0);assert.equal(db.prepare('SELECT content_package_json c FROM radar_events WHERE id=?').get(candidate.changes[0].id).c,candidate.changes[0].before.content_package_json);db.close();
});
