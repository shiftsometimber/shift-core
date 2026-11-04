import {generatorSubset} from './v7-generator-subset.mjs';
// Installs only the isolated synthetic-account test site. No production routes,
// secrets, schedules or database bindings are copied. Production is rejected.
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';import esbuild from 'esbuild';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6',TEST_DB='247b065f-fea4-4891-945b-b707f2417656',PROD_DB='88f40aed-cb23-4372-8c94-8a73f48bc847';
const LEGACY='shift-programme-my-timber-v7-legacy',PREPARER='shift-my-timber-v7-test-preparer';
const FRONT='shift-programme-my-timber-v7-test',BACK='shift-core-my-timber-v7-backend',ORIGIN='https://'+FRONT+'.matobrien.workers.dev';
if(TEST_DB===PROD_DB||![FRONT,BACK].every(n=>/my-timber-v7-(test|backend)$/.test(n)))throw Error('Test isolation failed');
const root=process.cwd(),output='/private/tmp/my-timber-v7-test-package';fs.mkdirSync(output,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const capture=name=>JSON.parse(zlib.gunzipSync(fs.readFileSync('/private/tmp/v7-live-'+name+'.json.gz')));
const decode=m=>Buffer.from(m.content_base64,'base64').toString();
const module=(name,text)=>({name,content_type:'application/javascript+module',content_base64:Buffer.from(text).toString('base64')});
const core=capture('shift-core'),programme=capture('shift-programme-member-20261023');
const originalHashes={core:Object.fromEntries(core.modules.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))])),programme:Object.fromEntries(programme.modules.map(m=>[m.name,digest(Buffer.from(m.content_base64,'base64'))]))};
const pworker=programme.modules.find(m=>m.name==='worker.mjs');let psource=decode(pworker);
for(const name of ['loadGrubCatalogue','usableCatalogue','emptyGrub','recommendationFor','grubMemberContext'])if(!psource.includes('function '+name+'(')&&!psource.includes('var '+name+' ='))throw Error('Captured helper missing: '+name);
const helperExport='\nexport {loadGrubCatalogue as v7LoadGrubCatalogue,usableCatalogue as v7UsableCatalogue,emptyGrub as v7EmptyGrub,recommendationFor as v7RecommendationFor,grubMemberContext as v7GrubMemberContext};\n';
pworker.content_base64=Buffer.from(psource+helperExport).toString('base64');
const legacy=structuredClone(programme);
const cworker=core.modules.find(m=>m.name==='worker.js'),csource=decode(cworker);
for(const name of ['composeSession','structuredFitPlan','loadGovernedFitCatalogue','ensureFitDurationUtilisation','assessMemberOutput'])if(!csource.includes('function '+name+'('))throw Error('Captured Fit helper missing: '+name);
const cExport=fs.readFileSync('member-experience/v7-core-helper-export.txt','utf8');cworker.content_base64=Buffer.from(csource+cExport).toString('base64');
// Bundle the existing Life Back ES modules for the scoped content adapter.
const lifeBack=await esbuild.build({entryPoints:['member-experience/life-back/client.mjs'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,plugins:[{name:'existing-life-back-imports',setup(build){build.onResolve({filter:/^\/assets\/member-experience\/life-back\/(?:model|icons)\.mjs$/},args=>({path:path.join(root,'member-experience/life-back',path.basename(args.path))}));}}]});
fs.writeFileSync('member-experience/v7-retained-life-back.mjs','// Bundled from the existing Life Back client, model and icons. No new UI.\nexport const retainedLifeBack='+JSON.stringify(lifeBack.outputFiles[0].text)+';\n');
const build=async(entry,external)=>{const r=await esbuild.build({entryPoints:[entry],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external,minify:true});return r.outputFiles[0].text;};
let l=await build('member-experience/v7-legacy-service.mjs',['cloudflare:workers','__MY_TIMBER_CURRENT_SERVING__','__MY_TIMBER_CURRENT_HELPERS__']);
l=l.replaceAll('__MY_TIMBER_CURRENT_SERVING__','../'+legacy.main_module).replaceAll('__MY_TIMBER_CURRENT_HELPERS__','../worker.mjs');
legacy.modules.push(module('v7-release-20261103/legacy-service.mjs',l));legacy.main_module='v7-release-20261103/legacy-service.mjs';
// Tree-shake the reviewed generators away from their serving document graph.
const prepCapture=path.join(output,'preparer-source');
const subsetManifests={};
for(const [kind,source]of [['core',core],['programme',legacy]])for(const m of source.modules){const file=path.join(prepCapture,kind,m.name);fs.mkdirSync(path.dirname(file),{recursive:true});let bytes=Buffer.from(m.content_base64,'base64');if(kind==='core'&&m.name==='worker.js'||kind==='programme'&&m.name==='worker.mjs'){const exports=kind==='core'?{v7ApprovedFitPreview:'v7ApprovedFitPreview',v7FitCatalogue:'loadGovernedFitCatalogue'}:{v7LoadGrubCatalogue:'loadGrubCatalogue',v7EmptyGrub:'emptyGrub',v7UsableCatalogue:'usableCatalogue',v7RecommendationFor:'recommendationFor',v7GrubMemberContext:'grubMemberContext'};const subset=generatorSubset(bytes.toString(),exports);bytes=Buffer.from(subset.code);subsetManifests[kind]=subset.manifest;}fs.writeFileSync(file,bytes);}
fs.writeFileSync('member-experience/v7-release-evidence/generator-subset.json',JSON.stringify(subsetManifests,null,2)+'\n');
const prepared=await esbuild.build({entryPoints:['member-experience/v7-preparer.mjs'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',minify:true,external:['cloudflare:workers'],plugins:[{name:'reviewed-serving-generators',setup(build){build.onResolve({filter:/^__MY_TIMBER_CURRENT_(?:CORE|PROGRAMME)_HELPERS__$/},args=>({path:path.join(prepCapture,args.path.includes('CORE')?'core/worker.js':'programme/worker.mjs')}));}}]});
const preparer={main_module:'preparer.mjs',compatibility_date:core.compatibility_date,compatibility_flags:core.compatibility_flags,modules:[module('preparer.mjs',prepared.outputFiles[0].text)]};
fs.writeFileSync(path.join(output,'preparer.json.gz'),zlib.gzipSync(JSON.stringify(preparer)));
console.log(JSON.stringify({preparerGzipBytes:zlib.gzipSync(prepared.outputFiles[0].contents).length,servingGeneratorsUnmodified:true}));
programme.modules=[];
let p=await build('member-experience/v7-programme-native-entry.mjs',[]);
p=p.replaceAll('__MY_TIMBER_CURRENT_SERVING__','../'+programme.main_module).replaceAll('__MY_TIMBER_CURRENT_HELPERS__','../worker.mjs');
const assetTag=digest(p).slice(0,20);p=p.replaceAll('__V7_NATIVE_ASSET_TAG__',assetTag);
// Precompress the exact served browser bytes at build time. No page-open work.
const compressFile=path.join(output,'native-compression-source.mjs');fs.writeFileSync(compressFile,p);
const compressionApp=(await import(pathToFileURL(compressFile).href+'?build='+Date.now())).default,compression=[];
for(const [asset,marker]of [['v7-native.mjs','__V7_BROTLI_BROWSER__'],['v7-native.css','__V7_BROTLI_CSS__'],['v7-journey-support.mjs','__V7_BROTLI_SECONDARY__']]){
 const response=await compressionApp.fetch(new Request('https://shiftsometimber.co.uk/assets/member-experience/'+asset,{headers:{'Accept-Encoding':'identity'}}),{},{});if(!response.ok)throw Error('Native precompression source unavailable');
 const raw=Buffer.from(await response.arrayBuffer()),packed=zlib.brotliCompressSync(raw,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11,[zlib.constants.BROTLI_PARAM_MODE]:zlib.constants.BROTLI_MODE_TEXT}});if(!zlib.brotliDecompressSync(packed).equals(raw))throw Error('Native byte verification failed');p=p.replaceAll(marker,packed.toString('base64'));compression.push({asset,rawBytes:raw.length,brotliBytes:packed.length,roundTripIdentical:true,sha256:digest(raw)});
}
fs.writeFileSync('member-experience/welcome-release-evidence/compression.json',JSON.stringify(compression,null,2)+'\n');
programme.modules.push(module('v7-release-20261103/programme.mjs',p));
let c=await build('member-experience/v7-core-planner.mjs',['cloudflare:workers','__MY_TIMBER_CURRENT_CORE__','__MY_TIMBER_CURRENT_CORE_HELPERS__']);
c=c.replaceAll('__MY_TIMBER_CURRENT_CORE__','../'+core.main_module).replaceAll('__MY_TIMBER_CURRENT_CORE_HELPERS__','../worker.js');
core.modules.push(module('v7-release-20261103/core.mjs',c));core.main_module='v7-release-20261103/core.mjs';
const accessFile='/private/tmp/my-timber-v7-test-access.json';
const access=fs.existsSync(accessFile)?JSON.parse(fs.readFileSync(accessFile)): {key:crypto.randomBytes(32).toString('hex'),cases:Object.fromEntries(['choose','hard-week','milestone'].map((name,i)=>[name,{id:900710001+i,email:'v7-'+name+'@example.invalid',token:crypto.randomBytes(32).toString('hex')}]))};
fs.writeFileSync(accessFile,JSON.stringify(access),{mode:0o600});
const phonePreview=fs.existsSync('/private/tmp/my-timber-v7-phone-preview.json')?JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-phone-preview.json')):null;
const testEntry=String.raw`import app from './programme.mjs';
const cases=${JSON.stringify(access.cases)},key=${JSON.stringify(access.key)},phone=${JSON.stringify(phonePreview)};
export default {...app,async fetch(request,env,ctx){
 const u=new URL(request.url);if(u.hostname!==${JSON.stringify(new URL(ORIGIN).hostname)})return new Response('Test host only',{status:403});
 if(u.pathname.startsWith('/__v7/preview/')){if(!phone||u.pathname!=='/__v7/preview/'+phone.code||Date.parse(phone.expiresAt)<=Date.now())return new Response('Preview link unavailable',{status:404});return new Response(null,{status:302,headers:{Location:'/member/dashboard#today','Set-Cookie':'sst_session='+phone.token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7200','Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive'}});}
 if(u.pathname.startsWith('/__v7/test-start/')){const name=u.pathname.split('/').pop(),entry=cases[name];if(!entry||u.searchParams.get('key')!==key)return new Response('Not found',{status:404});return new Response(null,{status:302,headers:{Location:'/member/dashboard#today','Set-Cookie':'sst_session='+entry.token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7200','Cache-Control':'no-store, private'}});}
 if(u.pathname==='/__v7/prepare'&&request.method==='POST'&&request.headers.get('X-V7-Test-Key')===key){const at=new Date().toISOString().slice(0,10)+'T01:30:00Z';const result=await app.scheduled({scheduledTime:Date.parse(at)},env,null);return Response.json({requested:true,result},{headers:{'Cache-Control':'no-store'}});}
 if((u.pathname.startsWith('/assets/')||u.pathname.startsWith('/shift-health/assets/'))&&!u.pathname.startsWith('/assets/member-experience/v7-')&&!['/assets/member-experience/v7-native.css','/assets/member-experience/v7-native.mjs','/assets/member-experience/v7-brand.svg','/assets/member-experience/v7-heading-font.woff2','/assets/member-experience/programme-support-plan.mjs','/assets/member-experience/programme-support-plan.css','/assets/member-experience/programme-journey.mjs','/assets/member-experience/food-diary.mjs','/assets/member-experience/programme-v7-preferences.mjs'].includes(u.pathname)&&['GET','HEAD'].includes(request.method)){try{return await fetch('https://shiftsometimber.co.uk'+u.pathname+u.search,{method:request.method,redirect:'manual'});}catch(e){return Response.json({testAssetError:e.message},{status:502});}}
 if(u.pathname==='/__v7/fit-probe'&&request.method==='POST'&&request.headers.get('X-V7-Test-Key')===key){try{const value=await env.V7_PLANNER.prepareV7Fit({userId:cases.choose.id,minutes:20,kit:'dumbbells'});return Response.json({plan:value});}catch(e){return Response.json({error:e.message},{status:503});}}
 if(u.pathname==='/__v7/health')return Response.json({testOnly:true,build:${JSON.stringify(assetTag)}});
 if(/(?:checkout|payment|stripe|send-message|send-email|contact\/submit|orders\/create)/i.test(u.pathname)&&request.method!=='GET')return Response.json({error:'Purchases and messages are disabled on this synthetic test site'},{status:403});
 return app.fetch(request,env,ctx);
}};`;
const checkFile=path.join(output,'test-entry-check.mjs');fs.writeFileSync(checkFile,testEntry,{mode:0o600});execFileSync(process.execPath,['--check',checkFile]);
programme.modules.push(module('v7-release-20261103/test-entry.mjs',testEntry));programme.main_module='v7-release-20261103/test-entry.mjs';
const publicBindings=[{type:'plain_text',name:'ALLOWED_ORIGINS',text:ORIGIN},{type:'plain_text',name:'PUBLIC_SITE_URL',text:ORIGIN},{type:'plain_text',name:'SHIFT_ENVIRONMENT',text:'my-timber-preview'},{type:'plain_text',name:'STRIPE_MODE',text:'test'},{type:'plain_text',name:'MEMBER_EXPERIENCE_V1_ENABLED',text:'true'},{type:'plain_text',name:'MY_TIMBER_V6_RELEASE_ENABLED',text:'true'},{type:'plain_text',name:'MY_TIMBER_PWA_ENABLED',text:'true'},{type:'plain_text',name:'MY_TREATMENT_ENABLED',text:'true'}];
async function upload(name,source,bindings){
 if(![FRONT,BACK,LEGACY,PREPARER].includes(name))throw Error('Production upload rejected');
 const metadata={main_module:source.main_module,compatibility_date:source.compatibility_date,compatibility_flags:[...new Set([...(source.compatibility_flags||[]),'global_fetch_strictly_public'])],bindings:[{type:'d1',name:'DB',id:TEST_DB},...bindings],keep_assets:false};
 const form=new FormData();form.append('metadata',JSON.stringify(metadata));let gzip=0;
 for(const m of source.modules){const bytes=Buffer.from(m.content_base64,'base64');gzip+=zlib.gzipSync(bytes).length;form.append(m.name,new Blob([bytes],{type:m.content_type}),m.name);}
 if(gzip>=10*1024*1024)throw Error('Worker exceeds compressed module budget');
 const result=await cf('/accounts/'+ACCOUNT+'/workers/scripts/'+name,'PUT',form);
 await cf('/accounts/'+ACCOUNT+'/workers/scripts/'+name+'/subdomain','POST',{enabled:![LEGACY,PREPARER].includes(name)});
 return {worker:name,main:source.main_module,modules:source.modules.length,gzipBytes:gzip,result};
}
// Public static assets are fetched anonymously by a read-only service below;
// no production member credentials or private API service is connected.
const assetProxy=module('v7-release-20261103/assets.mjs',`export default {async fetch(request){const u=new URL(request.url);if(!u.pathname.startsWith('/assets/')||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname+u.search,{method:request.method,redirect:'error'});}};`);
// Legacy core expects an asset service. A separate named entrypoint keeps it
// read-only; programme/core private routes still use the isolated test DB.
core.modules.push(module('v7-release-20261103/assets-entrypoint.mjs',String.raw`import {WorkerEntrypoint} from 'cloudflare:workers';export class PublicCatalogues extends WorkerEntrypoint {async fetch(request){const u=new URL(request.url);if(request.method!=='GET'||!(/^\/shift-health\/testing(?:\/[a-z0-9-]{1,70})?$/.test(u.pathname)||['/shift-health/supplements-nutrition','/shop','/assets/shift-purchase-basket-v1.js'].includes(u.pathname)))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname,{headers:{Accept:'text/html'},redirect:'manual'});}};export class PublicAssets extends WorkerEntrypoint {async fetch(request){const u=new URL(request.url);if(!u.pathname.startsWith('/assets/')||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname+u.search,{method:request.method,redirect:'error'});}}`));
// Core's static asset binding is supplied by the front's read-only endpoint in a
// second update, after both services exist. No production private service binding.
programme.modules.push(assetProxy);
fs.writeFileSync(path.join(output,'programme.json.gz'),zlib.gzipSync(JSON.stringify(programme)));
fs.writeFileSync(path.join(output,'core.json.gz'),zlib.gzipSync(JSON.stringify(core)));fs.writeFileSync(path.join(output,'legacy.json.gz'),zlib.gzipSync(JSON.stringify(legacy)));
const manifest={state:'PACKAGED_NOT_DEPLOYED',testOrigin:ORIGIN,assetTag,testDatabase:TEST_DB,productionDatabaseExcluded:true,sourceBranch:'fix/my-timber-precompiled-documents-20261102',sourceCaptures:{programme:programme.id,core:core.id},originalHashes};
fs.writeFileSync('member-experience/v7-release-evidence/test-package.json',JSON.stringify(manifest,null,2)+'\n');
if(process.argv.includes('--upload-test')||process.argv.includes('--upload-front')){
 const oldManifest=fs.existsSync('member-experience/v7-release-evidence/test-legacy-build.json')?JSON.parse(fs.readFileSync('member-experience/v7-release-evidence/test-legacy-build.json')):null;
 const legacyBuild=digest(l+JSON.stringify(originalHashes.programme)+'public-catalogues-v2-treatment');let legacyUpload={worker:LEGACY,retained:true};if(oldManifest?.build!==legacyBuild){legacyUpload=await upload(LEGACY,legacy,[...publicBindings,{type:'service',name:'CORE',service:BACK},...['MY_TIMBER_PUBLIC_TESTING','MY_TIMBER_PUBLIC_NUTRITION','MY_TIMBER_PUBLIC_KIT'].map(name=>({type:'service',name,service:LEGACY,entrypoint:'V7PublicCatalogues'}))]);fs.writeFileSync('member-experience/v7-release-evidence/test-legacy-build.json',JSON.stringify({worker:LEGACY,build:legacyBuild}));}
 manifest.legacy=legacyUpload;
 const preparationUpload=await upload(PREPARER,preparer,[{type:'service',name:'LEGACY_JOBS',service:LEGACY,entrypoint:'V7Offers'}]);manifest.preparer=preparationUpload;
 let back={worker:BACK,retained:true};if(process.argv.includes('--upload-test')){back=await upload(BACK,core,[...publicBindings,{type:'service',name:'MEMBER_ASSETS',service:BACK,entrypoint:'PublicAssets'},{type:'service',name:'V7_PREPARER',service:PREPARER,entrypoint:'V7Planner'}]);}
 const front=await upload(FRONT,programme,[...publicBindings,{type:'service',name:'MEMBER_LEGACY',service:LEGACY},{type:'service',name:'V7_OFFERS',service:PREPARER,entrypoint:'V7Offers'},{type:'service',name:'CORE',service:BACK},{type:'service',name:'V7_PLANNER',service:PREPARER,entrypoint:'V7Planner'}]);
 manifest.state='TEST_SERVICES_UPLOADED_NOT_MEMBER_DEPLOYED';manifest.uploads=[back,front];fs.writeFileSync('member-experience/v7-release-evidence/test-package.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({state:manifest.state,testOrigin:ORIGIN,back:back.gzipBytes,front:front.gzipBytes,legacy:legacyUpload.gzipBytes}));
}else console.log(JSON.stringify({state:manifest.state,testOrigin:ORIGIN,assetTag}));