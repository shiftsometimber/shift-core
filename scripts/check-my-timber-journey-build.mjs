// Source compilation only. Use the existing provider-baseline release workflow
// for composition/qualification; this script cannot deploy or activate a service.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import * as catalogue from '../grub-expansion-serving-manifest-v1.mjs';
const require=createRequire(new URL('../package.json',import.meta.url)),{build,version}=require('esbuild');
const baseRef=process.argv[2],output=process.argv[3];
if(!/^[0-9a-f]{40}$/.test(baseRef||''))throw Error('Pass the exact 40-character predecessor commit.');
const owned=['member-experience/life-back-routes.mjs','member-experience/six-page-recovery.mjs','member-experience/support-plan-pages.mjs','member-experience/support-release.mjs'];
const base=new Map(owned.map(file=>[file,execFileSync('git',['show',baseRef+':'+file],{encoding:'utf8',maxBuffer:4*1024*1024})]));
async function compile(before){
  const plugin={name:'existing-governed-manifest',setup(b){
    // Same data freeze as build-my-timber-support-release.mjs; Node's catalogue
    // decoder must not be shipped into a browser/Worker module.
    b.onLoad({filter:/grub-expansion-serving-manifest-v1\.mjs$/},()=>({contents:Object.entries(catalogue).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n'),loader:'js'}));
    if(before)b.onLoad({filter:/member-experience\/(?:life-back-routes|six-page-recovery|support-plan-pages|support-release)\.mjs$/},a=>({contents:base.get(path.relative(process.cwd(),a.path)),loader:'js'}));
  }};
  const result=await build({entryPoints:['member-experience/support-release.mjs'],bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true,metafile:true,plugins:[plugin]});
  const bytes=result.outputFiles[0].contents;
  return {bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex'),inputs:Object.keys(result.metafile.inputs).length};
}
const baseline=await compile(true),candidate=await compile(false);
const receipt={at:new Date().toISOString(),base:baseRef,esbuild:version,target:'es2022',baseline,candidate,gzipDeltaBytes:candidate.gzipBytes-baseline.gzipBytes,boundary:'Standalone support-service compilation with the existing governed-manifest freeze. Not provider-baseline composition, release qualification or deployment.'};
if(output)fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
