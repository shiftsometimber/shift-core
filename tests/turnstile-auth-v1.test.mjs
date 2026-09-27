import test from 'node:test';
import assert from 'node:assert/strict';
import {publicTurnstileConfig,turnstileGuard,turnstileInternals} from '../turnstile-auth-v1.js';

test('Turnstile remains off until explicitly required',async()=>{
  assert.deepEqual(publicTurnstileConfig({}),{ok:true,enabled:false,required:false,siteKey:''});
  assert.equal(await turnstileGuard(new Request('https://api.shiftsometimber.co.uk/v1/auth/login',{method:'POST',body:'{}'}),{}),null);
});

test('protected authentication routes fail closed when required but unconfigured',async()=>{
  const response=await turnstileGuard(new Request('https://api.shiftsometimber.co.uk/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}),{TURNSTILE_REQUIRED:'true'});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'turnstile_not_configured');
  assert.equal(turnstileInternals.PROTECTED_ACTIONS.get('/v1/hq/auth/login'),'hq_login');
});

test('a missing token is rejected before credentials are checked',async()=>{
  const response=await turnstileGuard(new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}),{TURNSTILE_REQUIRED:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'});
  assert.equal(response.status,400);
  assert.equal((await response.json()).error,'turnstile_required');
});

test('Turnstile does not trust commissioning headers; verified OIDC is handled before this guard',async()=>{
  const env={TURNSTILE_REQUIRED:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'};
  for(const path of ['/v1/auth/register','/v1/auth/login']){
    const request=new Request(`https://api.shiftsometimber.co.uk${path}`,{method:'POST',headers:{'content-type':'application/json','x-shift-commissioning-oidc':'synthetic-jwt'},body:'{}'});
    const blocked=await turnstileGuard(request,env);
    assert.equal(blocked.status,400,path);
    assert.equal((await blocked.json()).error,'turnstile_required',path);
  }
});