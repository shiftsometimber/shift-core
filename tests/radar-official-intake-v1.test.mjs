import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {officialIntakeAuthority,officialIntakeDate,officialIntakeRelevant} from '../radar-official-intake-v1.js';
test('only the exact official authorities and document paths receive authority evidence',()=>{
 assert.equal(officialIntakeAuthority('https://www.gov.uk/drug-safety-update/yellow-card'),'MHRA');
 assert.equal(officialIntakeAuthority('https://hansard.parliament.uk/Commons/2026-10-26/debates/id/ProstateCancerScreening'),'UK Parliament');
 assert.equal(officialIntakeAuthority('https://commonslibrary.parliament.uk/research-briefings/cbp-12230/'),'House of Commons Library');
 for(const url of ['https://www.gov.uk.evil.test/drug-safety-update/yellow','https://www.gov.uk@evil.test/drug-safety-update/yellow','https://user:pass@www.gov.uk/drug-safety-update/yellow','http://www.gov.uk/drug-safety-update/yellow','https://www.gov.uk:8443/drug-safety-update/yellow','https://www.gov.uk/irrelevant','https://example.test/prostate'])assert.equal(officialIntakeAuthority(url),null,url);
});
test('official publication dates must be valid and present in the fetched source',()=>{
 assert.equal(officialIntakeDate('<time>26 October 2026</time>','2026-10-26'),'2026-10-26');
 assert.equal(officialIntakeDate('<time datetime="2026-10-26">Today</time>','2026-10-26'),'2026-10-26');
 for(const date of ['2026-02-30','tomorrow','2026-10-25',''])assert.throws(()=>officialIntakeDate('26 October 2026',date));
});
test('official men’s health and reporting topics pass relevance without making unrelated sources authoritative',()=>{
 assert(officialIntakeRelevant('UK Parliament','Prostate Cancer Screening',''));
 assert(officialIntakeRelevant('MHRA','MedSafetyWeek and Yellow Card',''));
 assert(!officialIntakeRelevant(null,'Prostate Cancer Screening',''));
 assert(!officialIntakeRelevant('MHRA','Tourism statistics',''));
});
const source=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('async function intakeUrl('),source.indexOf('\nfunction publicSourceChange',source.indexOf('async function intakeUrl(')));
async function exercise(url,{prepare=false,date='2026-10-26',title='Prostate Cancer Screening'}={}){
 const rows=[],queries=[];let calls=0,preparation=null;
 const DB={prepare(sql){queries.push(sql);let values=[];return{bind(...v){values=v;return this},async run(){if(sql.startsWith('INSERT OR IGNORE'))rows.push({id:1,event_key:values[0],status:values[1],source_evidence_json:values[11],verification_json:values[12]});return{meta:{changes:1}}},async first(){return rows[0]}}}};
 const fn=vm.runInNewContext(code+';intakeUrl',{URL,Date,JSON,AbortSignal,officialIntakeAuthority,officialIntakeDate,officialIntakeRelevant,RELEVANT_RADAR:/weight loss/i,safeIntakeUrl:u=>new URL(u),htmlText:s=>String(s).replace(/<[^>]+>/g,' '),read:async()=>({url,source_date:date,region:'UK',prepare}),j:(x,status)=>({body:x,status}),iso:()=>new Date().toISOString(),sha:async()=>url,verifyEvidence:e=>({verified:e.some(x=>x.source_tier===1)}),audit:async()=>{},decodeEvent:x=>x,fetch:async()=>{calls++;return{ok:true,url,text:async()=>'<title>'+title+'</title><time>26 October 2026</time>'}},preparePackages:async(env)=>{preparation=env;return{ok:true}}});
 const result=await fn({}, {DB,RADAR_AUTO_NEWS_ENABLED:'true'}, {email:'local-fixture@example.test'});
 return{result,rows,calls,preparation,queries};
}
test('owner intake creates a verified official review event without AI preparation or publication',async()=>{
 const r=await exercise('https://hansard.parliament.uk/Commons/2026-10-26/debates/id/ProstateCancerScreening');
 assert.equal(r.result.status,201);assert.equal(r.rows[0].status,'verified');assert.equal(JSON.parse(r.rows[0].source_evidence_json)[0].source_tier,1);assert.equal(r.preparation,null);assert.equal(r.calls,1);assert(r.queries.every(q=>!q.includes('radar_publication_jobs')));
});
test('ordinary submitted links remain unverified; claimed dates are never silently accepted for official sources',async()=>{
 const ordinary=await exercise('https://example.test/weight-loss',{title:'New weight loss research'});assert.equal(ordinary.result.status,201);assert.equal(ordinary.rows[0].status,'needs_more_evidence');assert.equal(JSON.parse(ordinary.rows[0].source_evidence_json)[0].source_tier,4);
 const wrong=await exercise('https://www.gov.uk/drug-safety-update/prostate',{date:'2026-10-25'});assert.equal(wrong.result.body.error,'source_date_not_found');assert.equal(wrong.rows.length,0);
});
test('legacy draft preparation cannot enable automatic publication or notifications',async()=>{
 const r=await exercise('https://hansard.parliament.uk/Commons/2026-10-26/debates/id/ProstateCancerScreening',{prepare:true});
 assert.equal(r.preparation.RADAR_AUTO_NEWS_ENABLED,'false');assert.equal(r.preparation.RADAR_SUPPRESS_NOTIFICATIONS,true);
});
test('owner authentication and normal approval/publication routes remain ahead of intake',()=>{
 const scope=source.slice(source.indexOf("if(p.startsWith('/v1/hq/radar'))"),source.indexOf("if(m==='POST'&&p==='/v1/radar/ingest')"));
 assert(scope.indexOf('await hqUser')<scope.indexOf("p==='/v1/hq/radar/intake'"));
 assert(scope.includes("return review(request,env"));
});
