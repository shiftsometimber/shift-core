import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {withMemberDetails} from '../member-details.mjs';
import {emailChangeRuntime} from '../member-email-client.mjs';
const source='<html><body><main>Existing settings</main></body></html>';
test('Settings enables email-change UI only with the same flag and mail binding required by the API',()=>{
 for(const env of [{},{MEMBER_EMAIL_CHANGE_ENABLED:'true'},{EMAIL:{send(){}}},{MEMBER_EMAIL_CHANGE_ENABLED:'false',EMAIL:{send(){}}}]){
  const html=withMemberDetails(source,env);assert(html.includes('data-email-change-enabled="false"'));assert(html.includes('readonly aria-describedby="memberEmailHelp"'));assert(html.includes('Existing settings'));
 }
 assert(withMemberDetails(source,{MEMBER_EMAIL_CHANGE_ENABLED:'true',EMAIL:{send(){}}}).includes('data-email-change-enabled="true"'));
});
test('disabled Settings mounts no email-change handlers and makes no unavailable API request',()=>{
 const form={dataset:{}},panel={dataset:{emailChangeEnabled:'false'},hidden:true};
 vm.runInNewContext(emailChangeRuntime,{document:{getElementById:id=>id==='memberEmailChangeForm'?form:panel},fetch:()=>assert.fail('disabled feature must not be probed')});
 assert.equal(form.dataset.bound,undefined);assert.equal(panel.hidden,true);
});
test('enabled Settings still loads the owning account status',async()=>{
 let requests=0;const nodes=new Map();
 for(const id of ['memberEmailChangePanel','memberEmailChangeForm','memberEmailChangeFields','memberEmailChangeSubmit','memberEmailChangeStatus','memberEmailChangeRefresh'])nodes.set(id,{dataset:{emailChangeEnabled:'true'},hidden:true,addEventListener(){}});
 vm.runInNewContext(emailChangeRuntime,{document:{getElementById:id=>nodes.get(id)||null},AbortSignal,fetch:async(url,options)=>{requests++;assert.equal(url,'/v1/member/details/email-change');assert.equal(options.credentials,'include');return{ok:true,json:async()=>({enabled:true,pending:false})}}});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(requests,1);assert.equal(nodes.get('memberEmailChangePanel').hidden,false);
});
