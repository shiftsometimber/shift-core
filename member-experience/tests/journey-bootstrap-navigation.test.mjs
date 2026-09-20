import test from 'node:test';
import {LEGACY_HEALTH_BLOCK,CURRENT_HEALTH_BLOCK} from '../../health-passport/journey-health-blocks.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const source=readFileSync(process.env.JOURNEY_BOOTSTRAP_SOURCE||new URL('../../frontend/member/member-my-journey-v2.js',import.meta.url),'utf8');

test('pinned Journey V2 preserves the served source outside the approved progressive setup, honest empty ratings, startup and consented-priority repairs',()=>{
 const original="activate(['journey','lifeback','progress'].includes(location.hash.slice(1))?'journey':'today',false);";
 const repaired="const requested=location.hash.slice(1),initial=['journey','lifeback','progress'].includes(requested)?'journey':document.body?.dataset.memberTools==='v1'&&['plans','visualise'].includes(requested)&&$('#panel-'+requested)?requested:'today';activate(initial,false);";
 assert.equal(createHash('sha256').update(source.replace(CURRENT_HEALTH_BLOCK,LEGACY_HEALTH_BLOCK).replace(repaired,original)).digest('hex'),'b27192b6a46856c5e59855dd2d3b7811214de62088fa11c13bc6cc60cedcf376');
 const worker=readFileSync(new URL('../../worker-entry-v6.js',import.meta.url),'utf8');
 assert.match(worker,/\["\/member-my-journey-v2\.js", "application\/javascript; charset=utf-8"\]/);
});

function boot({hash='',delayed=false,selection=null,restored=true,panelNames=['today','journey','visualise','plans']}={}){
 const timers=[],writes=[];
 const panels=panelNames.map(name=>({id:'panel-'+name,classList:{active:name==='today',toggle(_,on){this.active=on}},setAttribute(){}}));
 const tabs=panelNames.map(name=>({dataset:{panel:name},classList:{toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){}}));
 const tabHost={querySelectorAll:()=>tabs};
 const location={pathname:'/member/dashboard',hash,search:''};
 const document={body:{dataset:restored?{memberTools:'v1'}:{}},readyState:'complete',querySelector:selector=>selector==='.mp-tabs'?tabHost:panels.find(panel=>'#'+panel.id===selector),querySelectorAll:selector=>selector==='.mp-panel'?panels:selector==='.mp-tab'?tabs:[]};
 const api={getMyJourney:()=>new Promise(()=>{})};
 const context={document,window:{SST_API:delayed?null:api},SST_API:api,location,history:{replaceState:(_,__,hash)=>{writes.push(hash);location.hash=hash}},setTimeout:callback=>timers.push(callback)};
 vm.runInNewContext(source,context);
 if(delayed){
  assert.equal(timers.length,1,'Journey must still wait for the real API owner');
  if(selection){location.hash='#'+selection;panels.forEach(panel=>panel.classList.active=panel.id==='panel-'+selection);}
  context.window.SST_API=api;timers.shift()();
 }
 return {hash:location.hash,active:panels.filter(panel=>panel.classList.active).map(panel=>panel.id),writes};
}

test('Journey startup preserves restored Plans and Progress deep links',()=>{
 for(const name of ['plans','visualise']){
  const state=boot({hash:'#'+name});
  assert.equal(state.hash,'#'+name);assert.deepEqual(state.active,['panel-'+name]);
 }
});

test('delayed Journey startup preserves a member selection made while the API is loading',()=>{
 for(const name of ['plans','visualise']){
  const state=boot({delayed:true,selection:name});
  assert.equal(state.hash,'#'+name);assert.deepEqual(state.active,['panel-'+name]);
  assert.deepEqual(state.writes,['#'+name],'late startup must never overwrite the member destination with Today');
 }
});

test('Journey aliases and the original Today fallback retain their behavior',()=>{
 for(const hash of ['#journey','#lifeback','#progress']){
  const state=boot({hash});assert.equal(state.hash,'#journey');assert.deepEqual(state.active,['panel-journey']);
 }
 for(const hash of ['','#today','#unknown']){
  const state=boot({hash});assert.equal(state.hash,'#today');assert.deepEqual(state.active,['panel-today']);
 }
});

test('startup never activates a missing restored panel or changes legacy-shell fallback',()=>{
 for(const options of [{restored:false},{panelNames:['today','journey']}]){
  const state=boot({hash:'#plans',...options});assert.equal(state.hash,'#today');assert.deepEqual(state.active,['panel-today']);
 }
});
