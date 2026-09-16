import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const functionSource=source.slice(source.indexOf('async function ensureSchema(DB)'),source.indexOf('\nfunction parseMemberState('));
function fixture({missingLast=false,probeError=false}={}){
  const probes=[],ddl=[],warnings=[];
  const ensure=runInNewContext('let schemaReady=false;'+functionSource+';ensureSchema',{console:{warn:(...args)=>warnings.push(args)}});
  const DB={prepare(sql){
    if(sql.startsWith('SELECT COUNT(*) AS count FROM sqlite_master'))return{bind(...names){
      assert(names.length<=100,'D1 permits at most 100 parameters per query');
      assert.equal((sql.match(/\?/g)||[]).length,names.length);
      probes.push(names);
      return{async first(){if(probeError)throw Error('Read unavailable');return{count:names.length-(missingLast&&names.includes('idx_cases_user')?1:0)}}};
    }};
    return{async run(){ddl.push(sql);return{success:true}}};
  }};
  return{ensure,DB,probes,ddl,warnings};
}
test('cold request checks every schema object within the D1 bound limit without DDL',async()=>{
  const f=fixture();await f.ensure(f.DB);
  const names=f.probes.flat();assert(names.length>100);assert.equal(new Set(names).size,names.length);
  assert(names.includes('assessment_answers'));assert(names.includes('idx_cases_user'));
  assert.equal(f.ddl.length,0);assert.equal(f.warnings.length,0);
  const count=f.probes.length;await f.ensure(f.DB);assert.equal(f.probes.length,count,'warm request should reuse verified readiness');
});
test('missing object in the final probe retains the full idempotent bootstrap',async()=>{
  const f=fixture({missingLast:true});await f.ensure(f.DB);
  assert(f.probes.length>1);assert(f.ddl.length>100);
  assert(f.ddl.some(sql=>sql.startsWith('CREATE INDEX IF NOT EXISTS idx_cases_user')));
});
test('probe error retains the full bootstrap rather than assuming readiness',async()=>{
  const f=fixture({probeError:true});await f.ensure(f.DB);
  assert.equal(f.warnings.length,1);assert(f.ddl.length>100);
});
