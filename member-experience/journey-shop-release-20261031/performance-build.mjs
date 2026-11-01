import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{createRequire}from'node:module';import assert from'node:assert/strict';import{shopNavigationAsset}from'./scoped-source/member-experience/shop-navigation.mjs';
const require=createRequire(import.meta.url),esbuild=require('/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/esbuild'),hash=b=>createHash('sha256').update(b).digest('hex'),baseline=JSON.parse(readFileSync('performance-serving-baseline.json')),resources=JSON.parse(readFileSync('performance-browser-resources.json')),publicSources=JSON.parse(readFileSync('performance-public-screen-sources.json')),proof=JSON.parse(readFileSync('performance-template-proof.json'));
assert(proof.verified&&proof.authenticationLookupsRetained&&proof.databaseAccessDenied);
const kinds={'shift-core':'core','shift-programme-member-20261023':'programme','shift-hq-member-comms-20261023':'documents'},assets={};
function owner(path){const matches=baseline.routes.filter(r=>{const regex=new RegExp('^'+r.pattern.replace(/[.+?^{}$()|[\]\\]/g,'\\$&').replaceAll('*','.*')+'$');return regex.test('shiftsometimber.co.uk'+path)}).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);return kinds[matches[0]?.script];}
for(const [path,a]of Object.entries(resources)){
const p=path.split('?')[0];if(!p.startsWith('/assets/member-experience/')&&!['/assets/my-timber-layout.mjs','/assets/my-timber-pwa.js','/assets/my-timber-pwa.css','/my-timber-v11.js'].includes(p))continue;
const kind=owner(path);if(!kind)continue;assert(/javascript|text\/css/.test(a.type),p);
if(assets[p])assert.equal(assets[p].sha256,a.sha256);else assets[p]={...a,owner:kind};
}
const nav='/assets/member-experience/programme-shop-navigation.mjs';assets[nav].body=await shopNavigationAsset(new Request('https://shiftsometimber.co.uk'+nav)).text();assets[nav].sha256=hash(assets[nav].body);
writeFileSync('performance-assets.mjs','export const assets='+JSON.stringify(assets)+';\n');
writeFileSync('performance-public-sources.mjs','export const publicSources='+JSON.stringify(publicSources)+';\n');
const result=await esbuild.build({entryPoints:['scoped-source/member-experience/performance-delivery.mjs'],bundle:true,format:'esm',target:'es2022',minify:false,write:false,metafile:true});
const bundle=Buffer.from(result.outputFiles[0].contents);writeFileSync('performance-delivery-bundle.mjs',bundle);
const data={at:new Date().toISOString(),bundleSHA256:hash(bundle),assetsSHA256:hash(readFileSync('performance-assets.mjs')),publicSourcesSHA256:hash(readFileSync('performance-public-sources.mjs')),staticAssets:Object.fromEntries(Object.entries(assets).map(([k,a])=>[k,{owner:a.owner,sha256:a.sha256,bytes:Buffer.byteLength(a.body)}])),publicSources:proof.publicSources,owners:baseline.owners.map(o=>({name:o.name,deployment:o.deployment.id,version:o.deployment.versions[0].version_id,main:o.version.main_module})),dependencies:baseline.dependencies.map(o=>({name:o.name,deployment:o.deployment.id,version:o.deployment.versions[0].version_id})),sourceInputs:Object.fromEntries(Object.keys(result.metafile.inputs).map(p=>[p,hash(readFileSync(p))]))};
writeFileSync('performance-build.json',JSON.stringify(data,null,2));console.log('BUILT',data.bundleSHA256,'public bases',Object.keys(publicSources),'code assets',Object.keys(assets).length);
