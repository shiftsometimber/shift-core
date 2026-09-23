import assert from 'node:assert/strict';
// Keep the reviewed UPDATE and its audit statement exactly equivalent, while
// binding text separately to stay below D1's SQL statement-length limit.
export function parameterizedCorrection(original){
 const lines=original.split('\n').filter(x=>x&&!x.startsWith('--'));
 assert.equal(lines.length,2);assert(lines[0].startsWith('UPDATE radar_events SET '));assert(lines[1].startsWith('INSERT INTO radar_audit('));
 const batch=lines.map(line=>{
  const params=[];
  const sql=line.replace(/'(?:''|[^'])*'/g,quoted=>{params.push(quoted.slice(1,-1).replaceAll("''","'"));return '?';});
  assert(params.length<=100);assert(Buffer.byteLength(sql)<100000);
  let i=0;assert.equal(sql.replace(/\?/g,()=>"'"+params[i++].replaceAll("'","''")+"'"),line,'Bound query must reconstruct the exact approved SQL');
  return {sql,params};
 });
 // D1 also restricts compound SELECT terms. Produce the same thirteen audit
 // rows from one JSON list instead of thirteen UNION ALL branches.
 const audit=batch[1],prefix='INSERT INTO radar_audit(event_id,action,actor,detail_json) ';
 assert(audit.sql.startsWith(prefix));
 const terms=audit.sql.slice(prefix.length).replace(/;$/,'').split(' UNION ALL ');
 assert.equal(terms.length,13);
 const ids=terms.map(term=>{const m=term.match(/^SELECT (\d+),\?,\?,\? WHERE changes\(\)=13$/);assert(m);return Number(m[1]);});
 assert.equal(new Set(ids).size,13);assert.equal(audit.params.length,39);
 const values=audit.params.slice(0,3);for(let i=0;i<13;i++)assert.deepEqual(audit.params.slice(i*3,i*3+3),values);
 batch[1]={sql:prefix+'SELECT CAST(value AS INTEGER),?,?,? FROM json_each(?) WHERE changes()=13;',params:[...values,JSON.stringify(ids)]};
 return {batch};
}
