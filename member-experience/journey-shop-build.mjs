// Build only the scoped release factories with the existing toolchain.
// The large read-only catalogue publication stays with its current serving owner.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),esbuild=require(process.env.MY_TIMBER_ESBUILD_MODULE||'esbuild');
const root=resolve(process.env.MY_TIMBER_RELEASE_DIR||'.'),source=join(root,'scoped-source');
const shim="export {UK_FULL_PUBLICATION} from '../support-service-prior.mjs';\n";
const receipt={at:new Date().toISOString(),esbuildVersion:esbuild.version,externalServingModule:'support-service-prior.mjs',overrides:{'grub-uk-full-publication-20261018.mjs':{contents:shim,sha256:createHash('sha256').update(shim).digest('hex')}},bundles:{}};
for(const [kind,name,file]of [['programme','wrapJourneyShopService','journey-shop-release.mjs'],['documents','wrapJourneyShopDocuments','shop-document-release.mjs']]){
 const result=await esbuild.build({stdin:{contents:'export {'+name+'} from "./member-experience/'+file+'";',resolveDir:source,sourcefile:'journey-shop-'+kind+'-factory.mjs',loader:'js'},bundle:true,format:'esm',target:'es2022',minify:true,write:false,metafile:true,external:['node:*','../support-service-prior.mjs'],plugins:[{name:'retain-current-serving-catalogue',setup(build){build.onLoad({filter:/grub-uk-full-publication-20261018\.mjs$/},()=>({contents:shim,loader:'js'}));}}]});
 const bytes=result.outputFiles[0].contents;writeFileSync(join(root,'bundle-'+kind+'.mjs'),bytes);writeFileSync(join(root,'bundle-'+kind+'-meta.json'),JSON.stringify(result.metafile));
 receipt.bundles[kind]={sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,inputs:Object.fromEntries(Object.entries(result.metafile.inputs).map(([path,input])=>{if(/(?:^|\/)journey-shop-(?:programme|documents)-factory\.mjs$/.test(path))return [path,{...input,generatedEntry:true}];const actual=resolve(root,path);return [path,{...input,canonicalSourceSHA256:createHash('sha256').update(readFileSync(actual)).digest('hex')}];}))};
 console.log('SCOPED_FACTORY_BUILT',kind,receipt.bundles[kind].bytes,receipt.bundles[kind].sha256);
}
writeFileSync(join(root,'journey-shop-build-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
