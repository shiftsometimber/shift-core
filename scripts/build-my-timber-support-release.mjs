// Prepare a scoped add-on for the two existing Worker owners. Never publish here.
// Preserve every downloaded baseline module; wrap only the existing entry module.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {shareOwnerCatalogue} from './share-my-timber-catalogue.mjs';
import {UK_FULL_PUBLICATION} from '../grub-uk-full-publication-20261018.mjs';
const root=process.cwd(),out=path.resolve(process.argv[2]||'');
if(!process.argv[2]||!fs.existsSync(path.join(out,'provider-baseline.json')))throw new Error('Pass the directory containing the current provider baseline');
const require=createRequire(path.join(root,'package.json')),esbuild=require('esbuild');
const source=await import(pathToFileURL(path.join(root,'grub-expansion-serving-manifest-v1.mjs')));
const plugin={name:'exact-governed-manifest',setup(build){
 build.onResolve({filter:/^\.\/support-service-prior\.mjs$/},()=>({path:'./support-service-prior.mjs',external:true}));
 build.onLoad({filter:/grub-expansion-serving-manifest-v1\.mjs$/},()=>({contents:Object.entries(source).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n'),loader:'js'}));
 build.onLoad({filter:/grub-uk-full-publication-20261018\.mjs$/},async args=>{
  return {contents:"export {UK_FULL_PUBLICATION} from './support-service-prior.mjs';",loader:'js'};
 });
}};
const result=await esbuild.build({stdin:{contents:"export {wrapSupportService} from './member-experience/support-release.mjs'",resolveDir:root},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true,metafile:true,plugins:[plugin]});
const service=result.outputFiles[0].contents;
fs.writeFileSync(path.join(out,'bundle-input-sizes.json'),JSON.stringify(Object.entries(Object.values(result.metafile.outputs)[0].inputs).sort((a,b)=>b[1].bytesInOutput-a[1].bytesInOutput).slice(0,15),null,2));
fs.writeFileSync(path.join(out,'support-service.mjs'),service);
fs.copyFileSync(path.join(root,'member-experience/support-markup.mjs'),path.join(out,'support-markup.mjs'));
const plans=[{name:'programme',before:'before',addon:'support-service.mjs',factory:'wrapSupportService'},{name:'member-document',before:'before-hq',addon:'support-markup.mjs',factory:'wrapSupportMarkup'}];
const manifest={at:new Date().toISOString(),candidates:{}};
for(const p of plans){
 const target=path.join(out,'candidate-'+p.name);fs.mkdirSync(target,{recursive:true});
 for(const n of fs.readdirSync(path.join(out,p.before)))fs.copyFileSync(path.join(out,p.before,n),path.join(target,n));
 const original=path.join(target,'presentation-entry.mjs'),old=fs.readFileSync(original,'utf8');
 const owned='export default '+p.factory+'(wrapPresentation(original));';
 if(old.includes(owned)){
  if(old.split(owned).length!==2||!old.includes("from './"+p.addon+"'"))throw new Error('Unexpected existing support wrapper for '+p.name);
 }else{
  if(!old.includes('export default wrapPresentation(original);'))throw new Error('Unexpected deployed entry for '+p.name);
  fs.writeFileSync(original,old.replace('export default wrapPresentation(original);',"import {"+p.factory+"} from './"+p.addon+"';"+owned));
 }
 // Keep the current implementation as the normal-member path while the exact
 // candidate is qualified using only the reserved synthetic sessions.
 const current=path.join(out,p.before,p.addon);
 const prior=fs.readFileSync(current,'utf8').includes('gateV6Owner')?path.join(out,p.before,p.addon.replace('.mjs','-prior.mjs')):current;
 if(!fs.existsSync(prior))throw new Error('Current support implementation is required for gated acceptance');
 if(p.name==='programme'){
  const ownerPath=path.join(target,'worker.mjs'),shared=shareOwnerCatalogue(fs.readFileSync(ownerPath,'utf8'),fs.readFileSync(prior,'utf8'),UK_FULL_PUBLICATION);
  fs.writeFileSync(ownerPath,shared.owner);
  fs.writeFileSync(path.join(target,p.addon.replace('.mjs','-prior.mjs')),shared.prior);
  fs.writeFileSync(path.join(out,'shared-catalogue-proof.json'),JSON.stringify(shared.proof,null,2));
 }else fs.copyFileSync(prior,path.join(target,p.addon.replace('.mjs','-prior.mjs')));
 fs.copyFileSync(path.join(out,p.addon),path.join(target,p.addon.replace('.mjs','-next.mjs')));
 fs.copyFileSync(path.join(root,'member-experience/support-release-gate.mjs'),path.join(target,'support-release-gate.mjs'));
 fs.writeFileSync(path.join(target,p.addon),"import {"+p.factory+" as before} from './"+p.addon.replace('.mjs','-prior.mjs')+"';import {"+p.factory+" as after} from './"+p.addon.replace('.mjs','-next.mjs')+"';import {composeV6Owner} from './support-release-gate.mjs';export function "+p.factory+"(original){return composeV6Owner(before,after,original);}\n");
 const files=fs.readdirSync(target).sort().map(n=>{const b=fs.readFileSync(path.join(target,n));return {name:n,bytes:b.length,gzip:gzipSync(b).length,sha256:createHash('sha256').update(b).digest('hex')};});
 manifest.candidates[p.name]={directory:target,mainModule:'presentation-entry.mjs',files,totalGzip:files.reduce((n,f)=>n+f.gzip,0)};
 if(files.reduce((n,f)=>n+f.bytes,0)>60*1024*1024)throw new Error('Worker uncompressed safety budget exceeded');
 if(manifest.candidates[p.name].totalGzip>10*1024*1024)throw new Error('Existing paid Worker gzip limit exceeded');
}
fs.writeFileSync(path.join(out,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
