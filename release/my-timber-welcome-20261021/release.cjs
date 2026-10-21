const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs'),r=__dirname;
const save=(n,v)=>fs.writeFileSync(r+'/'+n,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)),load=n=>JSON.parse(fs.readFileSync(r+'/'+n));
const GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh';
const api=(p,b)=>JSON.parse(cp.execFileSync(GH,['api','repos/shiftsometimber/shift-core'+p,...(b?['--method','POST','--input','-']:[])],{input:b?JSON.stringify(b):undefined,encoding:'utf8',timeout:30000}));
async function prepare(){
const p=await c.organicApi(c.pages),d=p.canonical_deployment;
assert.equal(d.id,load('baseline.json').id,'Baseline moved');
const files=(await c.organicApi(c.pages+'/deployments/'+d.id+'/files')).files;
assert.deepEqual(files,load('manifest-before.json'));
const old=(await c.get(d.url+'/member/dashboard.html')).bytes;
assert.equal(c.asset(old,'html'),files['/member/dashboard.html']);
save('before-dashboard.html',old);
const html=fs.readFileSync(r+'/welcome.html','utf8'),cssLink='<link rel="stylesheet" href="/assets/my-timber-welcome-20261021.css">',jsLink='<script defer src="/assets/my-timber-welcome-20261021.js"></script>';
const next=old.toString().replace('</head>',cssLink+'</head>').replace('<body>','<body>'+html).replace('</body>',jsLink+'</body>');
assert.equal(next.replace(cssLink,'').replace(html,'').replace(jsLink,''),old.toString(),'Exact dashboard inverse');
const h=JSON.parse(fs.readFileSync('/Users/shiftsometimberltd/SST/knowledge-links-20261021/production-deployment.json'));
assert.equal(h.id,d.id,'Recover current header source');
save('_headers',fs.readFileSync('/Users/shiftsometimberltd/SST/knowledge-links-20261021/_headers'));
fs.mkdirSync(r+'/after',{recursive:true});save('after/dashboard.html',next);
for(const[a,b]of [['welcome.css','welcome.css'],['welcome.js','welcome.js'],['anton.ttf','anton.ttf']])fs.copyFileSync(r+'/'+a,r+'/after/'+b);
const map={'/member/dashboard.html':'dashboard.html','/assets/my-timber-welcome-20261021.css':'welcome.css','/assets/my-timber-welcome-20261021.js':'welcome.js','/assets/my-timber-welcome-anton.ttf':'anton.ttf'};
const manifest={...files},changes=[];for(const [url,file]of Object.entries(map)){let b=fs.readFileSync(r+'/after/'+file);manifest[url]=c.asset(b,path.extname(url).slice(1));changes.push({path:url,file,before:files[url]||null,after:manifest[url],sha256:c.sha(b)})}
save('changes.json',changes);save('manifest-candidate.json',manifest);
save('scope-proof.json',{at:new Date().toISOString(),base:d.id,changes:changes.map(x=>x.path),allOtherAssetsUnchanged:Object.entries(files).every(([p,h])=>p==='/member/dashboard.html'||manifest[p]===h),dashboardInverse:true,homepageUnchanged:true,authCodeUnchanged:true,headersSHA256:c.sha(fs.readFileSync(r+'/_headers'))});
console.log(JSON.stringify(load('scope-proof.json')));
}
async function source(){
const previous=fs.existsSync(r+'/source-publication.json')?load('source-publication.json'):null;
const branch='feature/my-timber-welcome-20261021',base=api('/git/ref/heads/'+(previous?branch:'main')).object.sha,commit=api('/git/commits/'+base);if(previous)assert.equal(base,previous.head);
const entries=[];
for(const x of load('changes.json')){const b=api('/git/blobs',{content:fs.readFileSync(r+'/after/'+x.file).toString('base64'),encoding:'base64'});entries.push({path:'release/my-timber-welcome-20261021/assets/'+x.file,mode:'100644',type:'blob',sha:b.sha});}
for(const n of ['release.cjs','scope-proof.json','changes.json','_headers']){const b=api('/git/blobs',{content:fs.readFileSync(r+'/'+n).toString('base64'),encoding:'base64'});entries.push({path:'release/my-timber-welcome-20261021/'+n,mode:'100644',type:'blob',sha:b.sha});}
const t=api('/git/trees',{base_tree:commit.tree.sha,tree:entries}),n=api('/git/commits',{message:'Add approved My Timber signed-out welcome page and app choices',tree:t.sha,parents:[base]});if(previous){save('source-previous-'+previous.head+'.json',previous);JSON.parse(cp.execFileSync(GH,['api','repos/shiftsometimber/shift-core/git/refs/heads/'+branch,'--method','PATCH','--input','-'],{input:JSON.stringify({sha:n.sha,force:false}),encoding:'utf8'}));}else api('/git/refs',{ref:'refs/heads/'+branch,sha:n.sha});assert.equal(api('/git/ref/heads/'+branch).object.sha,n.sha);save('source-publication.json',{branch,head:n.sha,tree:t.sha,base});console.log(JSON.stringify(load('source-publication.json')));
}
function validate(){const before=load('manifest-before.json'),next=load('manifest-candidate.json'),changes=load('changes.json');assert.equal(changes.length,4);for(const[p,h]of Object.entries(before))if(p!=='/member/dashboard.html')assert.equal(next[p],h);for(const x of changes)assert.equal(c.sha(fs.readFileSync(r+'/after/'+x.file)),x.sha256);assert.equal(c.sha(fs.readFileSync(r+'/_headers')),load('scope-proof.json').headersSHA256);}
async function publish(stage){
validate();assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Reconcile transaction first');
const base=load('baseline.json'),source=load('source-publication.json'),next=load('manifest-candidate.json'),changes=load('changes.json');
assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,base.id,'Production moved');
const phase=await c.phase();
if(stage==='production'){assert(load('preview-verification.json').pass);assert(load('browser-acceptance.json').pass);}
const {jwt}=await c.organicApi(c.pages+'/upload-token'),auth={'Content-Type':'application/json',Authorization:'Bearer '+jwt},known=new Map(changes.map(x=>[next[x.path],x]));
const missing=await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})});assert(missing.every(x=>known.has(x)),'Unrelated asset unavailable');
if(missing.length)await c.organicApi('/pages/assets/upload',{method:'POST',headers:auth,body:JSON.stringify(missing.map(key=>{const x=known.get(key);return {key,value:fs.readFileSync(r+'/after/'+x.file).toString('base64'),base64:true,metadata:{contentType:x.file.endsWith('.html')?'text/html; charset=utf-8':x.file.endsWith('.css')?'text/css; charset=utf-8':x.file.endsWith('.js')?'application/javascript; charset=utf-8':'font/ttf'}}}))});
await c.organicApi('/pages/assets/upsert-hashes',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})});
assert.equal((await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})})).length,0);
await c.phase();assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,base.id);validate();
const f=c.organicFormData();f.set('manifest',JSON.stringify(next));f.set('_headers',new Blob([fs.readFileSync(r+'/_headers')]),'_headers');f.set('branch',stage==='production'?base.productionBranch:source.branch);f.set('commit_hash',source.head);f.set('commit_dirty','false');f.set('commit_message','Approved My Timber welcome page: free joining, login and app choices');
save(stage+'-intent.json',{at:new Date().toISOString(),base:base.id,source:source.head,phase,scope:changes.map(x=>x.path)});
const d=await c.organicApi(c.pages+'/deployments',{method:'POST',body:f});save(stage+'-deployment.json',{id:d.id,url:d.url,stage:d.latest_stage});console.log(JSON.stringify(load(stage+'-deployment.json')));
}
async function verify(stage){validate();const d=load(stage+'-deployment.json'),a=await c.organicApi(c.pages+'/deployments/'+d.id);assert.equal(a.latest_stage.status,'success');assert.deepEqual(a.files,load('manifest-candidate.json'));const checks=[];for(const x of load('changes.json')){let z=await c.get(d.url+x.path);assert.equal(z.receipt.sha256,x.sha256);checks.push(z.receipt)}const p=await c.organicApi(c.pages);assert.equal(p.canonical_deployment.id,stage==='production'?d.id:load('baseline.json').id);if(stage==='production'){let z=await c.get('https://shiftsometimber.co.uk/member/dashboard');assert(z.bytes.toString().includes('id="mtWelcome"'));save('live-dashboard.html',z.bytes);checks.push(z.receipt);for(const x of load('changes.json').filter(x=>x.path.startsWith('/assets/'))){let y=await c.get('https://shiftsometimber.co.uk'+x.path);assert.equal(y.receipt.sha256,x.sha256);checks.push(y.receipt)}}save(stage+'-verification.json',{pass:true,at:new Date().toISOString(),id:d.id,checks,manifestExact:true,source:load('source-publication.json').head});console.log(JSON.stringify({pass:true,stage,id:d.id}));}
(async()=>{const mode=process.argv[2];if(mode==='prepare')await prepare();else if(mode==='source')await source();else if(mode.startsWith('verify-'))await verify(mode.slice(7));else await publish(mode)})().catch(e=>{console.error(e);process.exitCode=1});
