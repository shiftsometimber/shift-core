import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import hq from '../hq-ai-v2.js';
import {knowledgeEditorialRoutes} from '../knowledge-editorial-v1.js';

// Delegation-contract tests: the real legacy HQ role/session contract remains
// separately exercised by g3-006-knowledge-editorial-staging.mjs.
function fixture(t,{status=200}={}){
  const sqlite=new DatabaseSync(':memory:');
  t.after(()=>sqlite.close());
  sqlite.exec("CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,created_at TEXT,updated_at TEXT)");
  const content='<h2>Fictional exact draft</h2>\n<p>A & B; unchanged wording.</p>';
  sqlite.prepare('INSERT INTO knowledge_articles VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(7,'Fictional title','fixture','Nutrition','Fictional author','draft','Exact summary',content,'Exact SEO title',null,'2026-09-16','2026-09-16');
  const state={bodyReads:0,delegated:[]};
  const DB={
    prepare(sql){
      if(/SELECT.*\bbody\b/i.test(sql))state.bodyReads++;
      let args=[];
      return{bind(...values){args=values;return this},async run(){const r=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return{results:sqlite.prepare(sql).all(...args)}}};
    },
    async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}
  };
  const metadata={id:7,title:'Fictional title',status:'draft'};
  t.mock.method(hq,'fetch',async request=>{
    state.delegated.push({url:request.url,method:request.method,cookie:request.headers.get('cookie')});
    return Response.json(status===200?{articles:[metadata],retainedListField:true}:{ok:false,error:status===401?'authentication_required':'forbidden'},{status});
  });
  const call=query=>knowledgeEditorialRoutes(new Request('https://api.shiftsometimber.co.uk/v1/hq/articles'+query,{headers:{Origin:'https://hq.shiftsometimber.co.uk',Cookie:'fixture-marker-only'}}),{DB},{});
  return{sqlite,state,call,content,metadata};
}

test('authenticated article read returns the exact stored body and retained review',async t=>{
  const f=fixture(t);
  await f.call('');
  f.sqlite.prepare('INSERT INTO knowledge_article_reviews(article_id,decision,reviewer_name,reviewed_at) VALUES(?,?,?,?)').run(7,'changes_requested','Fictional reviewer','2026-09-16T12:00:00Z');
  const response=await f.call('?articleId=7'),body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.article.body,f.content);
  assert.equal(body.article.summary,'Exact summary');
  assert.equal(body.article.seo_title,'Exact SEO title');
  assert.equal(body.article.review.reviewer_name,'Fictional reviewer');
  assert.equal(body.article.review.decision,'changes_requested');
  assert.equal(f.state.bodyReads,1);
  assert.equal(f.state.delegated.at(-1).cookie,'fixture-marker-only');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'),'https://hq.shiftsometimber.co.uk');
});

for(const status of [401,403])test(`article body is never read after existing HQ returns ${status}`,async t=>{
  const f=fixture(t,{status}),response=await f.call('?articleId=7');
  assert.equal(response.status,status);
  assert.equal(f.state.bodyReads,0);
  assert.equal(f.state.delegated.length,1);
  assert.equal('article' in await response.json(),false);
});

test('invalid article identifiers cannot reach the body query',async t=>{
  const f=fixture(t);
  for(const id of ['', '0','-1','1.2','01','7 OR 1=1','9007199254740992']){
    const response=await f.call('?articleId='+encodeURIComponent(id));
    assert.equal(response.status,400,id);
    assert.equal((await response.json()).error,'invalid_article_id');
  }
  assert.equal(f.state.bodyReads,0);
});

test('missing article returns 404 after existing HQ authorization',async t=>{
  const f=fixture(t),response=await f.call('?articleId=8');
  assert.equal(response.status,404);
  assert.equal((await response.json()).error,'article_not_found');
  assert.equal(f.state.bodyReads,1);
});

test('ordinary list response remains metadata-only with its existing shape',async t=>{
  const f=fixture(t),response=await f.call('');
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{articles:[{...f.metadata,review:null}],retainedListField:true});
  assert.equal(f.state.bodyReads,0);
});
