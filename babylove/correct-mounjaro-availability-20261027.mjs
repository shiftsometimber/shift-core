import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';

const ID=44;
const SLUG='what-to-eat-on-mounjaro';
const BEFORE='ab0c88fc1b1467d5fff08a8510a098e0c67738a4451557ae6cd75b5426e67b1e';
const FROM='If you are thinking about treatment, or already on it and want practical backup, SHIFT brings treatment information together with food ideas, achievable movement and check-ins. You can read about [weight-management medication](https://shiftsometimber.co.uk/treatments/medication) and how clinical assessment and prescribing work through regulated partners, or see how it all fits in our [Mounjaro for men guide](https://shiftsometimber.co.uk/mounjaro). Before any appointment, our [weight-management review questions](https://shiftsometimber.co.uk/tools/weight-management-review) help you know what to ask.';
const TO='If you are thinking about treatment, or already on it and want practical backup, SHIFT brings together general treatment information, food ideas, achievable movement and check-ins. SHIFT does not currently provide or book prescribing. You can read general information about [weight-management medication](https://shiftsometimber.co.uk/treatments/medication) and how clinical assessment and prescribing should work, or see how it all fits in our [Mounjaro for men guide](https://shiftsometimber.co.uk/mounjaro). Before any appointment, our [weight-management review questions](https://shiftsometimber.co.uk/tools/weight-management-review) help you know what to ask.';
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
function query(sql,values=[]){let i=0;const command=sql.replace(/\?/g,()=>literal(values[i++]));assert.equal(i,values.length);const out=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:12*1024*1024,timeout:60000});const result=JSON.parse(out);assert(Array.isArray(result)&&result.length&&result.every(x=>x.success!==false));return result[0];}
const first=(sql,values=[])=>query(sql,values).results?.[0]||null;
const mode=process.argv[2]||'--check';
assert(['--check','--apply'].includes(mode));
const before=first('SELECT id,slug,title,status,body,publish_at,updated_at FROM knowledge_articles WHERE id=? AND slug=?',[ID,SLUG]);
assert.equal(Number(before?.id),ID);assert.equal(before.slug,SLUG);assert.equal(before.status,'published');assert(before.publish_at);
const beforeHash=hash(before.body);
assert.equal(beforeHash,BEFORE,'Live article changed; refusing stale correction');
assert.equal(before.body.split(FROM).length-1,1,'Availability sentence missing or duplicated');
const corrected=before.body.replace(FROM,TO);
assert(!corrected.includes('prescribing work through regulated partners'));
assert(corrected.includes('SHIFT does not currently provide or book prescribing.'));
const afterHash=hash(corrected);
if(mode==='--apply'){
 const stamp=new Date().toISOString();
 const result=query("UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=?",[corrected,stamp,ID,SLUG,before.body]);
 assert.equal(Number(result.meta?.changes||0),1,'Guarded update did not change exactly one row');
}
const after=mode==='--apply'?first('SELECT id,slug,status,body,publish_at,updated_at FROM knowledge_articles WHERE id=? AND slug=?',[ID,SLUG]):{...before,body:corrected};
assert.equal(hash(after.body),afterHash);assert.equal(after.publish_at,before.publish_at);
mkdirSync('nightly-article-proof',{recursive:true});
writeFileSync('nightly-article-proof/mounjaro-availability-correction.json',JSON.stringify({ok:true,mode,id:ID,slug:SLUG,publish_at:after.publish_at,before_hash:beforeHash,after_hash:afterHash,updated_at:after.updated_at,clinical_safety_wording_changed:false},null,2)+'\n');
console.log(JSON.stringify({ok:true,mode,id:ID,slug:SLUG,beforeHash,afterHash,publishAt:after.publish_at}));
