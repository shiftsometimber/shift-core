import test from 'node:test';
import assert from 'node:assert/strict';
import {DB,server} from './grub-ease-fixture.mjs';
import {grubWorkspaceRoutes} from '../grub-routes.mjs';
const origin='https://shiftsometimber.co.uk';
const env={DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const request=(body,headers={})=>new Request(origin+'/v1/grub/workspace',{method:body?'POST':'GET',headers:{Cookie:'sst_session=fixture-token-1',...(body?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
test('real SQLite workspace route honours saved dietary-review status without replacing any owned food data',async()=>{
 try{
  const original=DB.sqlite.prepare('SELECT preferences FROM member_state WHERE user_id=1').get();
  const prefs=JSON.parse(original.preferences||'{}');prefs.food={...prefs.food,dietaryRequirements:['Fictional dietary requirement']};
  prefs.grubV2={revision:5,saved:['everyday-ham-salad'],week:[],shopping:[{key:'manual:keep',text:'Fictional retained item',source:'manual',done:true}],options:{days:3,style:'fast',servings:2,exclude:''},operations:[]};
  DB.sqlite.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(prefs));
  const before=DB.sqlite.prepare('SELECT * FROM member_state ORDER BY user_id').all();
  const r=await grubWorkspaceRoutes(request({action:'plan',revision:5,operationId:'route-quality-operation-001',options:prefs.grubV2.options}),env);
  assert.equal(r.status,400);assert.match((await r.json()).error,/saved dietary requirements/);
  assert.deepEqual(DB.sqlite.prepare('SELECT * FROM member_state ORDER BY user_id').all(),before);
  const get=await grubWorkspaceRoutes(request(),env);assert.equal(get.status,200);const view=await get.json();assert.deepEqual(view.saved,prefs.grubV2.saved);assert.deepEqual(view.shopping,prefs.grubV2.shopping);assert.equal(view.revision,5);
  const other=await grubWorkspaceRoutes(request(null,{Cookie:'sst_session=fixture-token-2'}),env);assert.equal(other.status,200);assert(!(await other.json()).saved.includes('everyday-ham-salad'));
  assert.equal((await grubWorkspaceRoutes(request(null,{Cookie:''}),env)).status,401);
  assert.equal((await grubWorkspaceRoutes(request({action:'plan'},{Origin:'https://unrelated.invalid'}),env)).status,403);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
