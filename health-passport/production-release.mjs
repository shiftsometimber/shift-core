// Production release plumbing only: no user rows are read, copied or modified.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {readCurrentMain} from '../scripts/current-main-guard.mjs';
import {patchStartHereClient} from './presentation.mjs';
const ORIGIN='https://shiftsometimber.co.uk',OUT='passport-release';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const norm=s=>String(s).replace(/\bIF NOT EXISTS\s+/gi,'').replace(/\s+/g,' ').replace(/;$/,'').trim().toLowerCase();
export function assertSchema(rows,source){
 const expected=source.replace(/^\s*--[^\n]*$/gm,'').split(';').map(x=>x.trim()).filter(Boolean);
 assert.equal(rows.length,2,'Passport table and index must both exist');
 assert.deepEqual(rows.map(r=>norm(r.sql)).sort(),expected.map(norm).sort(),'Passport schema differs from the reviewed addition');
}
function cli(args){return execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});}
function query(sql){const output=JSON.parse(cli(['d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql]));assert.ok(Array.isArray(output)&&output.length&&output.every(x=>x.success),'D1 metadata query failed');return output.flatMap(x=>x.results||[]);}
const metadata="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index','trigger','view') AND sql IS NOT NULL ORDER BY type,name";
const own=r=>r.name==='health_passport_records'||r.name==='idx_health_passport_member';
export function assertNoOtherSchemaChanges(before,after){assert.deepEqual(after.filter(r=>!own(r)),before.filter(r=>!own(r)),'Non-Passport schema changed during migration');}
async function prepare(){
 await readCurrentMain();mkdirSync(OUT,{recursive:true});
 const config=readFileSync('wrangler.jsonc','utf8');
 assert.match(config,/"name"\s*:\s*"shift-core"/);assert.match(config,/"database_id"\s*:\s*"88f40aed-cb23-4372-8c94-8a73f48bc847"/);
 assert.match(config,/"HEALTH_PASSPORT_V1_ENABLED"\s*:\s*"true"/);assert.match(config,/"AUTO_VERIFY_EMAIL"\s*:\s*"false"/);
 const source=readFileSync('health-passport/schema.sql','utf8');assert.equal(hash(source),'9096092462b9c2ec2992c68cf6e45ac1ac7cf901fb21957a3032c6b1382d5342','Unreviewed migration');
 const r=await fetch(ORIGIN+'/start-here-v72.js?v=direct-detail-20260912',{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.match(r.headers.get('content-type')||'',/javascript/);
 const old=await r.text(),count=old.split('JSON.stringify({recommended,alternative,answers})').length-1;
 let expected;
 if(count===2)expected=patchStartHereClient(old);else{assert.equal(count,0);assert.equal(old.split('JSON.stringify({recommended,alternative})').length-1,2,'Start Here source drift');expected=old;}
 const before=query(metadata);const existing=before.filter(own);if(existing.length)assertSchema(existing,source);
 const deployments=JSON.parse(readFileSync('deployment-before.json','utf8'));const list=Array.isArray(deployments)?deployments:deployments.deployments||deployments.result?.deployments;
 assert.ok(Array.isArray(list)&&list.length,'Missing rollback deployments');
 const latest=[...list].sort((a,b)=>String(b.created_on).localeCompare(String(a.created_on)))[0];
 assert.equal(latest.versions?.length,1,'A split rollout needs explicit reconciliation');assert.equal(latest.versions[0].percentage,100,'Rollback version must own all traffic');
 const version=latest.versions[0].version_id;assert.match(version,/^[a-f0-9-]{36}$/i);
 const proof={release:process.env.GITHUB_SHA,checkedAt:new Date().toISOString(),migrationSha256:hash(source),previousVersion:version,rollbackCommand:`npx wrangler rollback ${version} --config wrangler.jsonc --message "Restore pre-Passport application; retain additive data"`,databaseRollback:'Do not drop the table or restore the whole database: retain newly saved member records.',startHereBefore:hash(old),startHereExpected:hash(expected),schemaBefore:hash(JSON.stringify(before)),userRowsRead:false,userRowsChanged:false};
 writeFileSync(OUT+'/release.json',JSON.stringify(proof,null,2));
 await readCurrentMain();
 if(process.env.PASSPORT_SCHEMA_READ_ONLY==='true')assertSchema(existing,source);
 if(!existing.length)cli(['d1','execute','DB','--remote','--config','wrangler.jsonc','--file','health-passport/schema.sql']);
 const after=query(metadata);assertSchema(after.filter(own),source);assertNoOtherSchemaChanges(before,after);
 Object.assign(proof,{schemaAfter:hash(JSON.stringify(after)),schemaReady:true,migrationApplied:!existing.length});
 writeFileSync(OUT+'/release.json',JSON.stringify(proof,null,2));console.log('PASS Passport schema and rollback record; no existing table or member row changed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)prepare().catch(e=>{console.error('Passport release preparation failed:',e.message);process.exitCode=1});
