import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fitRuntime} from '../fit-approved-runtime.mjs';
import {fitTodayHandoffSource} from '../fit-today-handoff.mjs';

const originalPlan={minutes_per_day:30,sessions:[{day:1,title:'Saved strength session',estimated_minutes:30,exercises:[{id:'walk',name:'Walk',group:'cardio',sets:2,reps:12,minutes:8,rest_seconds:45}]}]};
function fixture(search=''){
 const nodes=new Map(),calls=[],historyChanges=[],saved=structuredClone(originalPlan);
 function element(id=''){
  const node={id,dataset:{},value:'',innerHTML:'',options:[],disabled:false,children:[],classList:{add(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},scrollIntoView(){},replaceChildren(...children){this.children=children},before(child){nodes.set('#'+child.id,child)},remove(){nodes.delete('#'+this.id)}};
  Object.defineProperty(node,'textContent',{get(){return this.children.length?this.children.map(x=>x.textContent).join(' '):this._text||''},set(value){this._text=String(value);this.children=[]}});return node;
 }
 for(const id of ['fitGenerate','fitMinutes','fitDays','fitLocation','fitEquipment','fitPrefs','fitStatus','fitOutput','fitLimitations'])nodes.set('#'+id,element(id));
 nodes.get('#fitMinutes').options=[10,20,30,45].map(n=>({value:String(n)}));nodes.get('#fitMinutes').value='20';nodes.get('#fitDays').value='1';nodes.get('#fitLocation').value='home';nodes.get('#fitEquipment').value='none';
 nodes.set('.sf-builder',element());
 let init;
 const context={
  URL,URLSearchParams,Intl,Date,console,
  location:{search,href:'https://fixture.invalid/member/fit'+search},
  history:{state:null,replaceState(_state,_title,url){historyChanges.push(url)}},
  document:{querySelector:s=>nodes.get(s)||null,getElementById:id=>nodes.get('#'+id)||null,querySelectorAll:()=>[],createElement:()=>element()},
  window:{
   addEventListener(name,fn){if(name==='load')init=fn},
   SST_API:{
    async getFitActivity(){calls.push({kind:'read'});return{fitJourney:{entries:{},sessionReviews:{}},plan:saved}},
    async generateFit(data){calls.push({kind:'generate',data});return{plan:{...structuredClone(originalPlan),minutes_per_day:data.minutes_per_day,sessions:[{...structuredClone(originalPlan.sessions[0]),estimated_minutes:data.minutes_per_day}]}}}
   }
  }
 };
 vm.createContext(context);vm.runInContext(fitRuntime,context);
 return{nodes,calls,saved,historyChanges,api:context.window.SST_API,init:async()=>{init();await new Promise(resolve=>setImmediate(resolve))}};
}

test('Today builds a bounded request only for an explicit adjusted movement suggestion',()=>{
 const source=readFileSync(new URL('../../frontend/member/member-my-timber-problem-v1.js',import.meta.url),'utf8'),a=source.indexOf('  function fitTodayHandoff('),b=source.indexOf('  function renderToday(',a),c=vm.createContext({});vm.runInContext(source.slice(a,b),c);
 const output={adjustment:'working_late',workout:{ready:true,minutes:10,title:'Old ten-minute promise'}},snapshot=structuredClone(output),result=c.fitTodayHandoff(output);
 assert.equal(result.href,'/member/fit?from=today&minutes=10');assert.match(result.title,/suggestion/);assert.match(result.detail,/has not been changed/);assert.equal(result.cta,'Review shorter session');assert.deepEqual(output,snapshot);
 for(const minutes of [5,15,1.5,0,999,'10<script>',Infinity])assert.equal(c.fitTodayHandoff({...output,workout:{ready:true,minutes}}),null);
 assert.equal(c.fitTodayHandoff({...output,adjustment:null}),null);assert.equal(c.fitTodayHandoff({...output,workout:{...output.workout,completed:true}}),null);
});

test('Fit accepts only a single exact supported Today duration parameter',()=>{
 const c=vm.createContext({URLSearchParams});vm.runInContext(fitTodayHandoffSource,c);
 for(const value of [10,20,30,45])assert.equal(c.fitTodayTarget('?from=today&minutes='+value),value);
 for(const search of ['','?minutes=10','?from=other&minutes=10','?from=today&minutes=10.0','?from=today&minutes=010','?from=today&minutes=10&minutes=20','?from=today&from=today&minutes=10','?from=today&minutes=%3Cscript%3E','?from=today&minutes=15'])assert.equal(c.fitTodayTarget(search),null);
});

test('opening Today’s 10-minute request retains the full saved 30-minute plan until explicit Build',async()=>{
 const f=fixture('?from=today&minutes=10');await f.init();
 assert.equal(f.nodes.get('#fitMinutes').value,'10');assert.equal(f.nodes.get('#fitDays').value,'1');assert.deepEqual(f.calls,[{kind:'read'}]);assert.deepEqual(f.saved,originalPlan);
 const banner=f.nodes.get('#fitTodayHandoff');assert.equal(banner.dataset.fitTodayMinutes,'10');assert.match(banner.textContent,/suggested up to 10 minutes/);assert.match(banner.textContent,/saved 30-minute session below is unchanged/);assert.match(banner.textContent,/Review your place, equipment and limitations/);
 const html=f.nodes.get('#fitOutput').innerHTML;assert.match(html,/30 MINUTES/);assert.match(html,/data-base-reps="12"/);assert.match(html,/data-base-sets="2"/);assert.match(html,/data-base-minutes="8"/);
 await f.nodes.get('#fitGenerate').onclick();
 assert.equal(f.calls.filter(x=>x.kind==='generate').length,1);assert.equal(f.calls.at(-1).data.minutes_per_day,10);assert.equal(f.calls.at(-1).data.days,1);
 assert.match(f.nodes.get('#fitOutput').innerHTML,/10 MINUTES/);assert.equal(f.nodes.has('#fitTodayHandoff'),false);assert.deepEqual(f.historyChanges,['/member/fit']);assert.deepEqual(f.saved,originalPlan,'Old plan object must never be modified in the client');
});

test('normal and malformed entries keep current Fit preferences, renderer and saved plan unchanged',async()=>{
 for(const search of ['', '?from=today&minutes=10<script>', '?from=today&minutes=10&minutes=30']){const f=fixture(search);await f.init();assert.equal(f.nodes.get('#fitMinutes').value,'20');assert.equal(f.nodes.has('#fitTodayHandoff'),false);assert.deepEqual(f.calls,[{kind:'read'}]);assert.deepEqual(f.saved,originalPlan);assert.match(f.nodes.get('#fitOutput').innerHTML,/30 MINUTES/);assert.deepEqual(f.historyChanges,[]);}
});

test('a failed explicit build keeps the saved session and duration suggestion available',async()=>{
 const f=fixture('?from=today&minutes=10');await f.init();f.api.generateFit=async()=>{throw Error('Builder unavailable')};
 await f.nodes.get('#fitGenerate').onclick();assert.equal(f.nodes.has('#fitTodayHandoff'),true);assert.match(f.nodes.get('#fitOutput').innerHTML,/30 MINUTES/);assert.deepEqual(f.saved,originalPlan);assert.deepEqual(f.historyChanges,[]);assert.match(f.nodes.get('#fitStatus').textContent,/Builder unavailable/);assert.equal(f.nodes.get('#fitGenerate').disabled,false);
});
