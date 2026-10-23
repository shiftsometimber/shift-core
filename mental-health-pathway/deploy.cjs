// Narrow public presentation release: no Core deployment, DB access or member writes.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const c=require('/Users/shiftsometimberltd/SST/organic-deploy-20261017/normal-wrangler-api.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.mental-health-release'),account='/accounts/9e5386dcf455be34c582d93f8bfc79e6',zone='/zones/66ec3268950adcfc837b7b8b2f8356ed',script='shift-mental-health-pathway-20261023';
fs.mkdirSync(out,{recursive:true});const save=(n,v)=>fs.writeFileSync(path.join(out,n+'.json'),JSON.stringify(v,null,2)),read=n=>JSON.parse(fs.readFileSync(path.join(out,n+'.json'))),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const own=r=>/^(?:https:\/\/)?(?:www\.)?shiftsometimber\.co\.uk\/(?:mens-mental-health|how-are-you-feeling)(?:\*|\/|\.html)?$/.test(r.pattern);
(async()=>{
const mode=process.argv[2];assert(['stage','activate','rollback','status'].includes(mode));
const routes=await c.organicApi(zone+'/workers/routes');
if(mode==='status'){console.log(JSON.stringify(routes.filter(own),null,2));return;}
if(mode==='stage'){
 assert.equal(git('status','--porcelain'),'','Commit source before staging');
 assert(!routes.some(r=>r.script===script),'This release is already active; reconcile before replacing it');
 const services=await c.organicApi(account+'/workers/services');if(services.some(s=>s.id===script))assert(fs.existsSync(path.join(out,'upload.json')),'Unowned staging service');
 const selected=routes.filter(own);assert(selected.length>=12,'Expected both existing page route families');
 assert(selected.every(r=>r.script===(r.pattern.includes('how-are-you-feeling')?'shift-feeling-presentation-20261022':'shift-final-pages-presentation-20261021')),'Unexpected current route owner');
 save('routes-before',selected);const source={head:git('rev-parse','HEAD'),worker:sha(fs.readFileSync(path.join(__dirname,'worker.mjs'))),content:sha(fs.readFileSync(path.join(__dirname,'content.mjs')))};save('source',source);
 const metadata={main_module:'mental-health-pathway/worker.mjs',bindings:[{type:'service',name:'GOOD',service:'shift-final-pages-presentation-20261021'},{type:'service',name:'FEEL',service:'shift-feeling-presentation-20261022'}],compatibility_date:'2026-08-09',observability:{enabled:false},tags:['approved-mental-health-pathway-20261023']};
 const form=c.organicFormData();form.append('metadata',JSON.stringify(metadata));for(const f of ['worker.mjs','content.mjs']){const name='mental-health-pathway/'+f;form.append(name,new(require('buffer').File)([fs.readFileSync(path.join(__dirname,f))],name,{type:'application/javascript+module'}),name);}
 save('upload',await c.organicApi(account+'/workers/scripts/'+script,{method:'PUT',body:form}));
 await c.organicApi(account+'/workers/scripts/'+script+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 const sub=await c.organicApi(account+'/workers/subdomain');const origin='https://'+script+'.'+sub.subdomain+'.workers.dev';save('stage',{origin,source});
 for(const p of ['/mens-mental-health','/how-are-you-feeling']){const r=await fetch(origin+p);assert.equal(r.status,200);assert.equal(r.headers.get('X-Shift-Mental-Health-Pathway'),'20261023-pathway-v1');}
 console.log(JSON.stringify({staged:origin,source:source.head,routes:selected.length}));
}else if(mode==='activate'){
 const source=read('source'),check=read('acceptance');assert.equal(check.passed,true,'Browser acceptance required');assert.equal(check.source,source.head);assert.equal(git('status','--porcelain'),'');assert.equal(git('rev-parse','HEAD'),source.head);
 for(const f of ['worker','content'])assert.equal(sha(fs.readFileSync(path.join(__dirname,f+'.mjs'))),source[f]);
 const before=read('routes-before');assert.deepEqual(routes.filter(own).sort((a,b)=>a.id.localeCompare(b.id)),[...before].sort((a,b)=>a.id.localeCompare(b.id)),'Concurrent route change: stop');
 save('activation-plan',before);const applied=[];for(const row of before){const route=await c.organicApi(zone+'/workers/routes/'+row.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:row.pattern,script})});applied.push({before:row,route});save('activated-routes',applied);}
 console.log(JSON.stringify({activated:applied.length,source:source.head}));
}else{
 const applied=read('activated-routes');for(const row of applied){const current=routes.find(r=>r.id===row.route.id);assert(current&&current.script===script,'Route ownership moved: stop rollback');await c.organicApi(zone+'/workers/routes/'+current.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:row.before.pattern,script:row.before.script})});}
 save('rollback',{at:new Date().toISOString(),restored:applied.length});console.log('Restored exact prior route owners');
}
})().catch(e=>{console.error(e.stack);process.exit(1)});
