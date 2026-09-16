import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {listEditorialArticles,reviewEditorialArticle,canPublishEditorialArticle} from '../knowledge-editorial-v1.js';

// D1 exec submits each newline-separated string as its own SQL query. Ordinary
// node:sqlite exec accepts multiline statements and masked this production bug.
// Contract: https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/d1-api.ts
function database(){
  const sqlite=new DatabaseSync(':memory:');
  const DB={
    sqlite,
    async exec(query){for(const line of query.trim().split('\n'))sqlite.exec(line);return{success:true}},
    prepare(sql){
      const args=[];
      return{
        bind(...values){args.push(...values);return this},
        async run(){const result=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(result.changes)}}},
        async first(){return sqlite.prepare(sql).get(...args)||null},
        async all(){return{success:true,results:sqlite.prepare(sql).all(...args)}}
      };
    },
    async batch(statements){
      sqlite.exec('BEGIN');
      try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}
      catch(error){sqlite.exec('ROLLBACK');throw error}
    }
  };
  return DB;
}

test('editorial list initializes its review schema through D1-compatible statements',async()=>{
  const DB=database();
  try{
    assert.deepEqual(await listEditorialArticles(DB,[{id:1,title:'Fictional draft'}]),[{id:1,title:'Fictional draft',review:null}]);
    assert.equal(DB.sqlite.prepare("SELECT count(*) n FROM sqlite_master WHERE name IN ('knowledge_article_reviews','idx_knowledge_article_reviews_decision')").get().n,2);
    assert.deepEqual(await listEditorialArticles(DB,[]),[]);
  }finally{DB.sqlite.close()}
});

test('review schema initialization preserves retained approval and rejects an unreviewed draft',async()=>{
  const DB=database();
  try{
    DB.sqlite.exec("CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT,status TEXT,updated_at TEXT); INSERT INTO knowledge_articles VALUES(1,'Fictional approved draft','fictional-reviewed','draft',NULL),(2,'Fictional unreviewed draft','fictional-unreviewed','draft',NULL)");
    assert.equal((await canPublishEditorialArticle(DB,'fictional-reviewed')).ok,false);
    const review=await reviewEditorialArticle(DB,1,{id:100,name:'Fictional reviewer',email:'editor@example.invalid'},{decision:'approved',notes:'Synthetic regression evidence only.'});
    assert.equal(review.ok,true);
    const listed=await listEditorialArticles(DB,[{id:1},{id:2}]);
    assert.equal(listed[0].review.reviewer_name,'Fictional reviewer');
    assert.equal(listed[0].review.notes,'Synthetic regression evidence only.');
    assert.equal(listed[1].review,null);
    assert.equal((await canPublishEditorialArticle(DB,'fictional-reviewed')).ok,true);
    assert.equal((await canPublishEditorialArticle(DB,'fictional-unreviewed')).ok,false);
    assert.equal(DB.sqlite.prepare('SELECT status FROM knowledge_articles WHERE id=1').get().status,'review');
  }finally{DB.sqlite.close()}
});
