import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {runDailyContentDraft,londonDay,primaryUrl,targetUrl,validateDraft,reviewPass} from './engine.mjs';

const NOW=Date.parse('2026-10-15T21:45:00Z');
const TARGET='https://shiftsometimber.co.uk/articles/meal-prep-busy-men';
const PRIMARY='https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely';
const sourceText=('This is a synthetic primary source fixture for testing evidence retrieval. Store food according to the instructions on its label and use suitable containers. ').repeat(8);
const currentText=('Existing synthetic article fixture. Plan two awkward meals and consider which practical obstacle makes the working week harder. ').repeat(4);
const paragraph='For this worked example, choose the busy evening you already know is awkward. Write down the ingredients in the cupboard before adding anything to a shopping list. Make the useful choice obvious and keep the preparation manageable. After trying it, ask whether the idea saved time or simply moved the effort to another day. The example is an optional organising suggestion, not a finding from a clinical trial.';
const draft=()=>({target_url:TARGET,title:'Meal prep for busy men: make two awkward meals easier',summary:'A practical worked example for planning food around a busy week.',body:'## Pick the actual problem\n\n'+Array.from({length:8},(_,i)=>`### Worked example ${i+1}\n\n${paragraph}`).join('\n\n')+`\n\n## Source\n\n[Food storage guidance](${PRIMARY})`,new_value:['A worked example for the two evenings that usually get difficult.','A short check of whether the idea actually saved time.'],claims:[{claim:'Follow the storage instructions supplied with your food.',source_urls:[PRIMARY]}],qualified_review_required:false});
const pass=()=>({decision:'PASS',claims_supported:true,useful_change:true,original_copy:true,sources_visible:true,no_treatment_advice:true,no_invented_review:true,issues:[]});

function fixture({response=draft(),review=pass(),fetchMode='good',modelError=false,objectResponses=false}={}){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title TEXT,source_uri TEXT,category TEXT,status TEXT,updated_at TEXT);
 CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT);
 INSERT INTO knowledge_articles(title,slug,status,body,publish_at) VALUES('Existing public article','existing-public-article','published','unchanged body','2026-09-01');`);
 sqlite.prepare('INSERT INTO ai_knowledge_documents(title,source_uri,category,status,updated_at) VALUES(?,?,?,?,?)').run('Meal prep',TARGET,'shift_public_site','published_site','2026-10-15T20:00:00Z');
 const calls=[],reads=[];
 const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values)},async run(){const r=sqlite.prepare(sql).run(...args);return{meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},async all(){return{results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null}});
 const DB={prepare:sql=>wrap(sql),async batch(stmts){sqlite.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 const env={DB,AI:{async run(...args){calls.push(args);if(modelError)throw Error('gateway budget refused');const value=calls.length===1?response:review;return{response:objectResponses?value:JSON.stringify(value)}}},SHIFT_AI_MODEL:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',DAILY_WEBSITE_CONTENT_ENABLED:'true',DAILY_CONTENT_GATEWAY:'shift-ai',DAILY_CONTENT_BUDGET_VERIFIED:'true'};
 const fetcher=async(url,options)=>{reads.push({url,options});if(fetchMode==='refused')return new Response('Forbidden',{status:403});if(url===TARGET)return new Response(`<html><head><link rel="canonical" href="${TARGET}"></head><main><h1>Meal prep</h1>${currentText}<a href="${fetchMode==='unapproved'?'https://www.nice.org.uk/guidance/ng246':PRIMARY}">Source</a></main></html>`,{headers:{'content-type':'text/html'}});return new Response(`<title>Primary fixture</title><main>${sourceText}</main>`,{headers:{'content-type':'text/html'}})};
 return{env,DB,sqlite,calls,reads,fetcher};
}

test('London day follows midnight and both daylight-saving transitions',()=>{
 assert.equal(londonDay(Date.parse('2026-10-15T23:15:00Z')),'2026-10-16');
 assert.equal(londonDay(Date.parse('2026-12-15T23:15:00Z')),'2026-12-15');
 assert.equal(londonDay(Date.parse('2026-03-29T00:59:59Z')),'2026-03-29');
 assert.equal(londonDay(Date.parse('2026-10-25T01:30:00Z')),'2026-10-25');
});

test('default off makes no database, network or model calls',async()=>{
 const f=fixture();delete f.env.DAILY_WEBSITE_CONTENT_ENABLED;
 assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'disabled');
 assert.equal(f.calls.length+f.reads.length,0);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM sqlite_master WHERE name='knowledge_daily_content_runs'").get().n,0);
});

test('provider structured objects retain the complete private draft and review flow',async()=>{
 const f=fixture({objectResponses:true});
 const result=await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher});
 assert.equal(result.status,'draft_ready');
 assert.equal(f.calls.length,2);
 const saved=f.sqlite.prepare('SELECT status,body,publish_at FROM knowledge_articles WHERE id=?').get(result.articleId);
 assert.equal(saved.status,'draft');assert.equal(saved.publish_at,null);
 assert.ok(saved.body.includes(PRIMARY));
});

test('malformed provider JSON never saves, repairs or automatically retries a draft',async()=>{
 const f=fixture();
 f.env.AI.run=async(...args)=>{f.calls.push(args);return{response:'{"body":"\ninvalid JSON string"}'}};
 const result=await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher});
 assert.equal(result.status,'failed');assert.equal(f.calls.length,1);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM knowledge_articles WHERE status='draft'").get().n,0);
 assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'already_attempted');
 assert.equal(f.calls.length,1);
});

test('unverified budget and wrong gateway cannot start generation',async()=>{
 for(const patch of [{DAILY_CONTENT_BUDGET_VERIFIED:'false'},{DAILY_CONTENT_GATEWAY:'default'},{SHIFT_AI_MODEL:undefined}]){
 const f=fixture();Object.assign(f.env,patch);
 assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'blocked');
 assert.equal(f.calls.length+f.reads.length,0);
 }
});

test('source permissions and exact canonical URLs cannot be widened by input',()=>{
 assert.equal(primaryUrl(PRIMARY),PRIMARY);assert.equal(targetUrl(TARGET),TARGET);
 for(const url of ['http://www.nhs.uk/x','https://www.nhs.uk.evil.example/x','https://user@www.nhs.uk/x','https://www.nhs.uk:8443/x','https://www.nhs.uk/x?extra=1','https://www.nice.org.uk/guidance/ng246','https://www.pharmacyregulation.org/rss'])assert.equal(primaryUrl(url),null,url);
 for(const url of [TARGET+'?preview=1',TARGET+'#anchor',TARGET.replace('shiftsometimber.co.uk','shiftsometimber.co.uk.evil.example'),'https://shiftsometimber.co.uk/member/dashboard'])assert.equal(targetUrl(url),null,url);
});

test('real SQLite flow saves one private HQ draft with evidence and no public overwrite',async()=>{
 const f=fixture(),out=await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher});
 assert.equal(out.status,'draft_ready');assert.equal(f.calls.length,2);
 const row=f.sqlite.prepare("SELECT * FROM knowledge_articles WHERE slug='internal-daily-2026-10-15'").get();
 assert.equal(row.status,'draft');assert.equal(row.publish_at,null);assert.equal(row.author,'SHIFT AI');assert.ok(row.body.includes(TARGET));
 const receipt=f.sqlite.prepare('SELECT * FROM knowledge_daily_content_runs').get();
 assert.equal(receipt.article_id,row.id);assert.match(receipt.draft_sha256,/^[a-f0-9]{64}$/);assert.equal(JSON.parse(receipt.evidence_json)[0].url,PRIMARY);
 assert.equal(JSON.parse(receipt.reason).knowledge_ingested,false);assert.equal(JSON.parse(receipt.reason).published,false);
 assert.equal(f.sqlite.prepare("SELECT body FROM knowledge_articles WHERE slug='existing-public-article'").get().body,'unchanged body');
 for(const [,input,options] of f.calls){assert.equal(options.gateway.id,'shift-ai');assert.equal(options.gateway.collectLog,false);assert.equal(options.gateway.skipCache,true);assert.ok(input.max_tokens<=4000);assert.ok(input.messages.every(m=>!m.content.includes('private member record')))}
 assert.ok(f.reads.every(x=>x.options.redirect==='error'));
});

test('overlapping cron invocations and repeat calls cannot create duplicates or spend twice',async()=>{
 const f=fixture();const results=await Promise.all([runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher}),runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})]);
 assert.deepEqual(results.map(x=>x.status).sort(),['already_attempted','draft_ready']);
 assert.equal((await runDailyContentDraft(f.env,{now:NOW+1000,fetcher:f.fetcher})).status,'already_attempted');
 assert.equal(f.calls.length,2);assert.equal(f.sqlite.prepare("SELECT count(*) n FROM knowledge_articles WHERE status='draft'").get().n,1);
});

test('a refused or unpermitted source yields an honest no-change receipt without inference',async()=>{
 for(const fetchMode of ['refused','unapproved']){const f=fixture({fetchMode});const result=await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher});assert.equal(result.status,'no_publishable_change');assert.equal(f.calls.length,0);assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'already_attempted');}
});

test('unsupported citations, changed canonical, missing sources and dose advice hold before review',async()=>{
 for(const change of [d=>{d.claims[0].source_urls=['https://example.com']},d=>{d.target_url=TARGET+'-new'},d=>{d.body=d.body.replace(PRIMARY,'https://example.com')},d=>{d.body+=' Stop your medication now.'},d=>{d.title='Clinically reviewed meal plan'}]){
  const body=draft();change(body);const f=fixture({response:body});assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'held');assert.equal(f.calls.length,1);assert.equal(f.sqlite.prepare("SELECT count(*) n FROM knowledge_articles WHERE status='draft'").get().n,0);
 }
});

test('independent reviewer holds partial and uncertain decisions',async()=>{
 for(const review of [{...pass(),claims_supported:false},{...pass(),issues:['unverified claim']},{decision:'PASS'},null]){
 const f=fixture({review});assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'held');assert.equal(f.calls.length,2);assert.equal(f.sqlite.prepare("SELECT count(*) n FROM knowledge_articles WHERE status='draft'").get().n,0);
 }
 assert.equal(reviewPass(pass()),true);assert.equal(reviewPass({decision:'PASS'}),false);
});

test('budget refusal is terminal for that day with no retry or direct provider fallback',async()=>{
 const f=fixture({modelError:true});assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'failed');assert.equal((await runDailyContentDraft(f.env,{now:NOW+1000,fetcher:f.fetcher})).status,'already_attempted');assert.equal(f.calls.length,1);
});

test('draft collision rolls back atomically and preserves the original private copy',async()=>{
 const f=fixture();f.sqlite.prepare("INSERT INTO knowledge_articles(title,slug,status,body) VALUES('Owner draft','internal-daily-2026-10-15','draft','owner copy')").run();
 assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'failed');
 assert.equal(f.sqlite.prepare("SELECT body FROM knowledge_articles WHERE slug='internal-daily-2026-10-15'").get().body,'owner copy');
 assert.equal(f.sqlite.prepare('SELECT article_id FROM knowledge_daily_content_runs').get().article_id,null);
});

test('unchanged text cannot be labelled a useful daily refresh',()=>{
 const d=draft();assert.ok(validateDraft(d,{url:TARGET,sources:[{url:PRIMARY,content:sourceText}],currentText:d.body}).includes('no_material_change'));
});

test('material drafted target is not automatically rewritten again the following day',async()=>{
 const f=fixture();assert.equal((await runDailyContentDraft(f.env,{now:NOW,fetcher:f.fetcher})).status,'draft_ready');assert.equal((await runDailyContentDraft(f.env,{now:NOW+86400000,fetcher:f.fetcher})).status,'no_publishable_change');assert.equal(f.calls.length,2);
});

