// Read only already-public records. No clinical approvals or database writes.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const sql="SELECT a.id,a.title,a.slug,a.category,a.author,a.status,a.summary,a.body,a.seo_title,a.publish_at,r.decision FROM knowledge_articles a LEFT JOIN knowledge_article_reviews r ON r.article_id=a.id WHERE a.status='published' AND a.slug IN ('wegovy-cost-uk','oral-semaglutide-for-weight-loss','mounjaro-cost-uk'); SELECT e.id,e.headline,e.region,e.regulator,e.event_type,e.content_package_json,e.source_evidence_json,e.reviewed_at,e.updated_at,e.created_at,(SELECT MIN(created_at) FROM radar_audit WHERE event_id=e.id AND action='published') first_published_at FROM radar_events e WHERE e.status='published' AND json_extract(e.content_package_json,'$.seo.slug')='medicine-news/bolt-pharmacy-ads-banned-asa';";
const data=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:4e6}));
assert.equal(data.length,2);assert(data.every(result=>result.success));
const articles=data[0].results,news=data[1].results;
assert.equal(articles.length,3);assert.equal(news.length,1);
assert(articles.every(row=>row.publish_at&&row.status==='published'));
mkdirSync('babylove/generated',{recursive:true});
writeFileSync('babylove/generated/quality-fixtures.mjs','export const articles='+JSON.stringify(articles)+';\nexport const news='+JSON.stringify(news)+';\n');
console.log('Captured three published articles and one published newsroom record. Zero writes.');
