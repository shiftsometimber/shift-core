import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const name='shift-treatment-preview-37739991995',id='efc0b7f3-c127-4326-accb-092e4934c15f';
const config={name:'shift-my-treatment-preview',main:'worker.mjs',compatibility_date:'2026-08-09',compatibility_flags:['nodejs_compat'],workers_dev:true,triggers:{crons:['* * * * *']},vars:{SHIFT_ENVIRONMENT:'treatment-preview-20261008',MY_TREATMENT_PREVIEW_ENABLED:'true',EXPIRES_AT:new Date(Date.now()+3*86400000).toISOString()},d1_databases:[{binding:'DB',database_name:name,database_id:id}]};fs.writeFileSync('preview/my-treatment/generated.json',JSON.stringify(config,null,2));

execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute',name,'--remote','--config','preview/my-treatment/generated.json','--file','member-experience/treatment.sql'],{stdio:'inherit'});
