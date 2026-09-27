import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../frontend/member/my-timber-preview.html',import.meta.url),'utf8');
const adapter=await readFile(new URL('../frontend/member/api-adapter-v33d.js',import.meta.url),'utf8');

test('member entry defaults to sign-in without requiring a first name',()=>{
  assert.match(html,/data-auth-mode="login"[^>]*>Sign in/);
  assert.match(html,/data-registration-field hidden>First name<input name="firstName"/);
  assert.doesNotMatch(html,/name="firstName"[^>]*required/);
  assert.match(html,/first\.required=registering/);
  assert.match(html,/autocomplete="current-password" minlength="12"/);
  assert.match(html,/\.preview-auth \[hidden\]\{display:none!important\}/);
});

test('member entry exposes password reset and verification recovery',()=>{
  assert.match(html,/data-forgot-password>Forgotten your password\?/);
  assert.match(html,/id="previewReset" hidden/);
  assert.match(html,/SST_API\.requestPasswordReset/);
  assert.match(html,/data-resend-verification hidden/);
  assert.match(html,/SST_API\.resendVerification/);
  assert.match(adapter,/resendVerification:data=>request\('\/auth\/resend-verification'/);
});

test('verification and invalid-link states are explained in the entry UI',()=>{
  assert.match(html,/Email verified\. Sign in to open My Timber\./);
  assert.match(html,/verification link has expired or has already been used/);
  assert.match(html,/verificationRequired/);
});
