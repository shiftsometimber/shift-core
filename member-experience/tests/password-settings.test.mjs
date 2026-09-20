import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
import {withPasswordSettings,passwordSettingsRuntime} from '../password-settings.mjs';

const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const source='<html><head></head><body><main><div class="tracker-card"><h3>Units</h3><select id="prefWeight"></select></div><div class="tracker-card"><h3>Security</h3><p>Account sessions are live.</p><button class="btn btn-ghost" disabled="">Account security</button></div><div id="healthConsentManager">Privacy controls</div></main><script defer src="/api-adapter-v33d.js"></script></body></html>';
function harness(api,security={}){
  const button={disabled:false,textContent:'Reset password'},status={textContent:'',dataset:{}},signIn={hidden:true};
  let submit;
  const form={querySelector:()=>button,addEventListener:(_,fn)=>{submit=fn},setAttribute(){},removeAttribute(){},focus(){}};
  const nodes={memberPasswordReset:form,memberPasswordStatus:status,memberPasswordSignIn:signIn};
  vm.runInNewContext(passwordSettingsRuntime,{window:{SST_API:api,SSTTurnstile:security},document:{getElementById:id=>nodes[id]}});
  return {button,status,signIn,submit:()=>submit({preventDefault(){}})};
}

test('only settings aliases gain the password card; original preference and consent controls survive',async()=>{
  for(const path of ['/member/settings','/member/settings.html']){
    const response=await memberExperienceEntry(new Request('https://site.test'+path),env,new Response(source,{headers:{'Content-Type':'text/html'}}));
    const html=await response.text();
    assert.match(html,/data-member-password-settings/);assert.doesNotMatch(html,/Account security/);
    assert.match(html,/<select id="prefWeight"><\/select>/);assert.match(html,/<div id="healthConsentManager">Privacy controls<\/div>/);
    assert.equal((html.match(/src="\/api-adapter-v33d.js"/g)||[]).length,1);
    assert.equal((html.match(/src="\/turnstile-auth-v1.js/g)||[]).length,1);
    assert.match(response.headers.get('Cache-Control'),/no-store/);
  }
  const html=await(await memberExperienceEntry(new Request('https://site.test/member/check-in'),env,new Response(source,{headers:{'Content-Type':'text/html'}}))).text();
  assert.doesNotMatch(html,/data-member-password-settings/);
  assert.equal(withPasswordSettings(withPasswordSettings(source)),withPasswordSettings(source));
});

test('password runtime is served with correct MIME, privacy headers and HEAD support',async()=>{
  const url='https://site.test/assets/member-experience/password-settings.mjs';
  const response=memberExperienceRoutes(new Request(url),env);
  assert.match(response.headers.get('Content-Type'),/javascript/);assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal(await response.text(),passwordSettingsRuntime);
  assert.equal(await memberExperienceRoutes(new Request(url,{method:'HEAD'}),env).text(),'');
  assert.equal(memberExperienceRoutes(new Request(url),{}),null);
});

test('only an explicit request sends the authenticated account email and success prevents duplicate requests',async()=>{
  const calls=[];
  let finish;
  const h=harness({getMe:async()=>({user:{email:'member@example.test'}}),requestPasswordReset:data=>{calls.push(data.email);return new Promise(resolve=>{finish=resolve})}});
  assert.equal(calls.length,0);
  const pending=h.submit();await Promise.resolve();await h.submit();
  assert.deepEqual(calls,['member@example.test']);assert.equal(h.button.disabled,true);
  finish({ok:true,message:'If that account exists, reset instructions will be sent shortly.'});await pending;
  assert.equal(h.status.dataset.state,'success');assert.match(h.status.textContent,/Your password stays the same/);
  assert.equal(h.button.textContent,'Reset requested');await h.submit();assert.equal(calls.length,1);
});

test('expired or missing identity never sends an email and offers sign-in',async()=>{
  for(const getMe of [async()=>{throw Object.assign(new Error('Unauthorized'),{status:401})},async()=>({user:{}})]){
    let sent=0;const h=harness({getMe,requestPasswordReset:()=>{sent++}});
    await h.submit();assert.equal(sent,0);assert.equal(h.signIn.hidden,false);assert.equal(h.button.disabled,false);
    assert.match(h.status.textContent,/sign in again/);
  }
});

test('request failures show no false success and permit a deliberate retry',async()=>{
  let attempts=0;
  const h=harness({getMe:async()=>({user:{email:'member@example.test'}}),requestPasswordReset:async()=>{if(++attempts===1)throw new Error('The security check timed out. Please try again.');return {ok:true}}});
  await h.submit();assert.equal(h.status.dataset.state,'error');assert.match(h.status.textContent,/timed out/);assert.equal(h.button.disabled,false);
  await h.submit();assert.equal(attempts,2);assert.equal(h.status.dataset.state,'success');
});

test('missing security client fails closed without making account or reset calls',async()=>{
  let calls=0;const h=harness({getMe:()=>{calls++},requestPasswordReset:()=>{calls++}},null);
  await h.submit();assert.equal(calls,0);assert.equal(h.status.dataset.state,'error');assert.match(h.status.textContent,/Refresh/);
});
