// Read-only connectivity diagnostic. No member account, model call or API key.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {shiftResearch} from '../../member-experience/ai-research.mjs';
const sql=new DatabaseSync(':memory:'),calls=[];
const DB={exec:async query=>sql.exec(query),prepare(query){assert(!/\b(users|user_sessions|member_state|consents)\b/.test(query));let values=[];return{bind(...next){values=next;return this},first:async()=>sql.prepare(query).get(...values)||null,run:async()=>({meta:{changes:Number(sql.prepare(query).run(...values).changes)}})}}};
try{
 const result=await shiftResearch({DB,AI:{run(){throw Error('research must not infer')}},SHIFT_AI_RESEARCH_FETCH:async(url,options)=>{assert.equal(new URL(url).hostname,'eutils.ncbi.nlm.nih.gov');assert.equal(options.redirect,'error');calls.push(url);return fetch(url,options)}},'Find research about protein',{type:'review'});
 const papers=result.sources.filter(source=>source.pmid);
 console.log(JSON.stringify({status:result.research.status,requests:calls.length,topic:result.research.topic,checkedAt:result.research.checkedAt,papers:papers.map(({pmid,publishedAt,evidenceType})=>({pmid,publishedAt,evidenceType})),journeyUsed:result.journeyUsed}));
 assert.equal(result.research.status,'live','Public index unavailable from this runner; UK guidance fallback remains available');
 assert(papers.length>0,'The public protein-review query should return real references');
 assert.equal(calls.length,2);assert.equal(result.journeyUsed,false);
}finally{sql.close()}
