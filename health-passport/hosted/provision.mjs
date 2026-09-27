import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const file='health-passport/hosted/generated/config.json',name='shift-passport-preview-auth-20260919';
const run=args=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:16e6});
const config=JSON.parse(readFileSync(file)),production=readFileSync('wrangler.jsonc','utf8');
if(config.name!=='shift-passport-preview-20260919'||config.vars.SHIFT_ENVIRONMENT!=='passport-hosted-20260919'||config.routes||config.services||config.send_email||config.ai||config.triggers||config.durable_objects||config.vars.HEALTH_PASSPORT_V1_ENABLED!=='true'||config.d1_databases.length)throw Error('Unsafe preview config');
let list=JSON.parse(run(['d1','list','--json'])),matches=list.filter(x=>x.name===name);
if(!matches.length){run(['d1','create',name,'--location','weur']);list=JSON.parse(run(['d1','list','--json']));matches=list.filter(x=>x.name===name)}
if(matches.length!==1)throw Error('Ambiguous isolated database');
const id=matches[0].uuid||matches[0].database_id||matches[0].id;
if(!/^[a-f0-9-]{36}$/.test(id)||production.includes(id)||matches[0].name!==name)throw Error('Unsafe database identity');
config.d1_databases=[{binding:'DB',database_name:name,database_id:id}];writeFileSync(file,JSON.stringify(config,null,2));
run(['d1','execute','DB','--remote','--file','health-passport/hosted/generated/auth.sql','--config',file]);
const proof=JSON.parse(run(['d1','execute','DB','--remote','--command',"SELECT name FROM sqlite_master WHERE name IN ('health_passport_records','idx_health_passport_member','users','user_auth','user_sessions') ORDER BY name",'--json','--config',file]));
const names=proof.flatMap(x=>x.results||[]).map(x=>x.name);if(names.length!==5)throw Error('Isolated schema proof failed');
writeFileSync('passport-hosted-proof/database.json',JSON.stringify({databaseName:name,schemaObjects:names,productionDatabaseExcluded:true,migration:'additive Passport schema in separately named preview database only'},null,2));
console.log('Only separately named Passport preview D1 was initialised; production excluded.');
