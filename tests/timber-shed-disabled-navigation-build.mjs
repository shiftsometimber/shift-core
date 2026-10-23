// Verify the actual bundled response, including compiler transformations.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const {default:worker}=await import(pathToFileURL(process.argv[2]).href);
const r=await worker.fetch(new Request('https://shiftsometimber.co.uk/assets/footer-social-links-v1.js?v=20261020'));
assert.equal(r.status,200);
const script=await r.text();
assert(!script.includes('__name('),'Compiler helper must not leak into the separately executed browser script');
const registered=[];
new vm.Script(script).runInNewContext({window:{},location:{pathname:'/'},document:{readyState:'loading',addEventListener:(name,fn)=>registered.push([name,fn])}});
assert.equal(registered.length,2,'Original footer and disabled navigation both register successfully');
console.log('Bundled browser script executes and registers both original and restored navigation without undefined helpers.');
