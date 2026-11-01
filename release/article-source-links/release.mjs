import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {deriveArticlePatch,applyArticlePatch,sha} from './patch.mjs';
import {runtimeRollbackDecision} from '../runtime-rollback-guard.mjs';
import images from '../../public-image-repair/manifest.json' with {type:'json'};

const MAIN='c6d4445bbd72f8e465b33d04de42d443b979116b';
const HEAD='60a1bdabbc7de1e8be2af3203456a7b2de08313c',BASE='a1741848bd6dca238def63d9ee6f03ff45e8a7ea';
const appPaths=['babylove/dynamic-public.mjs','babylove/dynamic-public.test.mjs'];
const support=['.github/workflows/article-source-links-1509-release.yml','release/article-source-links/patch.mjs','release/article-source-links/patch.test.mjs','release/article-source-links/release.mjs'];
const dir='evidence/article-source-links';mkdirSync(dir,{recursive:true});
const save=(name,value)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:100*1024*1024}).trim();
const source=process.env.GITHUB_SHA,run=process.env.GITHUB_RUN_ID;
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token);
assert.equal(process.env.GITHUB_REF,'refs/heads/release/article-source-links-1509-20261101');
assert.equal(git('rev-parse','HEAD'),source);
async function api(path,init={}){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider operation failed: '+path+' '+JSON.stringify(j.errors));return j.result;
}
const latest=async()=>{const d=await api('/workers/scripts/shift-core/deployments');const a=(d.deployments??d).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];assert.equal(a.versions.length,1);assert.equal(a.versions[0].percentage,100);return a;};
const version=id=>api('/workers/workers/shift-core/versions/'+id+'?include=modules');
const promote=id=>api('/workers/scripts/shift-core/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':'Exact article renderer PR1509 run '+run}})});
async function rollback(){
 if(!existsSync(dir+'/deployed.json'))return;
 const before=JSON.parse(readFileSync(dir+'/before.json')).deployment,receipt=JSON.parse(readFileSync(dir+'/deployed.json')),active=await latest();
 const decision=runtimeRollbackDecision({before,active,receipt,source,run});
 if(decision.action==='restore'){
  const result=await promote(before.versions[0].version_id);
  assert.equal((await latest()).id,result.id);
  assert.equal((await latest()).versions[0].version_id,before.versions[0].version_id);
  save('rollback',{restored:true,deployment:result.id,previous:before.versions[0].version_id});
 }else save('rollback',{skipped:true,reason:decision.reason,current:active.id});
}
if(process.argv[2]==='rollback'){await rollback();process.exit(0);}
function currentSource(){
 git('fetch','--no-tags','origin','main');
 assert.equal(git('rev-parse','origin/main'),MAIN,'Main moved: reconcile before a production operation');
 assert.equal(git('diff','--name-only'),'','Tracked source changed');
 assert.equal(git('diff',HEAD,MAIN,'--',...appPaths),'','Main differs from the exact tested PR renderer');
 assert.deepEqual(git('diff','--name-only',MAIN,'HEAD').split('\n').filter(Boolean).sort(),support.toSorted(),'Only isolated release support may follow the merged repair');
}
currentSource();git('merge-base','--is-ancestor',HEAD,MAIN);
async function gh(path){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json();}
const pr=await gh('pulls/1509');assert.equal(pr.merged,true);assert.equal(pr.head.sha,HEAD);
assert.deepEqual((await gh('pulls/1509/files')).map(f=>f.filename).sort(),appPaths.toSorted());
for(const id of [41251655793,41251655750,41251655803]){const r=await gh('actions/runs/'+id);assert.equal(r.head_sha,HEAD);assert.equal(r.conclusion,'success','Existing required check must pass: '+id);}
save('source',{main:MAIN,pr:1509,testedHead:HEAD,releaseSource:source,run,reusedChecks:[41251655793,41251655750,41251655803],applicationFiles:appPaths});
const renderer='babylove/dynamic-public.mjs',candidate=readFileSync(renderer,'utf8'),oldSource=execFileSync('git',['show',BASE+':'+renderer],{encoding:'utf8'});
execFileSync('node',['babylove/prepare-public-bundle.mjs'],{stdio:'pipe'});assert.equal(git('diff','--name-only'),'');
const buildDir=process.env.RUNNER_TEMP+'/article-1509-build';
function compile(){
 rmSync(buildDir,{recursive:true,force:true});
 const out=execFileSync('npx',['wrangler','deploy','--dry-run','--config','wrangler.jsonc','--outdir',buildDir],{encoding:'utf8',maxBuffer:50*1024*1024});
 writeFileSync(dir+'/build.log',out);return readFileSync(buildDir+'/worker.js','utf8');
}
let compiledBefore;
try{writeFileSync(renderer,oldSource);compiledBefore=compile();}finally{writeFileSync(renderer,candidate);}
const compiledAfter=compile(),patch=deriveArticlePatch(compiledBefore,compiledAfter);
save('compiled',{before:sha(compiledBefore),after:sha(compiledAfter),oldArticle:sha(patch.oldText),newArticle:sha(patch.newText),exactInverse:true});
currentSource();
const baseline=await latest(),original=await version(baseline.versions[0].version_id),settings=await api('/workers/scripts/shift-core/settings');
const names=original.modules.map(m=>m.name);assert.equal(new Set(names).size,names.length);assert(names.includes('worker.js'));
const serving=original.modules.find(m=>m.name==='worker.js'),repair=applyArticlePatch(Buffer.from(serving.content_base64,'base64'),patch);
save('before',{deployment:baseline,main:original.main_module,modules:original.modules.map(m=>({name:m.name,sha256:sha(Buffer.from(m.content_base64,'base64'))})),repair:repair.proof});
const planned=original.modules.map(m=>m.name==='worker.js'?{...m,content_base64:Buffer.from(repair.code).toString('base64')}:m);
const security=['content-security-policy','strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'];
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
async function get(path,method='GET'){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{method,headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);
 return {status:r.status,text:method==='HEAD'?'':clean(await r.text()),headers:Object.fromEntries(security.map(h=>[h,r.headers.get(h)])),source:r.headers.get('x-shift-article-source'),type:r.headers.get('content-type')};
}
const protectedPaths=[...images.pages.map(p=>p.page),'/','/about','/member-login','/knowledge','/medicine-news/uk-archive-scotland-young-people-mental-health-transitions','/assets/member-experience/session.mjs','/api-adapter-v33d.js','/member-shell-v33g.js'];
async function protectedPages(){const result={};for(const p of protectedPaths){const r=await get(p);result[p]={sha256:sha(r.text),headers:r.headers,type:r.type};}return result;}
async function imageProof(){const rows=[];for(const item of images.pages){const r=await fetch('https://shiftsometimber.co.uk'+item.image,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,item.image);assert.equal(r.headers.get('content-type'),'image/webp');const bytes=Buffer.from(await r.arrayBuffer());assert.equal(sha(bytes),item.sha256,item.image);rows.push({path:item.image,status:r.status,sha256:sha(bytes)});}return rows;}
const databaseBinding=original.bindings.find(b=>b.name==='DB');assert.equal(databaseBinding?.type,'d1');
const databaseId=databaseBinding.id||databaseBinding.database_id;assert.match(databaseId,/^[a-f0-9-]{36}$/);
save('article-database-binding',{name:'DB',id:databaseId});
async function query(sql,params=[]){assert(/^SELECT\b/i.test(sql.trim())&&!sql.includes(';'),'Only fixed read-only article queries are permitted');const rows=await api('/d1/database/'+databaseId+'/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sql,params})});assert.equal(rows.length,1);return rows[0].results;}
const DB={prepare(sql){return{args:[],bind(...args){this.args=args;return this;},async first(){return(await query(sql,this.args))[0]||null;},async all(){return{results:await query(sql,this.args)};}};}};
const beforeFile='babylove/.article-1509-before.mjs';writeFileSync(beforeFile,oldSource);
const oldRenderer=await import(pathToFileURL(process.cwd()+'/'+beforeFile).href),newRenderer=await import(pathToFileURL(process.cwd()+'/'+renderer).href);
rmSync(beforeFile);
const dated=await query("SELECT a.slug,b.source_id,a.publish_at FROM knowledge_articles a JOIN babylove_receipts b ON b.slug=a.slug WHERE a.status='published' AND a.publish_at IS NOT NULL AND julianday(a.publish_at)<=julianday('now') ORDER BY a.publish_at DESC LIMIT 100");
save('publication-samples',dated);
const preferred=dated.filter(r=>String(r.publish_at).startsWith('2026-10-30'));
const vendor=preferred.find(r=>r.source_id!=='shift-contributor')||dated.find(r=>r.source_id!=='shift-contributor');
assert(vendor,'Existing BabyLove receipt example is required');
// The existing direct contributor publication is served by its own retained
// route. It must be checked on actual traffic, not invented as a BabyLove receipt.
const directSlug='type-2-diabetes-remission-men';
function articleDates(html){
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  const parsed=JSON.parse(m[1]),rows=Array.isArray(parsed)?parsed:[parsed,...(parsed['@graph']||[])];
  const a=rows.find(r=>[r['@type']].flat().some(t=>t==='Article'||t==='BlogPosting'));
  if(a)return {publishedAt:a.datePublished||null,updatedAt:a.dateModified||null};
 }
 return {publishedAt:null,updatedAt:null};
}
const editorial=await query("SELECT a.slug FROM knowledge_articles a JOIN knowledge_editorial_releases r ON r.article_id=a.id AND r.slug=a.slug WHERE a.status='published' AND r.state IN ('published','verified') ORDER BY a.publish_at DESC LIMIT 1");
const slugs=[...new Set(['glp-1-weight-regain',vendor.slug,directSlug,...editorial.map(r=>r.slug)])];
const articleBefore={},expectedArticles={},sourceProof={};
for(const slug of slugs){
 if(slug===directSlug){
  const r=await get('/articles/'+slug);assert.equal(r.source,'shift-contributor','Existing direct publication route must retain its authenticated source label');
  articleBefore[slug]=r;expectedArticles[slug]=r.text;
  sourceProof[slug]={kind:'existing_direct_publication_route',expected:'shift-contributor',...articleDates(r.text),htmlSHA256:sha(r.text)};
  continue;
 }
 const row=await newRenderer.dynamicBabyLovePublication({DB},slug);assert(row,'Published authenticated article unavailable: '+slug);
 const oldBody=oldRenderer.renderMarkdown(row.body,row.title,row.slug),newBody=newRenderer.renderMarkdown(row.body,row.title,row.slug);
 const r=await get('/articles/'+slug);assert(r.text.includes(oldBody),'Live body does not match the authenticated published preimage: '+slug);
 assert.equal(r.text.split(oldBody).length,2,'One published article body required');
 articleBefore[slug]=r;expectedArticles[slug]=r.text.replace(oldBody,()=>newBody);
 sourceProof[slug]={sourceId:row.source_id,editorial:!!row.editorial,expected:newRenderer.articleSource(row),publishedAt:row.publish_at,updatedAt:row.updated_at,bodySHA256:sha(row.body)};
}
console.log('AUTHENTICATED_SOURCE_EXAMPLES '+JSON.stringify({direct:{slug:directSlug,...sourceProof[directSlug]},vendor}));
const beforePages=await protectedPages();save('protected-before',beforePages);save('images-before',await imageProof());save('article-sources',sourceProof);
currentSource();assert.equal((await latest()).id,baseline.id);assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settings);
const metadata={main_module:original.main_module,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,annotations:{'workers/message':'Exact article renderer PR1509; source '+source,'workers/tag':'article-1509-'+run}};
for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
for(const m of planned)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type||'application/javascript+module'}),m.name);
const uploaded=await api('/workers/scripts/shift-core/versions?bindings_inheritance=strict',{method:'POST',body:form}),staged=await version(uploaded.id);
assert.deepEqual(staged.modules.map(m=>m.name).sort(),names.toSorted());
for(const m of planned){const actual=staged.modules.find(x=>x.name===m.name);assert.equal(sha(Buffer.from(actual.content_base64,'base64')),sha(Buffer.from(m.content_base64,'base64')),m.name);assert.equal(actual.content_type,m.content_type,m.name+' type');}
for(const key of ['main_module','compatibility_date','compatibility_flags','bindings','assets','migration_tag','usage_model'])assert.deepEqual(staged[key],original[key],'Serving configuration changed: '+key);
save('staged',{source,main:MAIN,run,versionId:uploaded.id,changedModule:'worker.js',unchangedModules:names.length-1,settingsPreserved:true,bindingsPreserved:true,exactInverse:true});
currentSource();assert.equal((await latest()).id,baseline.id,'Serving owner moved during staging');assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settings);
save('promotion-intent',{source,run,versionId:uploaded.id,previousDeploymentId:baseline.id});
try{
 let result,promotionError;
 try{result=await promote(uploaded.id);}catch(e){promotionError=e;}
 const active=await latest();assert.equal(active.versions[0].version_id,uploaded.id,'Owned version was not promoted');assert.notEqual(active.id,baseline.id);if(result)assert.equal(active.id,result.id);
 const receipt={kind:'owned_runtime_deployment',source,run,main:MAIN,deploymentId:active.id,versionId:uploaded.id,previousDeploymentId:baseline.id,previousVersionId:baseline.versions[0].version_id};save('deployed',receipt);
 const articleAfter={};
 for(const slug of slugs){
  let r;for(let attempt=0;attempt<8;attempt++){r=await get('/articles/'+slug);if(r.text===expectedArticles[slug]&&r.source===sourceProof[slug].expected)break;await new Promise(resolve=>setTimeout(resolve,1500));}
  assert.equal(sha(r.text),sha(expectedArticles[slug]),'Only the exact existing renderer repair may change live article HTML: '+slug);
  assert.deepEqual(r.headers,articleBefore[slug].headers,'Article security policy changed: '+slug);assert.equal(r.source,sourceProof[slug].expected,slug+' source');
  const head=await get('/articles/'+slug,'HEAD');assert.equal(head.source,r.source);assert.deepEqual(head.headers,r.headers);
  let row;
  if(slug===directSlug){const dates=articleDates(r.text);assert.equal(dates.publishedAt,sourceProof[slug].publishedAt);assert.equal(dates.updatedAt,sourceProof[slug].updatedAt);row={publish_at:dates.publishedAt,updated_at:dates.updatedAt};}
  else{row=await newRenderer.dynamicBabyLovePublication({DB},slug);assert.equal(sha(row.body),sourceProof[slug].bodySHA256);assert.equal(row.publish_at,sourceProof[slug].publishedAt);assert.equal(row.updated_at,sourceProof[slug].updatedAt);}
  const hrefs=[...r.text.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]).filter(h=>h.includes('/journals/eclinm/'));
  if(slug==='glp-1-weight-regain'){const full='https://www.thelancet.com/journals/eclinm/article/PIIS2589-5370(25)00614-5/fulltext';assert.equal(hrefs.filter(h=>h===full).length,2,'Both complete eClinicalMedicine links required');assert(hrefs.every(h=>h.endsWith('/fulltext')));}
  articleAfter[slug]={httpStatus:r.status,getSource:r.source,headSource:head.source,securityPreserved:true,publishedAt:row.publish_at,updatedAt:row.updated_at,bodyUnchanged:true,htmlSHA256:sha(r.text),eClinicalMedicineLinks:hrefs};
 }
 save('articles-after',articleAfter);
 assert.deepEqual(await protectedPages(),beforePages,'Unrelated public pages or login assets changed');save('protected-after',beforePages);save('images-after',await imageProof());
 assert.deepEqual(await api('/workers/scripts/shift-core/settings'),settings,'Production settings changed');assert.equal((await latest()).id,receipt.deploymentId,'A newer deployment owns production');
 save('verified',{...receipt,verifiedAt:new Date().toISOString(),reusedChecks:[41251655793,41251655750,41251655803],imagesVerified:8,protectedDocuments:protectedPaths.length,articlesVerified:slugs,allOtherModulesPreserved:names.length-1,articleBodyAndDatesUnchanged:true,databaseWrites:false,routeChanges:false,communicationsSent:false,promotionResponseRecovered:!!promotionError});
 console.log('ARTICLE_RENDERER_PRODUCTION_VERIFIED '+JSON.stringify({main:MAIN,version:uploaded.id,deployment:receipt.deploymentId,articles:articleAfter,images:8,otherModules:names.length-1}));
}catch(e){save('failure',{message:e.message});await rollback();throw e;}
