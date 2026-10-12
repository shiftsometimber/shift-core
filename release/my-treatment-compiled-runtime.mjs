import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {treatmentRuntime,treatmentStyles} from '../member-experience/treatment-page.mjs';
import {describeTreatmentEvent} from '../member-experience/treatment-detail.mjs';
import {treatmentServiceWorker} from '../member-experience/treatment-service-worker.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../package.json',import.meta.url));
export const TREATMENT_BUILD_PATHS=Object.freeze(['/assets/member-experience/treatment.mjs','/assets/member-experience/treatment.css','/treatment-sw.js']);
export const treatmentBuildHash=value=>createHash('sha256').update(value).digest('hex');
export function compiledDescribeRuntime(bundle){
 const marker='// member-experience/treatment-detail.mjs\n';assert.equal(bundle.split(marker).length,2,'Exact treatment module boundary missing or duplicated');
 const start=bundle.indexOf(marker)+marker.length,next=bundle.indexOf('\n// ',start);assert(next>start,'Compiled treatment module end missing');
 const section=bundle.slice(start,next),matches=[...section.matchAll(/^function describeTreatmentEvent(?:\d+)?\([^]*?^\}/gm)];
 assert.equal(matches.length,1,'One complete compiled treatment description required');
 const fn=matches[0][0];new vm.Script('('+fn+')');return fn;
}
// Compile the full production entrypoint with deployment's locked Wrangler.
// Only Function.toString()'s exact compiled source is substituted into the
// unchanged template. No live body, whitespace/AST normalisation or semantic
// equivalence is used to construct the full-byte expectation.
export async function compiledTreatmentAssets(){
 const out=mkdtempSync(join(tmpdir(),'shift-treatment-build-'));
 try{
  execFileSync(process.execPath,[join(root,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config','wrangler.jsonc','--outdir',out],{cwd:root,encoding:'utf8',maxBuffer:16e6,env:{...process.env,CLOUDFLARE_API_TOKEN:'',WRANGLER_SEND_METRICS:'false',CI:'true'}});
  const scriptPath=join(out,'worker.js');
  const bundle=readFileSync(scriptPath,'utf8'),fn=compiledDescribeRuntime(bundle),source=describeTreatmentEvent.toString();
  assert.equal(treatmentRuntime.split(source).length,2,'Exact source description substitution missing or duplicated');
  const assets={[TREATMENT_BUILD_PATHS[0]]:treatmentRuntime.replace(source,fn),[TREATMENT_BUILD_PATHS[1]]:treatmentStyles,[TREATMENT_BUILD_PATHS[2]]:treatmentServiceWorker};
  return {assets,proof:{kind:'compiled_treatment_asset_expectation',bundleSha256:treatmentBuildHash(readFileSync(scriptPath)),lockSha256:treatmentBuildHash(readFileSync(join(root,'package-lock.json'))),wrangler:require('wrangler/package.json').version,assets:TREATMENT_BUILD_PATHS.map(path=>({path,sha256:treatmentBuildHash(assets[path])})),productionRequests:0,customerRecords:0,normalisation:false}};
 }finally{rmSync(out,{recursive:true,force:true});}
}
export function assertTreatmentAssetBytes(actual,expected,path){
 assert(TREATMENT_BUILD_PATHS.includes(path),'Unlisted treatment asset');
 assert.equal(treatmentBuildHash(actual),treatmentBuildHash(expected),'Exact compiled treatment asset differs: '+path);
}
