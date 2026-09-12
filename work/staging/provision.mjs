import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const cli='node_modules/wrangler/bin/wrangler.js',file='work/staging/generated/config.json';
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',maxBuffer:8e6});
const config=JSON.parse(readFileSync(file));if(config.name!=='shift-core-work-staging'||config.routes||config.vars.SHIFT_ENVIRONMENT!=='work-staging-20260912')throw Error('Not the isolated staging configuration');
const production=readFileSync('wrangler.jsonc','utf8');
for(const [binding,name]of [['DB','shift-core-work-staging-auth-20260912'],['WORK_DB','shift-core-work-staging-data-20260912']]){
 let list=JSON.parse(run(['d1','list','--json'])),found=list.filter(d=>d.name===name);if(found.length===0){run(['d1','create',name,'--location','weur']);list=JSON.parse(run(['d1','list','--json']));found=list.filter(d=>d.name===name)}
 if(found.length!==1)throw Error('Ambiguous staging database');const id=found[0].uuid??found[0].database_id??found[0].id;if(!/^[a-f0-9-]{36}$/.test(id)||production.includes(id))throw Error('Unsafe database binding');
 config.d1_databases.push({binding,database_name:name,database_id:id});
}
if(config.d1_databases[0].database_id===config.d1_databases[1].database_id)throw Error('Databases must be separate');writeFileSync(file,JSON.stringify(config,null,2));
for(const [binding,sql]of [['DB','auth.sql'],['WORK_DB','work.sql']])run(['d1','execute',binding,'--remote','--file','work/staging/generated/'+sql,'--config',file]);
console.log('Initialised only the two explicitly named staging databases.');
