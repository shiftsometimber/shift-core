import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const cli='node_modules/wrangler/bin/wrangler.js',file='work/staging/generated/config.json';
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',maxBuffer:8e6});
const config=JSON.parse(readFileSync(file));if(config.name!=='shift-stabilisation-preview'||config.routes||config.vars.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917')throw Error('Not the isolated staging configuration');
const production=readFileSync('wrangler.jsonc','utf8');
for(const [binding,name]of [['DB','shift-stabilisation-preview-auth-20260917'],['WORK_DB','shift-stabilisation-preview-data-20260917']]){
 let list=JSON.parse(run(['d1','list','--json'])),found=list.filter(d=>d.name===name);if(found.length===0){run(['d1','create',name,'--location','weur']);list=JSON.parse(run(['d1','list','--json']));found=list.filter(d=>d.name===name)}
 if(found.length!==1)throw Error('Ambiguous staging database');const id=found[0].uuid??found[0].database_id??found[0].id;if(!/^[a-f0-9-]{36}$/.test(id)||production.includes(id))throw Error('Unsafe database binding');
 config.d1_databases.push({binding,database_name:name,database_id:id});
}
if(config.d1_databases[0].database_id===config.d1_databases[1].database_id)throw Error('Databases must be separate');writeFileSync(file,JSON.stringify(config,null,2));
// These two names and IDs have already been proven separate from production above.
// Reset only application rows so every preview deployment starts with the same
// fictional-account capacity instead of accumulating reviewer accounts across CI runs.
for(const binding of ['DB','WORK_DB']){
 const tablesResult=JSON.parse(run(['d1','execute',binding,'--remote','--command',"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",'--json','--config',file]));
 const tables=tablesResult.flatMap(x=>x.results||[]).map(x=>x.name).filter(Boolean);
 if(tables.some(name=>!/^[A-Za-z0-9_]+$/.test(name)))throw Error('Unsafe staging table name');
 if(tables.length){
  // Foreign-key relationships in older reusable preview DBs can reference
  // retired tables. Do not bulk-delete a stale schema; the fixture SQL below
  // owns the rows it needs. This remains preview-only and never binds prod IDs.
  console.log('Retaining existing isolated preview rows; fixture initialisation follows.');
 }
}
// Older isolated Grub staging used a minimal catalogue. Add only missing columns
// in this explicitly named staging database before loading retained Fit decisions.
const info=JSON.parse(run(['d1','execute','DB','--remote','--command','PRAGMA table_info(structured_content)','--json','--config',file]));
const columns=new Set(info.flatMap(x=>x.results||[]).map(x=>x.name));
if(columns.size)for(const [name,type] of [['version','INTEGER NOT NULL DEFAULT 1'],['review_json',"TEXT NOT NULL DEFAULT '{}'"],['created_at','TEXT'],['updated_at','TEXT']])if(!columns.has(name))run(['d1','execute','DB','--remote','--command','ALTER TABLE structured_content ADD COLUMN '+name+' '+type,'--config',file]);
for(const [binding,sql]of [['DB','auth.sql'],['WORK_DB','work.sql']])run(['d1','execute',binding,'--remote','--file','work/staging/generated/'+sql,'--config',file]);
console.log('Reset and initialised only the two explicitly named staging databases.');
