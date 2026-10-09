import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {distributionScorecard} from './scorecard.mjs';

const literal=value=>{
 if(typeof value==='number'&&Number.isFinite(value))return String(value);
 if(typeof value==='string')return "'"+value.replaceAll("'","''")+"'";
 throw Error('Unsupported query value');
};
const execute=(sql,args)=>{
 const clean=String(sql).trim();
 if((! /^(SELECT|WITH)\b/.test(clean)&&clean!=='PRAGMA table_info(audit_log)')||clean.includes(';'))throw Error('Only one read-only aggregate statement is allowed');
 let i=0;const query=clean.replace(/\?/g,()=>{if(i>=args.length)throw Error('Missing parameter');return literal(args[i++])});
 if(i!==args.length)throw Error('Extra parameter');
 const raw=execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',query],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:60000});
 const response=JSON.parse(raw);assert.ok(Array.isArray(response)&&response.every(x=>x.success===true),'D1 read failed');
 return response.flatMap(x=>x.results||[]);
};
const DB={prepare(sql){let args=[];return{bind(...values){args=values;return this},async all(){return{results:execute(sql,args)}},async first(){return execute(sql,args)[0]||null}}}};
const scorecard=await distributionScorecard(DB,{days:30,now:Date.now()});
assert.equal(scorecard.available,true,'Distribution scorecard unavailable');
assert.equal(scorecard.registrations.total,scorecard.registrations.fromWeightLossSupport.registered+scorecard.registrations.fromSomeoneWhoCares.registered);
assert.equal(scorecard.publicAnalytics.joinedToMembers,false);
const proof={
 pass:true,
 checkedAt:new Date().toISOString(),
 productionWrites:false,
 scorecard:{
  version:scorecard.version,
  days:scorecard.days,
  asOf:scorecard.asOf,
  since:scorecard.since,
  registrations:scorecard.registrations,
  acquisition:scorecard.acquisition,
  afterTreatment:scorecard.afterTreatment,
  publicAnalytics:scorecard.publicAnalytics,
  privacy:scorecard.privacy,
  limitations:scorecard.limitations
 },
 proofScope:'Exact deployed distribution scorecard executed SELECT-only against production D1. No identities or free text returned.'
};
console.log(JSON.stringify(proof,null,2));
