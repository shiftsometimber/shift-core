import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='work/staging/generated/config.json',config=JSON.parse(readFileSync(path));
if(config.name!=='shift-core-work-staging'||config.routes||config.vars.SHIFT_ENVIRONMENT!=='work-staging-20260912')throw Error('AI proof must use isolated staging');
config.ai={binding:'AI'};
writeFileSync(path,JSON.stringify(config,null,2));
// Obtain real observations. Retrieval failures stay failures and cannot approve
// sources. This only appends to the separately provisioned staging database.
const observations='work/staging/generated/watch-observations.sql';
execFileSync(process.execPath,['medicines-watch/bootstrap.mjs',observations],{stdio:'inherit'});
appendFileSync('work/staging/generated/auth.sql','\n'+readFileSync('medicines-watch/migration.sql','utf8')+'\n'+readFileSync(observations,'utf8'));
