import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function renderHealthTestConfig(template,productionConfig,databaseId){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId||''))throw Error('Provide the UUID of the newly created isolated health-test database.');
 const productionIds=[...productionConfig.matchAll(/"database_id"\s*:\s*"([0-9a-f-]{36})"/gi)].map(x=>x[1].toLowerCase());
 if(!productionIds.length)throw Error('Production database IDs could not be checked; no configuration written.');
 if(productionIds.includes(databaseId.toLowerCase()))throw Error('Production database binding rejected.');
 const config=JSON.parse(template.replace('__NEW_ISOLATED_HEALTH_TEST_DATABASE_ID__',databaseId));
 if(config.name!=='shift-my-timber-health-test'||config.d1_databases?.length!==1||config.d1_databases[0].database_name!=='shift-my-timber-health-test-db'||config.routes)throw Error('Unexpected health-test configuration.');
 return JSON.stringify(config,null,2)+'\n';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const template=readFileSync(path.join(root,'health-test/wrangler.template.jsonc'),'utf8');
 const production=readFileSync(path.join(root,'../wrangler.jsonc'),'utf8');
 const output=renderHealthTestConfig(template,production,process.argv[2]);
 writeFileSync(path.join(root,'health-test/wrangler.health-test.json'),output);
 console.log('Separate health-test configuration written. No database or service was created or deployed.');
}
