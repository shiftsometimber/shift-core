import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,realpathSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const ARTICLE_ID=47;
export const SLUG='mounjaro-injection-sites';
export const BEFORE_SHA256='d428afced2d44764335641f9e4bf46fa00c3190dc23b69af38c18a99214441d2';

export const FROM_ROUTINE=`## Our view: the site matters less than the routine

We started SHIFT because plenty of men tell us the same thing. They're given a pen, a leaflet and a few minutes of explanation, and then they're left to get on with it. The injection itself is rarely the hard part. The hard part is the routine around it: remembering the day, rotating the spot, knowing what to do when a week goes sideways.

![Our view: the site matters less than the routine — overview diagram](https://media.babylovegrowth.ai/blog-images/organization-55073/1793074986094_Our-view-the-site-matters-less-than-the-routine-overview-diagram.jpeg)

So our advice is boring on purpose. Pick the stomach or thigh. Rotate in a pattern you'll actually follow. Write it down. Read the Instructions for Use once properly, not just when something breaks. And keep your prescriber in the loop, because dose changes belong to them.

We'd also say this. Where you inject won't decide how well treatment goes. What you eat, how you move and whether you've got someone in your corner will matter far more. That's why we built The Programme around food (Grub), movement (Fit), goals (Life Back) and check-ins (My Timber), not around the needle.

> *— Matt O’Brien*`;

export const TO_ROUTINE=`## Our view: make the routine easy to repeat

The current UK product information says to use the abdomen or thigh, or for another person to inject the back of the upper arm, and to rotate the site with each dose. The practical priority is to use an approved site and follow the current Instructions for Use.

A simple note of the day and site can help you avoid using the same spot repeatedly. Food, movement and support still matter to the wider treatment journey, but they do not change the injection instructions or replace advice from your prescriber.`;

export const FROM_AVAILABILITY=`SHIFT is a UK men's health and weight management business. We bring treatment information together with practical support, whether you're thinking about GLP-1 treatment, already using it, started elsewhere or want to stop. Clinical assessment, prescribing and dispensing are handled by appropriately regulated partners, and we're there for the everyday side: food ideas, achievable exercise, tracking and keeping progress going.`;

export const TO_AVAILABILITY=`SHIFT provides general treatment information and practical support around food, movement, tracking and routines. SHIFT does not currently provide or book prescribing, dispensing or treatment. For medicine advice, contact your prescriber, pharmacist or another appropriately regulated healthcare professional.`;

export const FROM_MISSED=`Per the South Yorkshire NHS guideline, if you miss a dose, [take it within four days](https://mot.southyorkshire.icb.nhs.uk/south-yorkshire/files/South%20Yorkshire%20Guideline%20Tirzepatide%20weight%20management.pdf). If more than four days have passed, skip it and take your next dose on your usual day.`;

export const TO_MISSED=`The current UK product information says that, if you miss a dose, you should [take it within four days](https://www.medicines.org.uk/emc/product/15482/smpc). If more than four days have passed, skip it and take your next dose on the usual day. It also says the weekly administration day can be changed if necessary, provided there are at least three days between two doses.`;

const hash=value=>createHash('sha256').update(String(value)).digest('hex');
const count=(body,needle)=>body.split(needle).length-1;

export function correctedBody(body,{expectedHash=BEFORE_SHA256}={}){
 assert.equal(hash(body),expectedHash,'Live article changed; refusing stale correction');
 for(const [name,from] of [['routine',FROM_ROUTINE],['availability',FROM_AVAILABILITY],['missed-dose',FROM_MISSED]])assert.equal(count(body,from),1,name+' copy missing or duplicated');
 const corrected=body.replace(FROM_ROUTINE,TO_ROUTINE).replace(FROM_AVAILABILITY,TO_AVAILABILITY).replace(FROM_MISSED,TO_MISSED);
 assert(!corrected.includes('Clinical assessment, prescribing and dispensing are handled by appropriately regulated partners'));
 assert(!corrected.includes('Where you inject won\'t decide how well treatment goes'));
 assert(!corrected.includes('— Matt O’Brien'));
 assert(corrected.includes('SHIFT does not currently provide or book prescribing, dispensing or treatment.'));
 assert(corrected.includes('at least three days between two doses.'));
 return corrected;
}

const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'" + String(value).replace(/'/g,"''") + "'";
function query(sql,values=[]){
 let i=0;const command=sql.replace(/\?/g,()=>literal(values[i++]));assert.equal(i,values.length);
 const out=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:16*1024*1024,timeout:60000});
 const result=JSON.parse(out);assert(Array.isArray(result)&&result.length&&result.every(x=>x.success!==false));return result[0];
}
const first=(sql,values=[])=>query(sql,values).results?.[0]||null;

async function main(){
 const mode=process.argv[2]||'--check';assert(['--check','--apply'].includes(mode));
 const before=first('SELECT id,slug,title,status,body,publish_at,updated_at FROM knowledge_articles WHERE id=? AND slug=?',[ARTICLE_ID,SLUG]);
 assert.equal(Number(before?.id),ARTICLE_ID);assert.equal(before.slug,SLUG);assert.equal(before.status,'published');assert(before.publish_at);
 const corrected=correctedBody(before.body),afterHash=hash(corrected);
 if(mode==='--apply'){
  assert.equal(process.env.MATT_APPROVED_COPY_SHA256,afterHash,'Exact public copy approval hash missing');
  assert.equal(process.env.QUALIFIED_CLINICAL_REVIEW_SHA256,afterHash,'Qualified clinical review hash missing');
  const stamp=new Date().toISOString();
  const result=query("UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=?",[corrected,stamp,ARTICLE_ID,SLUG,before.body]);
  assert.equal(Number(result.meta?.changes||0),1,'Guarded update did not change exactly one row');
 }
 const after=mode==='--apply'?first('SELECT id,slug,status,body,publish_at,updated_at FROM knowledge_articles WHERE id=? AND slug=?',[ARTICLE_ID,SLUG]):{...before,body:corrected};
 assert.equal(hash(after.body),afterHash);assert.equal(after.publish_at,before.publish_at);
 const proofDir=process.env.PROOF_DIR||'nightly-article-proof';
 mkdirSync(proofDir,{recursive:true});
 writeFileSync(proofDir+'/mounjaro-injection-sites-correction.json',JSON.stringify({ok:true,mode,id:ARTICLE_ID,slug:SLUG,publish_at:after.publish_at,before_sha256:BEFORE_SHA256,after_sha256:afterHash,updated_at:after.updated_at,copy_approval_required:true,qualified_clinical_review_required:true},null,2)+'\n');
 console.log(JSON.stringify({ok:true,mode,id:ARTICLE_ID,slug:SLUG,beforeSha256:BEFORE_SHA256,afterSha256:afterHash,publishAt:after.publish_at}));
}
if(process.argv[1]&&pathToFileURL(realpathSync(process.argv[1])).href===import.meta.url)await main();
