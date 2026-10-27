import {test} from 'node:test';import assert from 'node:assert/strict';
import {canonicalRuntime,uploadedVersion} from '../release/canonical-runtime-build.mjs';
import {liveAppClient} from '../app-layout-live.mjs';
test('native function serialization survives bundling with an exact inverse',()=>{const input='var liveAppClient = appClient + memberDesignClient + "\\n" + sixPageRecoveryRuntime;\nvar memberImageViewerRuntime = "bundled";\nvar supportPlanRuntime = "bundled";\nvar supportTryRuntime = "bundled";\nvar shedRuntime = "bundled";\nexport { worker as default };';const out=canonicalRuntime(input);assert(out.bundle.includes('liveAppClient = '+JSON.stringify(liveAppClient)));assert.equal(out.bundle.slice(0,input.indexOf('export {')),input.slice(0,input.indexOf('export {')));assert.equal(out.bundle.slice(out.bundle.lastIndexOf('export {')),input.slice(input.indexOf('export {')));assert.equal(out.baseSHA256.length,64);assert.notEqual(out.buildSHA256,out.baseSHA256);});
test('ambiguous or changed bundle layouts fail closed',()=>{assert.throws(()=>canonicalRuntime('export {};'));assert.throws(()=>canonicalRuntime('export {}; export {};'));});
test('version upload requires one exact provider ID',()=>{const id='ca5ca696-3fa1-47bc-b1d7-85a2d6d587f9';assert.equal(uploadedVersion('Worker Version ID: '+id),id);assert.throws(()=>uploadedVersion('Upload failed'));assert.throws(()=>uploadedVersion('Version ID: '+id+'\nVersion ID: '+id));});

test('support, try-it and community clients retain their native browser source',async()=>{
 const {supportPlanRuntime}=await import('../member-experience/support-plan-client.mjs'),{supportTryRuntime}=await import('../member-experience/support-plan-pages.mjs'),{shedRuntime}=await import('../member-experience/shed-support-ui.mjs');
 const input='var liveAppClient = appClient + memberDesignClient + "\\n" + sixPageRecoveryRuntime;\nvar memberImageViewerRuntime = "bundled";\nvar supportPlanRuntime = "broken Worker helper";\nvar supportTryRuntime = "broken Worker helper";\nvar shedRuntime = "broken Worker helper";\nexport { worker as default };',out=canonicalRuntime(input);
 for(const[name,value]of Object.entries({supportPlanRuntime,supportTryRuntime,shedRuntime})){assert(out.bundle.includes(name+' = '+JSON.stringify(value)+';'));assert(!value.includes('__name('));}
});
