import {execFileSync} from 'node:child_process';
import {PURGE_EXPIRED_SQL} from './server.mjs';
import {assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';
await assertCurrentMain();
if(!PURGE_EXPIRED_SQL.startsWith("UPDATE audit_log SET metadata=json_remove(metadata,'$.acquisition') WHERE action='auth.register'"))throw Error('Unexpected retention operation');
const result=JSON.parse(execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',PURGE_EXPIRED_SQL],{encoding:'utf8',timeout:60000,maxBuffer:1048576}));
if(!Array.isArray(result)||!result.every(x=>x.success))throw Error('Attribution expiry not verified');
console.log(JSON.stringify({ok:true,scope:'Expired optional acquisition metadata only',changed:result.reduce((n,x)=>n+Number(x.meta?.changes||0),0)}));
