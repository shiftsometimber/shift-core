import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {preserveApprovedRootShare as preserve,LEGACY_ROOT_SHARE_URL as old,APPROVED_ROOT_SHARE_URL as approved} from '../release/root-share-public-preservation.mjs';
const before=readFileSync('docs/root-share-stream-before-384750.html');
const after=Buffer.from(before.toString().replaceAll(old,approved));
test('official fifth failed-release bytes restore exactly the actual original whole root response',()=>{
 assert.equal(before.length,204124);assert.equal(createHash('sha256').update(before).digest('hex'),'63a94996d73561b1774cdeceda3924eb13dccea0735562570b1714ed9a578d19');
 assert.equal(after.length,204144);assert.equal(createHash('sha256').update(after).digest('hex'),'904c8a04dbf424cca69b5fcc3cf1b02b57db4b4dc5aa93897615821a80a98ca2');
 assert.deepEqual(preserve('/',after,{required:true}),before);assert.deepEqual(preserve('/',before),before);
 assert.throws(()=>preserve('/',before,{required:true}),/must be served/);
});
test('missing, duplicate, unknown or mixed platform images fail closed',()=>{
 for(const text of [
  after.toString().replace('property="og:image"','property="missing"'),
  after.toString()+'<meta property="og:image" content="'+approved+'">',
  after.toString().replace(approved,'https://unreviewed.example/image.jpg'),
  after.toString().replace(approved,old)
 ])assert.throws(()=>preserve('/',Buffer.from(text),{required:true}));
 assert.throws(()=>preserve('/',Buffer.from(after.toString().replace(approved,old))),/Mixed/);
});
test('title, favicon, visible copy, image dimensions and unrelated mutations remain visible to the original full-page comparison',()=>{
 for(const bytes of [after.toString().replace('<title>','<title>unapproved '),after.toString().replace('content="1200"','content="1199"'),after.toString()+'<p>unapproved</p>',after.toString()+'<img src="'+approved+'">'])assert.notDeepEqual(preserve('/',Buffer.from(bytes),{required:true}),before);
});
test('every non-root route and the login asset are returned byte-for-byte, including strict after mode',()=>{
 const input=Buffer.from('<meta property="og:image" content="https://unreviewed.example/image.jpg">');
 for(const p of ['/programme','/member-login','/turnstile-auth-v1.js?v=timeout-20260912','/articles/stopping-glp1','/help'])assert.strictEqual(preserve(p,input,{required:true}),input);
});
test('only a diagnostic wrapper is added; every original public-preservation statement and assertion remains exact',()=>{
 const s=readFileSync('member-experience/public-preservation.mjs','utf8');
 const line="import {preserveApprovedRootShare} from '../release/root-share-public-preservation.mjs';\n",changed=" const supportPreserved=preserveSupportRecovery(path,preserveApprovedRootShare(path,rawBody,{required:Boolean(before)}),{required:Boolean(before)});",original=" const supportPreserved=preserveSupportRecovery(path,rawBody,{required:Boolean(before)});";
 assert.equal(s.split(line).length,2);assert.equal(s.split(changed).length,2);
 assert(s.includes('assertPublicPagesPreserved(pages,JSON.parse(readFileSync(before)).pages)'));
 assert(s.includes('actualSha256:hash(rawBody),actualBytes:rawBody.length'));
 assert.equal(s.replace(line,'').replace(changed,original).includes('preserveApprovedRootShare'),false);
});
