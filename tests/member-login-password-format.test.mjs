import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withSessionState} from '../member-experience/session-state.mjs';
const oldRule="form.elements.password.pattern=registering?'(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}':'';",newRule="if(registering){form.elements.password.pattern='(?=.*[A-Z])(?=.*[\\\\p{P}\\\\p{S}]).{10,}';form.elements.password.minLength=10}else{form.elements.password.removeAttribute('pattern');form.elements.password.removeAttribute('minlength')}form.elements.password.placeholder=registering?'At least 10 characters':'Your password';",oldAttr=" autocomplete=\"current-password\" minlength=\"10\" placeholder=\"At least 10 characters\" required",newAttr=" autocomplete=\"current-password\" placeholder=\"Your password\" required";
const retained='<div id="memberSessionStatus"></div><form id="previewRegister"><input name="password"'+oldAttr+'></form><script>'+oldRule+'</script>';
test('retained auth HTML drops the empty sign-in pattern and old minimum while retaining account-creation policy',()=>{
 const result=withSessionState(retained);
 assert.equal(result,retained.replace(oldRule,newRule).replace(oldAttr,newAttr));
 assert(!result.includes(oldRule));assert(result.includes("removeAttribute('pattern')"));assert(result.includes('minLength=10'));
});
test('repair is idempotent for a current or already transformed auth document',()=>{
 const once=withSessionState(retained);assert.equal(withSessionState(once),once);
 const source=readFileSync(new URL('../frontend/member/my-timber-preview.html',import.meta.url),'utf8');
 assert(source.includes(newRule));assert(!source.includes(oldRule));assert(source.includes(newAttr));
 const current=withSessionState(source);assert.equal(withSessionState(current),current);
});
test('other forms and pages retain their existing session treatment',()=>{
 const other='<div id="memberSessionStatus"></div><form id="other"><input'+oldAttr+'></form><script>'+oldRule+'</script>';
 assert.equal(withSessionState(other),other);
});

test('compiled login patch preserves unrelated bytes and refuses changed or duplicated preimages',async()=>{
 const {deriveLoginPatch,applyLoginPatch}=await import('../release/member-login-format/patch.mjs');
 const before='// retained module\nfunction withSessionState(html) {\n return html;\n}\n// retained tail\n';
 const after=before.replace(' return html;'," html=html.replace('old',\"removeAttribute('pattern')\");\n return html;");
 const patch=deriveLoginPatch(before,after),serving=Buffer.from('/* unrelated serving addition */\n'+before+'/* retained */');
 const result=applyLoginPatch(serving,patch);assert(result.proof.exactInverse);assert(result.code.startsWith('/* unrelated serving addition */'));
 assert.throws(()=>applyLoginPatch(Buffer.from('wrong bundle'),patch));assert.throws(()=>applyLoginPatch(Buffer.concat([serving,serving]),patch));
 assert.throws(()=>deriveLoginPatch(before,after+'unreviewed unrelated compiled source'.repeat(400)));
});
test('release ownership checks reject another owner and settings drift',async()=>{
 const {assertOwned,assertSettings}=await import('../release/member-login-format/patch.mjs');
 assertOwned({versions:[{version_id:'ours',percentage:100}]},'ours');
 assert.throws(()=>assertOwned({versions:[{version_id:'other',percentage:100}]},'ours'));
 assert.throws(()=>assertOwned({versions:[{version_id:'ours',percentage:50}]},'ours'));
 const before={bindings:[{name:'DB'}],annotations:{'workers/tag':'old'}},annotations={'workers/tag':'new','workers/message':'login only'};
 assertSettings({...before,annotations},before,annotations);
 assert.throws(()=>assertSettings({bindings:[],annotations},before,annotations));
});
