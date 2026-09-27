// Seed observation state through the existing production D1 deployment credential.
// Never approves source changes or modifies medicine/reference content.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import {checkSources,readWatchHealth} from './monitor.mjs';
import {observationInsert} from './observations.mjs';
const output=process.argv[2];
if(!output)throw Error('Supply a SQL output path');
const sqlite=new DatabaseSync(':memory:');
const DB={exec:async sql=>sqlite.exec(sql),prepare(sql){let values=[];return {
 bind(...args){values=args;return this},
 async run(){const r=sqlite.prepare(sql).run(...values);return {meta:{changes:r.changes}}},
 async all(){return {results:sqlite.prepare(sql).all(...values)}}
}}};
const result=await checkSources({DB});
const rows=sqlite.prepare('SELECT * FROM medicines_watch_checks').all();
const sql=rows.map(observationInsert).join('\n');
writeFileSync(output,sql+'\n');
writeFileSync(output+'.json',JSON.stringify({result,health:await readWatchHealth({DB})},null,2));
console.log(JSON.stringify({checked:result.checked,failed:result.failed,sources:rows.length}));
sqlite.close();
