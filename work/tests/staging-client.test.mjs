import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../staging/login.mjs',import.meta.url),'utf8');
test('Staging logout waits for success and exposes failures for retry',async()=>{
 for(const ok of [true,false]){
  let handler,redirect;const calls=[],button={disabled:false,textContent:'Sign out of test account',addEventListener:(name,fn)=>{handler=fn}};
  const document={querySelector:s=>s==='#stage-logout'?button:null};
  const fetch=async(path,options)=>{calls.push({path,options});return {ok,status:ok?200:503}};
  new Function('document','fetch','location',source)(document,fetch,{assign:url=>{redirect=url}});
  await handler({currentTarget:button});
  assert.equal(calls[0].path,'/v1/auth/logout');assert.equal(calls[0].options.credentials,'same-origin');
  if(ok)assert.equal(redirect,'/staging/sign-in');else{assert.equal(redirect,undefined);assert.equal(button.disabled,false);assert.match(button.textContent,/503/)}
 }
});
