import {consentClient} from '../acquisition-activation/consent.mjs';
import {readFileSync} from 'node:fs';
// Post-release, read-only proof: exact public bytes, authentication boundary,
// and aggregate source-of-truth measurements. No account rows are returned.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bootstrap} from './assets.mjs';
import {activationScorecard} from './scorecard.mjs';
import {assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await assertCurrentMain({...process.env,GITHUB_SHA:sourceSha,GITHUB_REF:'refs/heads/main'});
const dir='activation-live';mkdirSync(dir,{recursive:true});
const report={checkedAt:new Date().toISOString(),sourceSha,productionWrites:false,assets:[],guards:[]};
const origin='https://shiftsometimber.co.uk';
try{
 for(const suffix of ['', '?v=52','?proof=activation-cohort-v1']){
  const r=await fetch(origin+'/analytics-bootstrap-v1.js'+suffix,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(20000)});
  assert.equal(r.status,200);assert.match(r.headers.get('content-type')||'',/javascript/);
  assert.equal(r.headers.get('x-shift-analytics-authority'),'consented-public-v2');const text=await r.text();assert.equal(text,bootstrap,'Live bootstrap must match exact Git source');
  report.assets.push({path:'/analytics-bootstrap-v1.js'+suffix,status:r.status,sha256:createHash('sha256').update(text).digest('hex'),matchesSource:true});
 }
 for(const [path,expected]of [['/consent-v4a.js',consentClient],['/api-adapter-v33d.js',readFileSync('frontend/member/api-adapter-v33d.js','utf8')]]){
  const r=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);assert.equal(await r.text(),expected);report.assets.push({path,status:r.status,matchesSource:true});
 }
 for(const path of ['/v1/hq/journey','/v1/hq/journey?days=90','/v1/me','/v1/acquisition-attribution']){
  const r=await fetch(origin+path,{redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(20000)});assert.equal(r.status,401,path+' must reject anonymous access');report.guards.push({path,status:r.status});
 }
 const literal=value=>{if(typeof value==='number'&&Number.isFinite(value))return String(value);if(typeof value==='string')return "'"+value.replaceAll("'","''")+"'";throw Error('Unsupported query value')};
 const execute=(sql,args)=>{
  if((! /^(SELECT|WITH)\b/.test(sql)&&sql!=='PRAGMA table_info(audit_log)')||sql.includes(';'))throw Error('Only one read-only aggregate statement is allowed');
  let i=0;const query=sql.replace(/\?/g,()=>{if(i>=args.length)throw Error('Missing parameter');return literal(args[i++])});if(i!==args.length)throw Error('Extra parameter');
  const raw=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',query],{encoding:'utf8',maxBuffer:1048576,timeout:60000});
  const response=JSON.parse(raw);assert.ok(Array.isArray(response)&&response.every(x=>x.success===true));return response.flatMap(x=>x.results||[]);
 };
 const DB={prepare(sql){let args=[];return{bind(...values){args=values;return this},async all(){return{results:execute(sql,args)}},async first(){return execute(sql,args)[0]||null}}}};
 report.activation=await activationScorecard(DB,{days:90,now:report.checkedAt});assert.equal(report.activation.available,true,'Live account evidence must be available');
 assert.equal(report.activation.acquisition.available,true,'Acquisition report must be available');
 assert.equal(report.activation.acquisition.sources.reduce((n,s)=>n+s.registered,0),report.activation.stages[0].members,'Source buckets reconcile to the same account cohort');
 assert.ok(report.activation.retention.week8,'Week-eight result must be present');
 assert.ok(report.activation.retention.week8.returned<=report.activation.retention.week8.eligible);
 if(!report.activation.retention.week8.eligible)assert.equal(report.activation.retention.week8.ratePct,null);
 report.aggregateProofScope='Exact released scorecard executed read-only against production D1; authenticated HTTP response not claimed.';
 report.pass=true;
}catch(e){report.pass=false;report.error=e.message;process.exitCode=1}
writeFileSync(dir+'/proof.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
