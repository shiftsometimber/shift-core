import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const files=['performance-precompiled-documents-runtime.mjs','performance-precompiled-documents-runtime.test.mjs','performance-precompiled-documents-prepare.mjs','performance-precompiled-documents-prepare.test.mjs','performance-precompiled-documents-proof.mjs','performance-precompiled-documents.json','performance-precompiled-documents-proof.json'];
const proof=JSON.parse(readFileSync(files.at(-1)));assert(proof.verified&&proof.routes.length===3);
const started=new Date().toISOString(),r=spawnSync(process.execPath,['--test','performance-precompiled-documents-runtime.test.mjs','performance-precompiled-documents-prepare.test.mjs'],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
const report={kind:'PRECOMPILED_MEMBER_DOCUMENT_LOCAL_QUALIFICATION',started,finished:new Date().toISOString(),verified:r.status===0,status:r.status,signal:r.signal,
 testsPassed:Number(r.stdout.match(/(?:#|ℹ)\s*(?:pass|tests)\s+(\d+)/)?.[1]||0),
 sourceHashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),
 sourceOwners:proof.sourceOwners.map(o=>({name:o.name,version:o.version,main:o.main})),
 exactHTMLComparisons:proof.routes.reduce((n,r)=>n+r.accountComparisons.length,0),currentLiveDocumentsMatched:proof.routes.length,
 productionMutations:0,productionSpeedQualified:false,physicalIPhoneVerified:false,stdout:r.stdout,stderr:r.stderr};
writeFileSync('performance-precompiled-documents-qualification.json',JSON.stringify(report,null,2)+'\n');
console.log(r.stdout);if(r.stderr)console.error(r.stderr);assert.equal(r.status,0,'Local document delivery qualification failed');
console.log('PRECOMPILED_MEMBER_DOCUMENT_LOCAL_QUALIFICATION_PASSED',report.testsPassed,'tests',report.exactHTMLComparisons,'exact HTML comparisons');
