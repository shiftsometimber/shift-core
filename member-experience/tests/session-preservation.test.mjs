import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withSessionState} from '../session-state.mjs';
import {preserveLoginSession} from '../session-preservation.mjs';
const source=readFileSync(new URL('../../frontend/member/my-timber-preview.html',import.meta.url),'utf8');
test('login preservation accepts only the exact reviewed auth presentation transition',()=>{
 assert.equal(preserveLoginSession('/member-login',Buffer.from(source)).toString(),source);
 assert.equal(preserveLoginSession('/member-login',Buffer.from(withSessionState(source))).toString(),source);
 const changed=withSessionState(source).replace('Checking your sign-in…','Signed in already');
 assert.throws(()=>preserveLoginSession('/member-login',Buffer.from(changed)));
 const unrelated=withSessionState(source.replace('Create your private Shift account.','Unapproved replacement.'));
 assert.notEqual(preserveLoginSession('/member-login',Buffer.from(unrelated)).toString(),source);
});
test('later public styles and credential handlers remain in the fingerprint',()=>{
 const style='<style data-later-wrapper>body{color:inherit}</style>';
 const after=withSessionState(source).replace('</head>',style+'</head>');
 assert.equal(preserveLoginSession('/member-login',Buffer.from(after)).toString(),source.replace('</head>',style+'</head>'));
 const bytes=Buffer.from(after);assert.equal(preserveLoginSession('/about',bytes),bytes);
});
