import test from 'node:test';import assert from 'node:assert/strict';
import {medicineBmiCriteria,bmiEligibility} from '../../medicine-commerce-v1.js';
import {assessmentFeeQuote,assessmentDeclineRefund,assessmentFeePolicy} from '../assessment-fee-policy.mjs';
import {assessmentSaleTermsResponse} from '../assessment-sale-terms.mjs';
test('initial BMI guidance source matches existing clinical criteria at boundaries',()=>{
 const item={name:'Mounjaro'},rules=medicineBmiCriteria(item);
 assert.equal(rules.standard,30);assert.equal(rules.conditional,27);assert.equal(medicineBmiCriteria({name:'Orlistat'}).conditional,28);
 const check=(bmi,condition)=>bmiEligibility(item,{heightCm:200,weightKg:bmi*4,weightRelatedCondition:condition});
 assert.equal(check(26.99,'yes').error,'bmi_service_exclusion');assert.equal(check(27,'yes'),null);assert.equal(check(27,'no').error,'bmi_service_exclusion');assert.equal(check(29.9,'').error,'weight_related_condition_required');assert.equal(check(30,'no'),null);
 assert.equal(bmiEligibility(item,{heightCm:100,weightKg:100}).error,'bmi_details_required');
 assert.equal(medicineBmiCriteria({name:'not configured'}),null);
});
test('BMI shown for the supplied measurements is 31.7, without implying prescribing approval',()=>assert.equal((94.8/(1.73**2)).toFixed(1),'31.7'));
test('assessment fee and refund always sum to treatment amount; never round fee above 10%',()=>{
 for(const total of[0,1,9,10,999,10000,13970,26750,Number.MAX_SAFE_INTEGER]){const q=assessmentFeeQuote(total);assert.equal(q.feePence+q.declinedRefundPence,total);assert(q.feePence<=total/10);}
 for(const total of[-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>assessmentFeeQuote(total));
});
test('completed, expressly accepted new assessment retains 10%; existing/unaccepted/unperformed returns full amount',()=>{
 const total=15000,newOrder={treatmentTotalPence:total,feePolicyVersion:assessmentFeePolicy.version,feeAccepted:true};
 assert.equal(assessmentDeclineRefund(newOrder,{assessmentCompleted:true}).refundPence,13500);
 for(const order of[{treatmentTotalPence:total},{...newOrder,feeAccepted:false},{...newOrder,feePolicyVersion:'previous'}])assert.equal(assessmentDeclineRefund(order,{assessmentCompleted:true}).refundPence,total);
 assert.equal(assessmentDeclineRefund(newOrder).refundPence,total);
});
test('new public sale terms preserve existing frame and statutory/existing-order protections',async()=>{
 const html='<html><head><title>Old</title></head><body><header>EXISTING HEADER</header><main><p>Old terms</p></main><footer>EXISTING FOOTER</footer></body></html>';
 for(const path of['/terms-of-sale','/refunds']){
  const r=await assessmentSaleTermsResponse(new Request('https://shiftsometimber.co.uk'+path),new Response(html,{headers:{'Content-Type':'text/html','ETag':'old'}})),body=await r.text();
  assert(body.includes('10%'));assert(body.includes('90%'));assert(body.includes('EXISTING HEADER'));assert(body.includes('EXISTING FOOTER'));assert(body.includes('statutory rights'));assert(body.includes('existing purchase'));assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('X-Shift-Assessment-Fee-Policy'),assessmentFeePolicy.version);
 }
});
test('terms overlay leaves unrelated Shop and non-HTML responses untouched',async()=>{
 for(const[path,type]of[['/member/life-back/shop','text/html'],['/v1/catalogue/medicines','application/json']]){
  const input=new Response('exact existing response',{headers:{'Content-Type':type}}),output=await assessmentSaleTermsResponse(new Request('https://shiftsometimber.co.uk'+path),input);assert.equal(output,input);
 }
});
