const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const c=require('/Users/shiftsometimberltd/SST/organic-deploy-20261017/normal-wrangler-api.cjs'),root=path.resolve(__dirname,'../../..'),out=path.join(root,'.support-member-release'),script='shift-mytimber-support-20261023',account='/accounts/9e5386dcf455be34c582d93f8bfc79e6',zone='/zones/66ec3268950adcfc837b7b8b2f8356ed';
fs.mkdirSync(out,{recursive:true});const save=(n,v)=>fs.writeFileSync(path.join(out,n+'.json'),JSON.stringify(v,null,2)),read=n=>JSON.parse(fs.readFileSync(path.join(out,n+'.json'))),git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
async function routes(){return c.organicApi(zone+'/workers/routes');}
const relevant=r=>/^(?:https:\/\/)?(?:www\.)?shiftsometimber\.co\.uk\/(?:mens-mental-health(?:\*|\/|\.html)?|member\/dashboard\*)$/.test(r.pattern);
const additions=[];for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const p of ['/member/support*','/v1/my-timber-support*'])additions.push(host+p);for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk','api.shiftsometimber.co.uk'])for(const p of ['/v1/privacy/export','/v1/privacy/health-tracking','/v1/privacy/account','/v1/consents'])additions.push(host+p);
(async()=>{
 const mode=process.argv[2];assert(['stage','activate','status','rollback'].includes(mode));const all=await routes();
 if(mode==='status'){console.log(JSON.stringify(all.filter(r=>r.script===script)));return;}
 if(mode==='stage'){
  assert.equal(git('status','--porcelain'),'','Source must be committed');assert(!all.some(r=>r.script===script),'Already activated; reconcile before replacing');
  const existing=all.filter(relevant);assert.equal(existing.length,10,'Expected existing hub and dashboard route families');assert(existing.every(r=>r.script===(r.pattern.includes('dashboard')?'shift-programme-member-20261023':'shift-mental-health-pathway-20261023')),'Existing page owner changed');
  for(const p of additions)assert(!all.some(r=>r.pattern===p),'New route already has an owner: '+p);
  const services=await c.organicApi(account+'/workers/services');if(services.some(s=>s.id===script))assert(fs.existsSync(path.join(out,'upload.json')),'Unowned staging service');
  save('route-plan',[...existing.map(row=>({pattern:row.pattern,before:row})),...additions.map(pattern=>({pattern,before:null}))]);
  const {ddl}=await import('./model.mjs');for(const sql of ddl){const result=await c.organicApi(account+'/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sql,params:[]})});assert(result.every(x=>x.success!==false));}
  const bundle=fs.readFileSync(path.join(out,'worker.js'));const source={head:git('rev-parse','HEAD'),bundleSha256:sha(bundle)};save('source',source);
  const bindings=[{type:'d1',name:'DB',id:'88f40aed-cb23-4372-8c94-8a73f48bc847'},{type:'service',name:'MEMBER',service:'shift-programme-member-20261023'},{type:'service',name:'PATHWAY',service:'shift-mental-health-pathway-20261023'},{type:'service',name:'CORE',service:'shift-core'}];
  const form=c.organicFormData();form.append('metadata',JSON.stringify({main_module:'worker.js',bindings,compatibility_date:'2026-08-09',compatibility_flags:['nodejs_compat'],observability:{enabled:false},tags:['approved-support-followthrough-20261023']}));form.append('worker.js',new(require('buffer').File)([bundle],'worker.js',{type:'application/javascript+module'}),'worker.js');
  save('upload',await c.organicApi(account+'/workers/scripts/'+script,{method:'PUT',body:form}));await c.organicApi(account+'/workers/scripts/'+script+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});const sub=await c.organicApi(account+'/workers/subdomain');save('stage',{origin:'https://'+script+'.'+sub.subdomain+'.workers.dev',source});console.log(JSON.stringify(read('stage')));
 }else if(mode==='activate'){
  const source=read('source'),accept=read('acceptance');assert.equal(accept.passed,true);assert.equal(accept.source,source.head);assert.equal(git('rev-parse','HEAD'),source.head);assert.equal(git('status','--porcelain'),'');assert.equal(sha(fs.readFileSync(path.join(out,'worker.js'))),source.bundleSha256);
  const plan=read('route-plan');for(const p of plan)assert.deepEqual(all.filter(r=>r.pattern===p.pattern),p.before?[p.before]:[],'Concurrent route owner changed');
  const applied=[];for(const p of plan){const row=await c.organicApi(zone+'/workers/routes'+(p.before?'/'+p.before.id:''),{method:p.before?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:p.pattern,script})});applied.push({...p,route:row});save('activated-routes',applied);}
  save('schedules',await c.organicApi(account+'/workers/scripts/'+script+'/schedules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify([{cron:'*/5 * * * *'}])}));console.log(JSON.stringify({activated:applied.length,source:source.head,reminderSchedule:'every five minutes'}));
 }else{
  const applied=read('activated-routes');await c.organicApi(account+'/workers/scripts/'+script+'/schedules',{method:'PUT',headers:{'Content-Type':'application/json'},body:'[]'});
  for(const p of applied){const r=all.find(x=>x.id===p.route.id);assert(r?.script===script,'Route moved; stop rollback');if(p.before)await c.organicApi(zone+'/workers/routes/'+r.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:p.before.pattern,script:p.before.script})});else await c.organicApi(zone+'/workers/routes/'+r.id,{method:'DELETE'});}
  save('rollback',{restored:applied.length,at:new Date().toISOString()});console.log('Restored prior routes; retained member data');
 }
})().catch(e=>{console.error(e.stack);process.exit(1)});
