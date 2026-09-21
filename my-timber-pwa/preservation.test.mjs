import test from 'node:test';
import assert from 'node:assert/strict';
import {withPwa} from './presentation.mjs';
import {preservePwaPresentation} from './preservation.mjs';
test('public preservation allows only the exact approved footer, setup and install metadata',async()=>{
 const source='<html><head><link rel="manifest" href="/old.webmanifest"><meta name="theme-color" content="#000"></head><body><header>Protected navigation</header><main>Protected content</main><footer>Protected links</footer></body></html>';
 for(const path of ['/','/programme','/member-login']){
  const result=await(await withPwa(new Request('https://shiftsometimber.co.uk'+path),new Response(source,{headers:{'Content-Type':'text/html'}}))).text();
  assert.equal(preservePwaPresentation(path,Buffer.from(result),{required:true}).toString(),preservePwaPresentation(path,Buffer.from(source)).toString());
  assert.throws(()=>preservePwaPresentation(path,Buffer.from(result.replace('My Timber, one tap away.','Unreviewed claim')),{required:true}));
  assert.notEqual(preservePwaPresentation(path,Buffer.from(result.replace('Protected content','changed')),{required:true}).toString(),preservePwaPresentation(path,Buffer.from(source)).toString());
 }
});
