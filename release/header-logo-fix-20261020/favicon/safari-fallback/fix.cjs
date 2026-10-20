const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs'),r=__dirname;
const read=n=>JSON.parse(fs.readFileSync(r+'/'+n)),save=(n,x)=>fs.writeFileSync(r+'/'+n,JSON.stringify(x,null,2));
const owner='/Users/shiftsometimberltd/SST/assessment-v2-20261020-review/budget-layout-20261020/contrast-r3',branch='fix/header-logo-20261020',prefix='release/header-logo-fix-20261020/favicon/safari-fallback/';
const GH='/Users/shiftsometimberltd/SST/shift-master-finish-20261013-7KGzrW/github-cli-private-20261013/gh_2.102.0_macOS_arm64/bin/gh';
const ico=['/favicon.ico','/assets/favicon.ico','/assets/favicon-shift-s-20261020.ico'],touch=['/apple-touch-icon.png','/apple-touch-icon-precomposed.png'];
function gh(p,b,method='POST'){return JSON.parse(cp.execFileSync(GH,['api','repos/shiftsometimber/shift-core'+p,...(b?['--method',method,'--input','-']:[])],{input:b?JSON.stringify(b):undefined,encoding:'utf8',timeout:30000}));}
async function get(url,status=200){
 const q=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Safari/605.1.15','Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
 assert.equal(q.status,status,url);const bytes=Buffer.from(await q.arrayBuffer());
 return {bytes,receipt:{url:q.url,status:q.status,sha256:c.sha(bytes),headers:Object.fromEntries(['content-type','cache-control','referrer-policy','x-robots-tag'].map(k=>[k,q.headers.get(k)]))}};
}
function parts(s){return Object.fromEntries(['main','header','footer'].map(k=>[k,c.sha(c.part(s,k))]));}
function icons(s){return(s.match(/<link\b[^>]*>/gi)||[]).filter(x=>/icon|manifest/i.test(x));}
async function prepare(){
 assert(!fs.existsSync(r+'/baseline.json'));
 const p=await c.organicApi(c.pages),d=p.canonical_deployment;assert.equal(d.id,JSON.parse(fs.readFileSync(owner+'/production-deployment.json')).id,'Recover current headers before proceeding');
 const before=(await c.organicApi(c.pages+'/deployments/'+d.id+'/files')).files;save('baseline.json',{id:d.id,url:d.url,productionBranch:p.production_branch});save('manifest-before.json',before);
 const headers=fs.readFileSync(owner+'/headers-candidate.txt');fs.writeFileSync(r+'/headers-before.txt',headers);
 let h=headers.toString().trimEnd()+'\n\n';for(const p of ico)h+=p+'\n  Content-Type: image/x-icon\n  Cache-Control: public, max-age=0, must-revalidate\n\n';for(const p of touch)h+=p+'\n  Content-Type: image/png\n  Cache-Control: public, max-age=0, must-revalidate\n\n';fs.writeFileSync(r+'/headers-candidate.txt',h);
 const z=await c.get(d.url+'/assets/apple-touch-shift-s-20261020.png');assert.equal(c.asset(z.bytes,'png'),before['/assets/apple-touch-shift-s-20261020.png']);fs.writeFileSync(r+'/approved-touch-icon.png',z.bytes);
 const next={...before};for(const p of touch){assert(!before[p]);next[p]=c.asset(z.bytes,'png')}save('manifest-candidate.json',next);
 const checks=[];for(const p of ico){const q=await get('https://shiftsometimber.co.uk'+p);assert.equal(q.receipt.headers['content-type'],'null');checks.push(q.receipt)}for(const p of touch)checks.push((await get('https://shiftsometimber.co.uk'+p,404)).receipt);
 const pages={};for(const p of ['/','/start-here']){const q=await get('https://shiftsometimber.co.uk'+p),s=q.bytes.toString();pages[p]={parts:parts(s),icons:icons(s)};fs.writeFileSync(r+'/'+(p==='/'?'home-before.html':'start-before.html'),q.bytes)}
 save('diagnosis.json',{at:new Date().toISOString(),checks,pages,observed:'Safari address field shows correct S, tab shows pale obsolete monogram',nativeSafariVersion:'27.2',nativeSafariTabVerified:false,accessLimits:{faviconCache:'macOS Operation not permitted',screenCapturePermission:false,appleEventsJavaScript:'disabled; unchanged'},causality:'Invalid fallback MIME is confirmed; causal connection to stale Safari tab is unverified'});
 save('scope-proof.json',{base:d.id,htmlAssetsChanged:0,existingAssetsUnchanged:Object.entries(before).every(([p,h])=>next[p]===h),addedAliases:touch,approvedArtworkUnchanged:true,headersOnlyAppend:true,headersBeforeSHA256:c.sha(headers),headersAfterSHA256:c.sha(h),iconSHA256:c.sha(z.bytes)});
 console.log(JSON.stringify({prepared:true,base:d.id,existingAssets:Object.keys(before).length,addedAliases:2}));
}
function commitFiles(parent,message,entries){
 const base=gh('/git/commits/'+parent),tree=[];for(const[p,b]of entries){const z=gh('/git/blobs',{encoding:'base64',content:b.toString('base64')});tree.push({path:p,mode:'100644',type:'blob',sha:z.sha})}
 const t=gh('/git/trees',{base_tree:base.tree.sha,tree}),n=gh('/git/commits',{message,tree:t.sha,parents:[parent]});gh('/git/refs/heads/'+branch,{sha:n.sha,force:false},'PATCH');return n.sha;
}
function source(){
 assert(!fs.existsSync(r+'/source-publication.json'));const head=gh('/git/ref/heads/'+branch).object.sha,doc=Buffer.from(gh('/contents/docs/rec034-auth-header.md?ref='+head).content,'base64').toString();
 const note='\n\nSafari follow-up 20 October 2026: Safari tab retains the obsolete pale monogram while Chrome and Safari address field show approved S. All current ICO frames and PNGs show approved S. Confirmed defect: all three ICO responses use literal invalid Content-Type: null; default Apple touch fallback paths return 404. Scoped repair appends valid image/x-icon response rules and exposes the existing unchanged S PNG at two Apple fallback paths. No existing asset, HTML, visible content or logic changes; latest Start Here and privacy rules preserved. Native Safari 27.2 is installed, but macOS blocks favicon cache access and screen capture; Apple Events JavaScript is disabled and was left unchanged. Isolated diagnostic window closed. Do not claim the native Safari tab is fixed without confirmation. Evidence: '+prefix+'.\n';
 const names=['fix.cjs','baseline.json','manifest-before.json','manifest-candidate.json','headers-before.txt','headers-candidate.txt','approved-touch-icon.png','diagnosis.json','scope-proof.json'];
 const entries=names.map(n=>[prefix+n,fs.readFileSync(r+'/'+n)]);entries.push(['docs/rec034-auth-header.md',Buffer.from(doc+note)]);
 const sha=commitFiles(head,'Correct invalid favicon MIME and add approved Apple icon fallback paths',entries);
 save('source-publication.json',{branch,head:sha,base:read('baseline.json').id,headersSHA256:c.sha(fs.readFileSync(r+'/headers-candidate.txt')),iconSHA256:c.sha(fs.readFileSync(r+'/approved-touch-icon.png'))});console.log(JSON.stringify(read('source-publication.json')));
}
function validate(){
 const before=read('manifest-before.json'),next=read('manifest-candidate.json'),s=read('source-publication.json');assert.equal(Object.keys(next).length,Object.keys(before).length+2);
 for(const[p,h]of Object.entries(before))assert.equal(next[p],h,p);
 const b=fs.readFileSync(r+'/approved-touch-icon.png');assert.equal(c.sha(b),s.iconSHA256);for(const p of touch)assert.equal(next[p],c.asset(b,'png'));
 const h=fs.readFileSync(r+'/headers-candidate.txt');assert.equal(c.sha(h),s.headersSHA256);assert(h.toString().startsWith(fs.readFileSync(r+'/headers-before.txt').toString().trimEnd()));assert.equal(read('scope-proof.json').htmlAssetsChanged,0);
 assert.equal(gh('/git/ref/heads/'+branch).object.sha,s.head,'Source branch moved');
}
async function publish(stage){
 validate();assert(['preview','production'].includes(stage));assert(!fs.existsSync(r+'/'+stage+'-intent.json'),'Reconcile existing transaction');if(stage==='production')assert(read('preview-verification.json').pass);
 const base=read('baseline.json'),src=read('source-publication.json'),next=read('manifest-candidate.json'),h=fs.readFileSync(r+'/headers-candidate.txt');assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,base.id,'Rebase on newer production');
 const phase=await c.phase(),{jwt}=await c.organicApi(c.pages+'/upload-token'),auth={'Content-Type':'application/json',Authorization:'Bearer '+jwt};
 const missing=await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:[...new Set(Object.values(next))]})});
 const preserved=read('retained-assets.json');for(const hash of missing){const row=preserved.find(x=>x.hash===hash);assert(row,'Unknown missing asset '+hash);const b=fs.readFileSync(r+'/'+row.file);assert.equal(c.sha(b),row.sha256);assert.equal(next[row.path],hash);await c.organicApi('/pages/assets/upload',{method:'POST',headers:auth,body:JSON.stringify([{key:hash,value:b.toString('base64'),base64:true,metadata:{contentType:row.contentType}}])})}
 await c.organicApi('/pages/assets/upsert-hashes',{method:'POST',headers:auth,body:JSON.stringify({hashes:Object.values(next)})});assert.equal((await c.organicApi('/pages/assets/check-missing',{method:'POST',headers:auth,body:JSON.stringify({hashes:[...new Set(Object.values(next))]})})).length,0);await c.phase();assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,base.id);validate();
 const f=c.organicFormData();f.set('manifest',JSON.stringify(next));f.set('_headers',new Blob([h]),'_headers');f.set('branch',stage==='production'?base.productionBranch:src.branch);f.set('commit_hash',src.head);f.set('commit_dirty','false');f.set('commit_message','Correct ICO response type and add approved Apple icon fallback paths');
 save(stage+'-intent.json',{at:new Date().toISOString(),base:base.id,source:src.head,phase,existingAssetChanges:0,addedAppleAliases:2,headersSHA256:c.sha(h)});
 const d=await c.organicApi(c.pages+'/deployments',{method:'POST',body:f});save(stage+'-deployment.json',{id:d.id,url:d.url,stage:d.latest_stage});console.log(JSON.stringify(read(stage+'-deployment.json')));
}
async function verify(stage){
 validate();const dep=read(stage+'-deployment.json'),next=read('manifest-candidate.json'),d=await c.organicApi(c.pages+'/deployments/'+dep.id);assert.equal(d.latest_stage.status,'success');assert.deepEqual(d.files,next);
 const checks=[],origins=[dep.url];if(stage==='production')origins.push('https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk');
 for(const origin of origins){
  for(const p of ico){const q=await get(origin+p);assert.equal(q.receipt.headers['content-type'],'image/x-icon',p);assert.equal(q.receipt.sha256,'62dc06ab52521ffb1c82466e70fdc052f5aeabacb163d113fafdb032997523d1');checks.push(q.receipt)}
  for(const p of touch){const q=await get(origin+p);assert.equal(q.receipt.headers['content-type'],'image/png');assert.equal(q.receipt.sha256,read('source-publication.json').iconSHA256);checks.push(q.receipt)}
  for(const p of ['/assets/favicon-shift-s-20261020.png','/assets/apple-touch-shift-s-20261020.png']){const q=await get(origin+p);assert.equal(q.receipt.headers['content-type'],'image/png');assert.equal(c.asset(q.bytes,'png'),next[p]);checks.push(q.receipt)}
 }
 if(stage==='production'){
  const old=read('diagnosis.json');for(const p of ['/','/start-here']){const q=await get('https://shiftsometimber.co.uk'+p),s=q.bytes.toString();assert.deepEqual(parts(s),old.pages[p].parts,p);assert.deepEqual(icons(s),old.pages[p].icons,p)}
  for(const p of ['/assessment-walkthrough','/medicine-preference','/treatment-assessment-terms']){const q=await get('https://shiftsometimber.co.uk'+p);assert.equal(q.receipt.headers['x-robots-tag'],'noindex, nofollow');assert.equal(q.receipt.headers['referrer-policy'],'no-referrer');assert.equal(q.receipt.headers['cache-control'],'no-store')}
  for(const p of ['/start-here','/assets/start-here-support-v1.js'])assert.equal((await get('https://shiftsometimber.co.uk'+p)).receipt.headers['cache-control'],'no-store');
 }
 assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,stage==='production'?dep.id:read('baseline.json').id);
 save(stage+'-verification.json',{at:new Date().toISOString(),pass:true,id:dep.id,url:dep.url,source:read('source-publication.json').head,manifestExact:true,existingAssetsUnchanged:true,htmlAssetsChanged:0,checks,nativeSafariTabVerified:false});
 console.log(JSON.stringify({pass:true,stage,id:dep.id,checks:checks.length,assets:Object.keys(next).length,nativeSafariTabVerified:false}));
}
async function closeout(){
 assert(!fs.existsSync(r+'/closeout-source.json'));const p=read('production-verification.json'),s=read('source-publication.json');assert(p.pass);assert.equal((await c.organicApi(c.pages)).canonical_deployment.id,p.id);assert.equal(gh('/git/ref/heads/'+branch).object.sha,s.head);
 const receipt={...p,url:'https://shiftsometimber.co.uk',predecessor:read('baseline.json').id,remaining:'Native Safari tab/cache state unverified; source and HTTP checks do not establish resolution',nativeAccessBlocked:true};save('publication-receipt.json',receipt);
 const doc=Buffer.from(gh('/contents/docs/rec034-auth-header.md?ref='+s.head).content,'base64').toString();
 const note='\nSafari fallback repair LIVE '+p.id+' from '+s.head+'. Whole manifest verified, all existing asset hashes retained, two default Apple PNG aliases added with unchanged approved S. All three ICO paths now have valid image/x-icon responses on deployment, apex and www redirect. Home/Start Here visible sections and metadata preserved; no-store and privacy headers retained. Actual native Safari tab remains unverified because macOS blocks the relevant access. Receipt: '+prefix+'publication-receipt.json.\n';
 const entries=['publication-receipt.json','production-verification.json','preview-verification.json'].map(n=>[prefix+n,fs.readFileSync(r+'/'+n)]);entries.push(['docs/rec034-auth-header.md',Buffer.from(doc+note)]);
 const sha=commitFiles(s.head,'Record live favicon repair and native Safari verification limit',entries);save('closeout-source.json',{branch,head:sha,deployedSource:s.head,deployment:p.id});console.log(JSON.stringify(read('closeout-source.json')));
}
(async()=>{const m=process.argv[2];if(m==='prepare')await prepare();else if(m==='source')source();else if(m==='closeout')await closeout();else if(m.startsWith('verify-'))await verify(m.slice(7));else await publish(m)})().catch(e=>{console.error(e);process.exitCode=1});
