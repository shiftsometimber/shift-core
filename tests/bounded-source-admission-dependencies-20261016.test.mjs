import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runBoundedChecks} from '../release/bounded-source-checks-20261016.mjs';

const quote=value=>"'"+value.replaceAll("'","'\"'\"'")+"'";
async function fixture(run){
 const root=mkdtempSync(join(tmpdir(),'shift-launch-dependency-')),log=join(root,'events.jsonl'),child=join(root,'child.mjs');
 writeFileSync(child,"import {appendFileSync}from'node:fs';const [log,id,delay,code]=process.argv.slice(2);appendFileSync(log,JSON.stringify({id,event:'start',at:Date.now()})+'\\n');await new Promise(r=>setTimeout(r,Number(delay)));appendFileSync(log,JSON.stringify({id,event:'finish',at:Date.now()})+'\\n');process.exitCode=Number(code);\n");
 const task=(id,delay=10,code=0,requires=[])=>({id,body:[process.execPath,child,log,id,String(delay),String(code)].map(quote).join(' '),requires});
 const execute=tasks=>runBoundedChecks(tasks,{proofDir:join(root,'proof'),poolId:'admission-fixture',snapshot:()=>({head:'a'.repeat(40),tree:'b'.repeat(40)})});
 try{return await run({root,task,execute,events:()=>readFileSync(log,'utf8').trim().split('\n').map(JSON.parse)});}finally{rmSync(root,{recursive:true,force:true});}
}
test('the launch command finishes successfully before any dependent growth or source command starts',()=>fixture(async({task,execute,events})=>{
 const schedule=JSON.parse(readFileSync(new URL('../release/production-source-schedule-20261016.json',import.meta.url),'utf8'));assert.equal(schedule.tasks.length,33);for(const entry of schedule.tasks)assert.deepEqual(entry.requires,entry.id==='production-step-004'?[]:['production-step-004']);
 const tasks=[task('production-step-012',10,0,['production-step-004']),task('production-step-005',10,0,['production-step-004']),task('production-step-004',80)];
 const result=await execute(tasks);assert.equal(result.passed,true);const rows=events(),launch=rows.find(r=>r.id==='production-step-004'&&r.event==='finish');
 for(const id of ['production-step-005','production-step-012'])assert(rows.find(r=>r.id===id&&r.event==='start').at>=launch.at,'Original launch approval must finish before '+id);
 assert(result.events.every(e=>e.active<=2));
}));
test('a failed launch blocks its dependants and still completes independent checks without false successful exits',()=>fixture(async({task,execute,events})=>{
 const result=await execute([task('growth',10,0,['launch']),task('launch',20,7),task('independent',10)]);assert.equal(result.passed,false);
 const growth=result.results.find(r=>r.id==='growth');assert.equal(growth.status,'blocked');assert.equal(growth.pid,null);assert.equal(growth.exitCode,null);assert(!events().some(r=>r.id==='growth'));assert.equal(result.results.find(r=>r.id==='independent').status,'passed');
}));
test('unknown duplicate self and cyclic prerequisites reject before a child can execute',()=>fixture(async({task,execute})=>{
 for(const tasks of [[task('a',1,0,['missing'])],[task('a',1,0,['a'])],[task('a',1,0,['b','b']),task('b')],[task('a',1,0,['b']),task('b',1,0,['a'])]])await assert.rejects(execute(tasks));
}));
