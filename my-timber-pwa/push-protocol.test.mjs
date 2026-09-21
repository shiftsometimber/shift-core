import test from 'node:test';
import assert from 'node:assert/strict';
import {sendPwaPush} from './reminders.mjs';
test('real push library uses aes128gcm and signed modern VAPID without plaintext health data',async t=>{
 const vapid=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const priv=await crypto.subtle.exportKey('jwk',vapid.privateKey);
 const publicKey=Buffer.from(await crypto.subtle.exportKey('raw',vapid.publicKey)).toString('base64url');
 const client=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const clientKey=Buffer.from(await crypto.subtle.exportKey('raw',client.publicKey)).toString('base64url');
 const DB={prepare(){return{}},batch:async()=>[],exec:async()=>{}};
 const original=globalThis.fetch;let captured;
 globalThis.fetch=async(url,options)=>{captured={url,options};return new Response(null,{status:201})};t.after(()=>{globalThis.fetch=original});
 assert.equal(await sendPwaPush({DB,VAPID_PUBLIC_KEY:publicKey,VAPID_PRIVATE_KEY:priv.d},{endpoint:'https://web.push.apple.com/synthetic-no-network',p256dh:clientKey,auth:Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url')}),'accepted');
 const headers=new Headers(captured.options.headers);assert.equal(headers.get('content-encoding'),'aes128gcm');assert.equal(headers.get('ttl'),'1800');assert.equal(captured.options.redirect,'error');
 const authorization=headers.get('authorization');assert(authorization.startsWith('vapid t='));assert(authorization.endsWith(', k='+publicKey));
 const jwt=authorization.slice(8).split(',')[0],parts=jwt.split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claims.aud,'https://web.push.apple.com');assert.equal(claims.sub,'mailto:hello@shiftsometimber.co.uk');
 assert(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},vapid.publicKey,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts.slice(0,2).join('.'))));
 assert(Buffer.from(captured.options.body).length>86);assert(!Buffer.from(captured.options.body).toString().includes('Time for your check-in'));
});
