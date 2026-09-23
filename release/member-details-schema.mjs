// Exact additive contact table and rollback-compatibility trigger only.
// Never restore, drop, seed or export customer data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {verifyScope} from '../scripts/b1-release-scope.mjs';
export const TABLE='member_account_details';
export const TRIGGER='member_account_details_preserve_delivery';
export const SQL_SHA='16c01d02280c2b6f0d7460241b978d2d7b5cfc62bec0518abde859a20d0d5bf0';
const sql=readFileSync(new URL('../member-experience/member-details.sql',import.meta.url),'utf8');
const tableSQL=sql.slice(0,sql.indexOf('CREATE TRIGGER')),triggerSQL=sql.slice(sql.indexOf('CREATE TRIGGER'));
export function assertSchemaFile(){assert.equal(createHash('sha256').update(sql).digest('hex'),SQL_SHA,'Unreviewed schema source');}
const clean=s=>String(s).replace(/--[^\n]*(?:\n|$)/g,'').replace(/IF NOT EXISTS\s+/i,'').replace(/\s+/g,' ').trim().replace(/;$/,'');
export function assertExisting(rows){
 const table=rows.find(x=>x.name===TABLE&&x.type==='table');
 if(table)assert.equal(clean(table.sql),clean(tableSQL),'Existing contact-table definition differs; do not overwrite');
 for(const name of ['users','user_sessions','member_status','audit_log'])assert(rows.some(x=>x.name===name&&x.type==='table'),'Required existing table is absent: '+name);
 for(const trigger of rows.filter(x=>x.type==='trigger'&&(x.tbl_name===TABLE||x.name===TRIGGER))){assert.equal(trigger.name,TRIGGER,'Unreviewed trigger on contact table');assert.equal(clean(trigger.sql),clean(triggerSQL),'Existing delivery-preservation trigger differs; do not overwrite');}
 return Boolean(table);
}
export function assertOnlyAddition(before,after){
 assertExisting(after);assert(after.some(x=>x.type==='table'&&x.name===TABLE));assert(after.some(x=>x.type==='trigger'&&x.name===TRIGGER));
 assert.deepEqual(after.filter(x=>![TABLE,TRIGGER].includes(x.name)),before.filter(x=>![TABLE,TRIGGER].includes(x.name)),'Unrelated database schema changed');
}
// --file prints upload progress even with --json in the pinned CLI. Binding
// --command=value also keeps leading SQL comments from becoming CLI options.
export function schemaCommandArgs(){assertSchemaFile();return ['d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command='+sql];}
function cli(args){return JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:16*1024*1024}));}
function schema(){const result=cli(['d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',"SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name"]);assert(result.length&&result.every(x=>x.success));return result.flatMap(x=>x.results||[]);}
async function main(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');const scope=verifyScope();assert.deepEqual(scope.runtimeSchemaAdditions,[TABLE,TRIGGER]);assertSchemaFile();
 const releasedConfig=execFileSync('git',['show','323f2409c0bd7f719abb05969fe9aeb2a827261b:wrangler.jsonc'],{encoding:'utf8'});assert.equal(readFileSync('wrangler.jsonc','utf8').replace('    "MEMBER_ADDRESS_PROVIDER": "photon",\n',''),releasedConfig,'Unexpected configuration change');
 mkdirSync('b1-runtime-release',{recursive:true});const before=schema(),exists=assertExisting(before),triggerExists=before.some(x=>x.type==='trigger'&&x.name===TRIGGER);
 const bookmark=cli(['d1','time-travel','info','shift-core-db','--json']);
 writeFileSync('b1-runtime-release/member-details-schema-before.json',JSON.stringify({schema:before,bookmark},null,2));
 if(!exists||!triggerExists){execFileSync(process.execPath,['scripts/catalogue-publication-client.mjs','--verify-main'],{stdio:'inherit'});const result=cli(schemaCommandArgs());assert(result.length&&result.every(x=>x.success),'Additive schema statement failed');}
 const after=schema();assertOnlyAddition(before,after);
 writeFileSync('b1-runtime-release/member-details-schema.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,table:TABLE,created:!exists,deliveryPreservationTriggerCreated:!triggerExists,sqlSHA256:SQL_SHA,existingSchemaPreserved:true,customerRowsRead:0,customerRowsChanged:0,dataExport:false,rollback:'Leave the additive table and preservation trigger intact; restore runtime only.'},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
