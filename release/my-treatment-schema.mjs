// Additive schema only. Read schema metadata, never customer rows. No resets.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {verifyScope} from '../scripts/b1-release-scope.mjs';
export const treatmentSQL=readFileSync(new URL('../member-experience/treatment.sql',import.meta.url),'utf8');
export const treatmentSQLHash=createHash('sha256').update(treatmentSQL).digest('hex');
const query="SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name";
const local=new DatabaseSync(':memory:');local.exec('CREATE TABLE users(id INTEGER PRIMARY KEY);'+treatmentSQL);
export const expectedTreatmentSchema=local.prepare(query).all().filter(x=>x.name!=='users').map(x=>({...x}));local.close();
const normalise=s=>String(s).replace(/IF NOT EXISTS\s+/gi,'').replace(/\s+/g,' ').trim().replace(/;$/,'');
export function assertTreatmentSchema(rows,{complete=false}={}){
 assert(rows.some(x=>x.type==='table'&&x.name==='users'),'Existing users table required');
 for(const expected of expectedTreatmentSchema){
  const actual=rows.find(x=>x.name===expected.name);
  if(!actual){assert(!complete,'Treatment schema object missing: '+expected.name);continue;}
  assert.equal(actual.type,expected.type,'Treatment schema type differs: '+expected.name);
  assert.equal(actual.tbl_name,expected.tbl_name,'Treatment schema owner differs: '+expected.name);
  assert.equal(normalise(actual.sql),normalise(expected.sql),'Existing treatment schema differs; do not overwrite: '+expected.name);
 }
 const owned=new Set(expectedTreatmentSchema.map(x=>x.tbl_name));
 for(const row of rows.filter(x=>owned.has(x.tbl_name)))assert(expectedTreatmentSchema.some(x=>x.name===row.name),'Unreviewed object on treatment store: '+row.name);
}
export function assertTreatmentAddition(before,after){
 assertTreatmentSchema(before);assertTreatmentSchema(after,{complete:true});
 const names=new Set(expectedTreatmentSchema.map(x=>x.name));
 assert.deepEqual(after.filter(x=>!names.has(x.name)),before.filter(x=>!names.has(x.name)),'Unrelated database schema changed');
 for(const old of before)assert.deepEqual(after.find(x=>x.name===old.name),old,'Existing schema changed: '+old.name);
}
const cli=args=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:16*1024*1024}));
function schema(){const r=cli(['d1','execute','DB','--remote','--json','--command='+query]);assert(r.length&&r.every(x=>x.success));return r.flatMap(x=>x.results||[]);}
async function main(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');verifyScope();
 assert(readFileSync('wrangler.jsonc','utf8').includes('"MY_TREATMENT_ENABLED": "true"'));
 mkdirSync('b1-runtime-release',{recursive:true});const before=schema();assertTreatmentSchema(before);
 const bookmark=cli(['d1','time-travel','info','shift-core-db','--json']);
 writeFileSync('b1-runtime-release/my-treatment-schema-before.json',JSON.stringify({schema:before,bookmark},null,2));
 if(expectedTreatmentSchema.some(x=>!before.some(b=>b.name===x.name))){
  execFileSync(process.execPath,['scripts/catalogue-publication-client.mjs','--verify-main'],{stdio:'inherit'});
  const r=cli(['d1','execute','DB','--remote','--json','--command='+treatmentSQL]);assert(r.length&&r.every(x=>x.success),'Treatment additive migration failed');
 }
 const after=schema();assertTreatmentAddition(before,after);
 writeFileSync('b1-runtime-release/my-treatment-schema.json',JSON.stringify({release:process.env.GITHUB_SHA,at:new Date().toISOString(),sqlSHA256:treatmentSQLHash,objects:expectedTreatmentSchema.map(x=>x.name),existingSchemaPreserved:true,customerRowsRead:0,customerRowsChanged:0,rollback:'Restore runtime only; preserve additive member stores.'},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
