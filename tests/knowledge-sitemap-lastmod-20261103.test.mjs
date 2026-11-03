import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {completeSitemap} from '../aeo-geo/delivery.mjs';
import {patchKnowledgeSitemapBundle,patchTwoApprovedTickerLines,EXTRA_TICKER_PATHS,soleServingVersion} from '../release/knowledge-sitemap-lastmod-20261103.mjs';
import {approvedTickerModule,APPROVED_TICKER_PATHS} from '../release/approved-shared-ticker-wording-20261031.mjs';
test('native Knowledge repair changes one discovery predicate and preserves every other byte',()=>{
 const before='UNRELATED HEADER\nasync function withDynamicBabyLoveDiscovery(response, request, env) {\n const q="knowledge_articles";\n if (row.editorial && text.includes("<loc>" + loc + "</loc>")) { const d=articleModifiedDate(row); }\n}\nUNRELATED FOOTER';
 const out=patchKnowledgeSitemapBundle(before);assert.equal(out.module,before.replace('row.editorial && ',''));assert(out.proof.fullInverseVerified);
 assert.throws(()=>patchKnowledgeSitemapBundle(out.module));assert.throws(()=>patchKnowledgeSitemapBundle(before+before));
 assert.throws(()=>patchKnowledgeSitemapBundle(before.replace('knowledge_articles','unrelated_table')));
});
const fixture=readFileSync(new URL('./fixtures/approved-shared-ticker-before-20261031.mjs',import.meta.url),'utf8'),baseline=approvedTickerModule(fixture),patch=patchTwoApprovedTickerLines(baseline.module,fixture);
function selector(body){return vm.runInNewContext(body.slice(body.indexOf('function publishedItems('),body.indexOf('  const start ='))+';publishedItems',{URL,Date,origin:'https://shiftsometimber.co.uk'});}
const old=selector(baseline.body),current=selector(patch.body),now=Date.parse('2026-11-03T15:00:00Z');
const row=(path,id)=>({id,headline:'Approved full title',story_headline:'Approved full title',ticker_line:'Exact approved ticker '+id,url:path,published_at:'2026-11-03T14:56:00Z',metadata:{canonical:'https://shiftsometimber.co.uk'+path,datePublished:'2026-11-03T14:56:00Z',dateModified:'2026-11-03T14:56:00Z'},destinations:['medicine_news']});
test('all six explicitly approved paths use their retained CMS ticker copy in both feeds',()=>{
 for(const newsroom of [true,false])for(const [i,path] of [...APPROVED_TICKER_PATHS,...EXTRA_TICKER_PATHS].entries()){const r=row(path,i+1),snapshot=structuredClone(r),items=current([r],newsroom,now);assert.equal(items.length,1);assert.equal(items[0].headline,r.ticker_line);assert.equal(items[0].url,path);assert.equal(items[0].published_at,old([r],newsroom,now)[0].published_at);assert.deepEqual(r,snapshot);}
});
test('unapproved destinations and native publication, foreign, future and duplicate guards remain unchanged',()=>{
 for(const rs of [[row('/medicine-news/unrelated',1)],[{...row(EXTRA_TICKER_PATHS[0],1),ticker_line:''}],[{...row(EXTRA_TICKER_PATHS[0],1),destinations:[]}],[{...row(EXTRA_TICKER_PATHS[0],1),metadata:{canonical:'https://evil.example/story',datePublished:'2026-11-03'}}],[{...row(EXTRA_TICKER_PATHS[0],1),metadata:{canonical:'https://shiftsometimber.co.uk'+EXTRA_TICKER_PATHS[0],datePublished:'2027-01-01'}}]])assert.deepEqual(JSON.parse(JSON.stringify(current(rs,true,now))),JSON.parse(JSON.stringify(old(rs,true,now))));
 const r=row(EXTRA_TICKER_PATHS[0],1);assert.equal(current([r,r],true,now).length,1);assert.throws(()=>patchTwoApprovedTickerLines(baseline.module+' ',fixture));
 for(const s of ['env.CORE.fetch(request)','shift-news-shared-v3','public, max-age=60, must-revalidate','SHIFT News:','ask-timber|shift-health','copy.cloneNode(true)'])assert(patch.module.includes(s));
 assert(patch.proof.fullInverseVerified);
});

test('a retained zero-traffic version is distinct from split or unaccounted live traffic',()=>{
 assert.equal(soleServingVersion({versions:[{version_id:'live',percentage:100},{version_id:'retained',percentage:0}]}),'live');
 assert.throws(()=>soleServingVersion({versions:[{version_id:'one',percentage:50},{version_id:'two',percentage:50}]}));
 assert.throws(()=>soleServingVersion({versions:[{version_id:'one',percentage:90}]}));
});

test('outer SEO snapshot preserves later real CMS article dates while retaining audited exclusions and other metadata',()=>{
 const loc='https://shiftsometimber.co.uk/articles/mounjaro-injection-sites',xml='<urlset><url><loc>'+loc+'</loc><lastmod>2026-11-03</lastmod></url><url><loc>https://shiftsometimber.co.uk/held</loc></url><url><loc>https://shiftsometimber.co.uk/unchanged</loc><lastmod>2026-08-27</lastmod></url></urlset>';
 const metadata={'/articles/mounjaro-injection-sites':{lastmod:'2026-10-29T05:00:37.839Z'},'/held':{exclude:true},'/unchanged':{lastmod:'2026-10-01'}},data={recipes:[],exercises:[],publishedAt:'2026-10-01'};
 const after=completeSitemap(xml,data,metadata);
 assert(after.includes('<lastmod>2026-11-03</lastmod>'));assert(!after.includes('/held'));assert(after.includes('<lastmod>2026-10-01</lastmod>'));
 for(const invalid of ['garbage','2099-01-01','2026-09-01'])assert(completeSitemap(xml.replace('2026-11-03',invalid),data,metadata).includes('<lastmod>2026-10-29T05:00:37.839Z</lastmod>'));
});
