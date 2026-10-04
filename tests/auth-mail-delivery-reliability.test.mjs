import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {recordAuthDelivery} from '../auth-delivery-v1.js';
import {handleAuthRecovery} from '../auth-recovery-v1.js';

function fixture({auditFailure=false,insertFailure=false,tokenFailure=false,rejected=false}={}){
 const sent=[],audits=[],tokens=[];
 const DB={
  async exec(){if(auditFailure)throw Error('fictional audit failure')},
  prepare(sql){return{bind(...args){return{
   async first(){if(sql.startsWith('SELECT id,email,first_name'))return{id:901,email:'fictional@example.test',first_name:'Fictional <name>'};return null},
   async run(){if(sql.includes('auth_delivery_events')){if(insertFailure)throw Error('fictional insert failure');audits.push(args);return{meta:{changes:1}}}if(tokenFailure)throw Error('token storage unavailable');tokens.push({sql,args});return{meta:{changes:1}}}
  }}}}
 };
 return{DB,sent,audits,tokens,env:{DB,EMAIL:{async send(message){sent.push(message);if(rejected)throw Object.assign(Error('fictional rejection'),{code:'E_RATE_LIMIT_EXCEEDED'});return{messageId:'fictional-provider-id'}}}}};
}
const request=()=>new Request('https://api.shiftsometimber.co.uk/v1/auth/request-password-reset',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify({email:'fictional@example.test'})});

test('successful auth audit records a hashed address and provider reference',async()=>{
 const f=fixture();const result=await recordAuthDelivery(f.DB,{userId:901,email:' Fictional@Example.Test ',eventType:'password_reset',status:'sent',providerId:'fictional-provider-id'});
 assert.deepEqual(result,{recorded:true});assert.equal(f.audits.length,1);assert.equal(f.audits[0][1],createHash('sha256').update('fictional@example.test').digest('hex'));assert.equal(f.audits[0][4],'fictional-provider-id');
});
test('audit schema and insert outages report failed persistence without throwing',async()=>{
 for(const options of [{auditFailure:true},{insertFailure:true}]){const f=fixture(options);assert.deepEqual(await recordAuthDelivery(f.DB,{email:'fictional@example.test',eventType:'password_reset',status:'sent'}),{recorded:false});}
});
test('accepted reset email survives an audit outage and uses the My Timber reply route',async()=>{
 const f=fixture({auditFailure:true});const r=await handleAuthRecovery(request(),f.env,{},()=>{throw Error('unexpected next')});
 assert.equal(r.status,200);assert.equal(f.sent.length,1);assert.equal(f.tokens.length,2);assert.equal(f.sent[0].subject,'Reset your My Timber password');assert.equal(f.sent[0].replyTo,'support@shiftsometimber.co.uk');assert.match(f.sent[0].html,/Fictional &lt;name&gt;/);assert.match(f.sent[0].text,/expires in 30 minutes/);
});
test('provider rejection and missing binding preserve the generic non-enumerating reset response during audit outages',async()=>{
 for(const noBinding of [false,true]){const f=fixture({auditFailure:true,rejected:true});if(noBinding)delete f.env.EMAIL;const r=await handleAuthRecovery(request(),f.env,{},()=>{});assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,message:'If that account exists, reset instructions will be sent shortly.'});assert.equal(f.sent.length,noBinding?0:1);}
});
test('token-store failure remains fail closed and sends no reset email',async()=>{
 const f=fixture({tokenFailure:true});await assert.rejects(handleAuthRecovery(request(),f.env,{},()=>{}),/token storage unavailable/);assert.equal(f.sent.length,0);
});
test('verified-account welcome uses My Timber wording and the existing support mailbox',async()=>{
 const f=fixture({auditFailure:true});const req=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'fictional@example.test'})});
 const r=await handleAuthRecovery(req,f.env,{},async()=>Response.json({user:{id:901,email:'fictional@example.test',firstName:'Fictional'},emailVerified:true},{status:201}));assert.equal(r.status,201);assert.equal(f.sent.length,1);assert.equal(f.sent[0].subject,'Welcome to My Timber');assert.equal(f.sent[0].replyTo,'support@shiftsometimber.co.uk');assert.doesNotMatch(f.sent[0].html,/My Shift/);
});

test('registration and verification keep their complete security lifecycle during an audit outage',()=>{const output=execFileSync(process.execPath,['gate1-email-verification-e2e.mjs'],{encoding:'utf8',env:{...process.env,AUTH_DELIVERY_AUDIT_FAILURE:'1'}});assert.match(output,/email verification e2e passed/);});
