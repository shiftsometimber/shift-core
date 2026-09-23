import assert from 'node:assert/strict';
// Keep the reviewed UPDATE and its audit statement exactly equivalent, while
// binding text separately to stay below D1's SQL statement-length limit.
export function parameterizedCorrection(original){
 const lines=original.split('\n').filter(x=>x&&!x.startsWith('--'));
 assert.equal(lines.length,2);assert(lines[0].startsWith('UPDATE radar_events SET '));assert(lines[1].startsWith('INSERT INTO radar_audit('));
 return {batch:lines.map(line=>{
  const params=[];
  const sql=line.replace(/'(?:''|[^'])*'/g,quoted=>{params.push(quoted.slice(1,-1).replaceAll("''","'"));return '?';});
  assert(params.length<=100);assert(Buffer.byteLength(sql)<100000);
  let i=0;assert.equal(sql.replace(/\?/g,()=>"'"+params[i++].replaceAll("'","''")+"'"),line,'Bound query must reconstruct the exact approved SQL');
  return {sql,params};
 })};
}
