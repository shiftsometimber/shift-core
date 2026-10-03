import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';

const ARTICLE_ID=16;
const SLUG='evidence-based-weight-loss';
const TITLE='7 Steps to Evidence Based Weight Loss in the UK With NHS Guidance';
const ORIGINAL='04b5dce3f8fca147eb7f8be86456a59d9c6b2d506ec24b52ccd6bbd70665a5b1';
const REVIEWED='715dca2644ea45d3a5a8cd1f6ee5f1fee2e20c3b0b2cae154d138feffbe624bd';
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";

function query(sql,values=[]){
  let i=0;
  const command=sql.replace(/\?/g,()=>literal(values[i++]));
  assert.equal(i,values.length);
  const out=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:10*1024*1024,timeout:60000});
  const result=JSON.parse(out);
  assert(Array.isArray(result)&&result.length&&result.every(r=>r.success!==false));
  return result[0];
}
const first=(sql,values=[])=>query(sql,values).results?.[0]||null;

export function repairEvidenceArticle(input){
  let body=String(input);
  const replacements=[
    ["Monitoring matters too. [NICE's technology appraisal for tirzepatide](https://www.nice.org.uk/guidance/TA1026/chapter/1-recommendations) sets out review schedules and wraparound support requirements, and many pathways apply a 6-month checkpoint: if a patient hasn't lost at least 5% of their starting weight by then, continuing the medicine is reconsidered. Funded treatment duration is typically time-limited rather than indefinite.","Monitoring matters too. [NICE's technology appraisal for tirzepatide](https://www.nice.org.uk/guidance/TA1026/chapter/1-recommendations) says that, after 6 months on the highest tolerated dose, clinicians should use the benefits and risks to decide whether to continue treatment if less than 5% of starting weight has been lost. Access and treatment duration depend on the commissioned pathway and an individual's clinical circumstances."],
    ["Where medicines fit, they're offered only within clinical assessment and monitoring pathways, never as a standalone purchase. SHIFT also sets out how NHS and private routes compare so men can make an informed choice. Plenty of men succeed with lifestyle support alone; others benefit from structured clinical input alongside it.","SHIFT's medicine-ordering pathway is currently closed while a prescribing partner is being commissioned. The site continues to provide general information about NHS and private routes, but it does not currently sell or arrange weight-loss medicines. Lifestyle support remains available through My Timber."],
    ["Where supplements come into the picture, they should support, not replace, food quality: a protein or fibre supplement such as Kikaboni's weight management stack might fill a gap in a busy day, but it isn't a substitute for the dietary basics above.","Supplements are not required for weight loss and should not replace a varied diet. If food alone is not meeting your needs, ask a qualified healthcare professional or dietitian whether a specific supplement is appropriate for you."],
    ["If you want structured support rather than figuring this out alone, SHIFT Some Timber combines lifestyle guidance with clinically governed medical options where appropriate, including medicines for those who meet the criteria.","If you want structured lifestyle support rather than figuring this out alone, My Timber brings together food, movement, goals and tracking. SHIFT's medicine-ordering pathway remains closed while a prescribing partner is being commissioned."],
    ["- Clinical assessment and monitoring sit behind any medication route, never a standalone sale.","- General medicine information remains available, but SHIFT does not currently sell or arrange weight-loss medicines."],
    ["- Support continues whether you're starting fresh, switching from elsewhere, or coming off medication.","- Lifestyle support is available whether you're starting fresh or maintaining changes after previous treatment."],
    ["Visit the [Weight-Loss Decision Centre](https://shiftsometimber.co.uk/decision-centre) to see which pathway fits your situation and book a consultation.","Visit the [Weight-Loss Decision Centre](https://shiftsometimber.co.uk/decision-centre) for general information about available support and the differences between NHS and private routes."]
  ];
  for(const [from,to] of replacements){
    const count=body.split(from).length-1;
    assert.equal(count,1,'Expected correction target missing or duplicated: '+from.slice(0,80));
    body=body.replace(from,to);
  }
  assert.equal(hash(body),REVIEWED,'Reviewed article body hash mismatch');
  for(const banned of ['Kikaboni','book a consultation','including medicines for those who meet the criteria',"they're offered only within clinical assessment"]){
    assert(!body.includes(banned),'Disallowed wording remains: '+banned);
  }
  return body;
}

function run(){
  const mode=process.argv[2]||'--check';
  assert(['--check','--apply'].includes(mode),'Use --check or --apply');
  let article=first('SELECT id,title,slug,status,body,publish_at FROM knowledge_articles WHERE id=? AND slug=?',[ARTICLE_ID,SLUG]);
  assert.equal(Number(article?.id),ARTICLE_ID,'Unexpected article identity');
  assert.equal(article?.title,TITLE,'Unexpected article title');
  assert.equal(article?.status,'published','Article is not published');
  assert(article?.publish_at,'Article publication date is missing');
  const beforeHash=hash(article.body);
  assert([ORIGINAL,REVIEWED].includes(beforeHash),'Stored article differs from reviewed source; refusing overwrite');
  if(beforeHash===ORIGINAL){
    const reviewed=repairEvidenceArticle(article.body);
    if(mode==='--apply')query('UPDATE knowledge_articles SET body=? WHERE id=? AND slug=? AND status=\'published\' AND body=?',[reviewed,ARTICLE_ID,SLUG,article.body]);
  }
  const after=mode==='--apply'?first('SELECT id,title,slug,status,body,publish_at FROM knowledge_articles WHERE id=? AND slug=?',[ARTICLE_ID,SLUG]):{...article,body:beforeHash===ORIGINAL?repairEvidenceArticle(article.body):article.body};
  assert.equal(after.status,'published');
  assert.equal(hash(after.body),REVIEWED);
  assert.equal(after.publish_at,article.publish_at,'Publication date changed unexpectedly');
  mkdirSync('babylove-proof',{recursive:true});
  writeFileSync('babylove-proof/evidence-based-article-repair.json',JSON.stringify({ok:true,mode,articleId:ARTICLE_ID,slug:SLUG,publishAt:after.publish_at,beforeHash,bodySha256:hash(after.body),workflowSha:process.env.GITHUB_SHA||null},null,2)+'\n');
  console.log(JSON.stringify({ok:true,mode,articleId:ARTICLE_ID,slug:SLUG,publishAt:after.publish_at,beforeHash,bodySha256:hash(after.body)},null,2));
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)run();
