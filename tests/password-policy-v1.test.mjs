import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passwordMeetsPolicy,PASSWORD_POLICY_MESSAGE} from '../password-policy-v1.js';
import {fastMemberRegister} from '../member-register-fastpath-v2.js';
import {handleAuthRecovery} from '../auth-recovery-v1.js';

const accepted=['Abcdefgh!1','Example!123','ABCDEFGHI!','Abcdefgh£1'];
const rejected=['Abcdefg!1','abcdefgh!1','Abcdefgh12','Abcdefgh 1','Abcdefgh\t1','abcdefghi!',null,undefined];
const request=(path,password)=>new Request('https://api.shiftsometimber.co.uk'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'fictional@example.test',token:'fictional-token',password,currentPassword:'Existing!123'})});

test('ten characters with a capital and a special character are accepted',()=>{
 for(const password of accepted)assert.equal(passwordMeetsPolicy(password),true,password);
});
test('short, lowercase-only and missing-special passwords fail; whitespace is not special',()=>{
 for(const password of rejected)assert.equal(passwordMeetsPolicy(password),false,String(password));
});
test('registration rejects every invalid password before any database operation',async()=>{
 const env={DB:{prepare(){throw Error('unexpected database access')}}};
 for(const password of rejected.filter(x=>typeof x==='string')){
  const response=await fastMemberRegister(request('/v1/auth/register',password),env);
  assert.equal(response.status,400);assert.equal((await response.json()).message,PASSWORD_POLICY_MESSAGE);
 }
});
test('reset rejects invalid passwords without reading or consuming the reset token',async()=>{
 const env={DB:{prepare(){throw Error('unexpected token access')}}};
 for(const password of rejected.filter(x=>typeof x==='string')){
  const response=await handleAuthRecovery(request('/v1/auth/reset-password',password),env,{},()=>{throw Error('unexpected next')});
  assert.equal(response.status,400);assert.equal((await response.json()).error,'invalid_reset');
 }
});
test('a valid ten-character reset reaches the unchanged token-expiry check',async()=>{
 let reads=0;const env={DB:{prepare(){reads++;return{bind(){return{async first(){return null}}}}}}};
 const response=await handleAuthRecovery(request('/v1/auth/reset-password',accepted[0]),env,{},()=>{});
 assert.equal(reads,1);assert.equal(response.status,400);assert.equal((await response.json()).error,'reset_expired');
});
test('authenticated password changes apply the shared rule before reading credentials',async()=>{
 const env={DB:{prepare(){throw Error('unexpected credential access')}}};
 const next=async()=>Response.json({user:{id:99001}});
 for(const password of rejected.filter(x=>typeof x==='string')){
  const response=await handleAuthRecovery(request('/v1/auth/change-password',password),env,{},next);
  assert.equal(response.status,400);assert.equal((await response.json()).error,'weak_password');
 }
});
test('legacy registration, HQ bootstrap and HQ staff creation all use the same rule',()=>{
 const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
 assert.equal((worker.match(/!passwordMeetsPolicy\(password\)/g)||[]).length,3);
 const login=worker.slice(worker.indexOf('async function hqLogin('),worker.indexOf('async function hqMfaLoginVerify('));
 assert.doesNotMatch(login,/passwordMeetsPolicy/,'Existing credentials remain usable during policy changes');
 assert.match(login,/verifyPassword\(password,user.password_hash\)/);
});
