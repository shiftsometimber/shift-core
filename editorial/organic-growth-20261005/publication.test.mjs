import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import {articleHTML} from '../../babylove/dynamic-public.mjs';
import {SLUGS,buildApplySql,buildRollbackSql,validateDraft,checkPublicArticle,validateBaseline} from './publish.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,slug TEXT UNIQUE,title TEXT,seo_title TEXT,summary TEXT,body TEXT,updated_at TEXT,status TEXT,publish_at TEXT,author TEXT);CREATE TABLE babylove_receipts(source_id TEXT,slug TEXT,payload_hash TEXT,payload_json TEXT);');
 const before={articles:SLUGS.map((slug,i)=>({id:i+1,slug,title:'Old '+slug,seo_title:null,summary:'Original',body:"Original's body",updated_at:'2026-10-03 10:00:00',status:'published',publish_at:'2026-09-23T05:31:02.403Z',author:'SHIFT Team'})),receipts:SLUGS.map((slug,i)=>({source_id:String(i+1),slug,payload_hash:'original-hash',payload_json:'original receipt'}))};
 for(const row of before.articles)db.prepare('INSERT INTO knowledge_articles VALUES(?,?,?,?,?,?,?,?,?,?)').run(...Object.values(row));
 for(const row of before.receipts)db.prepare('INSERT INTO babylove_receipts VALUES(?,?,?,?)').run(...Object.values(row));
 db.exec("INSERT INTO knowledge_articles VALUES(999,'unrelated','Unrelated',NULL,NULL,'Do not touch',NULL,'published','2026-01-01','Matt')");
 const after=before.articles.map(row=>({...row,title:'Reviewed '+row.slug,seo_title:'Reviewed title',summary:'Reviewed summary',body:"Reviewed's text",updated_at:'2026-10-05T21:00:00.000Z'}));
 return {db,before,after};
}
const all=db=>db.prepare('SELECT * FROM knowledge_articles WHERE id<999 ORDER BY id').all().map(r=>({...r}));
test('atomic publication changes both exact selected rows and preserves receipts and unrelated content',()=>{
 const {db,before,after}=fixture();try{db.exec(buildApplySql(before,after));assert.deepEqual(all(db),after);assert.deepEqual(db.prepare('SELECT * FROM babylove_receipts ORDER BY source_id').all().map(r=>({...r})),before.receipts);assert.equal(db.prepare('SELECT body FROM knowledge_articles WHERE id=999').get().body,'Do not touch')}finally{db.close()}
});
test('a concurrent content or receipt change blocks the whole two-row publication',()=>{
 for(const change of ["UPDATE knowledge_articles SET body='Later editor' WHERE id=1","UPDATE babylove_receipts SET payload_hash='Changed receipt' WHERE source_id='1'"]){
  const {db,before,after}=fixture();try{db.exec(change);const existing=all(db);db.exec(buildApplySql(before,after));assert.deepEqual(all(db),existing)}finally{db.close()}
 }
});
test('owned rollback restores our exact rows and preserves a later editor',()=>{
 const {db,before,after}=fixture();try{db.exec(buildApplySql(before,after));db.exec("UPDATE knowledge_articles SET body='Newer accepted content' WHERE id=1");db.exec(buildRollbackSql(before,after));const now=all(db);assert.equal(now[0].body,'Newer accepted content');assert.equal(now[0].title,after[0].title);assert.deepEqual(now[1],before.articles[1]);}finally{db.close()}
});
test('draft metadata and rendered content retain the original canonical and publication date',()=>{
 for(const slug of SLUGS){
  const file=new URL('./'+slug+'.json',import.meta.url);assert(existsSync(file),'Reviewed article missing');
  const draft=JSON.parse(readFileSync(file,'utf8'));validateDraft(draft);
  const row={...draft,author:'SHIFT Team',publish_at:'2026-09-23T05:31:02.403Z',updated_at:'2026-10-05T21:00:00.000Z'};
  const result=checkPublicArticle(articleHTML(row),row);assert.equal(result.datePublished,row.publish_at);assert.equal(result.dateModified,row.updated_at);
  assert.throws(()=>checkPublicArticle(articleHTML({...row,body:row.body+'\n\nUnreviewed change.'}),row),/differs/);
 }
});
test('baseline refuses a newer source revision rather than overwriting it',()=>{
 const {db,before}=fixture();try{const baseline={articles:before.articles.map(r=>({slug:r.slug,expected_title:r.title,expected_seo_title:r.title,expected_summary:r.summary,expected_publish_at:r.publish_at,expected_modified_at:'2026-10-03T10:00:00.000Z'}))};validateBaseline(before,baseline);before.articles[0].updated_at='2026-10-05T20:00:00.000Z';assert.throws(()=>validateBaseline(before,baseline),/changed since inspected/);}finally{db.close()}
});
