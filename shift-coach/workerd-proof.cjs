const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {Miniflare,convertV4MiniflareOptions}=require(process.env.COACHING_MINIFLARE||'miniflare');
(async()=>{
 const out=process.env.COACHING_PROOF_DIR||'/tmp/shift-coach-workerd-proof';fs.mkdirSync(out,{recursive:true});
 const {fixture,request,setupInput}=await import('./test-fixture.mjs');const local=fixture();
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,modulesRoot:path.dirname(process.env.COACHING_WORKER_BUNDLE),scriptPath:process.env.COACHING_WORKER_BUNDLE,compatibilityDate:'2026-08-09',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{MEMBER_EXPERIENCE_V1_ENABLED:'true'}}));
 const proof={scope:'Full compiled candidate Worker running on local workerd and D1; synthetic accounts only.',checks:[],productionResources:0};
 const mark=name=>proof.checks.push(name);
 try{
  const DB=await mf.getD1Database('DB');
  const schema=local.sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all().map(r=>r.sql).join(';')+';';await DB.exec(schema);
  for(const table of ['users','user_sessions','consents','member_state','member_status'])for(const row of local.sqlite.prepare('SELECT * FROM '+table).all()){
   const fields=Object.keys(row);await DB.prepare('INSERT INTO '+table+'('+fields.join(',')+') VALUES('+fields.map(()=>'?').join(',')+')').bind(...Object.values(row)).run();
  }
  const dispatch=r=>mf.dispatchFetch(r.url,{method:r.method,headers:Object.fromEntries(r.headers),...(!['GET','HEAD'].includes(r.method)?{body:r.body,duplex:'half'}:{})});
  const read=async(member=1)=>(await dispatch(request('GET',null,member))).json();
  const save=async(input,member=1)=>dispatch(request('POST',{revision:(await read(member)).revision,operationId:crypto.randomUUID(),...input},member));
  assert.equal((await mf.dispatchFetch('https://shiftsometimber.co.uk/v1/shift-coach')).status,401);mark('anonymous request denied by original session authentication');
  assert.equal((await dispatch(request('POST',setupInput(0),1,{Origin:'https://foreign.invalid'}))).status,403);mark('foreign origin denied');
  const before=await DB.prepare('SELECT user_id,preferences FROM member_state ORDER BY user_id').all();fs.writeFileSync(out+'/workerd-before.json',JSON.stringify(before,null,2));
  const setup=await save(setupInput(0));assert.equal(setup.status,201,await setup.clone().text());let first=await read();assert.match(first.action.reason,/late shifts/);assert(!first.action.general);mark('same-session setup prepares action from two confirmed facts');
  assert.equal((await read()).action.id,first.action.id);assert.equal((await read(2)).enabled,false);mark('persistent action and second-account isolation');
  assert.equal((await save({kind:'accept',id:first.action.id})).status,201);assert.equal((await save({kind:'outcome',id:first.action.id,value:'didnt-help'})).status,201);assert.notEqual((await read()).action.type,first.action.type);mark('feedback changes next approach');
  const stale=await dispatch(request('POST',{kind:'fact',key:'week',value:'Stale',revision:first.revision,operationId:crypto.randomUUID()}));assert.equal(stale.status,409);mark('stale snapshot cannot overwrite newer progress');
  await DB.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();assert.equal((await read()).enabled,false);mark('withdrawal immediately stops context use');
  await DB.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();assert.equal((await read()).enabled,false);mark('regrant does not revive prior memory');
  first=await read();assert.equal((await save(setupInput(first.revision))).status,201);assert.equal((await dispatch(request('DELETE'))).status,200);assert.equal((await read()).enabled,false);mark('deletion removes coaching snapshot');
  const after=await DB.prepare('SELECT user_id,preferences FROM member_state ORDER BY user_id').all();fs.writeFileSync(out+'/workerd-after.json',JSON.stringify(after,null,2));
  assert(!fs.readFileSync(process.env.COACHING_WORKER_BUNDLE,'utf8').includes('fixture-token-'));mark('test sessions and fixture helpers absent from production bundle');
  fs.writeFileSync(out+'/workerd-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
 }finally{local.close();await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
