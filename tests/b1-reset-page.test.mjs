import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {repairPasswordResetDocument,repairPasswordResetResponse} from '../auth-recovery-page-v1.mjs';
// Exact affected inline reset controller from the pinned Pages deployment.
const original=String.raw`<h1>Choose a new password</h1><script>
(function(){
'use strict';const API='https://api.shiftsometimber.co.uk/v1',msg=(t,type='error')=>{const e=document.getElementById('authMessage');e.textContent=t;e.dataset.type=type};
const token=new URLSearchParams(location.search).get('token') |'';
if(!token)msg('This reset link is incomplete. Request a new password reset from My Timber.');
document.getElementById('resetForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),p=String(f.get('password') |''),c=String(f.get('confirm') |''),b=e.currentTarget.querySelector('button');
if(p!==c){msg('Passwords do not match.');return}if(p.length<12){msg('Please use at least 12 characters.');return}if(!token){msg('Request a new password reset from My Timber.');return}
b.disabled=true;b.textContent='Saving…';
try{const r=await fetch(API+'/auth/reset-password',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:p})});let body={};try{body=await r.json()}catch{}
if(!r.ok)throw new Error(body.message |'We could not reset that password.');
msg('Password changed. Taking you back to sign in…','success');setTimeout(()=>location.replace('/member-login#sign-in'),900)}
catch(err){msg(err.message |'We could not reset that password.');b.disabled=false;b.textContent='Save new password'}})
})();
</script>`;
function runtime(html,{status=200,body={},token='received-fictional-token',password='Fictional-reset-password!',confirm=password}={}){
 const message={dataset:{}},button={},requests=[];let submit;
 const form={addEventListener(name,fn){assert.equal(name,'submit');submit=fn},querySelector(){return button}},document={getElementById(id){return id==='resetForm'?form:message}};
 runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document,URLSearchParams,location:{search:'?token='+token,replace(){}},FormData:class{get(k){return k==='password'?password:confirm}},setTimeout(){},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return{ok:status<400,json:async()=>body}}});
 return{message,button,requests,submit:()=>submit({preventDefault(){},currentTarget:form})};
}
test('B1-N01 original document blocks a valid token/password; repaired document sends exact strings',async()=>{
 const broken=runtime(original);await broken.submit();assert.equal(broken.requests.length,0);assert.equal(broken.message.textContent,'Please use at least 12 characters.');
 const fixed=runtime(repairPasswordResetDocument(original));await fixed.submit();assert.equal(fixed.requests.length,1);assert.deepEqual(fixed.requests[0].body,{token:'received-fictional-token',password:'Fictional-reset-password!'});assert.equal(fixed.message.dataset.type,'success');
});
test('B1-N01 failure message, retry control and validation are preserved',async()=>{
 const failure=runtime(repairPasswordResetDocument(original),{status:503,body:{message:'Temporary service failure'}});await failure.submit();assert.equal(failure.message.textContent,'Temporary service failure');assert.equal(failure.button.disabled,false);
 const mismatch=runtime(repairPasswordResetDocument(original),{confirm:'different-password'});await mismatch.submit();assert.equal(mismatch.message.textContent,'Passwords do not match.');assert.equal(mismatch.requests.length,0);
});
test('B1-N01 repair is idempotent and changes no other document or route',async()=>{
 const fixed=repairPasswordResetDocument(original);assert.equal(repairPasswordResetDocument(fixed),fixed);assert.equal(fixed.replaceAll(' ||\'', ' |\''),original);
 const unrelated='<script>const flags=1 | 2;</script><p>No stock available today</p>';assert.equal(repairPasswordResetDocument(unrelated),unrelated);
 const other=new Response(original,{headers:{'Content-Type':'text/html'}});assert.equal(await repairPasswordResetResponse(other,new Request('https://shiftsometimber.co.uk/programme')),other);
 const r=await repairPasswordResetResponse(new Response(original,{headers:{'Content-Type':'text/html','ETag':'old'}}),new Request('https://shiftsometimber.co.uk/reset-password.html?token=fictional'));assert.equal(await r.text(),fixed);assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Cache-Control'),'no-store');
});
