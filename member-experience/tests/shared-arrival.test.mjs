import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memberExperienceEntry} from '../entry.mjs';

const source=readFileSync(new URL('../test-support/dashboard.html',import.meta.url),'utf8');
const env={MEMBER_EXPERIENCE_V1_ENABLED:'true',WORK_V1_ENABLED:'false',MEMBER_SESSION_REVIEW_ONLY:'true'};
const response=()=>new Response(source,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});

test('shared My Timber arrival is query-scoped and keeps normal dashboard untouched',async()=>{
 const normal=await (await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/dashboard'),env,response())).text();
 const shared=await (await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/dashboard?from=someone-who-cares'),env,response())).text();
 assert.doesNotMatch(normal,/someoneSentMyTimber|my-timber-share|my_timber_shared_arrival/);
 assert.match(shared,/Someone thought this might help/);
 assert.match(shared,/My Timber is free — food, movement, check-ins and everyday support in one place/);
 assert.match(shared,/data\.source='my-timber-share'/);
 assert.match(shared,/my_timber_shared_arrival/);
 assert.match(shared,/source:'someone_who_cares'/);
 assert.match(shared,/sign_up':'login',\{method:'website',source:'someone_who_cares'\}/);
 assert.doesNotMatch(shared,/sender|recipient|email address|phone number/i);
 assert.match(shared,/data-auth="register">Create account/);
});

test('canonical free-support traffic is tagged without changing the ordinary or shared arrival UI',async()=>{
 const support=await (await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/dashboard?from=weight-loss-support'),env,response())).text();
 assert.match(support,/data\.source='my-timber-support'/);
 assert.match(support,/source:'weight_loss_support'/);
 assert.match(support,/sign_up':'login',\{method:'website',source:'weight_loss_support'\}/);
 assert.match(support,/data-weight-loss-support-arrival/);
 assert.match(support,/weight_loss_support_arrival/);
 assert.doesNotMatch(support,/someoneSentMyTimber|someone thought this might help/i);
});
