// Actual mailbox receipt/opening is verified separately. This records send evidence
// and waits for the received-link reset, then verifies ordinary password login.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const origin=process.env.PREVIEW_URL,config='work/staging/generated/config.json',fixture=JSON.parse(readFileSync('work/staging/generated/b1-probe.json')),dir='work/staging/generated/five-points-evidence/b1';
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''));
assert.equal(JSON.parse(readFileSync(config)).d1_databases.find(x=>x.binding==='DB')?.database_name,'shift-stabilisation-preview-auth-20260917');
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),productionWrites:0,inboxReceipt:'requires independent connected-mailbox evidence',status:'requesting'},save=()=>writeFileSync(dir+'/actual-email-report.json',JSON.stringify(report,null,2));
const post=async(path,body)=>{const r=await fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}};
report.request=await post('/v1/auth/request-password-reset',{email:fixture.email});assert.equal(report.request.status,200);
const rows=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config',config,'--command',`SELECT event_type,status,provider_id,error_code,created_at FROM auth_delivery_events WHERE user_id=${fixture.emailId} AND event_type='password_reset' ORDER BY id DESC LIMIT 1`,'--json'],{encoding:'utf8'}))[0].results;
report.provider=rows[0]||null;report.status=report.provider?.status==='sent'?'waiting_for_received_link_reset':'delivery_failed';save();console.log(JSON.stringify(report));assert.equal(report.provider?.status,'sent','Actual provider acceptance failed');
// No token is read from the database. Check password hash locally so polling
// does not accumulate failed sign-in attempts or lock the fictional account.
const {pbkdf2Sync}=await import('node:crypto');let changed=false;
for(let i=0;i<60;i++){
 const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config',config,'--command',`SELECT password_hash FROM user_auth WHERE user_id=${fixture.emailId}`,'--json'],{encoding:'utf8'}))[0].results[0];
 const [,iterations,salt,hash]=auth.password_hash.split('$');changed=pbkdf2Sync(fixture.emailNewPassword,Buffer.from(salt,'base64url'),Number(iterations),32,'sha256').toString('base64url')===hash;
 if(changed)break;await new Promise(r=>setTimeout(r,10000));
}
if(changed){report.oldLogin=(await post('/v1/auth/login',{email:fixture.email,password:fixture.oldPassword})).status;report.newLogin=(await post('/v1/auth/login',{email:fixture.email,password:fixture.emailNewPassword})).status;report.status=report.oldLogin===401&&report.newLogin===200?'reset_and_ordinary_login_pass':'login_failed'}else report.status='received_link_reset_unverified';
save();console.log(JSON.stringify(report));assert.equal(report.status,'reset_and_ordinary_login_pass','Actual received-link reset and login gate remains open');
