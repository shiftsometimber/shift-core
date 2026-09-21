import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';

const ORIGINAL='d8f3e45edd5787756daa425cec05616874306493143ba9c3b0ce66718e1e4347';
const REVIEWED='ab4018ef1dd4ed6df07be62d1d712dcc3f2c8bd990600aee5380477e27d70662';
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
function query(sql,values=[]){let i=0;const command=sql.replace(/\?/g,()=>literal(values[i++]));assert.equal(i,values.length);const out=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',command],{encoding:'utf8',maxBuffer:10*1024*1024,timeout:60000});const result=JSON.parse(out);assert(Array.isArray(result)&&result.length&&result.every(r=>r.success!==false));return result[0]}
const first=(sql,values=[])=>query(sql,values).results?.[0]||null;
const receipt=first("SELECT source_id,slug FROM babylove_receipts WHERE source_id='876303' AND slug='mounjaro-cost-uk'");
assert.equal(receipt?.source_id,'876303','Trusted BabyLove receipt 876303 missing');
let article=first("SELECT id,title,slug,status,body,publish_at FROM knowledge_articles WHERE slug='mounjaro-cost-uk'");
assert.equal(Number(article?.id),4,'Unexpected article identity');
assert.equal(article?.title,'NICE List vs Private Prices: Mounjaro Cost in the UK');
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const beforeHash=hash(article.body);
assert([ORIGINAL,REVIEWED].includes(beforeHash),'Stored article differs from received/reviewed source; refusing overwrite');
const replacements=[
["The NHS route is free at the point of use but restricted to specialist Tier 3 weight-management services, so the majority of UK patients still pay privately.","NHS access avoids private treatment prices, although standard prescription charges can apply in England unless you are exempt. Access now includes specialist weight-management services and a phased primary-care rollout for people with the highest clinical need."],
["- NHS prescriptions are free through specialist Tier 3 services but involve long waits of 12 to 24 months and specific eligibility criteria.","- NHS access is available through specialist weight-management services and, for prioritised cohorts, primary care. Standard prescription charges can apply in England unless you are exempt, and local access varies."],
["The NHS route to Mounjaro is genuinely free at the point of use, but access runs through specialist Tier 3 weight-management services rather than your GP surgery directly. That's the single fact that explains why most UK patients end up paying privately, not because the NHS route is expensive, but because it's narrow.","NHS access to Mounjaro does not use private retail pricing, although standard prescription charges can apply in England unless you are exempt. Access is available through specialist weight-management services and is also being phased into primary care for prioritised cohorts, so the route depends on clinical eligibility and local commissioning."],
["3. **Expect a genuine wait.** GP practice guidance, including notes published by [Morecambe Surgery](https://www.morecambesurgery.nhs.uk/important-information-regarding-gp-prescribing-of-mounjaro-tirzepatide-for-weight-management/), points to waiting times often running from 12 to 24 months given current demand against capacity.","3. **Expect local variation.** NHS England is phasing access through specialist services and primary care, and availability depends on your local Integrated Care Board, service capacity and which priority cohort you fall into. Ask your GP or ICB what pathway is operating locally rather than relying on a national waiting-time estimate."],
["For a lot of men, that 12 to 24 month wait is the deciding factor. It's not that the NHS pathway is a bad option. It's that a wait measured in years doesn't help someone who wants to start addressing their weight now, which is precisely why the private market has grown so quickly. If you want a fuller picture of how the NHS pathway works in practice, the guide by Shift Some Timber to NHS access in England covers the referral routes in more detail.","For many men, the practical issue is whether they meet the current NHS criteria and how quickly their local pathway can assess them. Access varies by area and cohort, so check the current local route rather than assuming either immediate access or a fixed national wait. If you want a fuller picture of how the NHS pathway works in practice, the guide by Shift Some Timber to NHS access in England covers the referral routes in more detail."],
["4. **Verify the pharmacy's GPhC registration.** Every pharmacy dispensing prescription medicines in the UK must be registered with the General Pharmaceutical Council, and you can check this directly on the GPhC register before handing over any payment details.","4. **Verify the pharmacy's regulator.** In Great Britain, check the pharmacy on the General Pharmaceutical Council (GPhC) register; in Northern Ireland, check the Pharmaceutical Society of Northern Ireland (PSNI) register before handing over payment details."]
];
if(beforeHash===ORIGINAL){
 for(const [from,to] of replacements){const count=String(article.body).split(from).length-1;assert.equal(count,1,'Expected correction target missing or duplicated');article.body=article.body.replace(from,to)}
 assert.equal(hash(article.body),REVIEWED,'Reviewed body hash mismatch');
 query("UPDATE knowledge_articles SET body=?,status='published',publish_at=COALESCE(publish_at,?),updated_at=? WHERE id=4 AND slug='mounjaro-cost-uk'",[article.body,new Date().toISOString(),new Date().toISOString()]);
}else if(article.status!=='published'){
 query("UPDATE knowledge_articles SET status='published',publish_at=COALESCE(publish_at,?),updated_at=? WHERE id=4 AND slug='mounjaro-cost-uk'",[new Date().toISOString(),new Date().toISOString()]);
}
const after=first("SELECT id,title,slug,status,body,publish_at FROM knowledge_articles WHERE id=4");
assert.equal(after.status,'published');assert(after.publish_at);assert.equal(hash(after.body),REVIEWED);
mkdirSync('babylove-proof',{recursive:true});writeFileSync('babylove-proof/mounjaro-876303-live.json',JSON.stringify({ok:true,sourceId:'876303',articleId:4,slug:after.slug,status:after.status,publishAt:after.publish_at,beforeHash,bodySha256:hash(after.body),workflowSha:process.env.GITHUB_SHA},null,2)+'\n');
console.log(JSON.stringify({ok:true,articleId:4,status:after.status,publishAt:after.publish_at,bodySha256:hash(after.body)},null,2));
