import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../frontend/member/member-progress-v1.js',import.meta.url),'utf8');
async function render(units){
 const host={innerHTML:'',setAttribute(){}},panel={querySelector(){return null}},document={body:{dataset:{memberTools:'v1'}},readyState:'complete',querySelector(s){return s==='#panel-visualise'?panel:null},getElementById(){return host},addEventListener(){}};
 const api={getProgressSummary:async()=>({progress:{state:'ready',units,entries:1,metrics:[{key:'weight',label:'Weight',latest:103,delta:null,direction:'not_enough_data',unit:'kg'}],milestones:[]}})};
 vm.runInNewContext(source,{location:{pathname:'/member/dashboard'},document,window:{SST_API:api,addEventListener(){}},SST_API:api,setTimeout:fn=>fn()});
 await new Promise(resolve=>setImmediate(resolve));return host.innerHTML;
}
test('imperial and metric preferences affect the actual rendered weight and never invent a trend',async()=>{
 assert.match(await render('stone_lb'),/16 st 3\.1 lb/);assert.match(await render('lb'),/227\.1 lb/);assert.match(await render('kg'),/103\.0kg/);
 assert.match(await render('stone_lb'),/Add another check-in/);assert.doesNotMatch(await render('stone_lb'),/Holding steady/);
});
