const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,account='9e5386dcf455be34c582d93f8bfc79e6',name='shift-bloods-public',scriptPath='/accounts/'+account+'/workers/scripts/'+name;
const token=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)[1];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function api(route,{method='GET',body,allowNotFound=false}={}){const r=await fetch('https://api.cloudflare.com/client/v4'+route,{method,headers:{Authorization:'Bearer '+token,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});if(r.status===404&&allowNotFound)return null;const j=await r.json();if(!r.ok||!j.success)throw Error('Provider HTTP '+r.status+' '+JSON.stringify(j.errors));return j.result;}
const patterns=['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].flatMap(h=>[h+'/shift-health/blood-tests*',h+'/shift-health',h+'/shift-health/',h+'/shift-health.html']);
(async()=>{
const mode=process.argv[2];if(!['preview','production','activate','routes'].includes(mode))throw Error('Expected preview, production, activate or routes');
if(mode==='activate'||mode==='routes'){
 const zones=await api('/zones?name=shiftsometimber.co.uk');if(zones.length!==1)throw Error('Expected one matching zone');const zone=zones[0].id,base='/zones/'+zone+'/workers/routes',routes=await api(base);
 if(mode==='routes'){console.log(JSON.stringify(routes.filter(x=>x.pattern.includes('/shift-health')).map(x=>({id:x.id,pattern:x.pattern,script:x.script}))));return;}
 if(!JSON.parse(fs.readFileSync(path.join(ROOT,'production-status.json'))).latest_stage||JSON.parse(fs.readFileSync(path.join(ROOT,'production-status.json'))).latest_stage.status!=='success')throw Error('Page assets are not yet serving');
 if(!JSON.parse(fs.readFileSync(path.join(ROOT,'preview-proof.json'))).pass)throw Error('Preview proof missing');
 if(fs.existsSync(path.join(ROOT,'marketing-routes-intent.json')))throw Error('Route activation already attempted: reconcile the retained route records');
 for(const pattern of patterns){const existing=routes.find(r=>r.pattern===pattern);if(existing)throw Error('An exact route already exists; no automatic replacement: '+pattern);}
 fs.writeFileSync(path.join(ROOT,'marketing-routes-before.json'),JSON.stringify(routes,null,2));fs.writeFileSync(path.join(ROOT,'marketing-routes-intent.json'),JSON.stringify({at:new Date().toISOString(),zone,script:name,patterns},null,2));
 const created=[];for(const pattern of patterns){const r=await api(base,{method:'POST',body:{pattern,script:name}});created.push({id:r.id,pattern:r.pattern,script:r.script});fs.writeFileSync(path.join(ROOT,'marketing-routes-created.json'),JSON.stringify({zone,created},null,2));}
 const after=await api(base);for(const r of created)if(!after.some(x=>x.id===r.id&&x.script===name&&x.pattern===r.pattern))throw Error('Route did not verify: '+r.pattern);
 for(const r of routes)if(!after.some(x=>x.id===r.id&&x.pattern===r.pattern&&x.script===r.script))throw Error('An existing route changed');
 fs.writeFileSync(path.join(ROOT,'marketing-routes-after.json'),JSON.stringify(after,null,2));console.log(JSON.stringify({activated:true,created,existingRoutesPreserved:routes.length,backendCodeChanged:false,homepageRouteChanged:false}));return;
}
const out=path.join(ROOT,'marketing-'+mode+'-deployment.json');if(fs.existsSync(out)||fs.existsSync(path.join(ROOT,'marketing-'+mode+'-intent.json')))throw Error('This router deployment was already attempted; reconcile its receipt');
if(mode==='production'&&!JSON.parse(fs.readFileSync(path.join(ROOT,'preview-proof.json'))).pass)throw Error('Preview proof missing');
const repo=path.join(ROOT,'source-repo'),modules=['shift-bloods-marketing-worker.mjs','shift-bloods-public.mjs'].map(file=>({name:file,bytes:fs.readFileSync(path.join(repo,file))}));
const source=JSON.parse(fs.readFileSync(path.join(ROOT,'source-publication.json'))),origin=mode==='preview'?'https://88265868.projectshift.pages.dev':'https://projectshift.pages.dev';
const existing=await api(scriptPath+'/settings',{allowNotFound:true});
if(mode==='preview'&&existing)throw Error('Router name already exists; inspect its ownership before changing it');
const form=new FormData();form.append('metadata',JSON.stringify({main_module:'shift-bloods-marketing-worker.mjs',compatibility_date:'2026-08-09',bindings:[{name:'PAGES_ORIGIN',type:'plain_text',text:origin}],observability:{enabled:false}}));
for(const m of modules)form.append(m.name,new Blob([m.bytes],{type:'application/javascript+module'}),m.name);
fs.writeFileSync(path.join(ROOT,'marketing-'+mode+'-intent.json'),JSON.stringify({at:new Date().toISOString(),sourceCommit:source.commit,script:name,origin,modules:modules.map(m=>({name:m.name,sha256:sha(m.bytes)})),routesChanged:false},null,2));
const result=await api(scriptPath,{method:'PUT',body:form});const subdomain=await api('/accounts/'+account+'/workers/subdomain');await api(scriptPath+'/subdomain',{method:'POST',body:{enabled:true,previews_enabled:false}});
const receipt={script:name,id:result.id,deployment_id:result.deployment_id,url:'https://'+name+'.'+subdomain.subdomain+'.workers.dev',origin,sourceCommit:source.commit,routesChanged:false};fs.writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
