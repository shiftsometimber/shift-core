import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const path='member-experience/treatment-week-client.mjs';
const baseline='b6f9c0c36d4303e5d384fb2d62b58968b998aa64';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function dom(){
 const listeners=[],nodes=[],doc={hidden:false,createElement:()=>({innerHTML:'',className:'',isConnected:true,append(){},querySelector(){return{replaceChildren(){},textContent:''}},addEventListener(...args){listeners.push(args)},remove(){this.isConnected=false}}),addEventListener(...args){listeners.push(args)},removeEventListener(){}};
 const host={ownerDocument:doc,append(node){nodes.push(node)}};
 const window={SST_API_BASE:'https://api.shiftsometimber.co.uk',addEventListener(...args){listeners.push(args)},removeEventListener(){}};
 return{host,window,nodes,listeners};
}
test('the original mounting function and every style byte remain unchanged',()=>{
 const original=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}),current=readFileSync(path,'utf8');
 const anchor='export const treatmentWeekRuntime=';
 assert.equal(current.slice(0,current.indexOf(anchor)),original.slice(0,original.indexOf(anchor)));
 const style='export const treatmentWeekStyles=';
 assert.equal(current.slice(current.indexOf(style)),original.slice(original.indexOf(style)));
});
test('the emitted browser module is exactly the original uncompiled mounting function',async()=>{
 const original=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'});
 const fn=original.slice(original.indexOf('export function mountTreatmentWeek'),original.indexOf('\nexport const treatmentWeekRuntime=')).replace(/^export /,'').trim();
 const {treatmentWeekRuntime}=await import('../member-experience/treatment-week-client.mjs');
 assert.equal(treatmentWeekRuntime,'export const mountTreatmentWeek = ('+fn+');');
});
for(const options of [{keepNames:true,minify:false},{keepNames:true,minify:true},{keepNames:false,minify:false},{keepNames:false,minify:true}]){
 test('compiled standalone browser module mounts and disposes with '+JSON.stringify(options),async()=>{
  const output=await build({entryPoints:[path],bundle:true,write:false,format:'esm',target:'es2022',...options});
  const compiled=await import(uri(output.outputFiles[0].text)),standalone=await import(uri(compiled.treatmentWeekRuntime));
  const state=dom(),prior=globalThis.window;globalThis.window=state.window;
  try{
   const dispose=standalone.mountTreatmentWeek(state.host,{sources:['treatment']});
   assert.equal(typeof dispose,'function');assert.equal(state.nodes.length,1);
   assert.equal(state.nodes[0].className,'shift-treatment-week');
   assert.match(state.nodes[0].innerHTML,/<summary>Your treatment weeks<\/summary>/);
   assert(state.listeners.some(([name])=>name==='toggle'));
   assert(state.listeners.some(([name])=>name==='visibilitychange'));
   dispose();assert.equal(state.nodes[0].isConnected,false);
  }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;}
 });
}
