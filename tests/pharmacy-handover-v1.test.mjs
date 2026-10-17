import test from 'node:test';
import assert from 'node:assert/strict';
import {pharmacyRequest,secureResumeUrl,acceptedReceipt} from '../pharmacy-handover-v1.mjs';

test('transport timeout aborts the request and reports uncertain delivery without exposing the error',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async(_,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(Error('private provider error')),{once:true}));
  try{await assert.rejects(()=>pharmacyRequest({PHARMACY_INTEGRATION_SECRET:'synthetic'},'https://pharmacy.example.test/intake',{},'SCI-test',{timeoutMs:15}),error=>error.code==='pharmacy_delivery_unconfirmed'&&error.uncertain&&!error.message.includes('private'));}finally{globalThis.fetch=original;}
});
for(const endpoint of ['http://pharmacy.example.test/intake','https://user:secret@pharmacy.example.test/intake','https://pharmacy.example.test/intake?email=private','https://pharmacy.example.test/#private'])test('credentials never reach an unsafe configured endpoint: '+new URL(endpoint).protocol,async()=>{
  const original=globalThis.fetch;let sent=false;globalThis.fetch=async()=>{sent=true;throw Error('unexpected');};
  try{await assert.rejects(()=>pharmacyRequest({PHARMACY_INTEGRATION_SECRET:'synthetic'},endpoint,{},'test'),/pharmacy_configuration_invalid/);assert.equal(sent,false);}finally{globalThis.fetch=original;}
});
test('oversized provider response is rejected rather than cut to a different identifier',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({reference:'x'.repeat(70000)});
  try{await assert.rejects(()=>pharmacyRequest({PHARMACY_INTEGRATION_SECRET:'synthetic'},'https://pharmacy.example.test/intake',{},'test'),/pharmacy_response_invalid/);}finally{globalThis.fetch=original;}
});
test('provider references and secure portal identity are explicit',()=>{
  assert.throws(()=>acceptedReceipt({reference:' internal ID ',status:'verified'}));
  assert.throws(()=>acceptedReceipt({reference:'ok',verified:true}));
  assert.equal(acceptedReceipt({reference:'CASE-1',patientReference:'PATIENT-1',verified:true}).status,'verified');
  assert.equal(secureResumeUrl('https://portal.example.test/questions?session=opaque','https://portal.example.test'),'https://portal.example.test/questions?session=opaque');
  assert.throws(()=>secureResumeUrl('https://portal.example.test.evil.example/questions','https://portal.example.test'));
});
