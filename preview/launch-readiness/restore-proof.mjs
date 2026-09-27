// Export ONLY the explicitly isolated fictional preview DB. Restore into a fresh
// local SQLite database; this is data recovery evidence, not a production drill.
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='work/staging/generated',configFile=dir+'/config.json',config=JSON.parse(readFileSync(configFile)),binding=config.d1_databases.find(d=>d.binding==='DB');
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(config.name,'shift-stabilisation-preview');assert.equal(binding.database_name,'shift-stabilisation-preview-auth-20260917');assert(!readFileSync('wrangler.jsonc','utf8').includes(binding.database_id));
const evidence=dir+'/five-points-evidence/launch';mkdirSync(evidence,{recursive:true});const began=Date.now(),file=dir+'/launch-private-backup.sql';
try{
 execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','export','DB','--remote','--config',configFile,'--output',file],{stdio:'pipe',timeout:120000,maxBuffer:32e6});
 const dump=readFileSync(file,'utf8'),restored=new DatabaseSync(':memory:');restored.exec(dump);
 assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 const tables=restored.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
 const proof=tables.map(name=>{const quoted='"'+name.replaceAll('"','""')+'"',rows=restored.prepare('SELECT * FROM '+quoted).all().map(r=>JSON.stringify(r)).sort();return {table:name,count:rows.length,sha256:createHash('sha256').update(rows.join('\n')).digest('hex')}});
 const required=['users','user_auth','member_state','consents','auth_tokens'];for(const name of required)assert(tables.includes(name),name+' missing from restore');
 const fixture=JSON.parse(readFileSync(dir+'/probe.json'));assert(restored.prepare('SELECT id FROM users WHERE id=?').get(fixture.ids[0]));
 const sql=required.map(name=>`SELECT '${name}' table_name,COUNT(*) count FROM ${name}`).join(' UNION ALL ');
 const live=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config',configFile,'--json','--command',sql],{encoding:'utf8',timeout:30000})).flatMap(r=>r.results||[]);
 for(const row of live)assert.equal(proof.find(t=>t.table===row.table_name).count,Number(row.count));
 writeFileSync(evidence+'/restore-report.json',JSON.stringify({source:process.env.GITHUB_SHA,at:new Date().toISOString(),elapsedMs:Date.now()-began,sourceDatabase:binding.database_name,productionAccess:false,exportSha256:createHash('sha256').update(dump).digest('hex'),integrity:'ok',tables:proof,requiredLiveCountsMatch:true,limitations:['D1 export restored into fresh local SQLite, not a production D1 Time Travel restore.','Separate WORK_DB, object storage, provider callbacks and secret/configuration restoration are not covered.','Human recovery owner and backup acknowledgement remain unverified.'],fullServiceRecoveryVerified:false},null,2));restored.close();
}finally{rmSync(file,{force:true})}
