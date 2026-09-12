import vm from 'node:vm';
import assert from 'node:assert/strict';
export function verifyGrubClient(script){
 const filters=['Fast','Budget'].map(filter=>({dataset:{filter},classList:{add(){},remove(){},toggle(){}},setAttribute(){}}));
 const nodes=new Map();
 const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'chicken',innerHTML:'',addEventListener(){},classList:{toggle(){}},querySelector(){}});return nodes.get(s)};
 const calls=[];
 vm.runInNewContext(script,{document:{querySelector:node,querySelectorAll:s=>s==='[data-filter]'?filters:[],addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},SST_API:{getPlanList:async()=>({}),conundrum:async x=>{calls.push(x);return {top:[]}}}});
 assert.equal(typeof filters[0].onclick,'function','filter handler must install');
 assert.equal(typeof node('#grubWeekGenerate').onclick,'function','later controls must install');
 assert.equal(typeof node('#shoppingForm').onsubmit,'function','shopping control must install');
 filters[0].onclick();assert.equal(calls.at(-1).filter,'Fast');assert.equal(calls.at(-1).query,'chicken');
 filters[0].onclick();assert.equal(calls.at(-1).filter,'');
}
