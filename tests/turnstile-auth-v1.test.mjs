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

test('commissioning registration reaches the OIDC identity verifier without weakening public Turnstile',async()=>{
  const env={TURNSTILE_REQUIRED:'true',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'};
  const commissioning=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json','x-shift-commissioning-oidc':'synthetic-jwt'},body:'{}'});
  assert.equal(await turnstileGuard(commissioning,env),null);
  const publicRegistration=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  const blocked=await turnstileGuard(publicRegistration,env);
  assert.equal(blocked.status,400);
  assert.equal((await blocked.json()).error,'turnstile_required');
  const loginWithForgedCommissioningHeader=new Request('https://api.shiftsometimber.co.uk/v1/auth/login',{method:'POST',headers:{'content-type':'application/json','x-shift-commissioning-oidc':'synthetic-jwt'},body:'{}'});
  const loginBlocked=await turnstileGuard(loginWithForgedCommissioningHeader,env);
  assert.equal(loginBlocked.status,400);
  assert.equal((await loginBlocked.json()).error,'turnstile_required');
});