import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {SIGNUP_ALERT_SCHEMA} from '../member-signup-alert.mjs';
import {verifyScope} from '../scripts/b1-release-scope.mjs';
const name='member_signup_alerts';
const clean=s=>String(s).replace(/IF NOT EXISTS\s+/i,'').replace(/\s+/g,' ').trim().replace(/;$/,'');
export function assertSignupSchema(rows){
 const table=rows.find(r=>r.type==='table'&&r.name===name);
 if(table)assert.equal(clean(table.sql),clean(SIGNUP_ALERT_SCHEMA),'Unexpected signup alert schema; do not overwrite');
 assert(!rows.some(r=>r.type==='trigger'&&r.tbl_name===name),'Unexpected signup alert trigger');
 assert(rows.some(r=>r.type==='table'&&r.name==='users'),'Existing users table required');
 return Boolean(table);
}
export function assertSignupAddition(before,after){assert(assertSignupSchema(after));assert.deepEqual(after.filter(r=>r.name!==name),before.filter(r=>r.name!==name),'Unrelated schema changed');}
function cli(command){return JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command='+command],{encoding:'utf8',maxBuffer:16*1024*1024}));}
function schema(){const r=cli("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name");assert(r.length&&r.every(x=>x.success));return r.flatMap(x=>x.results||[]);}
async function main(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');assert(verifyScope().runtimeSchemaAdditions.includes(name));
 const before=schema(),existed=assertSignupSchema(before);
 if(!existed){execFileSync(process.execPath,['scripts/catalogue-publication-client.mjs','--verify-main'],{stdio:'inherit'});const r=cli(SIGNUP_ALERT_SCHEMA);assert(r.length&&r.every(x=>x.success));}
 const after=schema();assertSignupAddition(before,after);mkdirSync('b1-runtime-release',{recursive:true});
 writeFileSync('b1-runtime-release/signup-alert-schema.json',JSON.stringify({source:process.env.GITHUB_SHA,table:name,created:!existed,sqlSha256:createHash('sha256').update(SIGNUP_ALERT_SCHEMA).digest('hex'),existingSchemaPreserved:true,customerRowsRead:0,customerRowsChanged:0,noBackfill:true,rollback:'Restore runtime only; retain the additive alert delivery table.'},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
