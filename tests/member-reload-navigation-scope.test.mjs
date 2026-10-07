import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validateNavigationAdoption,assertNavigationReceipt,NAVIGATION_PAYLOAD_PATHS,NAVIGATION_MAINTENANCE_PATHS,NAVIGATION_RUN,NAVIGATION_VERIFIER} from '../release/member-reload-navigation-scope.mjs';
const gitRead=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
test('adoption retains exactly the live-tested harness and original serving workflow',()=>{assert(validateNavigationAdoption());});
test('drift in every harness or adoption-record file is rejected before historical comparisons',()=>{
 const c=validateNavigationAdoption();
 for(const path of [...NAVIGATION_PAYLOAD_PATHS,...NAVIGATION_MAINTENANCE_PATHS,'release/app-manifest.json'])assert.throws(()=>validateNavigationAdoption(c,(ref,p)=>ref==='HEAD'&&p===path?'drift':gitRead(ref,p)),/drift/);
 for(const path of ['worker-entry-v6.js','.github/workflows/my-timber-final-production.yml','shift-coach/release-manifest.json'])assert.throws(()=>validateNavigationAdoption(c,(ref,p)=>ref==='HEAD'&&p===path?'drift':gitRead(ref,p)),/boundary drift/);
});
test('changed adoption configuration cannot reuse a cached successful validation',()=>{
 const c=validateNavigationAdoption();
 for(const change of [{verifierSource:'a'.repeat(40)},{run:1},{servingSourceChanged:true},{payloadPaths:[]},{source:c.base}])assert.throws(()=>validateNavigationAdoption({...c,...change}));
});
test('an unrelated, failed or incomplete workflow receipt cannot authorise harness adoption',()=>{
 const receipt={id:NAVIGATION_RUN,head_sha:NAVIGATION_VERIFIER,path:'.github/workflows/my-timber-final-production.yml',head_branch:'fix/member-reload-navigation-20261007',event:'push',status:'completed',conclusion:'success'};
 assertNavigationReceipt(receipt);
 for(const change of [{id:1},{head_sha:'a'.repeat(40)},{head_branch:'main'},{event:'pull_request'},{status:'in_progress'},{conclusion:'failure'}])assert.throws(()=>assertNavigationReceipt({...receipt,...change}));
});

test('cached immutable structure still rejects changed values from the same supplied reader',()=>{
 const c=validateNavigationAdoption();let drift=false;const read=(ref,path)=>drift&&ref==='HEAD'&&path==='release/app-manifest.json'?'drift':gitRead(ref,path);
 validateNavigationAdoption(c,read);drift=true;assert.throws(()=>validateNavigationAdoption(c,read),/manifest source drift/);
});
