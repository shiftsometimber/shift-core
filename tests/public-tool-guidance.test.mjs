import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_GUIDANCE,improveToolGuidance} from '../public-tool-guidance.mjs';
import {withPublicToolDelivery} from '../public-tool-delivery.mjs';
const sample=g=>`<html><head></head><body><main><form id="${g.form}"><div class="result" id="${g.result}">Default number</div></form></main><script type="application/ld+json">{"@type":"WebPage"}</script></body></html>`;
test('all eight calculators have a specific method, practical steps and named destination',()=>{
 for(const [path,g] of Object.entries(TOOL_GUIDANCE)){assert.equal(g.steps.length,3);const html=improveToolGuidance(sample(g),path);assert(html.includes('data-tool-inputs-pending="true"'));assert(html.includes(g.label));assert(html.includes('Your next three steps'));assert(html.includes(g.method.replaceAll('&','&amp;')));assert.equal((html.match(/data-tool-guidance="20261009"/g)||[]).length,1);assert.equal(improveToolGuidance(html,path),html);assert(html.includes('<script type="application/ld+json">{"@type":"WebPage"}</script>'));}
});
test('homepage and unrelated or malformed pages remain byte-identical',()=>{for(const path of ['/','/start-here','/tools','/member/dashboard'])assert.equal(improveToolGuidance(sample(TOOL_GUIDANCE['/tools/bmi']),path),sample(TOOL_GUIDANCE['/tools/bmi']));assert.equal(improveToolGuidance('<p>Incomplete</p>','/tools/bmi'),'<p>Incomplete</p>');});
test('Decision Centre offers a new-user route and discloses legacy profile limitations',()=>{const html=improveToolGuidance('<html><head></head><body><main></main></body></html>','/decision-centre');assert(html.includes('href="/treatment-finder"'));assert(html.includes('does not create one'));assert(html.includes('personal GP report'));assert(html.includes('decisionClient'));});
test('delivery adapter serves guidance only for public successful HTML GETs and clears stale body metadata',async()=>{
 const body=sample(TOOL_GUIDANCE['/tools/bmi']);const response=()=>new Response(body,{headers:{'content-type':'text/html','etag':'old','content-length':'123'}});
 const changed=await withPublicToolDelivery(response(),new Request('https://shiftsometimber.co.uk/tools/bmi'));assert((await changed.text()).includes('Make this result useful'));assert.equal(changed.headers.has('etag'),false);assert.equal(changed.headers.has('content-length'),false);
 for(const [url,method] of [['https://shiftsometimber.co.uk/','GET'],['https://shiftsometimber.co.uk/start-here','GET'],['https://shiftsometimber.co.uk/tools/bmi','POST'],['https://shiftsometimber.co.uk/tools/bmi','HEAD'],['https://example.test/tools/bmi','GET']]){const r=response();assert.equal(await withPublicToolDelivery(r,new Request(url,{method})),r);}
});
test('workflow automatically checks deployment and successful owned rollback without weakening existing rollback condition',()=>{
 const workflow=readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8');
 assert(workflow.includes("if: ${{ failure() && steps.runtime_deploy.outcome == 'success' || (failure() && steps.growth_deployed.outputs.already_deployed == 'true' && steps.growth_live_started.outcome == 'success') }}"));
 assert(workflow.includes("if: ${{ always() && steps.runtime_rollback.outcome == 'success' }}"));
 const deploy=workflow.indexOf('node release/tool-schema-gate.mjs deploy'),rollback=workflow.indexOf('node release/member-details-rollback.mjs'),check=workflow.indexOf('node release/tool-schema-gate.mjs rollback'),report=workflow.lastIndexOf('node release/tool-schema-gate.mjs report');assert(deploy>0&&rollback>deploy&&check>rollback&&report>check);
 assert(!/continue-on-error: true/.test(workflow.slice(deploy-150,deploy+100)));assert(workflow.slice(report).includes('${{ job.status }}'));
});

// Reproduce the production bundler, rather than testing unbundled function source.
import {build} from 'esbuild';
import vm from 'node:vm';
test('all nine browser clients survive the production name-preserving bundle without Worker helper dependencies',async()=>{
 const bundled=await build({entryPoints:['public-tool-guidance.mjs'],bundle:true,format:'esm',platform:'node',keepNames:true,write:false});
 const module=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 for(const [path,g]of [...Object.entries(module.TOOL_GUIDANCE),['/decision-centre',null]]){
  const raw=g?sample(g):'<html><head></head><body><main></main></body></html>';
  const html=module.improveToolGuidance(raw,path),script=html.match(/<script data-tool-guidance-client>([\s\S]*?)<\/script>/)?.[1];assert(script,path);
  assert(!script.includes('__name'),path+' contains a server-only helper');let boot;
  assert.doesNotThrow(()=>vm.runInNewContext(script,{document:{readyState:'loading',addEventListener(event,listener,options){assert.equal(event,'DOMContentLoaded');assert.equal(options.once,true);boot=listener;}}}),path);
  assert.equal(typeof boot,'function',path+' did not initialise');
 }
});
