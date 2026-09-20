import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARTICLE} from './oral-public.mjs';
import {assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';
assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');await assertCurrentMain();
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
const query=sql=>JSON.parse(execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:8e6,timeout:60000}));
const sha=s=>createHash('sha256').update(s).digest('hex');
const before=query("SELECT * FROM knowledge_articles WHERE slug='oral-semaglutide-for-weight-loss'; SELECT * FROM babylove_receipts WHERE slug='oral-semaglutide-for-weight-loss';");
const row=before[0].results[0],receipt=before[1].results[0];assert.equal(row.id,3);assert.equal(receipt.source_id,'875730');
assert.equal(receipt.payload_hash,'cc7a87c11df80b17c07744ac43a234b79a4a3d6606cd7a11a71cb7f906ba6f0d');
if(row.body!==ARTICLE.body){
 assert.equal(row.status,'draft');assert.equal(sha(row.body),'ce8dcb8451f735a9a2cdc9d0c26714bca9c1bda0e0df8dcbc74a76e851c72ae3');
 const time=new Date().toISOString();
 // One D1 transaction/file, preserving the complete original article and receipt.
 const sql=`CREATE TABLE IF NOT EXISTS babylove_editorial_backups(slug TEXT PRIMARY KEY,article_json TEXT NOT NULL,receipt_json TEXT NOT NULL,created_at TEXT NOT NULL);
 INSERT OR IGNORE INTO babylove_editorial_backups VALUES(${literal(ARTICLE.slug)},${literal(JSON.stringify(row))},${literal(JSON.stringify(receipt))},${literal(time)});
 INSERT INTO knowledge_article_reviews(article_id,decision,reviewer_name,notes,reviewed_at,updated_at) VALUES(3,'approved','Matt O’Brien — owner instruction','Owner asked to resolve this publication. Source-checked editorial correction; no clinical review claimed.',${literal(time)},${literal(time)}) ON CONFLICT(article_id) DO UPDATE SET decision=excluded.decision,reviewer_name=excluded.reviewer_name,notes=excluded.notes,reviewed_at=excluded.reviewed_at,updated_at=excluded.updated_at;
 UPDATE knowledge_articles SET title=${literal(ARTICLE.title)},author=${literal(ARTICLE.author)},summary=${literal(ARTICLE.summary)},body=${literal(ARTICLE.body)},seo_title=${literal(ARTICLE.seoTitle)},status='published',publish_at=${literal(time)},updated_at=${literal(time)} WHERE id=3 AND status='draft' AND body=${literal(row.body)};`;
 writeFileSync('babylove-proof/publication.sql',sql);await assertCurrentMain();
 execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--file','babylove-proof/publication.sql'],{stdio:'inherit',timeout:60000});
}
const after=query("SELECT id,title,author,status,body,publish_at FROM knowledge_articles WHERE id=3;")[0].results[0];assert.equal(after.body,ARTICLE.body);assert.equal(after.status,'published');assert.equal(after.author,ARTICLE.author);
writeFileSync('babylove-proof/publication.json',JSON.stringify({id:3,url:ARTICLE.proposed_url,status:after.status,publishedAt:after.publish_at,bodySha256:sha(after.body),originalRetained:true,sourceSha:process.env.GITHUB_SHA},null,2));
