const test=require('node:test'),assert=require('node:assert/strict');
const {compiledGuidance,verifyBrowserPayload,freshBuiltGuidance}=require('../scripts/verify-tool-guidance-build.cjs');
test('actual built-module check catches the production-only missing bundler helper',()=>{
 const broken='// public-tool-guidance.mjs\nfunction toolClient(g){const boot=__name(()=>{},"boot");boot();}\nfunction improveToolGuidance(){return "<script data-tool-guidance-client>("+toolClient.toString()+")({});</script>";}\n// next.mjs\n';
 const transform=compiledGuidance(broken);assert.throws(()=>verifyBrowserPayload(transform(),'/tools/bmi'),/__name is not defined/);
});
test('literal browser sources stay standalone after a named production module build',async()=>{
 const {TOOL_GUIDANCE,improveToolGuidance}=await import('../public-tool-guidance.mjs');
 for(const [pathname,g] of Object.entries(TOOL_GUIDANCE)){const html=improveToolGuidance('<html><head></head><body><main><form id="'+g.form+'"></form></main></body></html>',pathname);assert.equal(verifyBrowserPayload(html,pathname).passed,true);}
 assert.equal(verifyBrowserPayload(improveToolGuidance('<html><head></head><body><main></main></body></html>','/decision-centre'),'/decision-centre').passed,true);
});
test('an already deployed client cannot mask the client from the candidate build',async()=>{
 const {improveToolGuidance}=await import('../public-tool-guidance.mjs');
 const base='<html><head></head><body><main><form id="bmiForm"></form></main></body></html>';
 const stale=improveToolGuidance(base,'/tools/bmi').replace(/<script data-tool-guidance-client>[\s\S]*?<\/script>/,'<script data-tool-guidance-client>throw new Error("old client");</script>');
 const built=freshBuiltGuidance(improveToolGuidance,stale,'/tools/bmi');
 assert.equal(verifyBrowserPayload(built,'/tools/bmi').passed,true);
 assert.equal([...built.matchAll(/<section data-tool-guidance=/g)].length,1);
 assert.equal([...built.matchAll(/data-tool-input-prompt role=/g)].length,1);
 assert(!built.includes('old client'));
});
