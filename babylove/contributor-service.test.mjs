import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {blogRoutes,createBlogKey,ensureBlogSchema,runBlogQueue,API,ADMIN,blogPublication,blogEditorialPaused,siteChecks} from './contributor-service.mjs';
import {articleHTML} from './dynamic-public.mjs';
function database(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(`CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,updated_at TEXT)`);
 return {sqlite,prepare(sql){let args=[];return {bind(...x){args=x;return this},async run(){const r=sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}}}},async batch(stmts){sqlite.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
}
const ownerResolver=async()=>({id:1,role:'owner'}),start=Date.parse('2026-10-24T08:00:00Z');
const payload=()=>({title:'A practical health question',body:'A useful article with practical next steps.\n\n[Start here](/start-here).\n\n## Sources\n\n[NHS health check](https://www.nhs.uk/conditions/nhs-health-check/)',heroImage:{url:'https://shiftsometimber.co.uk/assets/test.png',alt:'A health check',caption:'An illustrative photograph.'},metaDescription:'Practical steps for a first health check.',url:'/articles/contributor-test',keywords:['men’s health'],sources:[{title:'NHS health check',url:'https://www.nhs.uk/conditions/nhs-health-check/'}],author:"Matt O'Brien",editorialCheck:{result:'pass',reviewer:'Contributor'}});
async function setup(){const env={DB:database(),BLOG_CONTRIBUTOR_ENABLED:'true',DAILY_CONTENT_GATEWAY:'shift-ai',DAILY_CONTENT_BUDGET_VERIFIED:'true',SHIFT_AI_MODEL:'existing-approved-model',AI:{calls:0,async run(){this.calls++;return {response:{decision:'PASS',claims_supported:true,original_copy:true,sources_visible:true,no_treatment_advice:true,no_invented_review:true,issues:[]}}}}};await ensureBlogSchema(env.DB);const key=await createBlogKey(env.DB,'Synthetic staging contributor',start);return {env,key}}
function request(path,token,body,idem='one',method=body?'POST':'GET'){return new Request('https://api.shiftsometimber.co.uk'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{}),'Idempotency-Key':idem},...(body?{body:JSON.stringify(body)}:{})})}
const baseFetcher=async(url)=>{url=String(url);if(url.endsWith('/assets/test.png'))return new Response(Uint8Array.from([137,80,78,71,13,10,26,10,1]),{headers:{'Content-Type':'image/png'}});if(url.includes('nhs.uk'))return new Response('<html><title>NHS</title><main>'+('Source content for a useful health check. '.repeat(20))+'</main></html>',{headers:{'Content-Type':'text/html'}});if(url.endsWith('/start-here'))return new Response('<main id="start">Useful support</main>');return new Response('Not found',{status:404})};
test('edge checks use supported manual redirects and reject redirected resources',async()=>{
 const article=payload();
 const direct=await siteChecks(article,{fetcher:async(url,options)=>{assert.equal(options.redirect,'manual');return baseFetcher(url)}});
 assert.equal(direct.pass,true);
 const redirected=await siteChecks(article,{fetcher:async(url,options)=>{assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://unchecked.invalid/'}})}});
 assert.equal(redirected.pass,false);
 assert.ok(redirected.reasons.some(x=>x.includes('resource_http_302')));
});
test('blog credentials are isolated, revocable and never stored in plaintext',async()=>{
 const {env,key}=await setup();try{
  assert.equal((await blogRoutes(request(API,'wrong'),env,{})).status,401);
  assert.equal((await blogRoutes(request(ADMIN+'/keys',key.token,{label:'Backdoor'}),env,{})).status,403);
  assert.equal(await blogRoutes(request('/v1/hq/users',key.token),env,{}),null);
  const row=env.DB.sqlite.prepare('SELECT * FROM knowledge_blog_keys').get();assert.notEqual(row.token_hash,key.token);assert.equal(JSON.stringify(row).includes(key.token),false);
  const r=await blogRoutes(request(ADMIN+'/keys/'+key.id+'/revoke',null,{}),env,{}, {ownerResolver,now:start});assert.equal(r.status,200);
  assert.equal((await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).status,401);
 }finally{env.DB.sqlite.close()}
});
test('new submissions are durable and repeat-safe; content conflicts cannot overwrite',async()=>{
 const {env,key}=await setup();try{
  const first=await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});assert.equal(first.status,202);const s=await first.json();assert.equal(s.state,'review_pending');assert.ok(Object.values(s.receipt.checks).every(x=>x.status==='pending'));
  const retry=await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});assert.equal((await retry.json()).duplicate,true);
  assert.equal((await blogRoutes(request(API,key.token,{...payload(),title:'Changed'}),env,{}, {now:start,fetcher:baseFetcher})).status,409);
  assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_submissions').get().n,1);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);
  const other=await createBlogKey(env.DB,'Other staging identity',start);assert.equal((await blogRoutes(request(API+'/'+s.id,other.token),env,{})).status,404);
 }finally{env.DB.sqlite.close()}
});
test('failed and unsafe submissions are private drafts with reasons',async()=>{
 const {env,key}=await setup();try{
  for(const [i,p]of [{...payload(),editorialCheck:{result:'fail',reviewer:'Contributor'}},{...payload(),body:'<script>unsafe()</script>'},{...payload(),url:'/start-here'}].entries()){
   const r=await blogRoutes(request(API,key.token,p,'fail_'+i),env,{}, {now:start,fetcher:baseFetcher});const s=await r.json();assert.equal(s.state,'draft_failed');assert.ok(s.reasons.length);
  }assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);
 }finally{env.DB.sqlite.close()}
});
test('existing article stays byte-identical until exact owner approval; stale base is rejected',async()=>{
 const {env,key}=await setup();try{
  env.DB.sqlite.prepare(`INSERT INTO knowledge_articles(title,slug,status,body,publish_at,updated_at) VALUES('Original','contributor-test','published','Original body','2020-01-01T11:00:00Z','2020-01-01T11:00:00Z')`).run();
  const before=JSON.stringify(env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get());
  const response=await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});const s=await response.json();assert.equal(s.state,'revision_awaiting_owner');assert.ok(s.comparison.length);
  await runBlogQueue(env,{now:start,fetcher:baseFetcher});assert.equal(env.AI.calls,0);assert.equal(JSON.stringify(env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get()),before);
  const path=ADMIN+'/submissions/'+s.id+'/approve',approval={payloadHash:s.payloadHash,baseHash:s.baseHash};assert.equal((await blogRoutes(request(path,key.token,approval),env,{})).status,403);
  assert.equal((await blogRoutes(request(path,null,{...approval,payloadHash:'wrong'}),env,{}, {ownerResolver,now:start})).status,409);
  env.DB.sqlite.prepare("UPDATE knowledge_articles SET body='Other editor change'").run();assert.equal((await blogRoutes(request(path,null,approval),env,{}, {ownerResolver,now:start})).status,409);
  assert.equal(env.DB.sqlite.prepare('SELECT body FROM knowledge_articles').get().body,'Other editor change');
 }finally{env.DB.sqlite.close()}
});
test('new publication requires independent site review, slot, unchanged base and active key',async()=>{
 const {env,key}=await setup();try{
  const s=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();
  await runBlogQueue(env,{now:start,fetcher:baseFetcher});assert.equal(env.AI.calls,1);assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'scheduled');assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);
  env.DB.sqlite.prepare('UPDATE knowledge_blog_keys SET active=0').run();await runBlogQueue(env,{now:Date.parse(s.dueAt),fetcher:baseFetcher});assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'draft_key_revoked');
 }finally{env.DB.sqlite.close()}
});
test('approved refresh preserves original date and records revision history atomically',async()=>{
 const {env,key}=await setup();try{
  env.DB.sqlite.prepare(`INSERT INTO knowledge_articles(title,slug,status,body,publish_at,updated_at) VALUES('Original','contributor-test','published','Original body','2020-01-01T11:00:00Z','2020-01-01T11:00:00Z')`).run();
  const s=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();const approve=await blogRoutes(request(ADMIN+'/submissions/'+s.id+'/approve',null,{payloadHash:s.payloadHash,baseHash:s.baseHash}),env,{}, {ownerResolver,now:start});assert.equal(approve.status,200);
  await runBlogQueue(env,{now:start,fetcher:baseFetcher});await runBlogQueue(env,{now:Date.parse(s.dueAt),fetcher:baseFetcher});
  const row=env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get();assert.equal(row.publish_at,'2020-01-01T11:00:00Z');assert.equal(row.updated_at,s.dueAt);assert.equal(row.title,payload().title);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_versions').get().n,1);assert.equal((await blogPublication(env,'contributor-test')).contributor,true);
 }finally{env.DB.sqlite.close()}
});
test('unavailable editorial gateway and interrupted work fail closed without automatic replay',async()=>{
 const {env,key}=await setup();try{
  delete env.AI;await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});await runBlogQueue(env,{now:start,fetcher:baseFetcher});assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'draft_review_hold');assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);
  env.DB.sqlite.prepare("UPDATE knowledge_blog_submissions SET state='publishing'").run();await runBlogQueue(env,{now:start+30*60000,fetcher:baseFetcher});assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'publication_uncertain');
 }finally{env.DB.sqlite.close()}
});
test('unpublished CMS drafts cannot be exposed or replaced by probing their slug',async()=>{
 const {env,key}=await setup();try{
  env.DB.sqlite.prepare("INSERT INTO knowledge_articles(title,slug,status,body) VALUES('Private editorial draft','contributor-test','draft','Private material')").run();
  const r=await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});const s=await r.json();assert.equal(s.state,'draft_failed');assert.ok(s.reasons.includes('unpublished_slug_reserved'));assert.equal(s.current,null);assert.equal(JSON.stringify(s).includes('Private material'),false);assert.equal(env.DB.sqlite.prepare('SELECT body FROM knowledge_articles').get().body,'Private material');
 }finally{env.DB.sqlite.close()}
});
test('live key creation is held until explicit backend acceptance; contributor cannot set that flag',async()=>{
 const {env}=await setup();try{
  let r=await blogRoutes(request(ADMIN+'/keys',null,{label:'Contributor'}),env,{}, {ownerResolver,now:start});assert.equal(r.status,409);assert.equal((await r.json()).error,'backend_acceptance_required_before_live_key');
  env.BLOG_ACCESS_ACCEPTED='true';r=await blogRoutes(request(ADMIN+'/keys',null,{label:'Contributor'}),env,{}, {ownerResolver,now:start});assert.equal(r.status,201);assert.equal((await r.json()).token.length,64);
 }finally{env.DB.sqlite.close()}
});
test('a changed reviewed source holds publication rather than reusing stale factual review',async()=>{
 const {env,key}=await setup();try{
  const s=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();await runBlogQueue(env,{now:start,fetcher:baseFetcher});
  const changed=async(url,options)=>String(url).includes('nhs.uk')?new Response('<main>'+('Changed source. '.repeat(100))+'</main>'):baseFetcher(url,options);
  await runBlogQueue(env,{now:Date.parse(s.dueAt),fetcher:changed});assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'draft_publish_hold');
 }finally{env.DB.sqlite.close()}
});
test('different articles can receive independent reviews on the same local day',async()=>{
 const {env,key}=await setup();try{
  for(const i of [1,2])await blogRoutes(request(API,key.token,{...payload(),url:'/articles/review-'+i},'review_'+i),env,{}, {now:start,fetcher:baseFetcher});
  await runBlogQueue(env,{now:start,fetcher:baseFetcher});await runBlogQueue(env,{now:start+60000,fetcher:baseFetcher});assert.equal(env.AI.calls,2);assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM knowledge_blog_submissions WHERE state='scheduled'").get().n,2);
 }finally{env.DB.sqlite.close()}
});
test('a concurrent CMS edit rolls back all publication SQL and leaves history untouched',async()=>{
 const {env,key}=await setup();try{
  const s=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();await runBlogQueue(env,{now:start,fetcher:baseFetcher});const batch=env.DB.batch.bind(env.DB);let injected=false;
  env.DB.batch=async statements=>{if(!injected){injected=true;env.DB.sqlite.prepare("INSERT INTO knowledge_articles(title,slug,status,body) VALUES('Other editor','contributor-test','published','Other live body')").run()}return batch(statements)};
  await runBlogQueue(env,{now:Date.parse(s.dueAt),fetcher:baseFetcher});assert.equal(env.DB.sqlite.prepare('SELECT title FROM knowledge_articles').get().title,'Other editor');assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_versions').get().n,0);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_pages').get().n,0);assert.equal(env.DB.sqlite.prepare('SELECT state FROM knowledge_blog_submissions').get().state,'publication_uncertain');
 }finally{env.DB.sqlite.close()}
});

async function publishedLinkFixture(){
 const {env,key}=await setup();
 env.DB.sqlite.prepare(`INSERT INTO knowledge_articles(title,slug,category,author,status,summary,body,seo_title,publish_at,updated_at) VALUES('A health check','contributor-test','Knowledge','Original author','published','Original summary','A health check can be a practical first step.','Original SEO title','2020-01-01T11:00:00Z','2020-01-01T11:00:00Z')`).run();
 const {ensureEditorialSchema}=await import('../daily-content/publication.mjs');await ensureEditorialSchema(env.DB);
 env.DB.sqlite.exec('CREATE TABLE babylove_receipts(slug TEXT,source_id TEXT)');env.DB.sqlite.prepare("INSERT INTO babylove_receipts VALUES('contributor-test','fixture')").run();
 const fetcher=async(url,options)=>{
  const u=String(url);
  if(u.endsWith('/articles/contributor-test'))return new Response(articleHTML(env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get()),{headers:{'Content-Type':'text/html'}});
  if(u.endsWith('/articles/health-check-guide'))return new Response('<link rel="canonical" href="https://shiftsometimber.co.uk/articles/health-check-guide"><main><h1>A health check guide</h1></main>',{headers:{'Content-Type':'text/html'}});
  if(u.endsWith('/explore-knowledge'))return new Response('<a href="/articles/contributor-test">Article</a>');
  if(u.endsWith('/sitemap.xml'))return new Response('<loc>https://shiftsometimber.co.uk/articles/contributor-test</loc>');
  return baseFetcher(url,options);
 };
 return {env,key,fetcher};
}
test('link-only route preserves legacy wording, author, metadata and original date without model spend',async()=>{
 const {env,key,fetcher}=await publishedLinkFixture();try{
  const before=env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get();
  const payload={url:'/articles/contributor-test',links:[{text:'health check',url:'/articles/health-check-guide'}]};
  const r=await blogRoutes(request(API+'/internal-links',key.token,payload,'links_only'),env,{}, {now:start,fetcher});assert.equal(r.status,202);const s=await r.json();assert.equal(s.state,'links_verified');assert.equal(s.receipt.existingWordingUnchanged,true);
  const after=env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get();assert.deepEqual({...after,body:before.body,updated_at:before.updated_at},{...before});assert.ok(after.body.includes('[health check]'));assert.equal(env.AI.calls,0);
  assert.equal(env.DB.sqlite.prepare('SELECT approved_by FROM knowledge_blog_versions').get().approved_by,'policy:internal_links_only');
  const retry=await (await blogRoutes(request(API+'/internal-links',key.token,payload,'links_only'),env,{}, {now:start,fetcher})).json();assert.equal(retry.duplicate,true);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_versions').get().n,1);
 }finally{env.DB.sqlite.close()}
});
test('Related line may use a verified destination title but cannot smuggle a rewrite or false label',async()=>{
 const {env,key,fetcher}=await publishedLinkFixture();try{
  for(const [i,p]of [{url:'/articles/contributor-test',related:[{text:'Unrelated treatment claim',url:'/articles/health-check-guide'}]},{url:'/articles/contributor-test',body:'Rewritten content',links:[{text:'health check',url:'/articles/health-check-guide'}]}].entries()){
   const s=await (await blogRoutes(request(API+'/internal-links',key.token,p,'invalid_link_'+i),env,{}, {now:start,fetcher})).json();assert.equal(s.state,'draft_failed');
  }
  assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_versions').get().n,0);
  const s=await (await blogRoutes(request(API+'/internal-links',key.token,{url:'/articles/contributor-test',related:[{text:'A health check guide',url:'/articles/health-check-guide'}]},'related'),env,{}, {now:start,fetcher})).json();assert.equal(s.state,'links_verified');assert.equal(s.receipt.relatedLineAdded,true);assert.ok(env.DB.sqlite.prepare('SELECT body FROM knowledge_articles').get().body.endsWith('Related: [A health check guide](https://shiftsometimber.co.uk/articles/health-check-guide)'));
 }finally{env.DB.sqlite.close()}
});
test('concurrent editor changes or key revocation prevent a link edit and roll back its audit record',async()=>{
 for(const revoke of [false,true]){
  const {env,key,fetcher}=await publishedLinkFixture();try{
   const batch=env.DB.batch.bind(env.DB);env.DB.batch=async items=>{if(revoke)env.DB.sqlite.prepare('UPDATE knowledge_blog_keys SET active=0').run();else env.DB.sqlite.prepare("UPDATE knowledge_articles SET body='Other editor wording'").run();return batch(items)};
   const s=await (await blogRoutes(request(API+'/internal-links',key.token,{url:'/articles/contributor-test',links:[{text:'health check',url:'/articles/health-check-guide'}]},'race'),env,{}, {now:start,fetcher})).json();assert.equal(s.state,'publication_uncertain');assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_versions').get().n,0);assert.equal(env.DB.sqlite.prepare('SELECT body FROM knowledge_articles').get().body.includes('[health check]'),false);
  }finally{env.DB.sqlite.close()}
 }
});
test('full existing-article submissions still require owner approval and future author is Matt',async()=>{
 const {env,key}=await setup();try{
  const s=await (await blogRoutes(request(API,key.token,{...payload(),author:'SHIFT Team'},'other_author'),env,{}, {now:start,fetcher:baseFetcher})).json();assert.equal(s.state,'draft_failed');assert.ok(s.reasons.includes('author_not_approved'));
 }finally{env.DB.sqlite.close()}
});
test('link policy preserves a website-owned article journal and its existing review evidence',async()=>{
 const {env,key,fetcher}=await publishedLinkFixture();try{
  const {POLICY,digest,frozenArticle,editorialPublication}=await import('../daily-content/publication.mjs');const old=env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get();const hash=await digest(frozenArticle(old));
  env.DB.sqlite.prepare("INSERT INTO knowledge_editorial_releases(release_day,intent_key,article_id,slug,state,token,policy,due_at,final_sha256,payload_json,review_json,verification_json,created_at,updated_at) VALUES('2020-01-01','health',1,'contributor-test','verified','journal',?,'2020-01-01T11:00:00Z',?,'{}','original_review','old_verification','2020-01-01','2020-01-01')").run(POLICY,hash);
  const s=await (await blogRoutes(request(API+'/internal-links',key.token,{url:'/articles/contributor-test',links:[{text:'health check',url:'/articles/health-check-guide'}]},'journal_links'),env,{}, {now:start,fetcher})).json();assert.equal(s.state,'links_verified');
  const j=env.DB.sqlite.prepare('SELECT * FROM knowledge_editorial_releases').get();assert.equal(j.review_json,'original_review');assert.equal(j.verification_json,null);assert.equal(j.state,'published');assert.notEqual(j.final_sha256,hash);assert.equal((await editorialPublication(env,'contributor-test')).editorial,true);
 }finally{env.DB.sqlite.close()}
});

test('owner series pause is durable and a storage error cannot silently resume publication',async()=>{
 const {env}=await setup();try{assert.equal(await blogEditorialPaused(env),false);env.DB.sqlite.exec("CREATE TABLE knowledge_blog_controls(name TEXT PRIMARY KEY,value TEXT NOT NULL,reason TEXT,updated_at TEXT); INSERT INTO knowledge_blog_controls VALUES('website_editorial_pause','true','45-day series','2026-10-21')");assert.equal(await blogEditorialPaused(env),true);const bad={DB:{prepare(){throw Error('database unavailable')}}};await assert.rejects(()=>blogEditorialPaused(bad),/database unavailable/);}
 finally{env.DB.sqlite.close()}
});


test('source furniture changes do not invalidate review; main copy changes name the source',async()=>{
 const {env,key}=await setup();try{
  const f=async(url,options)=>String(url).includes('nhs.uk')?new Response('<nav>Navigation '+(options?.x||'one')+'</nav><main>'+('Actual source copy. '.repeat(20))+'</main><footer>Campaign one</footer>'):baseFetcher(url,options);
  const x=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:f})).json();await runBlogQueue(env,{now:start,fetcher:f});
  const chrome=async(url,options)=>String(url).includes('nhs.uk')?new Response('<nav>Navigation two</nav><main>'+('Actual source copy. '.repeat(20))+'</main><footer>Campaign two</footer>'):baseFetcher(url,options);
  await runBlogQueue(env,{now:Date.parse(x.dueAt),fetcher:chrome});assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,1);
 }finally{env.DB.sqlite.close()}
});
test('date-only resubmission reuses the existing passed review without another model call',async()=>{
 const {env,key}=await setup();try{
  await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher});await runBlogQueue(env,{now:start,fetcher:baseFetcher});
  await blogRoutes(request(API,key.token,{...payload(),datePublished:'2026-10-25'},'date_retry'),env,{}, {now:start+60000,fetcher:baseFetcher});await runBlogQueue(env,{now:start+60000,fetcher:baseFetcher});
  assert.equal(env.AI.calls,1);assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM knowledge_blog_submissions WHERE state='scheduled'").get().n,2);
 }finally{env.DB.sqlite.close()}
});
test('changed sources expose their exact URL and retry keeps one record; another key cannot retry it',async()=>{
 const {env,key}=await setup();try{
  const x=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();await runBlogQueue(env,{now:start,fetcher:baseFetcher});
  const f=async(url,options)=>String(url).includes('nhs.uk')?new Response('<main>'+('Material change. '.repeat(30))+'</main>'):baseFetcher(url,options);
  await runBlogQueue(env,{now:Date.parse(x.dueAt),fetcher:f});let row=env.DB.sqlite.prepare('SELECT * FROM knowledge_blog_submissions').get();assert.equal(JSON.parse(row.receipt_json).detail.sourceChanges[0].url,payload().sources[0].url);
  const other=await createBlogKey(env.DB,'Other');assert.equal((await blogRoutes(request(API+'/'+x.id+'/retry',other.token,{}),env,{}, {now:start,fetcher:f})).status,404);
  assert.equal((await blogRoutes(request(API+'/'+x.id+'/retry',key.token,{body:'replacement'}),env,{}, {now:start,fetcher:f})).status,400);
  const r=await blogRoutes(request(API+'/'+x.id+'/retry',key.token,{publishMode:'when_ready'}),env,{}, {now:Date.parse(x.dueAt)+60000,fetcher:f});assert.equal(r.status,202);assert.equal((await r.json()).id,x.id);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_submissions').get().n,1);
 }finally{env.DB.sqlite.close()}
});
test('a historical spent review day cannot block a new review or leave a midnight wait',async()=>{
 const {env,key}=await setup();try{
  env.DB.sqlite.prepare('INSERT INTO knowledge_blog_review_days VALUES(?,?,?)').run('2026-10-24','historical-reviewed-post',new Date(start).toISOString());
  const x=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();
  env.DB.sqlite.prepare("UPDATE knowledge_blog_submissions SET state='review_waiting_budget',receipt_json=? WHERE id=?").run(JSON.stringify({retryAt:'2026-10-24T23:00:00.000Z',publishMode:'when_ready'}),x.id);
  await runBlogQueue(env,{now:start+60000,fetcher:baseFetcher});const row=env.DB.sqlite.prepare('SELECT * FROM knowledge_blog_submissions WHERE id=?').get(x.id);assert.equal(row.state,'scheduled');assert.equal(env.AI.calls,1);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_review_days').get().n,1);
 }finally{env.DB.sqlite.close()}
});
test('explicit when-ready submission publishes after 11 without waiting until tomorrow',async()=>{
 const {env,key}=await setup();try{
  const now=Date.parse('2026-10-24T14:00:00Z');const r=await blogRoutes(request(API,key.token,{...payload(),publishMode:'when_ready'}),env,{}, {now,fetcher:baseFetcher});assert.equal((await r.json()).dueAt,new Date(now).toISOString());await runBlogQueue(env,{now,fetcher:baseFetcher});assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,1);
 }finally{env.DB.sqlite.close()}
});
test('independent hold returns the actual editorial issues',async()=>{
 const {env,key}=await setup();try{
  env.AI.run=async()=>({response:{decision:'HOLD',issues:['A claim lacks source support.']}});const x=await (await blogRoutes(request(API,key.token,payload()),env,{}, {now:start,fetcher:baseFetcher})).json();await runBlogQueue(env,{now:start,fetcher:baseFetcher});const row=env.DB.sqlite.prepare('SELECT * FROM knowledge_blog_submissions WHERE id=?').get(x.id);assert.deepEqual(JSON.parse(row.receipt_json).detail.issues,['A claim lacks source support.']);
 }finally{env.DB.sqlite.close()}
});

test('a contributor can verify its key and capabilities without creating a post',async()=>{
 const {env,key}=await setup();try{const r=await blogRoutes(request(API+'/capabilities',key.token),env,{});assert.equal(r.status,200);const x=await r.json();assert.equal(x.authenticated,true);assert.equal(x.scope,'blogs_only');assert.equal(x.dailyModelAttemptLimit,null);assert.equal(x.reviewAllowanceRequired,false);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_blog_submissions').get().n,0);assert.equal((await blogRoutes(request(API+'/capabilities','wrong'),env,{})).status,401);}finally{env.DB.sqlite.close()}
});

test('when-ready legacy budget wait retains its intent and publishes on rollover without an eleven am delay',async()=>{
 const {env,key}=await setup();try{
  const now=Date.parse('2026-10-24T14:00:00Z');const x=await (await blogRoutes(request(API,key.token,payload(),'late'),env,{}, {now,fetcher:baseFetcher})).json();
  env.DB.sqlite.prepare("UPDATE knowledge_blog_submissions SET state='draft_review_hold' WHERE id=?").run(x.id);
  const retry=await blogRoutes(request(API+'/'+x.id+'/retry',key.token,{publishMode:'when_ready'}),env,{}, {now,fetcher:baseFetcher});assert.equal(retry.status,202);
  env.DB.sqlite.prepare("UPDATE knowledge_blog_submissions SET state='review_waiting_budget' WHERE id=?").run(x.id);
  const next=Date.parse('2026-10-24T23:01:00Z');await runBlogQueue(env,{now:next,fetcher:baseFetcher});const article=env.DB.sqlite.prepare("SELECT * FROM knowledge_articles WHERE slug='contributor-test'").get();assert.ok(article);assert.equal(article.publish_at,new Date(next).toISOString());assert.equal(env.AI.calls,1);
 }finally{env.DB.sqlite.close()}
});
