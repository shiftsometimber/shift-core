// Keep routine source-observation seeding on D1's query path, outside bulk import mode.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {observationInsert} from '../medicines-watch/observations.mjs';
import {sources} from '../medicines-watch/data.mjs';
const schema=readFileSync(new URL('../medicines-watch/migration.sql',import.meta.url),'utf8');
export function observationStatements(sql){
 const statements=[];let start=0,quoted=false;
 for(let i=0;i<sql.length;i++){
  if(sql[i]==="'"){if(quoted&&sql[i+1]==="'"){i++;continue;}quoted=!quoted;}
  if(!quoted&&sql[i]===';'){const statement=sql.slice(start,i+1).trim();if(statement)statements.push(statement);start=i+1;}
 }
 assert(!quoted&&!sql.slice(start).trim(),'Incomplete observation SQL');
 assert(statements.length<=sources.length,'Too many source observations');
 const database=new DatabaseSync(':memory:');
 try{
  database.exec(schema);
  for(const statement of statements){assert(statement.startsWith('INSERT INTO medicines_watch_checks ('),'Only source-observation seeds are permitted');database.prepare(statement).run();}
  const rows=database.prepare('SELECT * FROM medicines_watch_checks ORDER BY rowid').all(),known=new Map(sources.map(s=>[s.id,s]));
  assert.equal(rows.length,statements.length,'Duplicate observation seeds');
  for(const row of rows){const source=known.get(row.source_id);assert(source,'Unknown source');assert.equal(row.source_url,source.url);assert.equal(row.check_url,source.checkUrl||source.url);}
  assert.equal(statements.join('\n'),rows.map(observationInsert).join('\n'),'Observation seed differs from the exact scheduler-preserving insertion');
 }finally{database.close();}
 return statements;
}
export function observationBatches(statements){
 const batches=[];let batch=[],bytes=0;
 for(const statement of statements){const size=Buffer.byteLength(statement)+1;assert(size<=80000,'Observation statement exceeds online budget');if(batch.length===20||bytes+size>80000){batches.push(batch.join('\n'));batch=[];bytes=0;}batch.push(statement);bytes+=size;}
 if(batch.length)batches.push(batch.join('\n'));return batches;
}
export function seedObservationsOnline(sql,{run=(...args)=>execFileSync(...args)}={}){
 const statements=observationStatements(sql),batches=observationBatches(statements);let changes=0;
 for(const command of batches){
  const result=JSON.parse(run(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command='+command],{encoding:'utf8',maxBuffer:4e6}));
  assert(Array.isArray(result)&&result.length&&result.every(r=>r.success),'Online observation seed failed');
  changes+=result.reduce((n,r)=>n+Number(r.meta?.changes||0),0);
 }
 return {sourceObservations:statements.length,batches:batches.length,changes,bulkImport:false,schedulerObservationsPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');assert(process.argv[2],'Observation SQL path required');
 execFileSync(process.execPath,['scripts/b1-release-scope.mjs'],{stdio:'inherit'});
 console.log(JSON.stringify(seedObservationsOnline(readFileSync(process.argv[2],'utf8'))));
}
