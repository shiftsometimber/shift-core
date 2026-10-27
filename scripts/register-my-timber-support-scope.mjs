// Register this finite, owner-authorised support payload without changing history.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const git=(...a)=>execFileSync('git',['--no-optional-locks','--no-replace-objects',...a],{encoding:'utf8',maxBuffer:64*1024*1024}).trim(),bytes=(ref,file)=>execFileSync('git',['--no-replace-objects','show',ref+':'+file],{maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
const oid=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const kind='EXACT_MY_TIMBER_SUPPORT_SERVICE_20261027',base='75165fcc83836be66af0848c82dc97543d5a6f39',contractPath='release/my-timber-support-contract-20261027.json',inversePath='release/my-timber-support-inverses-20261027.json',receiptPath='release/my-timber-support-20261027.json';
const maintenancePaths=['release/my-timber-joined-look-scope-20261024.mjs','release/growth-scope.mjs','tests/my-timber-loop-qualification-20261026.test.mjs','tests/my-timber-support-qualification-20261027.test.mjs','scripts/register-my-timber-support-scope.mjs',contractPath,inversePath].sort(),generatedPaths=[contractPath,inversePath].sort();
const authority={instruction:'Matt: own and complete My Timber v6, full Shed loop and all remaining checks, retain the current approved release work and remove the obsolete release-manager bottleneck',existingReleaseAuthority:'Repeated deploy/go-live authority; validate each named check before activating new member features',scope:'Exact committed v6 support product and evidence payload plus the two already-approved routing-maintenance commits from main; finite source-qualification maintenance only',retainedRoutingSource:'afa38107c8d663dc233114982039a8814ca64229',holds:'Homepage approval, internal-member privacy, Google-download hold, no external communications, no spending; Shed operating approval remains conditional'};
const changes=(a,b)=>git('diff','--no-renames','--name-status',a,b).split('\n').filter(Boolean).map(row=>{const [status,path,...extra]=row.split('\t');assert(!extra.length&&['A','M'].includes(status),'Only exact regular additions/modifications');return{status,path};});
const mode=process.argv[2];
if(mode==='prepare'){
 const payload=process.argv[3];assert.match(payload,/^[a-f0-9]{40}$/);assert.equal(payload,git('rev-parse','HEAD'));git('merge-base','--is-ancestor',base,payload);git('merge-base','--is-ancestor',authority.retainedRoutingSource,payload);
 const payloadChanges=changes(base,payload),paths=payloadChanges.map(x=>x.path);assert(!paths.some(p=>maintenancePaths.includes(p)),'Runtime and maintenance must be disjoint');
 const dirty=git('diff','--name-only','HEAD').split('\n').filter(Boolean);assert(dirty.every(p=>maintenancePaths.includes(p)),'Runtime source must be committed first');
 const payloadBlobs=Object.fromEntries(paths.map(p=>[p,git('rev-parse',payload+':'+p)])),payloadStatuses=Object.fromEntries(payloadChanges.map(x=>[x.path,x.status]));
 const maintenanceExpected=Object.fromEntries(maintenancePaths.filter(p=>!generatedPaths.includes(p)).map(p=>[p,oid(fs.readFileSync(p))]));
 const files={};for(const p of [...new Set([...paths,...maintenancePaths])]){let b;try{b=bytes(base,p);}catch{continue;}files[p]={originalBlob:oid(b),originalBase64:b.toString('base64')};}
 write(inversePath,{kind,base,files});write(contractPath,{kind,base,payload,payloadBlobs,payloadStatuses,maintenancePaths,maintenanceExpected,generatedPaths,inversePath,receiptPath,authority});
 console.log(JSON.stringify({state:'FINITE_SUPPORT_SCOPE_PREPARED',payload,productPaths:paths.length,maintenancePaths:maintenancePaths.length,originalReceiptRewritten:false}));
}else if(mode==='receipt'){
 const c=JSON.parse(fs.readFileSync(contractPath)),registrationSource=git('rev-parse','HEAD');assert.equal(git('diff','--name-only','HEAD'),'');
 assert.deepEqual(changes(c.payload,registrationSource).map(x=>x.path).sort(),maintenancePaths);
 const maintenanceBlobs=Object.fromEntries(maintenancePaths.map(p=>[p,git('rev-parse',registrationSource+':'+p)]));
 for(const[p,pin]of Object.entries(c.maintenanceExpected))assert.equal(maintenanceBlobs[p],pin,'Maintenance implementation changed');
 write(receiptPath,{kind,base,payload:c.payload,registrationSource,payloadBlobs:c.payloadBlobs,maintenanceBlobs,authority});
 console.log(JSON.stringify({state:'FINITE_SUPPORT_RECEIPT_PREPARED',registrationSource,receiptPath}));
}else throw Error('Use prepare <payload SHA> or receipt');
