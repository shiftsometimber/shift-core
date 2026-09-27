import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARTICLE} from './editorial/public-bundle.mjs';
import {reviewEditorialArticle,canPublishEditorialArticle} from '../knowledge-editorial-v1.js';
import {assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';
assert.equal(process.env.GITHUB_EVENT_NAME,'push','Publication requires the authorised main push');
assert.equal(process.env.GITHUB_ACTOR_ID,'315011648','Publication requires the established owner actor');
await assertCurrentMain();
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
function query(sql,values=[]){
 let i=0;const command=sql.replace(/\?/g,()=>literal(values[i++]));assert.equal(i,values.length);
 const output=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});
 const result=JSON.parse(output);assert(Array.isArray(result)&&result.length&&result.every(r=>r.success!==false),'D1 command failed');return result[0];
}
const DB={prepare(sql){let values=[];return{bind(...v){values=v;return this},async first(){return query(sql,values).results?.[0]||null},async all(){return query(sql,values)},async run(){return query(sql,values)}}},async batch(statements){const out=[];for(const s of statements)out.push(await s.run());return out}};
const before=await DB.prepare('SELECT id,title,slug,author,summary,body,seo_title,status,publish_at FROM knowledge_articles WHERE slug=?').bind(ARTICLE.slug).first();
assert(before,'Approved article is missing');assert.equal(Number(before.id),2);assert(['draft','review','published'].includes(before.status));
for(const key of ['title','slug','author','summary','body'])assert.equal(before[key],ARTICLE[key],'Approved '+key+' differs from stored article');
assert.equal(before.seo_title,ARTICLE.seoTitle);
const bodySha256=createHash('sha256').update(before.body).digest('hex');
assert.equal(bodySha256,'7ea4ca06ff2fb5475f57b60a7a631785ec2c0c39b7c2429ee1be39ae5b7a8da7');
let approval=await canPublishEditorialArticle(DB,ARTICLE.slug);
if(before.status!=='published'||!approval.ok){
 await assertCurrentMain();
 const review=await reviewEditorialArticle(DB,2,{name:'Matt O’Brien'},{decision:'approved',notes:'Owner instruction “Publish” after approval of the SHIFT preview with named author, three images and corrected contrast. This records editorial approval only, not independent clinical review.'});
 assert.equal(review.ok,true);approval=await canPublishEditorialArticle(DB,ARTICLE.slug);assert.equal(approval.ok,true,'Existing editorial approval gate must pass');
 await assertCurrentMain();
 const publishedAt=new Date().toISOString();
 await DB.prepare("UPDATE knowledge_articles SET status='published',publish_at=COALESCE(publish_at,?),updated_at=? WHERE id=2 AND slug=? AND body=? AND author=? AND EXISTS(SELECT 1 FROM knowledge_article_reviews WHERE article_id=2 AND decision='approved')").bind(publishedAt,publishedAt,ARTICLE.slug,ARTICLE.body,ARTICLE.author).run();
}
const after=await DB.prepare('SELECT a.id,a.title,a.slug,a.author,a.body,a.status,a.publish_at,r.decision,r.reviewer_name FROM knowledge_articles a LEFT JOIN knowledge_article_reviews r ON r.article_id=a.id WHERE a.id=2').first();
assert.equal(after.status,'published');assert.equal(after.decision,'approved');assert.equal(after.body,ARTICLE.body);assert.equal(after.author,ARTICLE.author);assert(after.publish_at);
const proof={ok:true,url:ARTICLE.proposed_url,articleId:2,status:after.status,author:after.author,reviewedBy:after.reviewer_name,publishedAt:after.publish_at,bodySha256,previousStatus:before.status,workflowSha:process.env.GITHUB_SHA};
writeFileSync('babylove-publication-proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));
