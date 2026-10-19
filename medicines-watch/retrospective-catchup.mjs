import review from './reviews/2026-10-19-retrospective-catchup.json' with {type:'json'};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Bounded corrections retain the old programme review date. Each complete
// before-image stays in the evidence record for historical receipt qualification.
export function retrospectiveIndustry(entries){
 const changed=new Set();
 const result=entries.map(entry=>{
  const correction=review.changes.find(x=>x.id===entry.id);
  if(!correction)return entry;
  if(!equal(entry,correction.before))throw Error('Retrospective programme before-image drift: '+entry.id);
  changed.add(entry.id);return correction.after;
 });
 if(changed.size!==review.changes.length)throw Error('Missing retrospective programme');
 if(result.some(x=>x.id===review.cbl514Candidate.id))throw Error('Duplicate CBL-514 owner');
 return [...result,review.cbl514Candidate];
}
export function retrospectiveSources(entries){
 const changed=new Set();
 const result=entries.map(source=>{
  const correction=review.registryResponses.find(x=>x.id===source.id);
  if(!correction)return source;
  if(!equal(source,correction.source)&&!equal(source,correction.afterSource))throw Error('Retrospective source before-image drift: '+source.id);
  changed.add(source.id);return correction.afterSource;
 });
 if(changed.size!==review.registryResponses.length)throw Error('Missing retrospective source');
 for(const entry of review.newRegistrySources){const existing=result.find(x=>x.id===entry.source.id);if(existing&&!equal(existing,entry.source))throw Error('CBL-514 source drift');if(!existing)result.push(entry.source);}
 return result;
}

export function industryBeforeRetrospective(entries){
 return entries.filter(entry=>{
  if(entry.id!==review.cbl514Candidate.id)return true;
  if(!equal(entry,review.cbl514Candidate))throw Error('CBL-514 before-image drift');
  return false;
 }).map(entry=>{
  const change=review.changes.find(x=>x.id===entry.id);
  if(!change)return entry;
  if(!equal(entry,change.after)&&!equal(entry,change.before))throw Error('Retrospective inverse programme drift');
  return change.before;
 });
}
export function sourcesBeforeRetrospective(entries){
 return entries.filter(source=>{
  const added=review.newRegistrySources.find(x=>x.source.id===source.id);
  if(!added)return true;
  if(!equal(source,added.source))throw Error('CBL-514 inverse source drift');
  return false;
 }).map(source=>{
  const change=review.registryResponses.find(x=>x.id===source.id);
  if(!change)return source;
  if(!equal(source,change.afterSource)&&!equal(source,change.source))throw Error('Retrospective inverse source drift');
  return change.source;
 });
}
