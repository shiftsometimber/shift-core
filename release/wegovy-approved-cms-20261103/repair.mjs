import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {prepareCorrection,sha256,slug,changes} from './article-correction-20261103.mjs';
const dir='wegovy-cms-proof', file=n=>dir+'/'+n;
mkdirSync(dir,{recursive:true});
const mode=process.argv[2]; assert(['capture','apply','verify','rollback'].includes(mode));
const sqlValue=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
function query(sql,values=[]){
 let i=0;const command=sql.replace(/\?/g,()=>sqlValue(values[i++]));assert.equal(i,values.length);
 const raw=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:5e6,timeout:90000});
 const data=JSON.parse(raw);assert(Array.isArray(data)&&data.length&&data.every(x=>x.success!==false));return data[0];
}
const read=()=>query("SELECT a.id,a.slug,a.title,a.status,a.author,a.category,a.summary,a.body,a.seo_title,a.publish_at,a.updated_at,b.source_id FROM knowledge_articles a JOIN babylove_receipts b ON b.slug=a.slug WHERE a.slug=?",[slug]).results[0];
const save=(name,obj)=>writeFileSync(file(name),JSON.stringify(obj,null,2)+'\n');
const load=name=>JSON.parse(readFileSync(file(name),'utf8'));
function currentMain(){assert.equal(execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8',timeout:30000}).trim().split(/\s+/)[0],process.env.APPROVED_BASE_SHA,'Current main moved; refuse mutation');}
async function publicPage(){
 const r=await fetch('https://shiftsometimber.co.uk/articles/'+slug,{redirect:'error',headers:{'Cache-Control':'no-cache','User-Agent':'SHIFT-Approved-Article-Correction/1.0'},signal:AbortSignal.timeout(30000)});
 const html=await r.text();assert.equal(r.status,200);assert.equal(r.headers.get('x-shift-article-source'),'babylovegrowth');
 return {html,status:r.status,headers:Object.fromEntries(['x-shift-article-source','x-robots-tag','content-security-policy','strict-transport-security','x-frame-options'].map(k=>[k,r.headers.get(k)]))};
}
if(mode==='capture'){
 currentMain();
 const before=read();assert(before);assert.notEqual(before.source_id,'shift-contributor');
 assert.equal(before.publish_at,'2026-11-02T05:02:38.522Z');
 const page=await publicPage();assert(page.html.includes(changes[2][0]));
 const plan=prepareCorrection(before,sha256(before.body),new Date().toISOString());
 save('before.json',before);save('plan.json',plan);
 writeFileSync(file('before.html'),page.html);save('before-http.json',{...page,html:undefined,sha256:sha256(page.html)});
 // Only public article metadata: no private member records, journal mutations or retries.
 const receipts=query("SELECT a.id,a.slug,a.status,a.author,a.publish_at,a.updated_at,b.source_id,b.created_at receipt_created_at FROM knowledge_articles a LEFT JOIN babylove_receipts b ON b.slug=a.slug WHERE (julianday(a.publish_at)>=julianday('2026-11-02T00:00:00Z') AND julianday(a.publish_at)<julianday('2026-11-03T00:00:00Z')) OR (julianday(b.created_at)>=julianday('2026-11-02T00:00:00Z') AND julianday(b.created_at)<julianday('2026-11-03T00:00:00Z')) ORDER BY a.publish_at,a.id").results;
 save('november-2-publication-metadata.json',receipts);
 console.log(JSON.stringify({captured:true,id:before.id,beforeBodySha256:plan.beforeBodySha256,afterBodySha256:plan.afterBodySha256,publicationMetadata:receipts}));
}
if(mode==='apply'){
 currentMain();const p=load('plan.json'),actual=read();assert.deepEqual(actual,p.before,'Article changed since capture');
 const result=query(p.update.sql,p.update.values);assert.equal(Number(result.meta?.changes||0),1,'Not exactly one owned row');
 save('applied.json',{at:new Date().toISOString(),id:actual.id,afterBodySha256:p.afterBodySha256,updated_at:p.after.updated_at,run:process.env.GITHUB_RUN_ID});
 console.log(JSON.stringify({applied:true,id:actual.id,run:process.env.GITHUB_RUN_ID}));
}
if(mode==='verify'){
 const p=load('plan.json'),a=read();assert.deepEqual(a,p.after,'Database readback differs');
 const page=await publicPage(),b=page.html;
 assert(b.includes('SHIFT does not currently provide or book prescribing.'));
 for(const [from,to] of changes){assert(!b.includes(from));assert(b.includes(to));}
 assert(!/<blockquote>[\s\S]*?Matt O[’']Brien[\s\S]*?<\/blockquote>/i.test(b));
 assert.equal((b.match(/<link\b[^>]*rel=["']canonical["']/gi)||[]).length,1);
 assert(b.includes('https://shiftsometimber.co.uk/articles/'+slug));
 assert(/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*index,follow/i.test(b));
 assert(!/\bnoindex\b/i.test(page.headers['x-robots-tag']||''));
 for(const k of ['content-security-policy','strict-transport-security','x-frame-options'])assert(page.headers[k],k+' missing');
 const schemas=[...b.matchAll(/<script\b(?=[^>]*type\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
 const article=schemas.find(x=>x['@type']==='Article');assert(article);
 assert.equal(article.datePublished,p.before.publish_at);assert.equal(article.dateModified,p.after.updated_at);
 assert.equal(article.author.name,p.before.author);
 const receipt={ok:true,verifiedAt:new Date().toISOString(),url:'https://shiftsometimber.co.uk/articles/'+slug,id:a.id,source:page.headers['x-shift-article-source'],publishAt:a.publish_at,modifiedAt:a.updated_at,beforeBodySha256:p.beforeBodySha256,afterBodySha256:p.afterBodySha256,htmlSha256:sha256(b),headers:page.headers,run:process.env.GITHUB_RUN_ID,workerRuntimeChanged:false};
 save('live-verification.json',receipt);writeFileSync(file('after.html'),b);console.log(JSON.stringify(receipt));
}
if(mode==='rollback'){
 if(!existsSync(file('applied.json'))){console.log('No owned mutation; no rollback needed.');process.exit(0);}
 const p=load('plan.json'),a=read();assert.deepEqual(a,p.after,'New owner changed row; refuse rollback');
 const r=query("UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND body=? AND updated_at=? AND publish_at=? AND author=?",[p.before.body,p.before.updated_at,a.id,slug,p.after.body,p.after.updated_at,p.before.publish_at,p.before.author]);
 assert.equal(Number(r.meta?.changes||0),1);assert.deepEqual(read(),p.before);save('rollback.json',{restored:true,at:new Date().toISOString()});console.log('Owned correction rolled back to exact captured row.');
}
