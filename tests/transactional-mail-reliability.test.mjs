import test from 'node:test';
import assert from 'node:assert/strict';
import {sendTransactionalEmail,medicineEmailTemplates} from '../transactional-email-v1.js';

function fixture({auditFails=false,sendFails=false}={}){
 const messages=[],events=[];
 const env={DB:{async exec(){if(auditFails)throw Error('audit unavailable')},prepare(){return{bind(...args){return{async run(){events.push(args)}}}}}},EMAIL:{async send(message){messages.push(message);if(sendFails)throw Object.assign(Error('rejected'),{code:'E_RATE_LIMIT_EXCEEDED'});return{messageId:'fictional-provider-id'}}}};
 return{env,messages,events};
}
test('transactional replies reach the existing event-specific mailbox',async()=>{
 for(const [eventType,replyTo] of [['order_confirmation','orders@shiftsometimber.co.uk'],['privacy','privacy@shiftsometimber.co.uk'],['complaint','complaints@shiftsometimber.co.uk'],['support','support@shiftsometimber.co.uk'],['unknown','hello@shiftsometimber.co.uk']]){
  const f=fixture();await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType,text:'Fictional proof only'});assert.equal(f.messages[0].replyTo,replyTo);
 }
});
test('provider acceptance survives a delivery-audit outage without a second attempt',async()=>{
 const f=fixture({auditFails:true});const result=await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType:'support',text:'Fictional proof only'});
 assert.equal(f.messages.length,1);assert.equal(result[0].status,'sent');assert.equal(result[0].providerId,'fictional-provider-id');assert.equal(result[0].auditRecorded,false);assert.equal(result[0].receiptVerified,false);
});
test('support messages use the support sender even with a generic sender configured',async()=>{
 for(const eventType of ['support','interest_notify']){
  const f=fixture();f.env.TRANSACTIONAL_EMAIL_FROM='hello@shiftsometimber.co.uk';
  await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType,text:'Fictional proof only'});
  assert.deepEqual(f.messages[0].from,{email:'support@shiftsometimber.co.uk',name:'Shift Some Timber Support'});
  assert.equal(f.messages[0].replyTo,'support@shiftsometimber.co.uk');
  assert.equal(f.messages[0].to,'fictional@example.test');
 }
});
test('internal support requests are addressed to support and retain the support identity',async()=>{
 const f=fixture();await sendTransactionalEmail(f.env,{eventType:'support',internalNotify:true,text:'Fictional proof only'});
 assert.equal(f.messages.length,1);assert.equal(f.messages[0].to,'support@shiftsometimber.co.uk');
 assert.equal(f.messages[0].from.email,'support@shiftsometimber.co.uk');
 assert.equal(f.messages[0].replyTo,'support@shiftsometimber.co.uk');
});
test('provider rejection and a missing binding remain explicit even if audit storage is unavailable',async()=>{
 const f=fixture({auditFails:true,sendFails:true});let result=await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType:'support'});assert.equal(result[0].status,'failed');assert.equal(result[0].errorCode,'E_RATE_LIMIT_EXCEEDED');assert.equal(f.messages.length,1);
 delete f.env.EMAIL;result=await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType:'support'});assert.equal(result[0].status,'binding_missing');assert.equal(f.messages.length,1);
});
test('clinical status cannot inject markup and supplied subjects cannot inject headers',async()=>{
 const f=fixture();const m=medicineEmailTemplates.clinicalStatus({status:'<img src=x onerror=alert(1)>'});assert.doesNotMatch(m.html,/<img/);assert.match(m.html,/&lt;img/);
 await sendTransactionalEmail(f.env,{to:'fictional@example.test',eventType:'support',subject:'SHIFT\r\nBcc: other@example.test'});assert.doesNotMatch(f.messages[0].subject,/[\r\n]/);
});
test('deduplicated recipients each retain provider evidence without claiming an inbox receipt',async()=>{
 const f=fixture();const result=await sendTransactionalEmail(f.env,{to:'ORDERS@shiftsometimber.co.uk',eventType:'order_confirmation',internalNotify:true,includeMatt:true});assert.equal(f.messages.length,3);assert.equal(f.events.length,3);assert(result.every(r=>r.auditRecorded===true&&r.receiptVerified===false));
});
