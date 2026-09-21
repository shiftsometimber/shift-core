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
// Receive only an encrypted proof payload on a separate evidence branch. This
// never changes/deploys the candidate. Private key stays on this ephemeral runner.
const {privateDecrypt,constants}=await import('node:crypto');
const branch='proof/b1-email-'+process.env.GITHUB_SHA.slice(0,12);let inbox=null;
for(let i=0;i<90;i++){
 const r=await fetch('https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY+'/contents/inbox-proof.json?ref='+encodeURIComponent(branch),{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'}});
 if(r.ok){const file=await r.json(),envelope=JSON.parse(Buffer.from(file.content,'base64').toString());assert.equal(envelope.candidate,process.env.GITHUB_SHA);inbox=JSON.parse(privateDecrypt({key:readFileSync('work/staging/generated/b1-inbox-private.pem'),padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(envelope.ciphertext,'base64')).toString());break}
 assert.equal(r.status,404,'Inbox proof transport unavailable');await new Promise(r=>setTimeout(r,10000));
}
assert(inbox,'Actual inbox link remains unverified');assert.equal(inbox.candidate,process.env.GITHUB_SHA);assert.equal(inbox.mailbox,fixture.email);
const link=new URL(inbox.url);assert.equal(link.origin,origin);assert.equal(link.pathname,'/reset-password.html');const token=link.searchParams.get('token');assert(token&&/^[A-Za-z0-9_-]{40,64}$/.test(token));
report.inboxReceipt={verified:true,receivedAt:inbox.receivedAt,origin:link.origin,evidence:'Connected owner mailbox; token encrypted directly to this runner; no DB token extraction'};
const {chromium}=await import('playwright');const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
try{
 await context.route('**/*',route=>{const r=route.request();return new URL(r.url()).origin!==origin&&!['GET','HEAD'].includes(r.method())?route.abort():route.continue()});
 await page.goto(link.href);const fields=page.locator('input[type=password]');await fields.first().waitFor();for(let i=0;i<await fields.count();i++)await fields.nth(i).fill(fixture.emailNewPassword);
 const result=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/auth/reset-password');await page.locator('button[type=submit],input[type=submit]').first().click();report.renderedResetStatus=(await result).status();assert.equal(report.renderedResetStatus,200);
 await page.screenshot({path:dir+'/actual-email-reset-success.png',fullPage:true});
 report.oldLogin=(await post('/v1/auth/login',{email:fixture.email,password:fixture.oldPassword})).status;report.newLogin=(await post('/v1/auth/login',{email:fixture.email,password:fixture.emailNewPassword})).status;
 report.reuse=(await post('/v1/auth/reset-password',{token,password:fixture.emailNewPassword+'-reused'})).status;
 assert.equal(report.oldLogin,401);assert.equal(report.newLogin,200);assert.equal(report.reuse,400);report.status='inbox_rendered_reset_and_ordinary_login_pass';
}catch(e){report.status='received_link_test_failed';report.error=String(e.message).replaceAll(token,'[token-redacted]').replaceAll(fixture.emailNewPassword,'[password-redacted]');process.exitCode=1}
finally{await context.close();await browser.close();save();console.log(JSON.stringify(report))}
