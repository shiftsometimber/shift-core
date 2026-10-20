import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customerCopyIssues} from '../customer-copy-quality.mjs';
import {renderHealthProduct,healthProducts} from '../shift-health-public-content.mjs';
import {testosteroneContent} from '../testosterone-public-content.mjs';
import {pages} from '../shift-coach/public-trust-repair.mjs';

test('publication rejects internal instructions and unfinished placeholders',()=>{
 for(const copy of ['TODO: agree fees','Internal note: call supplier','[Insert price]','Confirm with the partner before publishing.','The checkout must explain the assessment fee.','Provider arrangements must be confirmed before ordering opens.','Needs editorial approval.'])assert.deepEqual(customerCopyIssues(copy),['internal_working_copy'],copy);
});
test('real customer questions, safety instructions and research uncertainty remain valid',()=>{
 for(const copy of ['What happens if treatment is declined?','Ask your prescriber about the benefits and risks.','Clinical approval is required before treatment.','No stock available today.','The study proposed a new explanation.','Follow the instructions supplied with your medicine.','Your consent must be confirmed before sharing health information.'])assert.deepEqual(customerCopyIssues(copy),[],copy);
});
test('all health guides retain unavailable ordering and substantive questions without internal instructions',()=>{
 for(const slug of Object.keys(healthProducts)){
  const html=slug==='testosterone-energy'?testosteroneContent:renderHealthProduct(slug);
  assert.match(html,/No stock available today/);assert.deepEqual(customerCopyIssues(html),[],slug);
  assert.doesNotMatch(html,/PROPOSED SCOPE|subject to confirmation|arrangements (?:must be|to be) confirmed|>To be confirmed</i,slug);
  assert.match(html,/<(?:summary|h2)[\s>]/,slug);
 }
});
test('sale terms and refunds keep closure, privacy and statutory rights without invented deductions',()=>{
 for(const path of ['/terms-of-sale','/refunds']){
  const html=pages[path][1];assert.deepEqual(customerCopyIssues(html),[],path);
  assert.match(html,/not (?:currently |)(?:accepting|open)|not currently open/);
  assert.match(html,/statutory rights/);assert.match(html,/Do not (?:include|send).*card details/);
  assert.doesNotMatch(html,/must (?:state|explain)|before.*checkout opens|admin(?:istration)? fee/i);
 }
});
