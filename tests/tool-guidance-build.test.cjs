const test=require('node:test'),assert=require('node:assert/strict');
const {compiledGuidance,verifyBrowserPayload}=require('../scripts/verify-tool-guidance-build.cjs');
test('actual built-module check catches the production-only missing bundler helper',()=>{
 const broken='// public-tool-guidance.mjs\nfunction toolClient(g){const boot=__name(()=>{},"boot");boot();}\nfunction improveToolGuidance(){return "<script data-tool-guidance-client>("+toolClient.toString()+")({});</script>";}\n// next.mjs\n';
 const transform=compiledGuidance(broken);assert.throws(()=>verifyBrowserPayload(transform(),'/tools/bmi'),/__name is not defined/);
});
test('literal browser sources stay standalone after a named production module build',async()=>{
 const {TOOL_GUIDANCE,improveToolGuidance}=await import('../public-tool-guidance.mjs');
 for(const [pathname,g] of Object.entries(TOOL_GUIDANCE)){const html=improveToolGuidance('<html><head></head><body><main><form id="'+g.form+'"></form></main></body></html>',pathname);assert.equal(verifyBrowserPayload(html,pathname).passed,true);}
 assert.equal(verifyBrowserPayload(improveToolGuidance('<html><head></head><body><main></main></body></html>','/decision-centre'),'/decision-centre').passed,true);
});
