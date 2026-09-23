// Bounded preview integration, checked against the exact archived draft source.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/account-completion-20260923');
function once(s,a,b){assert.equal(s.split(a).length,2,'Patch anchor mismatch: '+a);return s.replace(a,b);}
function edit(path,marker,fn){const s=fs.readFileSync(path,'utf8');if(s.includes(marker))return;const old=execFileSync('git',['show','a40a42ab671db8d6c12b497f36b2cebdc1c57428:'+path],{encoding:'utf8'});assert.equal(s,old,'Source drift in '+path);const n=fn(s);assert(n.includes(marker));fs.writeFileSync(path,n);}
edit('member-experience/member-details-routes.mjs','memberEmailChangeRoute',s=>"import {memberEmailChangeRoute} from './member-email-change.mjs';\n"+once(s,'export async function memberDetailsRoute(request,env){','export async function memberDetailsRoute(request,env){\n const email=await memberEmailChangeRoute(request,env);if(email)return email;'));
edit('member-experience/member-details.mjs','emailChangeMarkup',s=>{
 s="import {emailChangeMarkup,emailChangeRuntime} from './member-email-client.mjs';\n"+s;
 s=once(s,'</form>${deliveryMarkup}</section>`;','</form>${deliveryMarkup}${emailChangeMarkup}</section>`;');
 return once(s,'})();`+deliveryRuntime;','})();`+deliveryRuntime+emailChangeRuntime;');
});
edit('preview/member-details/worker.mjs','previewEmailRoute',s=>{
 s="import {previewEmailRoute} from '../../account-completion/preview-mail.mjs';\n"+s;
 const anchor=" if(path==='/__review'&&request.method==='GET')return page(intro(env));";
 s=once(s,anchor," const emailPreview=await previewEmailRoute(request,env,ctx,core);if(emailPreview)return emailPreview;\n"+anchor);
 return once(s,'<br><a href="/__review/gp-form">','<br><a href="/__review/email-inbox">Open your fictional confirmation inbox (no real email sent)</a><br><a href="/__review/gp-form">');
});
edit('preview/member-details/provision.mjs','member-email-change.sql',s=>{
 s=once(s,"'member-experience/checkin-followup.sql','member-experience/member-details.sql'","'member-experience/checkin-followup.sql','member-experience/member-details.sql','member-experience/member-email-change.sql'");
 return s+"\n// Ephemeral fictional email receipts for candidate proof only; never a real mail binding.\nrun(['d1','execute','DB','--remote','--command',\"CREATE TABLE IF NOT EXISTS preview_email_change_mail(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient TEXT NOT NULL,subject TEXT NOT NULL,body_text TEXT NOT NULL,created_at TEXT NOT NULL)\",'--config',file]);\n";
});
console.log('Integrated only the reviewed email route/card and fictional mailbox preview; production remains unchanged.');
