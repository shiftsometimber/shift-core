import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/Users/shiftsometimberltd/SST/shift-audit-recovery-20261003',dir='/tmp/shift-audit-20261003',file=dir+'/drill-config.json',f=JSON.parse(readFileSync(dir+'/drill-fixture.json')),key=readFileSync(dir+'/drill-key.txt','utf8'),started=Date.now();
const config=JSON.parse(readFileSync(file)),headers={Origin:f.origin,'Content-Type':'application/json','x-recovery-drill':key,Cookie:f.cookie};
assert.equal(config.name,'shift-recovery-drill-20261003');assert(!config.routes&&!config.ai&&!config.send_email&&!config.triggers);
const prod=readFileSync(root+'/wrangler.jsonc','utf8');for(const db of config.d1_databases){assert(db.database_name.startsWith('shift-recovery-drill-'));assert(!prod.includes(db.database_id))}
const cli=(args,input)=>execFileSync(process.execPath,[root+'/node_modules/wrangler/bin/wrangler.js',...args],{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8e6,timeout:180000});
const sql=command=>JSON.parse(cli(['d1','execute','DB','--remote','--json','--config',file,'--command',command])).flatMap(x=>x.results||[]);
assert.equal(sql('SELECT COUNT(*) n FROM users')[0].n,1);assert.equal(sql('SELECT id FROM users')[0].id,f.id);
const content=await fetch(f.origin+'/__drill/content',{method:'POST',headers,body:JSON.stringify({action:'read-all'})}).then(r=>r.json());assert.equal(content.overrides.length,1);
writeFileSync(dir+'/content-backup.json',JSON.stringify(content));
const deletion=await fetch(f.origin+'/v1/privacy/account',{method:'DELETE',headers});assert.equal(deletion.status,202);
assert.equal((await fetch(f.origin+'/v1/me',{headers})).status,401);
const requests=sql('SELECT * FROM data_requests'),tasks=sql('SELECT * FROM hq_tasks');
assert.equal(requests.filter(r=>r.request_type==='deletion').length,1);assert.equal(tasks.filter(t=>t.title==='Review account deletion request').length,1);
const journal={requests,tasks,at:new Date().toISOString()};writeFileSync(dir+'/recovery-journal.json',JSON.stringify(journal),{mode:0o600});
for(const db of config.d1_databases){const name=db.database_name.replace('drill-','restored-');cli(['d1','create',name,'--location','weur']);const list=JSON.parse(cli(['d1','list','--json'])),row=list.find(d=>d.name===name);assert(row&&!prod.includes(row.uuid));db.database_name=name;db.database_id=row.uuid}
writeFileSync(dir+'/restored-config.json',JSON.stringify(config,null,2));
const restored=dir+'/restored-config.json';
for(const [binding,short]of [['DB','main'],['EVIDENCE_DESK_READ_DB','evidence']])cli(['d1','execute',binding,'--remote','--config',restored,'--file',dir+'/drill-'+short+'-backup.sql']);
console.log('Both D1 backups imported into newly created isolated databases.');
const quote=x=>x===null?'NULL':typeof x==='number'?String(x):"'"+String(x).replaceAll("'","''")+"'";
const insert=(table,rows)=>rows.map(row=>'INSERT INTO '+table+' ('+Object.keys(row).join(',')+') VALUES ('+Object.values(row).map(quote).join(',')+');').join('\n');
const reconciliation="DELETE FROM data_requests; DELETE FROM hq_tasks;\n"+insert('data_requests',requests)+'\n'+insert('hq_tasks',tasks)+"\nUPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE revoked_at IS NULL; UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE used_at IS NULL;";
writeFileSync(dir+'/reconciliation.sql',reconciliation,{mode:0o600});
cli(['d1','execute','DB','--remote','--config',restored,'--file',dir+'/reconciliation.sql']);
for(const row of content.overrides){const r=await fetch(f.origin+'/__drill/content',{method:'POST',headers,body:JSON.stringify({action:'pause',pagePath:row.page_path,contentKey:row.content_key})});assert(r.ok)}
const cleared=await fetch(f.origin+'/__drill/content',{method:'POST',headers,body:JSON.stringify({action:'read-all'})}).then(r=>r.json());assert.equal(cleared.overrides.length,0);
cli(['deploy','--config',restored]);
cli(['secret','put','RECOVERY_CANARY','--config',restored],'fictional-restore-canary');
for(const row of content.overrides){const r=await fetch(f.origin+'/__drill/content',{method:'POST',headers,body:JSON.stringify({action:'publish',pagePath:row.page_path,contentKey:row.content_key,cssSelector:row.css_selector,publishedText:row.published_text,version:row.version})});assert(r.ok)}
const after=await fetch(f.origin+'/__drill/content',{method:'POST',headers,body:JSON.stringify({action:'read-all'})}).then(r=>r.json());assert.deepEqual(after,content);
assert.equal((await fetch(f.origin+'/v1/me',{headers})).status,401,'Old sessions must stay revoked');
for(const path of ['/health','/__drill/evidence','/__drill/credential']){const r=await fetch(f.origin+path,{headers});assert(r.ok,path);if(path.endsWith('credential'))assert.equal((await r.json()).restored,true)}
const state=JSON.parse(cli(['d1','execute','DB','--remote','--json','--config',restored,'--command',"SELECT (SELECT COUNT(*) FROM data_requests WHERE request_type='deletion' AND status='received') pending_deletions,(SELECT COUNT(*) FROM hq_tasks WHERE title='Review account deletion request' AND status='open') open_tasks,(SELECT COUNT(*) FROM user_sessions WHERE revoked_at IS NULL) active_sessions;"])).flatMap(x=>x.results||[])[0];
assert.equal(state.pending_deletions,1);assert.equal(state.open_tasks,1);assert.equal(state.active_sessions,0);
const result={at:new Date().toISOString(),elapsedMs:Date.now()-started,productionWrites:0,syntheticOnly:true,sourceRevision:'6c9a8ac8f54dde34eaae4f027bc24be0dc9cc7c3',mainAndEvidenceD1Restored:true,workerAnd455MemberAssetsRedeployed:true,durableObjectClearedAndRestored:true,testCredentialRestored:true,deletionIntakeAndQueueVerified:true,postBackupDeletionPreserved:true,oldSessionsInvalidated:true,state,limitations:['Uses fictional data and a canary credential; production secret escrow and credential rotation are not verified.','Payments, emails and external callbacks were disabled, not replayed or reconciled against real providers.','Public Pages restored separately; all service routing/configuration still needs combined cutover acceptance.','Recovery owner, retention/processor contracts and operating acknowledgement are not established by this drill.'],fullServiceRecoveryVerified:false};
writeFileSync(dir+'/restore-drill-receipt.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
