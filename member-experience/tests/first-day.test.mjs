import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fitPhaseAllowed} from '../fit-phase.mjs';
import {buildIndustrialCatalogue} from '../../industrial-catalogue-v14.js';

test('main-session slots reject every legacy warm-up and cool-down variant; matching phases remain eligible',()=>{
 const rows=buildIndustrialCatalogue().exercises;
 let covered=0;
 for(const data of rows){
  const phase=data.variation_identity?.startsWith('cool-down-')?'cool-down':data.variation_identity?.startsWith('warm-up-')?'warm-up':null;
  if(!phase)continue;covered++;
  const row={id:data.id,data};assert.equal(fitPhaseAllowed(row,'strength'),false,data.id);assert.equal(fitPhaseAllowed(row,phase),true,data.id);
 }
 assert(covered>100);
 assert.equal(fitPhaseAllowed({id:'normal',data:{variation_identity:'standard-beginner'}},'strength'),true);
});

function journey(){
 const source=readFileSync(new URL('../../frontend/member/member-my-journey-v2.js',import.meta.url),'utf8').replace('function ensure(){','globalThis.reviewJourney={setup,model};function ensure(){');
 const c={location:{pathname:'/member/dashboard'},document:{readyState:'loading',addEventListener(){}},FormData:class{constructor(form){return Object.entries(form)}}};
 vm.runInNewContext(source,c);return c.reviewJourney;
}
test('guided setup keeps the three first answers outside optional details and has no assumed ratings',()=>{
 const {setup}=journey(),html=setup({}),visible=html.split('<details class="mj-optional">')[0];
 for(const field of ['why','focus','reviewDay'])assert.match(visible,new RegExp('name="'+field+'"'));
 for(const field of ['heightCm','startSt','life_energy'])assert(!visible.includes('name="'+field+'"'));
 assert.doesNotMatch(html,/name="life_\w+"[^>]*value="50"/);
 assert.equal((html.match(/name="why"/g)||[]).length,1);
});
test('saving just a goal preserves missing measurements and never invents a wellbeing baseline',()=>{
 const {model}=journey(),out=model({_journey:{healthInterests:['health-mot']}},{units:'kg',why:'Enjoy weekend walks',focus:'movement',reviewDay:'6',reviewCadence:'weekly'});
 assert.equal(out.setup.why,'Enjoy weekend walks');assert.equal(out.setup.reviewDay,6);
 assert.equal(out.weight.startKg,null);assert.equal(out.weight.currentKg,null);
 assert(Object.values(out.lifeBack.baseline.scores).every(v=>v===null));
 assert.deepEqual(Array.from(out.healthInterests),['health-mot']);
});
