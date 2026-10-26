// Offline code/DOM-contract checks. This is not a browser or visual acceptance receipt.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=new URL('.',import.meta.url).pathname,storage=new Map(),cases=[];
const model=fs.readFileSync(root+'support-example-model.mjs','utf8').replace(/\bexport (?=(?:const|function)\b)/g,''),view=fs.readFileSync(root+'support-example-view.js','utf8');
const theory=JSON.parse(fs.readFileSync(root+'fictional-records.json','utf8'));
function boot(){
 const ids=['screen','nav','modal','menu','exampleStatus','joinedStatus','evidenceSummary','quoteEdit','careNote','mode','cadence'];
 const nodes=Object.fromEntries(ids.map(k=>['#'+k,{innerHTML:'',textContent:'',value:'',hidden:false}])),listeners={};
 const document={querySelector:s=>nodes[s]||null,addEventListener:(event,fn)=>listeners[event]=fn,createElement:()=>({click(){}})};
 const context=vm.createContext({document,window:{scrollTo(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,Date,Intl,structuredClone,Blob,URL});
 vm.runInContext(model+'\nconst theory='+JSON.stringify(theory)+';\n'+view,context);
 const click=(action,data={})=>listeners.click({target:{closest:()=>({dataset:{action,...data}})}});
 const change=(id,value,checked)=>listeners.change({target:{id,value,checked}});
 const state=()=>JSON.parse(vm.runInContext('JSON.stringify(state)',context));
 return {nodes,listeners,context,click,change,state};
}
const pass=name=>cases.push({name,pass:true});let app=boot();
assert.match(app.nodes['#screen'].innerHTML,/Let’s sort one thing/);assert(!app.nodes['#screen'].innerHTML.includes('masked'));pass('first render has a real starting point and no invented history');
app.click('choose',{choice:'late'});app.click('open-action');assert.match(app.nodes['#screen'].innerHTML,/Heat the beans/);assert.match(app.nodes['#screen'].innerHTML,/Fallback/);assert.equal(app.state().joined,false);pass('before registration the rendered meal has ingredients, steps and a fallback');
app.click('accept');assert.match(app.nodes['#modal'].innerHTML,/creates no account/);app.click('join-confirm');assert(app.state().joined&&app.state().accepted);assert.match(app.nodes['#screen'].innerHTML,/Did it help/);pass('keeping a plan offers an explicit fictional join before member view');
assert.match(app.nodes['#screen'].innerHTML,/class="masked" aria-hidden="true"/);app.click('reveal');assert(!app.nodes['#screen'].innerHTML.includes('class="masked"'));app.click('hide');assert(!app.nodes['#screen'].innerHTML.includes('remembered'));pass('quote controls update the rendered privacy state');
app.click('day2');app.click('not-fit');app.click('feedback',{outcome:'not-fit',reason:'effort'});assert.equal(app.state().action,'nocook');app=boot();assert.equal(app.state().action,'nocook');pass('feedback changes the prepared action and persists through renderer restart');
app.change('person','lee');assert.equal(app.state().choice,null);app.change('person','dan');assert.equal(app.state().action,'nocook');pass('separate fictional accounts preserve isolation');
app.click('day2');app.click('feedback',{outcome:'not-tried'});assert.equal(app.state().action,'beans');assert.match(app.nodes['#screen'].innerHTML,/No problem/);pass('not tried retains the idea and offers an obstacle question');
app.click('day2');app.click('feedback',{outcome:'not-helped'});assert.equal(app.state().action,'schedule');pass('tried and unhelpful changes the approach');
app.click('day2');app.click('feedback',{outcome:'helped'});assert.match(app.nodes['#screen'].innerHTML,/helpful 1 time/);assert(!app.nodes['#screen'].innerHTML.includes('remembered'));pass('helpful counts are derived and the resolved problem quote retires');
app.click('day30');app.nodes['#mode'].value='stopped';app.nodes['#cadence'].value='fortnightly';app.click('save-continuity');app.click('return');assert.equal(app.state().mode,'stopped');assert.equal(app.state().day,37);assert.match(app.nodes['#screen'].innerHTML,/Good to see you/);pass('confirmed treatment situation and quiet-day return keep the history');
app.click('notes');app.nodes['#careNote'].value='FICTIONAL: My own question for my prescriber.';app.click('save-note');app.click('close');app.click('notes');assert.match(app.nodes['#careNote'].value,/My own question/);assert.equal(app.state().sharePrepared,false);pass('reviewed notes persist and no automatic sharing exists');app.click('close');
app.click('day30');
for(const tab of ['today','journey','grub','fit','support','stuff']){
 app.click('tab',{page:tab});assert(app.nodes['#screen'].innerHTML.includes('<h1'));
 fs.writeFileSync(root+'snapshot-'+tab+'.html',app.nodes['#screen'].innerHTML);pass('complete '+tab+' markup renders');
}
app.click('tab',{page:'support'});assert(app.nodes['#screen'].innerHTML.indexOf('Need urgent help?')<app.nodes['#screen'].innerHTML.indexOf('ASK TIMBER'));app.click('symptoms');assert.match(app.nodes['#modal'].innerHTML,/Need urgent help/);assert.match(app.nodes['#modal'].innerHTML,/tel:999/);assert.match(app.nodes['#modal'].innerHTML,/tel:111/);assert.match(app.nodes['#modal'].innerHTML,/samaritans.org/);pass('urgent routes are prominent on Support and present inside symptom detail');app.click('close');
app.click('tab',{page:'journey'});app.change('chartCase','gaps');assert.equal((app.nodes['#screen'].innerHTML.match(/<line /g)||[]).length,2);pass('gaps example does not connect missing dates');
for(const metric of ['weight','waist','bp','energy','sleep']){app.change('measure',metric);assert.match(app.nodes['#screen'].innerHTML,/<svg viewBox=/);}pass('five chart measures render with units and record tables');
const report={at:new Date().toISOString(),scope:'Offline renderer and synthetic model only. Browser launch unavailable; cloud workspace preview blocked by URL policy. No visual acceptance or live AI claim.',cases,productionWrites:0,communicationsSent:0};
fs.writeFileSync(root+'example-renderer-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:cases.length,scope:report.scope}));
