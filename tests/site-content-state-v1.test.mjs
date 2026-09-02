import test from 'node:test';
import assert from 'node:assert/strict';
import {SiteContentState} from '../site-content-state-v1.js';

function subject(){
  const values=new Map();
  const storage={
    async get(key){return values.get(key)},
    async put(key,value){values.set(key,value)},
    async delete(key){values.delete(key)}
  };
  return new SiteContentState({storage});
}
async function call(state,path,body){
  const response=await state.fetch(new Request('https://state.test'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
  return {status:response.status,body:await response.json()};
}

test('published content is immediately visible and pause is immediately authoritative',async()=>{
  const state=subject();
  const item={pagePath:'/start-here',contentKey:'intro',cssSelector:'#intro',publishedText:'Hello. World.',version:2};
  assert.equal((await call(state,'/publish',item)).status,200);
  assert.deepEqual((await call(state,'/read',{path:'/start-here'})).body.overrides,[{content_key:'intro',css_selector:'#intro',published_text:'Hello. World.',version:2}]);
  assert.equal((await call(state,'/pause',{pagePath:'/start-here',contentKey:'intro'})).status,200);
  assert.deepEqual((await call(state,'/read',{path:'/start-here'})).body.overrides,[]);
});

test('synthetic closeout state can always be reset',async()=>{
  const state=subject();
  await call(state,'/publish',{pagePath:'/__synthetic-hq-closeout',contentKey:'proof',cssSelector:'#proof',publishedText:'PASS',version:1});
  await call(state,'/reset-synthetic',{});
  assert.deepEqual((await call(state,'/read',{path:'/__synthetic-hq-closeout'})).body.overrides,[]);
});
