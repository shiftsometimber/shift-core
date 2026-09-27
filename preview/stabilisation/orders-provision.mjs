// Isolated Orders acceptance: never reset or reuse the shared stabilisation D1s.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const cli='node_modules/wrangler/bin/wrangler.js',file='work/staging/generated/config.json';
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',maxBuffer:8e6});
const config=JSON.parse(readFileSync(file));
assert.equal(config.name,'shift-stabilisation-preview');
assert.equal(config.vars.SHIFT_ENVIRONMENT,'stabilisation-preview-20260917');
assert.deepEqual(config.d1_databases,[]);
config.name='shift-stabilisation-preview-v2';
config.compatibility_flags=['nodejs_compat'];
const runId=process.env.GITHUB_RUN_ID;
assert.match(runId||'',/^\d+$/,'A single CI run identifies this isolated preview');
const production=readFileSync('wrangler.jsonc','utf8');
for(const [binding,name]of [['DB','shift-orders-preview-auth-'+runId],['WORK_DB','shift-orders-preview-data-'+runId]]){
 let list=JSON.parse(run(['d1','list','--json']));
 if(list.some(d=>d.name===name))throw Error('Orders preview database already exists: preserve it and inspect the earlier run before retrying');
 run(['d1','create',name,'--location','weur']);
 list=JSON.parse(run(['d1','list','--json']));const found=list.filter(d=>d.name===name);
 assert.equal(found.length,1);const id=found[0].uuid??found[0].database_id??found[0].id;
 assert.match(id,/^[a-f0-9-]{36}$/);assert(!production.includes(id));
 config.d1_databases.push({binding,database_name:name,database_id:id});
}
writeFileSync(file,JSON.stringify(config,null,2));
for(const [binding,sql]of [['DB','auth.sql'],['WORK_DB','work.sql']])run(['d1','execute',binding,'--remote','--file','work/staging/generated/'+sql,'--config',file]);
console.log('Provisioned only separately named fictional Orders preview databases.');
