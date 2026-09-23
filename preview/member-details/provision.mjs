// Only the two names below may be created/seeded. Never reset any other preview or production data.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const cli='node_modules/wrangler/bin/wrangler.js',file='work/staging/generated/config.json';
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',maxBuffer:12e6});
const c=JSON.parse(readFileSync(file)),prod=readFileSync('wrangler.jsonc','utf8');
assert.equal(c.name,'shift-stabilisation-preview');assert.equal(c.main,'../../../preview/member-details/worker.mjs');assert.equal(c.d1_databases.length,0);assert(!c.routes&&!c.route&&!c.triggers&&!c.send_email&&!c.ai);
for(const[binding,name]of [['DB','shift-member-details-auth-20260922'],['WORK_DB','shift-member-details-data-20260922']]){
 let list=JSON.parse(run(['d1','list','--json'])),found=list.filter(d=>d.name===name);
 if(!found.length){run(['d1','create',name,'--location','weur']);list=JSON.parse(run(['d1','list','--json']));found=list.filter(d=>d.name===name);}
 assert.equal(found.length,1);const id=found[0].uuid??found[0].database_id??found[0].id;
 assert(/^[a-f0-9-]{36}$/.test(id)&&!prod.includes(id));c.d1_databases.push({binding,database_name:name,database_id:id});
}
assert.notEqual(c.d1_databases[0].database_id,c.d1_databases[1].database_id);writeFileSync(file,JSON.stringify(c,null,2));
// Existing preview account IDs are retained. New probe IDs are unique per build.
for(const[binding,sql]of [['DB','auth.sql'],['WORK_DB','work.sql']])run(['d1','execute',binding,'--remote','--file','work/staging/generated/'+sql,'--config',file]);
for(const sql of ['member-experience/checkin-followup.sql','member-experience/member-details.sql','member-experience/member-email-change.sql'])run(['d1','execute','DB','--remote','--file',sql,'--config',file]);
// Retain automated review records but stop counting the exact completed fixture
// as an untouched human-review slot. No account or data is deleted.
const completedReviewSql=`UPDATE users SET first_name='Fictional automated reviewer' WHERE first_name='Fictional reviewer' AND last_name='Preview' AND email LIKE 'review-%@example.invalid' AND EXISTS (SELECT 1 FROM member_account_details d WHERE d.user_id=users.id AND json_extract(d.body_json,'$.address1')='4 Fictional Road')`;
run(['d1','execute','DB','--remote','--command',completedReviewSql,'--config',file]);
writeFileSync('work/staging/generated/review-evidence/isolation.json',JSON.stringify({previewOnly:true,databases:c.d1_databases,productionIdsRejected:true,bulkDeletion:false,noEmails:true,noPayments:true,noScheduledWork:true},null,2));
console.log('Initialised only named member-details preview databases; no records deleted.');

// Ephemeral fictional email receipts for candidate proof only; never a real mail binding.
run(['d1','execute','DB','--remote','--command',"CREATE TABLE IF NOT EXISTS preview_email_change_mail(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient TEXT NOT NULL,subject TEXT NOT NULL,body_text TEXT NOT NULL,created_at TEXT NOT NULL)",'--config',file]);
