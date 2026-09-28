import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const path='work/staging/generated/config.json',config=JSON.parse(readFileSync(path));
if(config.name!=='shift-stabilisation-preview'||config.routes||config.vars.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917')throw Error('Not isolated preview');
config.main='../../../preview/app-layout/worker.mjs';config.compatibility_flags=['nodejs_compat'];
writeFileSync(path,JSON.stringify(config,null,2));mkdirSync('work/staging/generated/app-layout-evidence',{recursive:true});
