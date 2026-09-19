import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const article=JSON.parse(fs.readFileSync('babylove/editorial/wegovy-cost-uk.json','utf8'));
const originalHash='94872cd6c75988c2f7213a4b0f250bfc6e922300365f6b72f9171ad05070e8c5';
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const literal=v=>v==null?'NULL':"'"+String(v).replaceAll("'","''")+"'";
const dir='babylove-draft-revision-proof';fs.mkdirSync(dir,{recursive:true});
function query(sql){
  const r=spawnSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:8*1024*1024});
  if(r.status!==0)throw new Error('D1 command failed; draft update not verified');
  const result=JSON.parse(r.stdout);if(result.some(x=>x.success===false))throw new Error('D1 query failed');return result;
}
if(article.slug!=='wegovy-cost-uk'||article.status!=='draft')throw new Error('Unexpected editorial target');
const select=`SELECT id,title,slug,category,author,status,summary,body,seo_title,publish_at,created_at,updated_at FROM knowledge_articles WHERE slug=${literal(article.slug)}`;
const before=query(select)[0].results;
if(before.length!==1||before[0].status!=='draft')throw new Error('Expected exactly one existing draft');
fs.writeFileSync(`${dir}/before.json`,JSON.stringify(before,null,2));
const old=before[0],newHash=hash(article.body);
if(![originalHash,newHash].includes(hash(old.body)))throw new Error('Article changed since editorial review; no write performed');
const expected={title:article.title,category:article.category,author:article.author,summary:article.summary,body:article.body,seo_title:article.seoTitle};
let changed=false;
if(Object.entries(expected).some(([k,v])=>old[k]!==v)){
  const guard=`id=${Number(old.id)} AND slug=${literal(article.slug)} AND status='draft' AND body=${literal(old.body)} AND updated_at IS ${literal(old.updated_at)}`;
  const sql=`UPDATE knowledge_articles SET ${Object.entries(expected).map(([k,v])=>`${k}=${literal(v)}`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE ${guard};`;
  const out=query(sql);if(out[0]?.meta?.changes!==1)throw new Error('Concurrent edit detected; expected one changed draft');changed=true;
}
const after=query(select)[0].results;
if(after.length!==1||after[0].status!=='draft'||after[0].publish_at!==old.publish_at||Object.entries(expected).some(([k,v])=>after[0][k]!==v))throw new Error('Draft verification mismatch');
fs.writeFileSync(`${dir}/after.json`,JSON.stringify(after,null,2));
const proof={checked_at:new Date().toISOString(),article_id:after[0].id,title:after[0].title,slug:after[0].slug,status:after[0].status,category:after[0].category,changed,previous_body_sha256:hash(old.body),revised_body_sha256:newHash,published:false,public_website_changed:false};
fs.writeFileSync(`${dir}/proof.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
