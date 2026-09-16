import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {commissioningLogin} from '../rendered-member-acceptance-support.mjs';

const harnesses=[
  'g2-011-progress-story-production.mjs',
  'g2-013-progress-picture-rendered-production.mjs',
  'g2-014-progress-picture-premium-production.mjs',
  'g2-015-plan-manager-production.mjs'
];

test('all rendered harnesses use the shared login and retain server-owned cookie scope',()=>{
  for(const file of harnesses){
    const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.match(source,/import\s*\{[^}]*commissioningLogin[^}]*\}\s*from\s*['"]\.\/rendered-member-acceptance-support\.mjs['"]/,`${file} must import the verified login helper`);
    assert.match(source,/commissioningLogin\(p,\{site:SITE,api:API,oidc:OIDC,email,password\}\)/,`${file} must verify its exact synthetic identity on both hosts`);
    assert.doesNotMatch(source,/addCookies|clearCookies|domain\s*:\s*['"]\.shiftsometimber\.co\.uk['"]/,`${file} must not manufacture or rescope cookies`);
  }
});

function sessionHarness({cookieIssued=true,rejectedOrigin=null}={}){
  const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk';
  const identity={site,api,email:'shiftsometimber+structured-cookie-test@gmail.com',password:'test-only',oidc:'synthetic-oidc-test-value'};
  const calls=[];let issued=false;
  const context={
    cookies(){throw Error('Cookie attributes must remain server-owned')},
    clearCookies(){throw Error('Do not delete server-issued cookies')},
    addCookies(){throw Error('Do not manufacture cookie scope')},
    request:{
      async post(url,options){calls.push({method:'POST',url,options});issued=cookieIssued;return{ok:()=>true,status:()=>200,json:()=>{throw Error('Login body is not session proof')}}},
      async get(url,options){calls.push({method:'GET',url,options});const ok=issued&&new URL(url).origin!==rejectedOrigin;return{ok:()=>ok,status:()=>ok?200:401,json:async()=>ok?{user:{email:identity.email}}:{error:'unauthorized'}}}
    }
  };
  return{identity,page:{context:()=>context},calls};
}

test('login uses the browser request jar and independently verifies the server session on each host',async()=>{
  const h=sessionHarness();
  assert.deepEqual(await commissioningLogin(h.page,h.identity),{authenticated:true,origins:[h.identity.api,h.identity.site]});
  assert.deepEqual(h.calls.map(({method,url})=>({method,url})),[
    {method:'POST',url:h.identity.api+'/v1/auth/login'},
    {method:'GET',url:h.identity.api+'/v1/me'},
    {method:'GET',url:h.identity.site+'/v1/me'}
  ]);
  assert.deepEqual(h.calls[0].options.data,{email:h.identity.email,password:h.identity.password});
  assert.equal(h.calls[0].options.headers['X-Shift-Commissioning-OIDC'],h.identity.oidc);
  assert.ok(h.calls.every(call=>call.options.headers.Origin===h.identity.site));
});

test('a successful login response cannot substitute for a cookie valid on both serving hosts',async()=>{
  for(const options of [{cookieIssued:false},{rejectedOrigin:'https://api.shiftsometimber.co.uk'},{rejectedOrigin:'https://shiftsometimber.co.uk'}]){
    const h=sessionHarness(options);
    await assert.rejects(commissioningLogin(h.page,h.identity),/session did not verify.*HTTP 401/);
  }
});
