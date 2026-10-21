const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process'),crypto=require('crypto');
const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const root=path.resolve(__dirname,'../..'),evidence='/Users/shiftsometimberltd/SST/programme-vision-20261021/shift-health-preview/route-release';fs.mkdirSync(evidence,{recursive:true});process.chdir(root);
const account='/accounts/9e5386dcf455be34c582d93f8bfc79e6',zone='/zones/66ec3268950adcfc837b7b8b2f8356ed',script='shift-health-presentation-20261021';
const patterns=['shiftsometimber.co.uk/shift-health*','www.shiftsometimber.co.uk/shift-health*'];
const save=(name,data)=>fs.writeFileSync(path.join(evidence,name+'.json'),JSON.stringify(data,null,2));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function guard(){assert.equal(git('diff','--name-only','HEAD','--'),'');assert.equal(git('diff','--cached','--name-only','--'),'');assert.equal(git('for-each-ref','--format=%(refname)','refs/replace'),'');assert.equal(git('rev-parse','HEAD:shift-health-vision-content.mjs'),git('rev-parse','39c703ac068b800bbf4a92a9277e21bd3d7b89e6:shift-health-vision-content.mjs'));assert.equal(git('diff','--name-only','39c703ac068b800bbf4a92a9277e21bd3d7b89e6','HEAD'),['release/health-presentation-20261021/README.md','release/health-presentation-20261021/deploy.cjs','shift-health-presentation-route.mjs','tests/health-presentation-route.test.mjs','wrangler.health-presentation.json'].sort().join('\n'));execFileSync(process.execPath,['--test','tests/health-presentation-route.test.mjs'],{stdio:'pipe'});return{at:new Date().toISOString(),head:git('rev-parse','HEAD'),approvedHealthSha:sha(fs.readFileSync('shift-health-vision-content.mjs')),routeWorkerSha:sha(fs.readFileSync('shift-health-presentation-route.mjs')),phase:await c.phase()};}
(async()=>{const mode=process.argv[2];assert(['preview','activate','rollback'].includes(mode));const checked=await guard();save('guard-'+mode,checked);
if(mode==='preview'){
 const services=await c.organicApi(account+'/workers/services');assert(!services.some(s=>s.id===script),'Preview already exists: inspect its receipt rather than overwrite');
 const before=await c.organicApi(zone+'/workers/routes');save('routes-before',before);
 const form=c.organicFormData();form.append('metadata',JSON.stringify({main_module:'shift-health-presentation-route.mjs',bindings:[{type:'service',name:'CORE',service:'shift-core'}],compatibility_date:'2026-08-09',observability:{enabled:false},tags:['approved-health-presentation-20261021']}));
 for(const file of ['shift-health-presentation-route.mjs','shift-health-vision-content.mjs'])form.append(file,new (require('buffer').File)([fs.readFileSync(file)],file,{type:'application/javascript+module'}),file);
 const uploaded=await c.organicApi(account+'/workers/scripts/'+script,{method:'PUT',body:form});save('upload',uploaded);
 await c.organicApi(account+'/workers/scripts/'+script+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 const sub=await c.organicApi(account+'/workers/subdomain');const url='https://'+script+'.'+sub.subdomain+'.workers.dev/shift-health';save('preview',{url,checked,uploaded});console.log(JSON.stringify({preview:url,head:checked.head}));
}else if(mode==='activate'){
 const proof=JSON.parse(fs.readFileSync(path.join(evidence,'browser-preview.json')));assert.equal(proof.passed,true);assert.equal(proof.head,checked.head);
 const before=JSON.parse(fs.readFileSync(path.join(evidence,'routes-before.json'))),current=await c.organicApi(zone+'/workers/routes');
 for(const pattern of patterns){const old=before.filter(x=>x.pattern===pattern),now=current.filter(x=>x.pattern===pattern);assert.deepEqual(now,old,'Concurrent route change: '+pattern);assert(old.length<=1);if(old.length)assert.equal(old[0].script,'shift-core','An unrelated route owner must be preserved');}
 save('activation-plan',patterns.map(pattern=>({pattern,before:current.find(x=>x.pattern===pattern)||null})));
 const applied=[];for(const pattern of patterns){const old=current.find(x=>x.pattern===pattern);const row=await c.organicApi(zone+'/workers/routes'+(old?'/'+old.id:''),{method:old?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script})});applied.push(row);save('activated-routes',applied);}
 console.log(JSON.stringify({activated:applied,head:checked.head}));
}else{
 const applied=JSON.parse(fs.readFileSync(path.join(evidence,'activated-routes.json'))),plans=JSON.parse(fs.readFileSync(path.join(evidence,'activation-plan.json'))),current=await c.organicApi(zone+'/workers/routes');
 for(const row of applied){const now=current.find(x=>x.id===row.id);assert(now&&now.script===script&&patterns.includes(now.pattern),'Rollback must own its exact route');const plan=plans.find(x=>x.pattern===row.pattern);if(plan.before)await c.organicApi(zone+'/workers/routes/'+row.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:row.pattern,script:plan.before.script})});else await c.organicApi(zone+'/workers/routes/'+row.id,{method:'DELETE'});}
 save('rolled-back',{at:new Date().toISOString(),applied});console.log('Exact Health routes restored');
}})().catch(e=>{console.error(e.stack);process.exit(1)});
