import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from './independent-presentation-pins-20261025.json' with {type:'json'};
const hash=s=>createHash('sha256').update(s).digest('hex');
export function validateIndependentPresentation(html,headers,policy){
 assert.equal(headers.get(policy.versionHeader),policy.version,'Independently approved presentation version changed');
 const mains=[...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/gi)];assert.equal(mains.length,1,'One independently approved main required');
 assert.equal(hash(mains[0][1]),policy.mainSHA256,'Independently approved complete main content changed');assert.equal(Buffer.byteLength(mains[0][1]),policy.mainBytes);
 assert.equal(html.split(policy.styleOpen).length,2,'One exact independently approved presentation stylesheet required');
 const style=html.slice(html.indexOf(policy.styleOpen)+policy.styleOpen.length).split('</style>')[0];assert.equal(hash(style),policy.styleSHA256,'Independently approved complete stylesheet changed');assert.equal(Buffer.byteLength(style),policy.styleBytes);
 return {source:policy.source,version:policy.version,mainSHA256:policy.mainSHA256,styleSHA256:policy.styleSHA256,sourcePolicySHA256:hash(JSON.stringify(policy)),comparison:'entire_raw_response_must_remain_byte_identical'};
}
export function independentPresentationEvidence(path,input,headers){
 const policy=pins[path];if(!policy)return null;
 // Earlier Core-native pages keep every original legacy assertion. These three
 // separately commissioned presentations replace that old main altogether.
 // Authenticate their complete approved main/style and compare ALL delivered
 // response bytes before/after. Do not invent historical controls as present.
 if(headers.get(policy.versionHeader)===null)return null;
 const html=input.toString('utf8');assert(Buffer.from(html).equals(input),'UTF-8 presentation required');return validateIndependentPresentation(html,headers,policy);
}
export function assertIndependentPresentationsPreserved(pages,baseline){
 assert.deepEqual(pages.map(x=>x.path),baseline.map(x=>x.path),'All original public preservation paths/order required');
 for(let i=0;i<pages.length;i++){
  const current=pages[i],before=baseline[i],policy=pins[current.path];
  if(!policy){assert(!current.independentPresentation&&!before.independentPresentation,'Foreign presentation exception forbidden');continue;}
  if(!current.independentPresentation&&!before.independentPresentation)continue;
  assert(current.independentPresentation&&before.independentPresentation,'Independent presentation boundary changed');
  assert.deepEqual(current.independentPresentation,before.independentPresentation,'Approved presentation identity changed');assert.equal(current.independentPresentation.sourcePolicySHA256,hash(JSON.stringify(policy)));
  assert.equal(current.status,200);assert.equal(before.status,200);assert.equal(current.sha256,before.sha256,current.path+' complete independently owned public response changed');assert.equal(current.bytes,before.bytes,current.path+' public response size changed');
 }
 return pages.filter(x=>!x.independentPresentation);
}
