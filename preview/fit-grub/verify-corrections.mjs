import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base=process.argv[2];
assert.ok(base,'Pass the isolated preview URL');
const expected=JSON.parse(fs.readFileSync('preview/fit-grub/v3/approval.json'));
const corrections=expected.records.filter(r=>r.correctionReview);
const summary=await (await fetch(base+'/fit-guidance-summary.json')).json();
assert.equal(summary.approvedImages,300);assert.equal(summary.heldImages,0);
assert.equal(summary.movements,300);assert.equal(summary.variants,2688);
assert.equal(summary.sourceSha256,'2461d65b76efac19ef718359331cd9eb5612e21c3212dae4424526cbf7bb4817');
const records=[];
for(let offset=0;offset<corrections.length;offset+=5){
 records.push(...await Promise.all(corrections.slice(offset,offset+5).map(async record=>{
  const response=await fetch(base+record.image);
  assert.equal(response.status,200,record.id);
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
  assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);
  const bytes=Buffer.from(await response.arrayBuffer());
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256,record.sha256,record.id+' served unexpected bytes');
  return {id:record.id,status:response.status,bytes:bytes.length,sha256};
 })));
}
assert.equal(records.length,45);
fs.writeFileSync('fit-correction-proof.json',JSON.stringify({url:base,checkedAt:new Date().toISOString(),approvedImages:summary.approvedImages,heldImages:summary.heldImages,sourceSha256:summary.sourceSha256,records},null,2)+'\n');
console.log('45 hosted correction hashes match; 300 images ready, 0 image holds.');
