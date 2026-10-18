import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {PUBLIC_INDEX_FRESHNESS_SQL,reusablePublicIndex} from './app-index-freshness.mjs';
export function readCurrentPublicIndex(execute,{now=Date.now,source}={}){
 const result=execute(PUBLIC_INDEX_FRESHNESS_SQL);
 assert(Array.isArray(result)&&result.length>0&&result.every(row=>row.success),'Actual public-index SELECT failed');
 const rows=result.flatMap(row=>row.results||[]);assert.equal(rows.length,1,'One public-index aggregate required');
 const capturedNow=typeof now==='function'?now():now;
 const index=rows[0];assert(Number(index.indexed)>=50,'Public-index inventory is incomplete');assert(Number(index.chunks)>=Number(index.indexed),'Public-index passages are incomplete');
 return{...index,at:new Date(capturedNow).toISOString(),source,reuse:reusablePublicIndex(index,{now:capturedNow}),method:'Fresh read-only aggregate at public-index point of use',customerRecordsRead:0,databaseWrites:0};
}
export function requireCurrentPublicIndex(snapshot){assert.equal(snapshot.reuse,true,'Published public index must remain eligible through the existing production verification budget');return snapshot;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');const mode=process.argv[2]||'decision';assert(['decision','require'].includes(mode));
 const snapshot=readCurrentPublicIndex(sql=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:4*1024*1024})),{source:process.env.GITHUB_SHA});
 mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/shift-ai-public-index.json',JSON.stringify(snapshot,null,2));
 if(mode==='require')requireCurrentPublicIndex(snapshot);else{assert(process.env.GITHUB_OUTPUT,'Workflow output path required');appendFileSync(process.env.GITHUB_OUTPUT,'existing_index='+snapshot.reuse+'\n');}
 console.log('PUBLIC_INDEX_POINT_OF_USE '+JSON.stringify(snapshot));
}
