// Bounded release: describe nine free calculator pages without unsupported software rich-result claims.
// Modes: prepare -> publish -> verify. Every publish checks that production still matches the captured baseline.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {hash}=require(process.env.TOOL_BLAKE3_MODULE||'blake3-wasm');
const dir=path.resolve(process.argv[3]||'tool-page-schema-evidence');
fs.mkdirSync(dir,{recursive:true});
const paths=['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water'];
const base='https://api.cloudflare.com/client/v4',project='/accounts/9e5386dcf455be34c582d93f8bfc79e6/pages/projects/projectshift';
const config=fs.readFileSync(path.join(require('os').homedir(),'Library/Preferences/.wrangler/config/default.toml'),'utf8');
const token=config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];assert(token,'Existing release credential unavailable');
const save=(n,d)=>fs.writeFileSync(path.join(dir,n),typeof d==='string'?d:JSON.stringify(d,null,2));
const load=n=>JSON.parse(fs.readFileSync(path.join(dir,n)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const assetKey=s=>hash(Buffer.from(s).toString('base64')+'html').toString('hex').slice(0,32);
async function api(p,init={},auth=token){const r=await fetch(base+p,{...init,headers:{Authorization:'Bearer '+auth,...init.headers},signal:AbortSignal.timeout(30000)});const d=await r.json();assert(r.ok&&d.success,'Release API failed: '+r.status+' '+JSON.stringify(d.errors));return d.result;}
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,url);return {body:await r.text(),status:r.status};}
const re=()=>/(<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script\s*>)/gi;
function nodes(html){return [...html.matchAll(re())].map(m=>JSON.parse(m[2]));}
function apps(n){if(Array.isArray(n))return n.flatMap(apps);if(!n||typeof n!=='object')return [];const types=[n['@type']].flat();return [...(types.some(t=>['SoftwareApplication','WebApplication','MobileApplication'].includes(t))?[n]:[]),...Object.values(n).flatMap(apps)];}
function repair(html,p){
 let changed=0;
 function node(n){
  if(Array.isArray(n))return n.map(node);
  if(!n||typeof n!=='object')return n;
  if(['WebApplication','SoftwareApplication'].includes(n['@type'])){
   assert.equal(n.isAccessibleForFree,true,'Tool was not declared free');assert(!n.aggregateRating&&!n.review,'Existing real review requires separate assessment');
   const out={...n,'@type':'WebPage','@id':'https://shiftsometimber.co.uk'+p+'#webpage',url:'https://shiftsometimber.co.uk'+p};
   delete out.applicationCategory;delete out.operatingSystem;delete out.offers;
   changed++;return out;
  }
  return Object.fromEntries(Object.entries(n).map(([k,v])=>[k,node(v)]));
 }
 const out=html.replace(re(),(whole,open,json,close)=>{const old=JSON.parse(json),next=node(old);return JSON.stringify(old)===JSON.stringify(next)?whole:open+JSON.stringify(next).replace(/</g,'\\u003c')+close;});
 assert.equal(changed,1,'Unexpected application count on '+p);
 assert.equal(html.replace(re(),'SCHEMA'),out.replace(re(),'SCHEMA'),'Visible HTML or calculator scripts changed');
 assert.equal(apps(nodes(out)).length,0,'Unsupported application-rich-result item remains');
 const beforeOthers=nodes(html).filter(n=>!apps(n).length),afterOthers=nodes(out).filter(n=>n['@type']!=='WebPage');
 assert.deepEqual(afterOthers,beforeOthers,'Unrelated structured data changed');
 return out;
}
async function prepare(){
 assert(!fs.existsSync(path.join(dir,'baseline.json')),'Use a fresh evidence directory; do not overwrite a previous release');
 const p=await api(project),d=p.canonical_deployment;assert(d&&d.environment==='production');assert(!d.uses_functions,'Function bundle requires separate preservation');
 const {files}=await api(project+'/deployments/'+d.id+'/files');assert(Object.keys(files).length>800);
 save('baseline.json',d);save('manifest-before.json',files);
 const candidate={...files},uploads=[],checks=[];
 for(const pth of paths){
  const file=pth+'.html';assert(files[file],'Missing canonical asset '+file);
  const {body:before}=await get(d.url+file);assert.equal(assetKey(before),files[file],'Snapshot does not match production asset');
  const after=repair(before,pth);save(encodeURIComponent(pth)+'.before.html',before);save(encodeURIComponent(pth)+'.after.html',after);
  const key=assetKey(after);candidate[file]=key;uploads.push({key,value:Buffer.from(after).toString('base64'),metadata:{contentType:'text/html'},base64:true});
  checks.push({path:pth,oldHash:sha(before),newHash:sha(after),visibleHtmlUnchanged:true,applicationItemsRemoved:1,remainingTypes:nodes(after).map(n=>n['@type']),jsonParseErrors:0});
 }
 assert.deepEqual(Object.keys(files).filter(k=>files[k]!==candidate[k]).sort(),paths.map(p=>p+'.html').sort());
 assert.equal(candidate['/index.html'],files['/index.html']);assert.equal(candidate['/start-here.html'],files['/start-here.html']);
 save('manifest-candidate.json',candidate);save('scope-proof.json',{at:new Date().toISOString(),baseline:d.id,changed:checks,retainedAssets:Object.keys(files).length-paths.length,homepageAndStartHerePreserved:true,googleSoftwareRichResults:'Not requested; no fabricated reviews'});
 assert.equal((await api(project)).canonical_deployment.id,d.id,'Production changed during preparation');
 const {jwt}=await api(project+'/upload-token');await api('/pages/assets/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(uploads)},jwt);
 const form=new FormData();form.set('manifest',JSON.stringify(candidate));form.set('branch','tool-page-schema-review-20261008');form.set('commit_message','Bounded nine-tool WebPage schema repair requested by Matt');form.set('commit_dirty','false');
 const preview=await api(project+'/deployments',{method:'POST',body:form});save('preview.json',preview);
 console.log(JSON.stringify({stage:'preview_submitted',id:preview.id,url:preview.url,changedAssets:checks.length,retainedAssets:Object.keys(files).length-paths.length}));
}
async function checkDeployment(d){
 const receipts=[];
 for(const p of paths){const {body,status}=await get(d.url+p+'.html');const expected=fs.readFileSync(path.join(dir,encodeURIComponent(p)+'.after.html'),'utf8');assert.equal(body,expected,'Deployed bytes differ for '+p);receipts.push({path:p,status,exactCandidate:true,remainingApplicationItems:apps(nodes(body)).length,jsonParseErrors:0});}
 return receipts;
}
async function publish(){
 assert(!fs.existsSync(path.join(dir,'production.json')),'Production receipt exists; use verify rather than publish again');
 const baseline=load('baseline.json'),preview=load('preview.json');const p=await api(project);assert.equal(p.canonical_deployment.id,baseline.id,'Production changed; rebase required');
 save('preview-verification.json',await checkDeployment(preview));
 const files=load('manifest-candidate.json');const latest=await api(project);assert.equal(latest.canonical_deployment.id,baseline.id,'Production changed before promotion');
 const form=new FormData();form.set('manifest',JSON.stringify(files));form.set('branch',p.production_branch);form.set('commit_message','Verified nine-tool page schema repair; visible calculators preserved');form.set('commit_dirty','false');
 const d=await api(project+'/deployments',{method:'POST',body:form});save('production.json',d);console.log(JSON.stringify({stage:'production_submitted',id:d.id,url:d.url}));
}
async function verify(){
 const d=load('production.json');assert.equal((await api(project)).canonical_deployment.id,d.id,'Another production release superseded this candidate');
 const originChecks=await checkDeployment(d),liveChecks=[];
 for(const p of paths){const {body,status}=await get('https://shiftsometimber.co.uk'+p);const expected=fs.readFileSync(path.join(dir,encodeURIComponent(p)+'.after.html'),'utf8');const actual=nodes(body),candidate=nodes(expected);
 const page=n=>n['@type']==='WebPage';assert.deepEqual(actual.filter(page),candidate.filter(page),'Live page schema differs on '+p);
 // This existing runtime suppresses an organisation logo used as Article.image on these three pages.
 // The same omission was observed in the pre-release live audit; require this exact difference only.
 const logoFilterPaths=new Set(['/decision-centre','/tools/protein','/tools/walking']);
 let runtimeArticleLogoOmitted=false;
 const comparable=candidate.map((n,i)=>{if(logoFilterPaths.has(p)&&n['@type']==='Article'&&n.image==='https://shiftsometimber.co.uk/assets/shift-wordmark.png'&&actual[i]?.image===undefined){runtimeArticleLogoOmitted=true;const out={...n};delete out.image;return out;}return n;});
 assert.deepEqual(actual,comparable,'Unexpected live schema difference on '+p);
 liveChecks.push({path:p,status,exactExpectedPageSchema:true,otherSchemaPreserved:true,knownPreexistingRuntimeArticleLogoOmitted:runtimeArticleLogoOmitted,applicationItems:apps(actual).length,jsonParseErrors:0,sha256:sha(body)});}
 const before=load('manifest-before.json'),after=load('manifest-candidate.json');
 const result={verifiedAt:new Date().toISOString(),productionDeployment:d.id,baselineDeployment:load('baseline.json').id,previewDeployment:load('preview.json').id,changedAssets:paths.length,retainedAssets:Object.keys(before).length-paths.length,homepageAndStartHereManifestUnchanged:before['/index.html']===after['/index.html']&&before['/start-here.html']===after['/start-here.html'],originChecks,liveChecks,semrushRecrawl:'Not run by this release; previous screenshot crawl dated 1 October',googleRichResults:'Software rich results not requested; genuine reviews not invented',agentTeam:'Not created; this is an executed bounded release workflow',rankingUplift:'Not measured'};
 save('live-verification.json',result);console.log(JSON.stringify(result));
}
({prepare,publish,verify}[process.argv[2]]||(()=>{throw Error('Choose prepare, publish or verify')}))().catch(e=>{console.error(e.message);process.exitCode=1;});
