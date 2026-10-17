import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fitRuntime} from '../fit-approved-runtime.mjs';

function startup(){
 let load,resolve,reject;
 const initial=new Promise((yes,no)=>{resolve=yes;reject=no});
 const button={disabled:false},status={className:'',textContent:''},output={addEventListener(){}};
 const nodes={'#fitGenerate':button,'#fitStatus':status,'#fitOutput':output,'#fitLimitations':{addEventListener(){}}};
 const document={querySelector:key=>nodes[key]||null,querySelectorAll:()=>[]};
 const window={addEventListener:(name,fn)=>{if(name==='load')load=fn},SST_API:{getFitActivity:()=>initial}};
 vm.runInNewContext(fitRuntime,{window,document,console,Date,Set,URL,URLSearchParams,location:{pathname:'/member/fit',search:'',href:'https://synthetic.example.invalid/member/fit'}});
 load();return{button,status,resolve,reject};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('a new plan build stays disabled until the actual initial saved-activity promise has completed',async()=>{
 const s=startup();assert.equal(s.button.disabled,true);
 await settled();assert.equal(s.button.disabled,true);
 s.resolve({fitJourney:{entries:{}},plan:null});await settled();
 assert.equal(s.button.disabled,false);assert.equal(typeof s.button.onclick,'function');
});
test('an initial saved-activity error retains its existing visible recovery message and settles the startup control',async()=>{
 const s=startup();assert.equal(s.button.disabled,true);
 s.reject(new Error('Synthetic saved activity unavailable'));await settled();
 assert.equal(s.status.textContent,'Synthetic saved activity unavailable');
 assert.match(s.status.className,/error/);assert.equal(s.button.disabled,false);
});
