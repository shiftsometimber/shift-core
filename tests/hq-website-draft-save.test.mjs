import test from 'node:test';
import assert from 'node:assert/strict';
import {hqCommerceContentRoutes} from '../hq-commerce-content-v1.js';
import {SiteContentState} from '../site-content-state-v1.js';
import {env,DB,cookies} from '../hq-management-acceptance.mjs';

const endpoint='/v1/hq/site-content',id=9201,key='TEST_NATIVE_DRAFT_SAVE';
const owner={Cookie:cookies.owner,Origin:'https://hq.shiftsometimber.co.uk'};
async function invoke(action,expectedVersion,text,delivery,headers=owner){
 const response=await hqCommerceContentRoutes(new Request('https://api.shiftsometimber.co.uk'+endpoint+(action?'/'+id:''),{method:action?'PATCH':'GET',headers:{...headers,...(action?{'Content-Type':'application/json'}:{})},body:action?JSON.stringify({action,expectedVersion,text}):undefined}),{...env,SITE_CONTENT_STATE:delivery},{});
 return {response,body:await response.json()};
}
assert.equal((await invoke()).response.status,200);
function seed(status='draft'){
 DB.sqlite.exec("DROP TRIGGER IF EXISTS TEST_FAIL_DRAFT_AUDIT;DELETE FROM site_content_versions;DELETE FROM site_content_overrides;DELETE FROM hq_audit WHERE action LIKE 'site_content.%';");
 DB.sqlite.prepare('INSERT INTO site_content_overrides(id,page_path,content_key,css_selector,label,draft_text,published_text,status,version) VALUES(?,?,?,?,?,?,?,?,4)').run(id,'/__synthetic-draft-save',key,'h1','TEST private draft field','TEST initial draft',status==='published'?'TEST original delivered wording':null,status);
}
const snapshot=()=>({content:DB.sqlite.prepare('SELECT * FROM site_content_overrides ORDER BY id').all(),history:DB.sqlite.prepare('SELECT * FROM site_content_versions ORDER BY id').all(),audit:DB.sqlite.prepare("SELECT * FROM hq_audit WHERE action LIKE 'site_content.%' ORDER BY id").all()});
function nativeDelivery(){
 const values=new Map(),calls=[];
 const storage={async get(key){return structuredClone(values.get(key));},async put(key,value){values.set(key,structuredClone(value));},async delete(key){return values.delete(key);},async list({prefix}={}){return new Map([...values].filter(([key])=>!prefix||key.startsWith(prefix)).map(([key,value])=>[key,structuredClone(value)]));}};
 const object=new SiteContentState({storage});
 const direct=(route,body={})=>object.fetch(new Request('https://site-content-state'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
 const namespace={idFromName(name){assert.equal(name,'global');return name;},get(name){assert.equal(name,'global');return {fetch(input,init){calls.push(new URL(input).pathname);return object.fetch(new Request(input,init));}};}};
 return {namespace,calls,direct,async published(){return (await(await direct('/read-all')).json()).overrides;}};
}

test('Native Save persists the edit, version, history and named actor audit without a delivery binding',async()=>{
 seed();const before=snapshot(),result=await invoke('save',4,'TEST saved draft');
 assert.equal(result.response.status,200);assert.deepEqual(result.body,{ok:true,saved:true,status:'draft',version:5});
 const after=snapshot(),row=after.content[0];assert.equal(row.draft_text,'TEST saved draft');assert.equal(row.status,'draft');assert.equal(row.published_text,before.content[0].published_text);assert.equal(row.version,5);
 assert.equal(after.history.length,1);assert.equal(after.history[0].action,'draft_saved');assert.equal(after.history[0].version,5);assert.equal(after.history[0].text_value,'TEST saved draft');
 assert.equal(after.audit.length,1);assert.equal(after.audit[0].action,'site_content.draft_saved');assert.equal(after.audit[0].hq_user_id,row.updated_by);assert.equal(after.history[0].actor_id,row.updated_by);assert.ok(row.updated_by);
 const readback=await invoke();assert.equal(readback.body.content[0].draft_text,'TEST saved draft');assert.equal(readback.body.content[0].version,5);assert.equal(readback.body.content[0].published_version,null);assert.equal(readback.body.deliveryState.status,'unavailable');
});

test('Saving a published edit keeps real native DO delivery unchanged until explicit Publish; Rollback retains the saved draft',async()=>{
 seed('published');const delivery=nativeDelivery();
 assert.equal((await delivery.direct('/publish',{pagePath:'/__synthetic-draft-save',contentKey:key,cssSelector:'h1',publishedText:'TEST original delivered wording',version:4})).status,200);
 const originalDelivered=await delivery.published(),saved=await invoke('save',4,'TEST approved next draft',delivery.namespace);
 assert.equal(saved.response.status,200);assert.equal(saved.body.status,'published');assert.equal(saved.body.version,5);assert.deepEqual(delivery.calls,[],'Save reached the delivery namespace');assert.deepEqual(await delivery.published(),originalDelivered);
 let readback=await invoke(undefined,undefined,undefined,delivery.namespace),row=readback.body.content[0];
 assert.equal(row.version,5);assert.equal(row.published_version,4);assert.equal(row.draft_text,'TEST approved next draft');assert.equal(row.published_text,'TEST original delivered wording');assert.equal(row.status,'published');
 const published=await invoke('publish',5,undefined,delivery.namespace);assert.equal(published.response.status,200);assert.deepEqual(published.body,{ok:true,status:'published',version:6});
 assert.equal((await delivery.published())[0].published_text,'TEST approved next draft');assert.equal((await delivery.published())[0].version,6);
 delivery.calls.length=0;const later=await invoke('save',6,'TEST retained later draft',delivery.namespace);assert.equal(later.response.status,200);assert.equal(later.body.version,7);assert.deepEqual(delivery.calls,[]);assert.equal((await delivery.published())[0].published_text,'TEST approved next draft');
 const rollback=await invoke('rollback',7,undefined,delivery.namespace);assert.equal(rollback.response.status,200);assert.deepEqual(rollback.body,{ok:true,status:'paused',rolledBack:true,version:8});assert.deepEqual(await delivery.published(),[]);
 readback=await invoke(undefined,undefined,undefined,delivery.namespace);row=readback.body.content[0];assert.equal(row.version,8);assert.equal(row.published_version,null);assert.equal(row.status,'paused');assert.equal(row.draft_text,'TEST retained later draft');
 const history=snapshot().history;assert.deepEqual(history.map(({action,version})=>({action,version})),[{action:'draft_saved',version:5},{action:'published',version:6},{action:'draft_saved',version:7},{action:'rolled_back',version:8}]);
});

test('Missing or invalid edit versions and obsolete draft actions fail without content or delivery writes',async()=>{
 seed();const delivery=nativeDelivery(),before=snapshot();
 for(const action of ['save','publish','rollback'])for(const version of [undefined,null,0,-1,1.5,'4']){
  const result=await invoke(action,version,'TEST proposed edit',delivery.namespace);assert.equal(result.response.status,400,action);assert.equal(result.body.error,'expected_version_required');assert.deepEqual(snapshot(),before);
 }
 for(const action of ['draft','unknown']){const result=await invoke(action,4,'TEST proposed edit',delivery.namespace);assert.equal(result.response.status,400);assert.equal(result.body.error,'invalid_action');assert.deepEqual(snapshot(),before);}
 assert.deepEqual(delivery.calls,[]);
});

test('A stale Save, Publish or Rollback is rejected without history, audit or delivery writes',async()=>{
 seed();const delivery=nativeDelivery(),before=snapshot();
 for(const action of ['save','publish','rollback']){
  const result=await invoke(action,3,'TEST stale edit',delivery.namespace);assert.equal(result.response.status,409);assert.deepEqual(result.body,{ok:false,error:'version_conflict',currentVersion:4});assert.deepEqual(snapshot(),before);
 }
 assert.deepEqual(delivery.calls,[]);
});

test('A concurrent edit winning after the native read cannot inherit this Save history or audit',async()=>{
 seed();const delivery=nativeDelivery(),originalBatch=DB.batch;let raced=false;
 DB.batch=async function(statements){
  if(!raced&&statements[0]?.sql.startsWith('UPDATE site_content_overrides SET draft_text=')){raced=true;DB.sqlite.prepare('UPDATE site_content_overrides SET draft_text=?,version=5 WHERE id=?').run('TEST other writer retained edit',id);}
  return originalBatch.call(this,statements);
 };
 try{
  const result=await invoke('save',4,'TEST losing edit',delivery.namespace);assert.equal(raced,true);assert.equal(result.response.status,409);assert.equal(result.body.currentVersion,5);
  const after=snapshot();assert.equal(after.content[0].draft_text,'TEST other writer retained edit');assert.equal(after.content[0].version,5);assert.deepEqual(after.history,[]);assert.deepEqual(after.audit,[]);assert.deepEqual(delivery.calls,[]);
 }finally{DB.batch=originalBatch;}
});

test('A native Save audit failure rolls back both edit and history, and never calls delivery',async()=>{
 seed('published');const delivery=nativeDelivery(),before=snapshot();
 DB.sqlite.exec("CREATE TEMP TRIGGER TEST_FAIL_DRAFT_AUDIT BEFORE INSERT ON hq_audit WHEN NEW.action='site_content.draft_saved' BEGIN SELECT RAISE(ABORT,'TEST audit unavailable'); END;");
 try{const result=await invoke('save',4,'TEST must not persist',delivery.namespace);assert.equal(result.response.status,503);assert.deepEqual(result.body,{ok:false,error:'content_save_not_committed'});assert.deepEqual(snapshot(),before);assert.deepEqual(delivery.calls,[]);}
 finally{DB.sqlite.exec('DROP TRIGGER TEST_FAIL_DRAFT_AUDIT');}
});

test('The existing native actor guard denies an anonymous Save before any content or delivery mutation',async()=>{
 seed();const delivery=nativeDelivery(),before=snapshot(),result=await invoke('save',4,'TEST unauthorised edit',delivery.namespace,{Origin:owner.Origin});
 assert.equal(result.response.status,401);assert.deepEqual(snapshot(),before);assert.deepEqual(delivery.calls,[]);
});
