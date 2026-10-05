import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAuthRecovery} from '../auth-recovery-v1.js';
import {previewResetSender} from '../preview/b1-repair/mail-guard.mjs';
test('current recovery handler passes the preview transport guard intact and retains provider evidence',async()=>{
 const messages=[],audits=[];
 const DB={async exec(){},prepare(sql){return{bind(...args){return{
  async first(){return sql.startsWith('SELECT id,email,first_name')?{id:901,email:'fictional@example.test',first_name:'Fictional B1 email'}:null},
  async run(){if(sql.includes('INSERT INTO auth_delivery_events'))audits.push(args);return{meta:{changes:1}}}
 }}}}};
 const env={DB,PREVIEW_B1_MAILBOX:'fictional@example.test',EMAIL:{async send(message){messages.push(message);return{messageId:'fictional-provider-id'}}}};
 const request=new Request('https://shift-stabilisation-preview.example.workers.dev/v1/auth/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'fictional@example.test'})});
 const response=await handleAuthRecovery(request,{...env,PUBLIC_SITE_URL:'https://shift-stabilisation-preview.example.workers.dev',EMAIL:previewResetSender(env)},{});
 assert.equal(response.status,200);assert.equal(messages.length,1);
 assert.equal(messages[0].subject,'Reset your My Timber password');
 assert.match(messages[0].text,/https:\/\/shift-stabilisation-preview\.example\.workers\.dev\/reset-password\.html\?token=/);
 assert.equal(audits[0][3],'sent');assert.equal(audits[0][4],'fictional-provider-id');
});
test('preview rejects stale subject and unexpected destination, sender or reply route before the provider',async()=>{
 let sent=0;const send=previewResetSender({PREVIEW_B1_MAILBOX:'fictional@example.test',EMAIL:{async send(){sent++}}});
 const valid={to:'fictional@example.test',from:{email:'hello@shiftsometimber.co.uk'},replyTo:'support@shiftsometimber.co.uk',subject:'Reset your My Timber password'};
 for(const change of [{subject:'Reset your My Shift password'},{to:'other@example.test'},{from:{email:'other@example.test'}},{replyTo:'other@example.test'}])await assert.rejects(send.send({...valid,...change}),/preview_mail_not_allowed/);
 assert.equal(sent,0);
});
