import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('export async function loadRadarReviewRows('),source.indexOf('\nasync function queue(',source.indexOf('export async function loadRadarReviewRows('))).replace('export ','');
const load=vm.runInNewContext(code+';loadRadarReviewRows');
function db(rows,selected){const queries=[];return {queries,prepare(sql){queries.push({sql});return {async all(){return{results:rows}},bind(id){queries.at(-1).id=id;return{async first(){return selected?.id===id?selected:null}}}}}}}
test('exact old event is retrieved beyond the unchanged 250-row queue',async()=>{const rows=Array.from({length:250},(_,i)=>({id:1000+i})),DB=db(rows,{id:283,status:'published'});const r=await load(DB,'283');assert.equal(r.rows.length,251);assert.equal(r.rows[0].id,283);assert.equal(r.selectedId,283);assert.equal(DB.queries[1].id,283);assert.match(DB.queries[0].sql,/LIMIT 250/);assert.match(DB.queries[1].sql,/WHERE id=\?/);assert.equal(rows.length,250);});
test('already present and absent selected events do not duplicate rows',async()=>{let DB=db([{id:283}],{id:283});assert.equal((await load(DB,'283')).rows.length,1);assert.equal(DB.queries.length,1);DB=db([{id:1}],null);assert.equal((await load(DB,'283')).rows.length,1);});
test('invalid event input cannot become a broad or interpolated query',async()=>{for(const input of [null,'0','-1','283 OR 1=1','1.1','9007199254740993']){const DB=db([{id:1}],{id:283});const r=await load(DB,input);assert.equal(r.selectedId,null);assert.equal(DB.queries.length,1);}});
test('authenticated read retains changed-source mapping and existing visibility filter',()=>{assert.ok(source.indexOf("const a=await hqUser")<source.indexOf("return queue(env,u.searchParams"));assert.match(source,/rows.filter\(row=>Number\(row.id\)===selectedId\|\|isVisibleRadarReviewRow\(row\)\)/);assert.match(source,/source_change:publicSourceChange\(changes.get\(row.id\)\)/);});
