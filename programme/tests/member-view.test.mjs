import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../frontend/member/assets/programme-v1/programme.mjs',import.meta.url),'utf8');
test('Private-view cleanup removes the account name, status, tabs, body and preview as well as the stored state',()=>{
 const node=()=>({textContent:'Fictional private information',replaceChildren(){this.textContent=''}});
 const nodes=Object.fromEntries(['#sp-name','#sp-entitlement','#sp-tabs'].map(k=>[k,node()])),view=node(),status=node();
 const ctx={state:{name:'Fictional member'},preview:{recipe:'Fictional private choice'},root:{querySelector:k=>nodes[k]},view,status};
 vm.createContext(ctx);
 const cleanup=source.slice(source.indexOf('function clearPrivateView(){'),source.indexOf('\nasync function api'));
 vm.runInContext(cleanup+';clearPrivateView();',ctx);
 assert.equal(ctx.state,null);assert.equal(ctx.preview,null);assert.equal(nodes['#sp-name'].textContent,'The Programme');
 for(const n of [nodes['#sp-entitlement'],nodes['#sp-tabs'],view,status])assert.equal(n.textContent,'');
 // This is a module-level check. It does not establish browser bfcache behaviour.
});
